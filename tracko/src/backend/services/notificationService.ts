import { Resend } from 'resend';
import { db } from '../db';
import { BackendPriceAlert, LiveOffer } from '../types';

export type NotificationDeliveryMode = 'production_resend' | 'missing_config' | 'mock_test';

export interface NotificationResult {
  success: boolean;
  mode: NotificationDeliveryMode;
  messageId?: string;
  simulated: boolean;
  message: string;
  error?: string;
  sentPayload?: {
    toMasked: string;
    subject: string;
    productName: string;
    editionLabel: string;
    targetPrice: string;
    currentPrice: string;
    merchantName: string;
    offerUrl: string;
    unsubscribeUrl: string;
  };
}

export type MockNotificationTransporter = (params: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}) => Promise<{ success: boolean; messageId?: string; error?: string }>;

export class NotificationService {
  private resendClient: Resend | null = null;
  private mockTransporter: MockNotificationTransporter | null = null;

  /**
   * Vérifie si la clé API Resend est correctement configurée
   */
  public isResendConfigured(): boolean {
    const key = process.env.RESEND_API_KEY;
    return Boolean(
      key &&
      key.trim().length > 10 &&
      !key.includes('VOTRE_') &&
      !key.includes('MY_')
    );
  }

  /**
   * Retourne l'expéditeur configuré ou l'adresse par défaut
   */
  public getSenderAddress(): string {
    const from = process.env.RESEND_FROM_EMAIL?.trim();
    if (from && from.length > 5) {
      return from;
    }
    // Par défaut, nom d'affichage clair et adresse du domaine
    return 'TRACKO <alertes@tracko.fr>';
  }

  /**
   * Permet d'injecter un transporteur fictif pour les tests automatisés
   */
  public setMockTransporter(transporter: MockNotificationTransporter | null): void {
    this.mockTransporter = transporter;
  }

  /**
   * Retourne le statut détaillé de la passerelle email
   */
  public getStatus() {
    const configured = this.isResendConfigured();
    const key = process.env.RESEND_API_KEY?.trim() || '';
    return {
      service: 'Resend',
      configured,
      status: configured ? 'ready' : 'missing_config',
      statusLabel: configured 
        ? '🟢 Prêt pour l\'envoi réel via Resend' 
        : '🟠 Configuration Resend manquante (RESEND_API_KEY absente dans l\'environnement)',
      fromEmail: this.getSenderAddress(),
      maskedKey: key.length > 8 ? `${key.substring(0, 5)}...${key.substring(key.length - 3)}` : null,
      notes: configured
        ? 'Les alertes déclenchées envoient un email réel.'
        : 'Renseignez la variable RESEND_API_KEY dans vos paramètres Netlify pour activer l\'envoi réel.',
    };
  }

  /**
   * Détermine l'URL de base publique de l'application
   */
  private resolveAppBaseUrl(providedUrl?: string): string {
    if (providedUrl && providedUrl.startsWith('http')) {
      return providedUrl.replace(/\/+$/, '');
    }
    const envUrl = process.env.APP_URL || process.env.URL || process.env.DEPLOY_PRIME_URL;
    if (envUrl && envUrl.startsWith('http')) {
      return envUrl.replace(/\/+$/, '');
    }
    return 'https://tracko.fr';
  }

  /**
   * Masque l'email pour la journalisation sécurisée (ex: "cl***1@domain.com")
   */
  private maskEmail(email: string): string {
    if (!email || !email.includes('@')) return '***';
    const [user, domain] = email.split('@');
    const start = user.length > 2 ? user.slice(0, 2) : user.slice(0, 1);
    const end = user.length > 3 ? user.slice(-1) : '';
    return `${start}***${end}@${domain}`;
  }

  /**
   * Formate un prix avec le format français (ex: "349,99 €" ou "350 €")
   */
  private formatPrice(price: number): string {
    if (Math.round(price) === price) {
      return `${price} €`;
    }
    return `${price.toFixed(2).replace('.', ',')} €`;
  }

