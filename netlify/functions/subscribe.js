const { Resend } = require('resend');
const { getStore } = require('@netlify/blobs');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  // Préflight CORS
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Méthode non autorisée.' }),
    };
  }

  // 1. Parsing et validation
  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Requête invalide.' }),
    };
  }

  const email = String(data.email || '').trim().toLowerCase();
  const targetPrice = data.targetPrice ? Number(data.targetPrice) : null;

  if (!EMAIL_REGEX.test(email)) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Adresse email invalide.' }),
    };
  }

  if (!process.env.RESEND_API_KEY || !process.env.RESEND_FROM_EMAIL) {
    console.error('Variables RESEND_API_KEY / RESEND_FROM_EMAIL manquantes.');
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Configuration serveur incomplète.' }),
    };
  }

  try {
    // 2. Enregistrement de l'abonné (Netlify Blobs — inclus, pas de DB externe requise)
    const store = getStore('ps5-subscribers');
    const existing = await store.get(email, { type: 'json' });

    await store.setJSON(email, {
      email,
      targetPrice,
      subscribedAt: existing?.subscribedAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // 3. Email de confirmation via Resend
    const resend = new Resend(process.env.RESEND_API_KEY);
    const { error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL,
      to: email,
      subject: 'Votre alerte prix PS5 est activée',
      html: buildConfirmationEmail(targetPrice),
    });

    if (resendError) {
      console.error('Erreur Resend:', resendError);
      return {
        statusCode: 502,
        headers,
        body: JSON.stringify({ error: "L'email de confirmation n'a pas pu être envoyé." }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Alerte activée. Vérifiez votre boîte mail.',
      }),
    };
  } catch (err) {
    console.error('Erreur subscribe:', err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Une erreur est survenue, réessayez plus tard.' }),
    };
  }
};

function buildConfirmationEmail(targetPrice) {
  const condition = targetPrice
    ? `dès qu'une PS5 passe sous <strong>${targetPrice} €</strong>`
    : `dès qu'une PS5 baisse de prix`;

  return `
    <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
      <h1 style="color: #0A0A0A; font-size: 20px; margin: 0 0 16px;">C'est activé.</h1>
      <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
        Vous recevrez un email ${condition}, tous marchands confondus.
      </p>
      <p style="color: #8A8A8A; font-size: 13px; line-height: 1.5; margin: 0;">
        Vous pouvez vous désabonner à tout moment en répondant à cet email.
      </p>
    </div>
  `;
}
