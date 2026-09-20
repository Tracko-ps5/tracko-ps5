export const prerender = false;
import type { APIRoute } from "astro";
import { addAlert } from "../../../lib/alerts-data";
import { sendEmail } from "../../../lib/send-email";
import { getLiveVariant } from "../../../lib/live-data";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const POST: APIRoute = async ({ request }) => {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Requête invalide." }), { status: 400 });
  }

  const email = String(body.email || "").trim().toLowerCase();
  const familySlug = String(body.familySlug || "");
  const edition = String(body.edition || "");
  const version = String(body.version || "");
  const productLabel = String(body.productLabel || "");
  // Compatible avec l'ancien comportement : si le champ n'est pas fourni
  // (anciens clients / requêtes existantes), on retombe sur "price".
  const type = body.type === "stock" ? "stock" : "price";

  if (!EMAIL_REGEX.test(email)) {
    return new Response(JSON.stringify({ error: "Adresse email invalide." }), { status: 400 });
  }
  if (!familySlug || !edition || !version) {
    return new Response(JSON.stringify({ error: "Produit non identifié." }), { status: 400 });
  }

  let targetPrice: number | undefined;
  let currentAvailability: boolean | undefined;

  if (type === "price") {
    targetPrice = Number(body.targetPrice);
    if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
      return new Response(JSON.stringify({ error: "Prix cible invalide." }), { status: 400 });
    }
  } else {
    // Alerte de retour en stock : on lie bien l'alerte à cette variante
    // précise (famille + édition + version), pas à toute la famille PS5.
    const variant = await getLiveVariant(familySlug, edition, version);
    if (!variant) {
      return new Response(JSON.stringify({ error: "Produit non identifié." }), { status: 400 });
    }
    currentAvailability = variant.merchants.some((m) => m.available);
  }

  const alert = await addAlert({
    type,
    email,
    familySlug,
    edition,
    version,
    productLabel,
    targetPrice,
    currentAvailability,
  });

  // Email de confirmation — best effort : si l'envoi échoue, l'alerte reste
  // quand même enregistrée (la fonction planifiée la vérifiera quand même).
  const confirmationHtml =
    type === "stock"
      ? `
      <div style="background:#faf9f6; padding:32px 16px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background:#ffffff; border:1px solid #e6e3da; border-radius:18px; padding: 36px 32px;">
          <p style="margin:0 0 20px; font-size:15px; font-weight:700; letter-spacing:-0.02em; color:#171611;">
            <span style="color:#1b2a4a;">&#9673;</span> Tracko
          </p>
          <h1 style="color:#171611; font-size:20px; margin:0 0 16px;">C'est activé.</h1>
          <p style="color:#171611; font-size:15px; line-height:1.6; margin:0 0 24px;">
            Tu recevras un email dès que la <strong>${productLabel}</strong> sera de nouveau disponible
            chez un marchand.
          </p>
          <p style="color:#6f6b5e; font-size:13px; line-height:1.5; margin:0;">
            Créé sur tracko-ps5.netlify.app — ceci est un service indépendant, sans lien avec Sony/PlayStation.
          </p>
        </div>
      </div>
    `
      : `
      <div style="background:#faf9f6; padding:32px 16px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
        <div style="max-width: 480px; margin: 0 auto; background:#ffffff; border:1px solid #e6e3da; border-radius:18px; padding: 36px 32px;">
          <p style="margin:0 0 20px; font-size:15px; font-weight:700; letter-spacing:-0.02em; color:#171611;">
            <span style="color:#1b2a4a;">&#9673;</span> Tracko
          </p>
          <h1 style="color:#171611; font-size:20px; margin:0 0 16px;">C'est activé.</h1>
          <p style="color:#171611; font-size:15px; line-height:1.6; margin:0 0 24px;">
            Tu recevras un email dès que le prix de la <strong>${productLabel}</strong> passera sous
            <strong>${targetPrice} €</strong>, tous marchands confondus.
          </p>
          <p style="color:#6f6b5e; font-size:13px; line-height:1.5; margin:0;">
            Créé sur tracko-ps5.netlify.app — ceci est un service indépendant, sans lien avec Sony/PlayStation.
          </p>
        </div>
      </div>
    `;

  await sendEmail({
    to: email,
    subject:
      type === "stock" ? "Ton alerte de retour en stock Tracko est activée" : "Ton alerte Tracko est activée",
    html: confirmationHtml,
  });

  return new Response(JSON.stringify({ success: true, id: alert.id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
