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
   * Masque une adresse email pour protéger la vie privée (ex: "j***e@gmail.com")
   */
  public maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***@***.***';
    const [local, domain] = email.split('@');
    if (local.length <= 2) {
      return `${local[0]}***@${domain}`;
    }
    return `${local[0]}***${local[local.length - 1]}@${domain}`;
  }

  /**
   * Génère un jeton de désinscription sécurisé, aléatoire et imprédictible
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
    // 1. Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!params.email || !emailRegex.test(params.email.trim())) {
      return { success: false, message: 'Adresse email invalide.' };
    }

    // 2. Validation du prix cible
    if (!params.targetPrice || params.targetPrice <= 50 || isNaN(params.targetPrice)) {
      return { success: false, message: 'Le prix cible doit être un montant valide supérieur à 50 €.' };
    }

    const cleanEmail = params.email.trim().toLowerCase();

    // 3. Vérification anti-doublon (même email + même produit + même édition + seuil identique)
    const existingActive = db.getActiveAlerts().find(
      a => a.email.toLowerCase() === cleanEmail &&
           a.productId === params.productId &&
           a.editionType === params.editionType &&
           a.targetPrice === params.targetPrice
    );

    if (existingActive) {
      return {
        success: true,
        alert: { ...existingActive, email: this.maskEmail(existingActive.email) },
        message: 'Une alerte active identique existe déjà pour cette adresse email.'
      };
    }

    const now = new Date().toISOString();
    const newAlert: BackendPriceAlert = {
      id: `alt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      email: cleanEmail,
      productId: params.productId,
      productName: params.productName,
      editionType: params.editionType,
      targetPrice: Math.round(params.targetPrice),
      currentPriceAtCreation: params.currentPriceAtCreation,
      status: 'active',
      unsubscribeToken: this.generateSecureUnsubscribeToken(),
      notificationStatus: 'none',
      retryCount: 0,
      createdAt: now,
      lastCheckedAt: now,
    };

    db.saveAlert(newAlert);
    console.log(`[TRACKO AlertManager] Alerte créée (${newAlert.id}) pour ${this.maskEmail(cleanEmail)} : ${params.productName} (${params.editionType}) <= ${newAlert.targetPrice} €`);

    return {
      success: true,
      alert: { ...newAlert, email: this.maskEmail(cleanEmail) },
      message: 'Alerte de prix enregistrée avec succès.'
    };
  }

  /**
   * Évalue toutes les alertes actives par rapport aux offres actuellement disponibles
   * RÈGLES STRICTES :
   * - inStock === true obligatoire
   * - totalPrice <= targetPrice
   * - Sélection du MEILLEUR prix disponible parmi tous les marchands
   * - Ne JAMAIS déclencher une alerte déjà passée en "triggered"
   */
  public evaluateAlerts(appBaseUrl: string = 'http://localhost:3000'): AlertCheckResult {
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

      // 4. Évaluation du seuil
      if (bestInStockOffer && bestPrice !== null && bestPrice <= alert.targetPrice) {
        // Condition satisfaite : DÉCLENCHEMENT DE L'ALERTE (Passage en 'triggered')
        const updatedAlert: BackendPriceAlert = {
          ...alert,
          status: 'triggered',
          lastCheckedAt: nowIso,
          triggeredAt: nowIso,
          triggerOffer: {
            merchantId: bestInStockOffer.merchantId,
            merchantName: bestInStockOffer.merchantName,
            price: bestPrice,
            inStock: true,
            condition: bestInStockOffer.condition,
            isTestOffer: true, // Marquage explicite de sécurité TEST
          }
        };

        db.updateAlertStatus(alert.id, updatedAlert);

        // Déclenchement de la notification (Simulation ou Production selon config)
        notificationService.sendPriceAlertNotification(updatedAlert, bestInStockOffer, appBaseUrl).catch(err => {
          console.error(`[TRACKO AlertManager] Erreur asynchrone lors de la notification (${alert.id}) :`, err);
        });

        result.alertsTriggered++;
        result.triggeredAlertIds.push(alert.id);
        result.details.push({
          alertId: alert.id,
          productName: alert.productName,
          targetPrice: alert.targetPrice,
          bestPriceFound: bestPrice,
          merchantName: bestInStockOffer.merchantName,
          status: 'triggered',
          reason: `Offre en stock trouvée chez ${bestInStockOffer.merchantName} à ${bestPrice} € (seuil: ${alert.targetPrice} €).`,
        });

        console.log(`[TRACKO AlertManager] 🎯 ALERTE DÉCLENCHÉE (${alert.id}) : ${alert.productName} (${alert.editionType}) trouvé à ${bestPrice} € chez ${bestInStockOffer.merchantName} pour ${this.maskEmail(alert.email)} (Seuil: ${alert.targetPrice} €)`);
      } else {
        // Condition non satisfaite : mise à jour de la date de vérification
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
   * Désabonne un utilisateur grâce à son token unique et sécurisé
   */
  public unsubscribeByToken(token: string): { success: boolean; message: string } {
    if (!token || token.length < 16) {
      return { success: false, message: 'Jeton de désinscription invalide.' };
    }

    const alert = db.getAllAlerts().find(a => a.unsubscribeToken === token);
    if (!alert) {
      return { success: false, message: 'Alerte introuvable ou déjà supprimée.' };
    }

    db.updateAlertStatus(alert.id, { status: 'cancelled' });
    console.log(`[TRACKO AlertManager] Alerte ${alert.id} désactivée via jeton.`);

    return {
      success: true,
      message: `Votre alerte pour ${alert.productName} a bien été désactivée.`
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

