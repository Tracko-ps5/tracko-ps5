// Fonction planifiée Netlify : vérifie chaque jour si une alerte de prix doit
// se déclencher, et envoie l'email correspondant via Resend. Indépendante des
// routes Astro (fonction Netlify autonome, déclenchée par un horaire, pas par
// une requête HTTP classique).
import { getAlerts, saveAlerts } from "../../src/lib/alerts-data";
import { getAllLiveVariants } from "../../src/lib/live-data";
import { sendEmail } from "../../src/lib/send-email";

export default async () => {
  const [alerts, variants] = await Promise.all([getAlerts(), getAllLiveVariants()]);

  const pending = alerts.filter((a) => !a.notifiedAt);
  if (pending.length === 0) {
    return new Response("Aucune alerte en attente.", { status: 200 });
  }

  let sentCount = 0;
  const now = new Date().toISOString();

  for (const alert of pending) {
    const variant = variants.find(
      (v) => v.familySlug === alert.familySlug && v.edition === alert.edition && v.version === alert.version
    );
    if (!variant) continue;

    if (variant.currentPrice <= alert.targetPrice) {
      const sent = await sendEmail({
        to: alert.email,
        subject: `Le prix baisse : ${alert.productLabel} à ${variant.currentPrice} €`,
        html: `
          <div style="font-family: -apple-system, Helvetica, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px;">
            <h1 style="color: #14140f; font-size: 20px; margin: 0 0 16px;">Bonne nouvelle.</h1>
            <p style="color: #333333; font-size: 15px; line-height: 1.6; margin: 0 0 20px;">
              La <strong>${alert.productLabel}</strong> est passée sous ton prix cible de
              ${alert.targetPrice} € : elle est actuellement à <strong>${variant.currentPrice} €</strong>.
            </p>
            <a
              href="https://tracko-ps5.netlify.app/ps5/${alert.familySlug}/${alert.edition}/${alert.version}"
              style="display:inline-block; background:#14140f; color:#faf9f6; padding:12px 20px; text-decoration:none; border-radius:8px; font-size:14px;"
            >
              Voir l'offre
            </a>
            <p style="color: #8A8A8A; font-size: 12px; line-height: 1.5; margin: 24px 0 0;">
              Créé sur tracko-ps5.netlify.app — service indépendant, sans lien avec Sony/PlayStation.
            </p>
          </div>
        `,
      });

      if (sent) {
        alert.notifiedAt = now;
        sentCount++;
      }
    }
  }

  if (sentCount > 0) {
    await saveAlerts(alerts);
  }

  return new Response(`${sentCount} alerte(s) envoyée(s) sur ${pending.length} en attente.`, { status: 200 });
};

// Tous les jours à 9h UTC — après ta mise à jour matinale des prix via l'admin.
export const config = {
  schedule: "0 9 * * *",
};
