import { db } from './db';
import { BackendPriceAlert, LiveOffer } from './types';
import { notificationService } from './services/notificationService';
import crypto from 'crypto';

export interface AlertCheckResult {
  alertsChecked: number;
  alertsTriggered: number;
  triggeredAlertIds: string[];
  details: Array<{
    alertId: string;
    productName: string;
    targetPrice: number;
    bestPriceFound: number | null;
    merchantName?: string;
    status: 'triggered' | 'kept_active';
    reason: string;
  }>;
}

class AlertManager {
  /**
   * Masque une adresse email pour protéger la vie privée (ex: "cl***1@test.com")
   */
  public maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.***';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local.slice(0, 2)}***${local.slice(-1)}@${domain}`;
  }

  /**
   * Génère un jeton de désinscription hautement sécurisé (48 caractères hexadécimaux aléatoires)
   */
  private generateSecureUnsubscribeToken(): string {
    return crypto.randomBytes(24).toString('hex');
  }

  /**
   * Crée une nouvelle alerte de prix avec validation stricte
   */
  public createAlert(params: {
    email: string;
    productId: string;
    productName: string;
    editionType: 'digital' | 'disc';
    targetPrice: number;
    currentPriceAtCreation: number;
  }): { success: boolean; alert?: BackendPriceAlert; message: string } {
    // 1. Validation stricte de l'adresse email
    const rawEmail = (params.email || '').trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (!rawEmail || rawEmail.length > 254 || !emailRegex.test(rawEmail)) {
      return { success: false, message: 'Adresse email invalide.' };
    }

    // 2. Validation du prix cible
    const targetPrice = Math.round(Number(params.targetPrice));
    if (!targetPrice || isNaN(targetPrice) || targetPrice <= 50) {
      return { success: false, message: 'Le prix cible doit être un montant valide supérieur à 50 €.' };
    }

    // 3. Vérification anti-doublon (même email + même produit + même édition)
    const existingActive = db.getActiveAlerts().find(
      a => a.email.toLowerCase() === rawEmail &&
           a.productId === params.productId &&
           a.editionType === params.editionType
    );

    if (existingActive) {
      if (existingActive.targetPrice === targetPrice) {
        return {
          success: true,
          alert: { ...existingActive, email: this.maskEmail(existingActive.email) },
          message: 'Une alerte active identique existe déjà pour cette console et ce seuil.'
        };
      } else {
        // Mise à jour du seuil pour éviter un doublon discordant
        db.updateAlertStatus(existingActive.id, {
          targetPrice: targetPrice,
          lastCheckedAt: new Date().toISOString()
        });
        const updated = db.getAlert(existingActive.id);
        return {
          success: true,
          alert: updated ? { ...updated, email: this.maskEmail(updated.email) } : undefined,
          message: `Votre alerte existante a été mise à jour avec le nouveau seuil (${targetPrice} €).`
        };
      }
    }

    const now = new Date().toISOString();
    const newAlert: BackendPriceAlert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: rawEmail,
      productId: params.productId,
      productName: params.productName,
      editionType: params.editionType,
      targetPrice: targetPrice,
      currentPriceAtCreation: params.currentPriceAtCreation,
      status: 'active',
      unsubscribeToken: this.generateSecureUnsubscribeToken(),
      notificationStatus: 'none',
      retryCount: 0,
      createdAt: now,
      lastCheckedAt: now,
    };

    db.saveAlert(newAlert);
    console.log(`[TRACKO AlertManager] Alerte créée (${newAlert.id}) pour ${this.maskEmail(rawEmail)} : ${params.productName} (${params.editionType}) <= ${newAlert.targetPrice} €`);

    return {
      success: true,
      alert: { ...newAlert, email: this.maskEmail(rawEmail) },
      message: 'Alerte de prix enregistrée avec succès.'
    };
  }

  /**
   * Évalue toutes les alertes actives par rapport aux offres actuellement disponibles
   * RÈGLES STRICTES :
   * - inStock === true obligatoire
   * - totalPrice <= targetPrice
   * - Sélection du MEILLEUR prix disponible parmi tous les marchands
   * - Ne JAMAIS déclencher une alerte déjà passée en "triggered" (garantie anti-spam)
   * - Gestion des erreurs d'envoi : échec correctement géré sans fausse confirmation
   */
  public async evaluateAlerts(appBaseUrl: string = 'http://localhost:3000'): Promise<AlertCheckResult> {
    const activeAlerts = db.getActiveAlerts();
    const nowIso = new Date().toISOString();

    const result: AlertCheckResult = {
      alertsChecked: activeAlerts.length,
      alertsTriggered: 0,
      triggeredAlertIds: [],
      details: [],
    };

    for (const alert of activeAlerts) {
      // 1. Récupérer toutes les offres disponibles correspondant exactement au produit et à l'édition
      const matchingOffers = db.getOffersForProduct(alert.productId, alert.editionType);

      // 2. Filtrer STRICTEMENT les offres RÉELLEMENT en stock
      const inStockOffers = matchingOffers.filter(offer => offer.inStock === true);

      // 3. Trouver la MEILLEURE offre en stock (le prix total le plus bas)
      let bestInStockOffer: LiveOffer | null = null;
      if (inStockOffers.length > 0) {
        bestInStockOffer = inStockOffers.reduce((best, current) => {
          const currentTotal = current.totalPrice || current.price;
          const bestTotal = best.totalPrice || best.price;
          return currentTotal < bestTotal ? current : best;
        });
      }

      const bestPrice = bestInStockOffer ? (bestInStockOffer.totalPrice || bestInStockOffer.price) : null;

      // 4. Évaluation du seuil avec validation anti-aberration (prix réel >= 50 € et non NaN)
      if (bestInStockOffer && bestPrice !== null && !isNaN(bestPrice) && bestPrice >= 50 && bestPrice <= alert.targetPrice) {
        // Envoi réel ou simulé via notificationService
        const sendResult = await notificationService.sendPriceAlertNotification(alert, bestInStockOffer, appBaseUrl);

        if (sendResult.success) {
          // Condition satisfaite ET envoi réussi (ou mock validé en test) :
          // Passage définitif en statut 'triggered' (anti-spam : ne sera plus jamais re-sélectionné)
          const updatedAlert: BackendPriceAlert = {
            ...alert,
            status: 'triggered',
            notificationStatus: 'sent',
            lastCheckedAt: nowIso,
            triggeredAt: nowIso,
            notifiedAt: nowIso,
            notificationDetails: {
              service: 'resend',
              mode: sendResult.mode === 'mock_test' ? 'simulation' : 'production',
              messageId: sendResult.messageId,
              sentAt: nowIso,
              simulated: sendResult.simulated,
            },
            triggerOffer: {
              merchantId: bestInStockOffer.merchantId,
              merchantName: bestInStockOffer.merchantName,
              price: bestPrice,
              inStock: true,
              condition: bestInStockOffer.condition,
              isTestOffer: false,
            }
          };

          db.updateAlertStatus(alert.id, updatedAlert);
          result.alertsTriggered++;
          result.triggeredAlertIds.push(alert.id);
          result.details.push({
            alertId: alert.id,
            productName: alert.productName,
            targetPrice: alert.targetPrice,
            bestPriceFound: bestPrice,
            merchantName: bestInStockOffer.merchantName,
            status: 'triggered',
            reason: `Offre en stock trouvée chez ${bestInStockOffer.merchantName} à ${bestPrice} € (seuil: ${alert.targetPrice} €) — Notification transmise avec succès.`,
          });

          console.log(`[TRACKO AlertManager] 🎯 ALERTE DÉCLENCHÉE & NOTIFIÉE (${alert.id}) : ${alert.productName} (${alert.editionType}) à ${bestPrice} € chez ${bestInStockOffer.merchantName} pour ${this.maskEmail(alert.email)} (Seuil: ${alert.targetPrice} €)`);
        } else {
          // ÉCHEC D'ENVOI (Resend en erreur ou clé API manquante) :
          // RÈGLE CRITIQUE : Ne PAS considérer l'envoi comme réussi, ne PAS supprimer l'alerte,
          // ne PAS créer de fausse confirmation. L'alerte reste 'active' pour nouvelle tentative.
          const newRetryCount = (alert.retryCount || 0) + 1;
          db.updateAlertStatus(alert.id, {
            lastCheckedAt: nowIso,
            notificationStatus: 'failed',
            retryCount: newRetryCount,
            notificationDetails: {
              service: 'resend',
              mode: sendResult.mode === 'missing_config' ? 'production' : 'production',
              error: sendResult.error || sendResult.message,
              sentAt: nowIso,
              simulated: false,
            },
          });

          result.details.push({
            alertId: alert.id,
            productName: alert.productName,
            targetPrice: alert.targetPrice,
            bestPriceFound: bestPrice,
            merchantName: bestInStockOffer.merchantName,
            status: 'kept_active',
            reason: `Seuil atteint (${bestPrice} € <= ${alert.targetPrice} €) mais échec d'envoi (${sendResult.error || sendResult.message}). Alerte maintenue active (tentative ${newRetryCount}).`,
          });

          console.warn(`[TRACKO AlertManager] ⚠️ Alerte ${alert.id} : seuil atteint mais notification en échec (${sendResult.message}). Statut maintenu 'active'.`);
        }
      } else {
        // Condition de prix non satisfaite : mise à jour de l'horodatage de vérification
        db.updateAlertStatus(alert.id, {
          lastCheckedAt: nowIso
        });

        let reason = '';
        if (!bestInStockOffer) {
          reason = 'Aucune offre en stock actuellement pour ce produit.';
        } else {
          reason = `Meilleur prix en stock (${bestPrice} € chez ${bestInStockOffer.merchantName}) supérieur au seuil (${alert.targetPrice} €).`;
        }

        result.details.push({
          alertId: alert.id,
          productName: alert.productName,
          targetPrice: alert.targetPrice,
          bestPriceFound: bestPrice,
          status: 'kept_active',
          reason,
        });
      }
    }

    return result;
  }

  /**
   * Désabonne un utilisateur grâce à son jeton unique et sécurisé
   */
  public unsubscribeByToken(token: string): { success: boolean; message: string; alert?: BackendPriceAlert } {
    if (!token || token.length < 24) {
      return { success: false, message: 'Jeton de désinscription invalide.' };
    }

    const alert = db.getAllAlerts().find(a => a.unsubscribeToken === token);
    if (!alert) {
      return { success: false, message: 'Alerte introuvable ou déjà supprimée.' };
    }

    db.updateAlertStatus(alert.id, { status: 'cancelled' });
    console.log(`[TRACKO AlertManager] Alerte ${alert.id} désactivée via jeton sécurisé.`);

    return {
      success: true,
      alert,
      message: `Votre alerte pour ${alert.productName} a bien été désactivée.`
    };
  }

  /**
   * Supprime définitivement une alerte de la base de données
   */
  public deleteAlert(id: string): { success: boolean; message: string } {
    const existing = db.getAlert(id);
    if (!existing) {
      return { success: false, message: 'Alerte introuvable ou déjà supprimée.' };
    }
    const deleted = db.deleteAlert(id);
    console.log(`[TRACKO AlertManager] Alerte ${id} supprimée définitivement.`);
    return {
      success: deleted,
      message: deleted ? 'Alerte supprimée avec succès.' : 'Erreur lors de la suppression de l\'alerte.'
    };
  }

  /**
   * Modifie le prix cible d'une alerte existante
   */
  public updateAlertTargetPrice(id: string, newTargetPrice: number): { success: boolean; alert?: any; message: string } {
    const existing = db.getAlert(id);
    if (!existing) {
      return { success: false, message: 'Alerte introuvable.' };
    }
    if (!newTargetPrice || newTargetPrice <= 50 || isNaN(newTargetPrice)) {
      return { success: false, message: 'Le prix cible doit être un montant valide supérieur à 50 €.' };
    }
    const rounded = Math.round(newTargetPrice);
    db.updateAlertStatus(id, {
      targetPrice: rounded,
      status: 'active', // Réactive l'alerte avec le nouveau seuil
      lastCheckedAt: new Date().toISOString()
    });
    const updated = db.getAlert(id);
    console.log(`[TRACKO AlertManager] Alerte ${id} mise à jour : nouveau seuil = ${rounded} €.`);
    return {
      success: true,
      alert: updated ? { ...updated, email: this.maskEmail(updated.email) } : undefined,
      message: `Seuil d'alerte mis à jour à ${rounded} €.`
    };
  }

  /**
   * Active ou suspend une alerte
   */
  public toggleAlertStatus(id: string, activate?: boolean): { success: boolean; alert?: any; message: string } {
    const existing = db.getAlert(id);
    if (!existing) {
      return { success: false, message: 'Alerte introuvable.' };
    }
    const targetStatus = activate !== undefined 
      ? (activate ? 'active' : 'cancelled')
      : (existing.status === 'active' ? 'cancelled' : 'active');

    db.updateAlertStatus(id, { status: targetStatus });
    const updated = db.getAlert(id);
    return {
      success: true,
      alert: updated ? { ...updated, email: this.maskEmail(updated.email) } : undefined,
      message: targetStatus === 'active' ? 'Alerte réactivée.' : 'Alerte suspendue.'
    };
  }

  /**
   * Retourne la liste anonymisée des alertes pour la surveillance et les tests
   */
  public getPublicAlertsSummary() {
    return db.getAllAlerts().map(a => ({
      id: a.id,
      maskedEmail: this.maskEmail(a.email),
      productId: a.productId,
      productName: a.productName,
      editionType: a.editionType,
      targetPrice: a.targetPrice,
      status: a.status,
      notificationStatus: a.notificationStatus,
      retryCount: a.retryCount,
      createdAt: a.createdAt,
      triggeredAt: a.triggeredAt,
      notifiedAt: a.notifiedAt,
      triggerOffer: a.triggerOffer,
    }));
  }
}

export const alertManager = new AlertManager();