  /**
   * Construit les versions texte et HTML de l'email d'alerte TRACKO
   */
  public generateEmailTemplate(alert: BackendPriceAlert, offer: LiveOffer, baseUrl: string) {
    const editionLabel = alert.editionType === 'digital' ? 'Digitale' : 'Avec Lecteur';
    const currentPriceFormatted = this.formatPrice(offer.totalPrice || offer.price);
    const targetPriceFormatted = this.formatPrice(alert.targetPrice);
    const unsubscribeLink = `${baseUrl}/api/alerts/unsubscribe?token=${alert.unsubscribeToken}`;

    const text = [
      'TRACKO',
      '',
      'Bonne nouvelle : le prix de votre PS5 a atteint votre objectif.',
      '',
      `Modèle : ${alert.productName}`,
      `Édition : ${editionLabel}`,
      `Prix cible : ${targetPriceFormatted}`,
      `Prix actuel : ${currentPriceFormatted}`,
      `Marchand : ${offer.merchantName}`,
      '',
      `Voir l'offre → ${offer.url}`,
      '',
      '--------------------------------------------------',
      'Ne plus recevoir cette alerte :',
      unsubscribeLink,
      '',
      'TRACKO — Le comparateur indépendant de prix PlayStation 5.',
    ].join('\n');

    const html = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Baisse de prix TRACKO - ${alert.productName}</title>
</head>
<body style="margin:0; padding:24px 12px; background-color:#f8fafc; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color:#0f172a;">
  <table align="center" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px; margin:0 auto; background-color:#ffffff; border-radius:16px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 12px rgba(15, 23, 42, 0.04);">
    <!-- En-tête -->
    <tr>
      <td style="padding:28px 32px 20px 32px; border-bottom:1px solid #f1f5f9;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <span style="font-size:22px; font-weight:800; letter-spacing:-0.5px; color:#0f172a; text-transform:uppercase;">TRACKO</span>
            </td>
            <td align="right">
              <span style="display:inline-block; font-size:11px; font-weight:700; color:#16a34a; background-color:#dcfce7; padding:4px 10px; border-radius:9999px; text-transform:uppercase; letter-spacing:0.5px;">Alerte atteinte</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <!-- Corps du message -->
    <tr>
      <td style="padding:32px 32px 28px 32px;">
        <h1 style="margin:0 0 16px 0; font-size:20px; font-weight:700; color:#0f172a; line-height:1.4;">
          Bonne nouvelle : le prix de votre PS5 a atteint votre objectif.
        </h1>
        <p style="margin:0 0 24px 0; font-size:15px; color:#475569; line-height:1.6;">
          Le marchand <strong>${offer.merchantName}</strong> propose actuellement votre modèle au prix attendu.
        </p>

        <!-- Récapitulatif Produit & Prix -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px; background-color:#f8fafc; border-radius:12px; border:1px solid #e2e8f0;">
          <tr>
            <td style="padding:16px 20px; border-bottom:1px solid #e2e8f0;">
              <span style="font-size:13px; color:#64748b; display:block; margin-bottom:2px;">Modèle</span>
              <span style="font-size:15px; font-weight:700; color:#0f172a;">${alert.productName}</span>
            </td>
            <td style="padding:16px 20px; border-bottom:1px solid #e2e8f0;">
              <span style="font-size:13px; color:#64748b; display:block; margin-bottom:2px;">Édition</span>
              <span style="font-size:15px; font-weight:600; color:#0f172a;">${editionLabel}</span>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 20px; border-bottom:1px solid #e2e8f0;">
              <span style="font-size:13px; color:#64748b; display:block; margin-bottom:2px;">Prix cible</span>
              <span style="font-size:15px; font-weight:600; color:#64748b; text-decoration:line-through;">${targetPriceFormatted}</span>
            </td>
            <td style="padding:16px 20px; border-bottom:1px solid #e2e8f0;">
              <span style="font-size:13px; color:#16a34a; font-weight:600; display:block; margin-bottom:2px;">Prix actuel</span>
              <span style="font-size:18px; font-weight:800; color:#16a34a;">${currentPriceFormatted}</span>
            </td>
          </tr>
          <tr>
            <td colspan="2" style="padding:14px 20px;">
              <span style="font-size:13px; color:#64748b;">Marchand vérifié :</span>
              <strong style="font-size:14px; color:#0f172a; margin-left:6px;">${offer.merchantName}</strong>
            </td>
          </tr>
        </table>

        <!-- Bouton CTA vers l'offre -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr>
            <td align="center">
              <a href="${offer.url}" target="_blank" rel="noopener noreferrer" style="display:inline-block; width:100%; box-sizing:border-box; background-color:#2563eb; color:#ffffff; font-size:16px; font-weight:700; text-align:center; text-decoration:none; padding:14px 24px; border-radius:10px; letter-spacing:-0.2px;">
                Voir l'offre →
              </a>
            </td>
          </tr>
        </table>
        <p style="margin:0; text-align:center; font-size:12px; color:#94a3b8;">
          Stock vérifié par TRACKO • Cliquez pour accéder directement à la page du marchand
        </p>
      </td>
    </tr>

    <!-- Pied de page avec désinscription -->
    <tr>
      <td style="padding:24px 32px; background-color:#f8fafc; border-top:1px solid #e2e8f0; text-align:center;">
        <p style="margin:0 0 8px 0; font-size:13px; color:#64748b;">
          Vous recevez ce message car vous avez configuré une alerte sur TRACKO.
        </p>
        <p style="margin:0; font-size:12px;">
          <a href="${unsubscribeLink}" style="color:#64748b; text-decoration:underline;">Ne plus recevoir cette alerte</a>
        </p>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();

    return {
      subject: `🎯 Baisse de prix TRACKO : ${alert.productName} (${editionLabel}) à ${currentPriceFormatted} chez ${offer.merchantName} !`,
      text,
      html,
      unsubscribeLink,
      editionLabel,
      currentPriceFormatted,
      targetPriceFormatted,
    };
  }

