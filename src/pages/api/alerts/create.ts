export const prerender = false;
import type { APIRoute } from "astro";
import { addAlert } from "../../../lib/alerts-data";
import { sendEmail } from "../../../lib/send-email";

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
  const targetPrice = Number(body.targetPrice);

  if (!EMAIL_REGEX.test(email)) {
    return new Response(JSON.stringify({ error: "Adresse email invalide." }), { status: 400 });
  }
  if (!familySlug || !edition || !version) {
    return new Response(JSON.stringify({ error: "Produit non identifié." }), { status: 400 });
  }
  if (!Number.isFinite(targetPrice) || targetPrice <= 0) {
    return new Response(JSON.stringify({ error: "Prix cible invalide." }), { status: 400 });
  }

  const alert = await addAlert({ email, familySlug, edition, version, productLabel, targetPrice });

  // Email de confirmation — best effort : si l'envoi échoue, l'alerte reste
  // quand même enregistrée et sera bien vérifiée chaque jour.
  await sendEmail({
    to: email,
    subject: "Ton alerte Tracko est activée",
    html: `
      <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
        <h1 style="color: #14140f; font-size: 20px; margin: 0 0 16px;">C'est activé.</h1>
        <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Tu recevras un email dès que le prix de la <strong>${productLabel}</strong> passera sous
          <strong>${targetPrice} €</strong>, tous marchands confondus.
        </p>
        <p style="color: #8A8A8A; font-size: 13px; line-height: 1.5; margin: 0;">
          Créé sur tracko-ps5.netlify.app — ceci est un service indépendant, sans lien avec Sony/PlayStation.
        </p>
      </div>
    `,
  });

  return new Response(JSON.stringify({ success: true, id: alert.id }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
