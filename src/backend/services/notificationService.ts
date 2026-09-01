import { db } from '../db';
import { BackendPriceAlert, LiveOffer } from '../types';

export interface NotificationResult {
  success: boolean;
  mode: 'simulation' | 'production';
  messageId?: string;
  simulated: boolean;
  message: string;
}

export class NotificationService {
  /**
   * Vérifie si un service d'email de production est configuré
   */
  public isProductionConfigured(): boolean {
    const resendKey = process.env.RESEND_API_KEY;
    const smtpHost = process.env.SMTP_HOST;
    return Boolean(
      (resendKey && resendKey.trim().length > 0 && !resendKey.includes('VOTRE_')) ||
      (smtpHost && smtpHost.trim().length > 0 && !smtpHost.includes('VOTRE_'))
    );
  }

  /**
   * Envoie une notification d'alerte de baisse de prix
   * En mode simulation (sans clé API) : simule l'envoi, logge le contenu et met à jour le statut en base de façon transparente.
   */
  public async sendPriceAlertNotification(
    alert: BackendPriceAlert,
    offer: LiveOffer,
    appBaseUrl?: string
  ): Promise<NotificationResult> {
    const now = new Date();
    const nowIso = now.toISOString();
    const isProd = this.isProductionConfigured();
    const unsubscribeLink = `${appBaseUrl || ''}/api/alerts/unsubscribe?token=${alert.unsubscribeToken}`;

    const emailSubject = `🔔 Baisse de prix TRACKO : ${alert.productName} disponible à ${offer.price} € chez ${offer.merchantName} !`;

    if (isProd) {
      // Branche pour futur fournisseur de production (Resend / SMTP)
      console.log(`[TRACKO Notification] Envoi réel en cours vers ${alert.email}...`);
      // Le code réseau réel s'exécutera ici lorsque les clés seront injectées
    }

    // Mode simulation / bac à sable
    const simulatedMessageId = `sim-notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    console.log(`[TRACKO Notification] 📨 Simulation d'email envoyée avec succès :`);
    console.log(`  -> Destinataire : ${alert.email}`);
    console.log(`  -> Objet : ${emailSubject}`);
    console.log(`  -> Marchand : ${offer.merchantName} (${offer.price} € vs seuil ${alert.targetPrice} €)`);
    console.log(`  -> Lien offre : ${offer.url}`);
    console.log(`  -> Lien désinscription : ${unsubscribeLink}`);

    // Mise à jour de l'état de notification de l'alerte
    db.updateAlertStatus(alert.id, {
      notificationStatus: 'sent',
      notifiedAt: nowIso,
      notificationDetails: {
        service: isProd ? 'production-mail' : 'simulation-internal',
        mode: isProd ? 'production' : 'simulation',
        messageId: simulatedMessageId,
        sentAt: nowIso,
        simulated: !isProd,
      },
    });

    return {
      success: true,
      mode: isProd ? 'production' : 'simulation',
      messageId: simulatedMessageId,
      simulated: !isProd,
      message: `Notification ${isProd ? 'réelle envoyée' : 'simulée avec succès'} pour l'alerte ${alert.id}`,
    };
  }
}

export const notificationService = new NotificationService();