  /**
   * Envoie une notification d'alerte réelle via Resend (ou mock/test si configuré)
   */
  public async sendPriceAlertNotification(
    alert: BackendPriceAlert,
    offer: LiveOffer,
    appBaseUrl?: string
  ): Promise<NotificationResult> {
    const now = new Date();
    const nowIso = now.toISOString();
    const baseUrl = this.resolveAppBaseUrl(appBaseUrl);
    const template = this.generateEmailTemplate(alert, offer, baseUrl);
    const maskedEmail = this.maskEmail(alert.email);
    const fromAddress = this.getSenderAddress();

    const payloadSummary = {
      toMasked: maskedEmail,
      subject: template.subject,
      productName: alert.productName,
      editionLabel: template.editionLabel,
      targetPrice: template.targetPriceFormatted,
      currentPrice: template.currentPriceFormatted,
      merchantName: offer.merchantName,
      offerUrl: offer.url,
      unsubscribeUrl: template.unsubscribeLink,
    };

    // 1. CAS TEST / MOCK TRANSPORTER INJECTÉ (pour la suite de tests automatisés)
    if (this.mockTransporter) {
      console.log(`[TRACKO Notification] 🧪 Utilisation du transporteur de test pour ${maskedEmail}...`);
      try {
        const mockResult = await this.mockTransporter({
          from: fromAddress,
          to: alert.email,
          subject: template.subject,
          html: template.html,
          text: template.text,
        });

        if (mockResult.success) {
          const messageId = mockResult.messageId || `mock-msg-${Date.now()}`;
          return {
            success: true,
            mode: 'mock_test',
            messageId,
            simulated: true,
            message: `Email de test simulé avec succès pour ${maskedEmail}`,
            sentPayload: payloadSummary,
          };
        } else {
          return {
            success: false,
            mode: 'mock_test',
            simulated: true,
            message: `Échec du transporteur de test : ${mockResult.error || 'Erreur inconnue'}`,
            error: mockResult.error || 'Mock transporter failure',
            sentPayload: payloadSummary,
          };
        }
      } catch (err: any) {
        return {
          success: false,
          mode: 'mock_test',
          simulated: true,
          message: `Exception lors du transporteur de test : ${err?.message || 'Erreur'}`,
          error: err?.message || 'Unknown mock error',
          sentPayload: payloadSummary,
        };
      }
    }

    // 2. CAS RESEND NON CONFIGURÉ (Pas de clé RESEND_API_KEY dans l'environnement)
    if (!this.isResendConfigured()) {
      console.log(`[TRACKO Notification] 🟠 Configuration Resend manquante : RESEND_API_KEY absente.`);
      console.log(`   └─ Destinataire masqué: ${maskedEmail}, Seuil: ${alert.targetPrice} €, Offre: ${offer.price} €`);
      console.log(`   └─ L'envoi réel reste en attente de la variable RESEND_API_KEY dans Netlify.`);

      return {
        success: false,
        mode: 'missing_config',
        simulated: false,
        message: 'Clé API Resend manquante dans l\'environnement (RESEND_API_KEY non définie dans Netlify).',
        error: 'MISSING_RESEND_API_KEY',
        sentPayload: payloadSummary,
      };
    }

    // 3. CAS ENVOI RÉEL VIA RESEND
    try {
      const apiKey = process.env.RESEND_API_KEY!.trim();
      if (!this.resendClient) {
        this.resendClient = new Resend(apiKey);
      }

      console.log(`[TRACKO Notification] 🚀 Envoi de l'email d'alerte réel via Resend vers ${maskedEmail}...`);

      const response = await this.resendClient.emails.send({
        from: fromAddress,
        to: alert.email,
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (response.error) {
        console.error(`[TRACKO Notification] ❌ Échec renvoyé par l'API Resend :`, response.error.message);
        return {
          success: false,
          mode: 'production_resend',
          simulated: false,
          message: `Erreur API Resend : ${response.error.message}`,
          error: response.error.message,
          sentPayload: payloadSummary,
        };
      }

      const messageId = response.data?.id || `resend-${Date.now()}`;
      console.log(`[TRACKO Notification] 🟢 Email envoyé avec succès par Resend (ID: ${messageId}) vers ${maskedEmail}`);

      return {
        success: true,
        mode: 'production_resend',
        messageId,
        simulated: false,
        message: `Email d'alerte envoyé avec succès via Resend à ${maskedEmail}`,
        sentPayload: payloadSummary,
      };
    } catch (err: any) {
      console.error(`[TRACKO Notification] ❌ Exception réseau/système lors de l'appel Resend :`, err?.message || err);
      return {
        success: false,
        mode: 'production_resend',
        simulated: false,
        message: `Exception lors de l'envoi Resend : ${err?.message || 'Erreur de connexion'}`,
        error: err?.message || 'Connection error',
        sentPayload: payloadSummary,
      };
    }
  }
}

export const notificationService = new NotificationService();
