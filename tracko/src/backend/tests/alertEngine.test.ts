import { db } from '../db';
import { alertManager } from '../alertManager';
import { notificationService } from '../services/notificationService';
import { LiveOffer } from '../types';

/**
 * Suite de validation complète pour le moteur d'alertes et le service d'envoi TRACKO.
 * Vérifie strictement :
 * 1. Seuil non atteint -> aucun email
 * 2. Seuil atteint (prix == seuil) -> email demandé avec contenu exact
 * 3. Seuil dépassé (prix < seuil) -> email demandé
 * 4. Alerte déjà déclenchée -> aucun deuxième email (anti-spam 100%)
 * 5. Erreur Resend -> échec correctement géré (pas de statut envoyé, alerte conservée, pas de fausse validation)
 * 6. Désinscription -> token sécurisé valide, alerte 'cancelled', aucun nouvel email
 * 7. Sécurité rupture de stock -> aucune fausse alerte sur produit hors stock
 * 8. Sécurité prix aberrant -> aucun déclenchement sur prix nul ou corrompu
 * 9. Détection et mise à jour de seuil sans doublon
 * 10. Confidentialité et masquage des adresses emails
 */
export async function runAlertEngineTests() {
  console.log('\n==================================================');
  console.log('🧪 VALIDATION DU MOTEUR D\'ALERTES & ENVOI RÉEL TRACKO');
  console.log('==================================================\n');

  // Nettoyage complet de l'espace de test
  db.clearAlertsForTesting();
  db.clearOffersForTesting();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail: string) {
    if (condition) {
      console.log(`✅ [RÉUSSI] ${testName}`);
      console.log(`   └─ ${detail}`);
      passed++;
    } else {
      console.error(`❌ [ÉCHEC] ${testName}`);
      console.error(`   └─ ${detail}`);
      failed++;
    }
  }

  // Historique des emails capturés par le transporteur de test
  const capturedEmails: Array<{
    from: string;
    to: string;
    subject: string;
    html: string;
    text: string;
  }> = [];

  let shouldSimulateResendError = false;

  // Configuration du mock transporteur pour tester les flux réels sans polluer le réseau
  notificationService.setMockTransporter(async (params) => {
    if (shouldSimulateResendError) {
      return {
        success: false,
        error: 'Resend API Error 429: Too Many Requests (Rate limit test)',
      };
    }

    capturedEmails.push(params);
    return {
      success: true,
      messageId: `resend-test-msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };
  });

  // Offres de référence en stock et hors stock
  const testOffers: LiveOffer[] = [
    {
      id: 'offer-boulanger-slim-digital',
      productId: 'ps5-slim',
      editionType: 'digital',
      merchantId: 'boulanger-test',
      merchantName: 'Boulanger (Test)',
      seller: 'Boulanger',
      price: 399,
      originalPrice: 449,
      currency: 'EUR',
      condition: 'new',
      conditionLabel: 'Neuf',
      inStock: true, // 399 € en stock
      stockStatus: 'in_stock',
      url: 'https://test.boulanger.com/ps5-slim-digital',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 399,
      isBestPrice: true,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '04/09/2026',
      sourceType: 'automated_feed',
    },
    {
      id: 'offer-fnac-slim-digital',
      productId: 'ps5-slim',
      editionType: 'digital',
      merchantId: 'fnac-test',
      merchantName: 'Fnac (Test)',
      seller: 'Fnac',
      price: 419,
      originalPrice: 449,
      currency: 'EUR',
      condition: 'new',
      conditionLabel: 'Neuf',
      inStock: true, // 419 € en stock
      stockStatus: 'in_stock',
      url: 'https://test.fnac.com/ps5-slim-digital',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 419,
      isBestPrice: false,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '04/09/2026',
      sourceType: 'automated_feed',
    },
    {
      id: 'offer-rupture-disc',
      productId: 'ps5-slim',
      editionType: 'disc',
      merchantId: 'cdiscount-test',
      merchantName: 'Cdiscount (Test)',
      seller: 'Cdiscount',
      price: 349, // Prix bas mais RUPTURE
      originalPrice: 549,
      currency: 'EUR',
      condition: 'new',
      conditionLabel: 'Neuf',
      inStock: false,
      stockStatus: 'out_of_stock',
      url: 'https://test.cdiscount.com/ps5-slim-disc',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 349,
      isBestPrice: false,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '04/09/2026',
      sourceType: 'automated_feed',
    },
    {
      id: 'offer-corrupted-zero',
      productId: 'ps5-pro',
      editionType: 'digital',
      merchantId: 'bug-merchant',
      merchantName: 'Bug Marchand',
      seller: 'Bug',
      price: 0, // Prix 0 € corrompu
      originalPrice: 799,
      currency: 'EUR',
      condition: 'new',
      conditionLabel: 'Neuf',
      inStock: true,
      stockStatus: 'in_stock',
      url: 'https://test.bug.com/ps5-pro',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 0,
      isBestPrice: false,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '04/09/2026',
      sourceType: 'automated_feed',
    }
  ];

  testOffers.forEach(o => db.upsertOffer(o));

  // =========================================================================
  // TEST 1 : Seuil non atteint -> AUCUN email envoyé
  // (Seuil = 380 €, meilleur prix en stock = 399 €)
  // =========================================================================
  capturedEmails.length = 0;
  const resT1 = alertManager.createAlert({
    email: 'test-user-1@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 380,
    currentPriceAtCreation: 449,
  });
  await alertManager.evaluateAlerts();
  const alertT1 = db.getAlert(resT1.alert!.id);
  assert(
    alertT1?.status === 'active' &&
    alertT1.notificationStatus === 'none' &&
    capturedEmails.length === 0,
    'TEST 1 : Seuil non atteint (399 € > seuil 380 €) -> AUCUN email envoyé',
    `Emails envoyés: ${capturedEmails.length}, Statut alerte: ${alertT1?.status}, Notification: ${alertT1?.notificationStatus}`
  );

  // =========================================================================
  // TEST 2 : Seuil atteint (prix == seuil) -> Email demandé avec contenu conforme
  // (Seuil = 399 €, meilleur prix en stock = 399 € chez Boulanger)
  // =========================================================================
  capturedEmails.length = 0;
  const resT2 = alertManager.createAlert({
    email: 'test-user-2@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 399,
    currentPriceAtCreation: 449,
  });
  await alertManager.evaluateAlerts();
  const alertT2 = db.getAlert(resT2.alert!.id);
  const emailT2 = capturedEmails[0];
  const hasExpectedText = emailT2 &&
    emailT2.text.includes('TRACKO') &&
    emailT2.text.includes('Bonne nouvelle : le prix de votre PS5 a atteint votre objectif') &&
    emailT2.text.includes('Modèle : PS5 Slim') &&
    emailT2.text.includes('Édition : Digitale') &&
    emailT2.text.includes('Prix cible : 399 €') &&
    emailT2.text.includes('Prix actuel : 399 €') &&
    emailT2.text.includes('Marchand : Boulanger (Test)') &&
    emailT2.text.includes('Voir l\'offre →') &&
    emailT2.text.includes('Ne plus recevoir cette alerte');

  assert(
    alertT2?.status === 'triggered' &&
    alertT2.notificationStatus === 'sent' &&
    capturedEmails.length === 1 &&
    Boolean(hasExpectedText),
    'TEST 2 : Seuil atteint (399 € == 399 €) -> Email demandé avec template conforme',
    `Emails envoyés: ${capturedEmails.length}, Marchand: ${alertT2?.triggerOffer?.merchantName}, Destinataire: ${emailT2?.to}`
  );

  // =========================================================================
  // TEST 3 : Seuil dépassé (prix < seuil) -> Email demandé
  // (Seuil = 420 €, meilleur prix en stock = 399 € chez Boulanger)
  // =========================================================================
  capturedEmails.length = 0;
  const resT3 = alertManager.createAlert({
    email: 'test-user-3@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 420,
    currentPriceAtCreation: 449,
  });
  await alertManager.evaluateAlerts();
  const alertT3 = db.getAlert(resT3.alert!.id);
  assert(
    alertT3?.status === 'triggered' &&
    alertT3.notificationStatus === 'sent' &&
    capturedEmails.length === 1,
    'TEST 3 : Seuil dépassé (399 € < 420 €) -> Email demandé',
    `Emails envoyés: ${capturedEmails.length}, Prix déclencheur: ${alertT3?.triggerOffer?.price} €`
  );

  // =========================================================================
  // TEST 4 : Alerte déjà déclenchée -> Aucun deuxième email (Anti-spam absolu)
  // Cycle 2 : Le prix est toujours à 399 €, l'alerte est déjà 'triggered'
  // =========================================================================
  capturedEmails.length = 0;
  const evalCycle2 = await alertManager.evaluateAlerts();
  assert(
    evalCycle2.alertsTriggered === 0 && capturedEmails.length === 0,
    'TEST 4 : Alerte déjà déclenchée -> Aucun deuxième email (Anti-spam 100%)',
    `Nouvelles alertes déclenchées: ${evalCycle2.alertsTriggered}, Nouveaux emails envoyés: ${capturedEmails.length}`
  );

  // =========================================================================
  // TEST 5 : Erreur Resend -> Échec géré sans fausse validation
  // L'alerte n'est pas marquée 'sent', statut reste 'active', erreur journalisée
  // =========================================================================
  capturedEmails.length = 0;
  shouldSimulateResendError = true; // Activer la panne simulée de l'API Resend
  const resT5 = alertManager.createAlert({
    email: 'test-user-5@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 410, // Prix atteint (399 € <= 410 €) mais panne Resend
    currentPriceAtCreation: 449,
  });
  await alertManager.evaluateAlerts();
  shouldSimulateResendError = false; // Rétablir le fonctionnement normal

  const alertT5 = db.getAlert(resT5.alert!.id);
  assert(
    alertT5?.status === 'active' &&
    alertT5.notificationStatus === 'failed' &&
    alertT5.retryCount === 1 &&
    alertT5.notificationDetails?.error?.includes('Resend API Error') === true,
    'TEST 5 : Erreur Resend -> Échec correctement géré (Alerte conservée active, pas de faux succès)',
    `Statut: ${alertT5?.status}, Notification: ${alertT5?.notificationStatus}, RetryCount: ${alertT5?.retryCount}, Erreur enregistrée: ${alertT5?.notificationDetails?.error}`
  );

  // =========================================================================
  // TEST 6 : Désinscription -> Aucun nouvel email
  // L'utilisateur configure une alerte (seuil favorable 430 € > 399 €)
  // mais clique sur le lien de désinscription -> statut 'cancelled' -> aucun email
  // =========================================================================
  const resT6 = alertManager.createAlert({
    email: 'test-user-6@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 430,
    currentPriceAtCreation: 449,
  });
  const unsubResult = alertManager.unsubscribeByToken(resT6.alert!.unsubscribeToken);
  capturedEmails.length = 0;
  await alertManager.evaluateAlerts();
  const alertT6AfterUnsub = db.getAlert(resT6.alert!.id);
  const emailsForT6 = capturedEmails.filter(e => e.to === 'test-user-6@test-domain.invalid');
  assert(
    unsubResult.success === true &&
    alertT6AfterUnsub?.status === 'cancelled' &&
    emailsForT6.length === 0,
    'TEST 6 : Désinscription -> Alerte annulée, aucun nouvel email',
    `Succès désinscription: ${unsubResult.success}, Statut: ${alertT6AfterUnsub?.status}, Emails envoyés à l'utilisateur: ${emailsForT6.length}`
  );

  // =========================================================================
  // TEST 7 : Sécurité rupture de stock -> Aucune fausse alerte
  // Prix de 349 € chez Cdiscount, mais inStock = false
  // =========================================================================
  capturedEmails.length = 0;
  const resT7 = alertManager.createAlert({
    email: 'test-user-7@test-domain.invalid',
    productId: 'ps5-slim',
    productName: 'PS5 Slim Lecteur',
    editionType: 'disc',
    targetPrice: 400, // 349 € < 400 € mais en rupture
    currentPriceAtCreation: 549,
  });
  await alertManager.evaluateAlerts();
  const alertT7 = db.getAlert(resT7.alert!.id);
  assert(
    alertT7?.status === 'active' &&
    alertT7.notificationStatus === 'none' &&
    capturedEmails.length === 0,
    'TEST 7 : Rupture de stock (349 € hors stock) -> Aucune alerte déclenchée',
    `Statut: ${alertT7?.status}, Emails envoyés: ${capturedEmails.length}`
  );

  // =========================================================================
  // TEST 8 : Sécurité prix aberrant (0 €) -> Rejet sécurisé
  // =========================================================================
  const resT8 = alertManager.createAlert({
    email: 'test-user-8@test-domain.invalid',
    productId: 'ps5-pro',
    productName: 'PS5 Pro',
    editionType: 'digital',
    targetPrice: 600,
    currentPriceAtCreation: 799,
  });
  await alertManager.evaluateAlerts();
  const alertT8 = db.getAlert(resT8.alert!.id);
  assert(
    alertT8?.status === 'active' && alertT8.notificationStatus === 'none',
    'TEST 8 : Sécurité prix aberrant (0 €) -> Rejet sécurisé du déclenchement',
    `Statut obtenu: ${alertT8?.status}`
  );

  // =========================================================================
  // TEST 9 : Détection du statut Resend sans clé API
  // Vérifie la clarté du diagnostic en l'absence de variable d'environnement
  // =========================================================================
  notificationService.setMockTransporter(null); // Retirer le mock
  const oldKey = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  const statusWithoutKey = notificationService.getStatus();
  if (oldKey) process.env.RESEND_API_KEY = oldKey; // Restaurer si existait

  assert(
    statusWithoutKey.configured === false &&
    statusWithoutKey.status === 'missing_config' &&
    statusWithoutKey.statusLabel.includes('Configuration Resend manquante'),
    'TEST 9 : Diagnostic clair lorsque RESEND_API_KEY est absente',
    `Configuré: ${statusWithoutKey.configured}, Label: ${statusWithoutKey.statusLabel}`
  );

  // =========================================================================
  // TEST 10 : Confidentialité des données (Masquage systématique des emails)
  // =========================================================================
  const summary = alertManager.getPublicAlertsSummary();
  const allMasked = summary.every(a => a.maskedEmail && a.maskedEmail.includes('***') && !(a as any).email);
  assert(
    allMasked,
    'TEST 10 : Protection de la vie privée (Anonymisation stricte des emails dans l\'API)',
    `Vérifié sur ${summary.length} alerte(s)`
  );

  console.log('\n==================================================');
  console.log(`📊 BILAN DES TESTS : ${passed} RÉUSSIS / ${passed + failed} TOTAL`);
  console.log('==================================================\n');

  // Remettre à zéro le mock pour ne pas polluer l'exécution normale
  notificationService.setMockTransporter(null);

  return { passed, failed, total: passed + failed };
}
