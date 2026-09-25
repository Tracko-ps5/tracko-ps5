// Fonction planifiée Netlify : vérifie chaque jour les alertes en attente et
// envoie l'email correspondant via MailerSend (src/lib/send-email.ts).
// Indépendante des routes Astro (fonction Netlify autonome, déclenchée par un
// horaire, pas par une requête HTTP classique).
//
// Deux types d'alertes sont traités :
// - "price" : one-shot, comme avant — une fois déclenchée (notifiedAt posé),
//   elle n'est plus jamais revérifiée.
// - "stock" : réarmable — on compare l'état de disponibilité actuel à
//   `wasAvailable` (dernier état connu) pour ne détecter qu'une vraie
//   transition indisponible → disponible, on envoie l'email uniquement à ce
//   moment-là, puis on met à jour `wasAvailable` à chaque exécution (même
//   sans envoi) pour pouvoir détecter un futur nouveau retour en stock si le
//   produit repasse en rupture entre-temps.
import { getAlerts, applyAlertUpdates, type Alert } from "../../src/lib/alerts-data";
import { getAllLiveVariants } from "../../src/lib/live-data";
import { sendEmail } from "../../src/lib/send-email";
import type { Variant } from "../../src/data/mock-ps5";

function findVariant(alert: Alert, variants: Variant[]): Variant | undefined {
  return variants.find(
    (v) => v.familySlug === alert.familySlug && v.edition === alert.edition && v.version === alert.version
  );
}

function priceDropEmailHtml(alert: Alert, variant: Variant): string {
  return `
    <div style="background:#faf9f6; padding:32px 16px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background:#ffffff; border:1px solid #e6e3da; border-radius:18px; padding: 36px 32px;">
        <p style="margin:0 0 20px; font-size:15px; font-weight:700; letter-spacing:-0.02em; color:#171611;">
          <span style="color:#1b2a4a;">&#9673;</span> Tracko
        </p>
        <h1 style="color:#171611; font-size:20px; margin:0 0 16px;">Bonne nouvelle.</h1>
        <p style="color:#171611; font-size:15px; line-height:1.6; margin:0 0 24px;">
          La <strong>${alert.productLabel}</strong> est passée sous ton prix cible de
          ${alert.targetPrice} € : elle est actuellement à <strong>${variant.currentPrice} €</strong>.
        </p>
        <a
          href="https://tracko-ps5.netlify.app/ps5/${alert.familySlug}/${alert.edition}/${alert.version}"
          style="display:inline-block; background:#1b2a4a; color:#faf9f6; padding:13px 24px; text-decoration:none; border-radius:999px; font-size:14px; font-weight:600;"
        >
          Voir l'offre
        </a>
        <p style="color:#6f6b5e; font-size:12px; line-height:1.5; margin:28px 0 0;">
          Créé sur tracko-ps5.netlify.app — service indépendant, sans lien avec Sony/PlayStation.
        </p>
      </div>
    </div>
  `;
}

function backInStockEmailHtml(alert: Alert): string {
  return `
    <div style="background:#faf9f6; padding:32px 16px; font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;">
      <div style="max-width: 480px; margin: 0 auto; background:#ffffff; border:1px solid #e6e3da; border-radius:18px; padding: 36px 32px;">
        <p style="margin:0 0 20px; font-size:15px; font-weight:700; letter-spacing:-0.02em; color:#171611;">
          <span style="color:#1b2a4a;">&#9673;</span> Tracko
        </p>
        <h1 style="color:#171611; font-size:20px; margin:0 0 16px;">C'est de retour.</h1>
        <p style="color:#171611; font-size:15px; line-height:1.6; margin:0 0 24px;">
          La <strong>${alert.productLabel}</strong> est de nouveau disponible chez au moins un marchand.
        </p>
        <a
          href="https://tracko-ps5.netlify.app/ps5/${alert.familySlug}/${alert.edition}/${alert.version}"
          style="display:inline-block; background:#1b2a4a; color:#faf9f6; padding:13px 24px; text-decoration:none; border-radius:999px; font-size:14px; font-weight:600;"
        >
          Voir l'offre
        </a>
        <p style="color:#6f6b5e; font-size:12px; line-height:1.5; margin:28px 0 0;">
          Créé sur tracko-ps5.netlify.app — service indépendant, sans lien avec Sony/PlayStation.
          Tu continueras à être prévenu si ce produit repart en rupture puis revient en stock.
        </p>
      </div>
    </div>
  `;
}

export default async () => {
  const [alerts, variants] = await Promise.all([getAlerts(), getAllLiveVariants()]);

  const pendingPriceAlerts = alerts.filter((a) => a.type === "price" && !a.notifiedAt);
  const stockAlerts = alerts.filter((a) => a.type === "stock");

  if (pendingPriceAlerts.length === 0 && stockAlerts.length === 0) {
    return new Response("Aucune alerte à vérifier.", { status: 200 });
  }

  let sentCount = 0;
  const now = new Date().toISOString();

  // Modifications à appliquer par id d'alerte (notifiedAt / wasAvailable),
  // rejouées sur l'état le plus récent au moment de l'écriture (voir
  // applyAlertUpdates dans alerts-data.ts). On ne réécrit jamais la liste
  // `alerts` telle quelle : une alerte créée par une autre requête pendant
  // l'exécution de cette fonction n'est donc jamais concernée par ce lot de
  // modifications et ne peut pas disparaître.
  const updates = new Map<string, Partial<Pick<Alert, "notifiedAt" | "wasAvailable">>>();

  // Alertes de prix — comportement inchangé (one-shot).
  for (const alert of pendingPriceAlerts) {
    const variant = findVariant(alert, variants);
    if (!variant || alert.targetPrice === null) continue;

    if (variant.currentPrice <= alert.targetPrice) {
      const sent = await sendEmail({
        to: alert.email,
        subject: `Le prix baisse : ${alert.productLabel} à ${variant.currentPrice} €`,
        html: priceDropEmailHtml(alert, variant),
      });

      if (sent) {
        alert.notifiedAt = now;
        sentCount++;
        updates.set(alert.id, { ...updates.get(alert.id), notifiedAt: now });
      }
    }
  }

  // Alertes de retour en stock — réarmables : on ne s'appuie jamais sur
  // `notifiedAt` pour décider si l'alerte doit encore être vérifiée, on
  // regarde uniquement la transition par rapport à `wasAvailable`.
  for (const alert of stockAlerts) {
    const variant = findVariant(alert, variants);
    if (!variant) continue;

    const isAvailableNow = variant.merchants.some((m) => m.available);
    const wasAvailable = alert.wasAvailable ?? false;

    if (!wasAvailable && isAvailableNow) {
      const sent = await sendEmail({
        to: alert.email,
        subject: `De retour en stock : ${alert.productLabel}`,
        html: backInStockEmailHtml(alert),
      });

      if (sent) {
        alert.notifiedAt = now;
        sentCount++;
        updates.set(alert.id, { ...updates.get(alert.id), notifiedAt: now });
      }
    }

    if (alert.wasAvailable !== isAvailableNow) {
      alert.wasAvailable = isAvailableNow;
      updates.set(alert.id, { ...updates.get(alert.id), wasAvailable: isAvailableNow });
    }
  }

  if (updates.size > 0) {
    await applyAlertUpdates(updates);
  }

  return new Response(`${sentCount} alerte(s) envoyée(s) sur ${pendingPriceAlerts.length + stockAlerts.length} vérifiée(s).`, {
    status: 200,
  });
};

// Tous les jours à 9h UTC — après la mise à jour matinale des prix via l'admin.
export const config = {
  schedule: "0 9 * * *",
};
