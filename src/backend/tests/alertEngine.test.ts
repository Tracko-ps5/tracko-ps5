import { db } from '../db';
import { alertManager } from '../alertManager';
import { LiveOffer } from '../types';

/**
 * Script de test unitaire et de validation pour le moteur d'alerte TRACKO
 * Teste les 6 cas requis par le cahier des charges :
 * TEST 1 : prix supérieur au seuil -> active
 * TEST 2 : prix égal au seuil -> triggered
 * TEST 3 : prix inférieur au seuil -> triggered
 * TEST 4 : prix inférieur mais rupture de stock -> active
 * TEST 5 : deuxième synchronisation après déclenchement -> aucun deuxième déclenchement
 * TEST 6 : plusieurs marchands -> sélection du meilleur prix disponible
 */

export function runAlertEngineTests() {
  console.log('\n==================================================');
  console.log('🧪 DÉBUT DE LA SUITE DE TESTS : MOTEUR D\'ALERTE TRACKO');
  console.log('==================================================\n');

  // Nettoyage complet de la base de test
  db.clearAlertsForTesting();
  db.clearOffersForTesting();

  // Configuration d'offres de test précises
  const testOffers: LiveOffer[] = [
    {
      id: 'offer-fnac-ps5-slim-digital',
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
      inStock: true, // EN STOCK à 419 €
      stockStatus: 'in_stock',
      url: 'https://test.fnac.com',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 419,
      isBestPrice: false,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '31/08/2026',
      sourceType: 'automated_feed',
    },
    {
      id: 'offer-boulanger-ps5-slim-digital',
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
      inStock: true, // EN STOCK à 399 € (Meilleur prix)
      stockStatus: 'in_stock',
      url: 'https://test.boulanger.com',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 399,
      isBestPrice: true,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '31/08/2026',
      sourceType: 'automated_feed',
    },
    {
      id: 'offer-cheapest-out-of-stock',
      productId: 'ps5-slim',
      editionType: 'disc',
      merchantId: 'rupture-test',
      merchantName: 'Marchand Rupture (Test)',
      seller: 'Test',
      price: 350,
      originalPrice: 549,
      currency: 'EUR',
      condition: 'new',
      conditionLabel: 'Neuf',
      inStock: false, // RUPTURE DE STOCK à 350 €
      stockStatus: 'out_of_stock',
      url: 'https://test.rupture.com',
      deliveryPrice: 0,
      deliveryInfo: 'Gratuit',
      totalPrice: 350,
      isBestPrice: false,
      lastChecked: new Date().toISOString(),
      lastCheckedFormatted: '31/08/2026',
      sourceType: 'automated_feed',
    }
  ];

  testOffers.forEach(o => db.upsertOffer(o));

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

  // TEST 1 : prix supérieur au seuil -> reste "active"
  // Offre minimale en stock pour PS5 Slim Digitale = 399 € (Boulanger)
  // Alerte avec seuil = 380 €
  const res1 = alertManager.createAlert({
    email: 'client1@test.com',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 380,
    currentPriceAtCreation: 449,
  });
  const eval1 = alertManager.evaluateAlerts();
  const alert1 = db.getAlert(res1.alert!.id);
  assert(
    alert1?.status === 'active',
    'TEST 1 : Prix supérieur au seuil (399 € > 380 €) -> Statut "active"',
    `Statut obtenu: ${alert1?.status}, Seuil: 380 €, Meilleur prix stock: 399 €`
  );

  // TEST 2 : prix égal au seuil -> passe en "triggered"
  // Alerte avec seuil = 399 € (égal au prix Boulanger 399 €)
  const res2 = alertManager.createAlert({
    email: 'client2@test.com',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 399,
    currentPriceAtCreation: 449,
  });
  const eval2 = alertManager.evaluateAlerts();
  const alert2 = db.getAlert(res2.alert!.id);
  assert(
    alert2?.status === 'triggered' && alert2.triggerOffer?.price === 399,
    'TEST 2 : Prix égal au seuil (399 € == 399 €) -> Statut "triggered"',
    `Statut obtenu: ${alert2?.status}, Marchand déclencheur: ${alert2?.triggerOffer?.merchantName} à ${alert2?.triggerOffer?.price} €`
  );

  // TEST 3 : prix inférieur au seuil -> passe en "triggered"
  // Alerte avec seuil = 410 € (supérieur au prix Boulanger 399 €)
  const res3 = alertManager.createAlert({
    email: 'client3@test.com',
    productId: 'ps5-slim',
    productName: 'PS5 Slim',
    editionType: 'digital',
    targetPrice: 410,
    currentPriceAtCreation: 449,
  });
  const eval3 = alertManager.evaluateAlerts();
  const alert3 = db.getAlert(res3.alert!.id);
  assert(
    alert3?.status === 'triggered' && alert3.triggerOffer?.price === 399,
    'TEST 3 : Prix inférieur au seuil (399 € < 410 €) -> Statut "triggered"',
    `Statut obtenu: ${alert3?.status}, Prix déclencheur: ${alert3?.triggerOffer?.price} €`
  );

  // TEST 4 : prix inférieur mais rupture de stock -> reste "active"
  // Pour PS5 Slim avec Lecteur, l'offre à 350 € est inStock === false
  // Alerte avec seuil = 400 €
  const res4 = alertManager.createAlert({
    email: 'client4@test.com',
    productId: 'ps5-slim',
    productName: 'PS5 Slim Lecteur',
    editionType: 'disc',
    targetPrice: 400,
    currentPriceAtCreation: 549,
  });
  const eval4 = alertManager.evaluateAlerts();
  const alert4 = db.getAlert(res4.alert!.id);
  assert(
    alert4?.status === 'active' && !alert4.triggeredAt,
    'TEST 4 : Prix inférieur mais offre hors stock (350 € RUPTURE) -> Statut "active" (Non déclenchée)',
    `Statut obtenu: ${alert4?.status}, triggeredAt: ${alert4?.triggeredAt || 'aucun (conforme)'}`
  );

  // TEST 5 : deuxième synchronisation après déclenchement -> aucun deuxième déclenchement
  const eval5 = alertManager.evaluateAlerts();
  // Les alertes 2 et 3 sont déjà 'triggered', donc 'getActiveAlerts' ne doit plus les réévaluer
  const stillTriggeredCount = eval5.alertsTriggered;
  assert(
    stillTriggeredCount === 0,
    'TEST 5 : Deuxième évaluation après déclenchement -> 0 re-déclenchement',
    `Nouvelles alertes déclenchées au 2e cycle: ${stillTriggeredCount}`
  );

  // TEST 6 : plusieurs marchands -> sélection du meilleur prix disponible
  // Deux marchands en stock pour PS5 Slim Digitale : Fnac (419 €) et Boulanger (399 €)
  assert(
    alert2?.triggerOffer?.merchantId === 'boulanger-test' && alert2.triggerOffer.price === 399,
    'TEST 6 : Sélection automatique du meilleur prix (Boulanger à 399 € vs Fnac à 419 €)',
    `Marchand sélectionné: ${alert2?.triggerOffer?.merchantName} (${alert2?.triggerOffer?.price} €)`
  );

  // TEST 7 (Confidentialité) : Masquage des emails
  const publicSummary = alertManager.getPublicAlertsSummary();
  const emailExposed = publicSummary.some(a => (a as any).email !== undefined);
  const allMasked = publicSummary.every(a => a.maskedEmail && a.maskedEmail.includes('***'));
  assert(
    !emailExposed && allMasked,
    'TEST 7 (Sécurité) : Aucun email en clair dans l\'API publique (ex: "c***1@test.com")',
    `Format anonymisé vérifié: ${publicSummary[0]?.maskedEmail}`
  );

  console.log('\n==================================================');
  console.log(`📊 BILAN DES TESTS : ${passed} RÉUSSIS / ${passed + failed} TOTAL`);
  console.log('==================================================\n');

  return { passed, failed, total: passed + failed };
}
