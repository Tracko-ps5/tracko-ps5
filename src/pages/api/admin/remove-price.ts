export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { updateLiveOverrides, getOverrideEntryOrDefault, LiveOverrideError } from "../../../lib/live-data";
import { variants } from "../../../data/mock-ps5";

// Supprime UNE SEULE référence marchand (un marchand pour une variante), sans
// jamais toucher aux autres marchands de la variante ni aux autres variantes.
// Comme update-price.ts, cette route ne réécrit que l'entrée concernée dans le
// blob "overrides" existant de Netlify Blobs — aucun nouveau stockage.
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return new Response(JSON.stringify({ error: "session" }), { status: 401 });
  }

  let body: { key?: unknown; merchantId?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "json" }), { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  const merchantId = typeof body.merchantId === "string" ? body.merchantId : "";

  const keyIsValid = variants.some((v) => `${v.familySlug}:${v.edition}:${v.version}` === key);
  if (!keyIsValid) {
    return new Response(JSON.stringify({ error: "unknown_key" }), { status: 400 });
  }

  if (!merchantId) {
    return new Response(JSON.stringify({ error: "unknown_merchant" }), { status: 400 });
  }

  try {
    await updateLiveOverrides((overrides) => {
      // État actuel de la variante (override live si présent — y compris
      // l'ancien format tableau, normalisé — sinon données de référence). On
      // part de là pour ne perdre aucun des autres marchands. `overrides` est
      // relu à chaque tentative en cas de conflit d'écriture.
      const entry = getOverrideEntryOrDefault(key, overrides);
      if (!entry) {
        throw new LiveOverrideError("unknown_key");
      }

      if (!entry.merchants.some((m) => m.id === merchantId)) {
        throw new LiveOverrideError("unknown_merchant");
      }

      // Une variante sans aucun marchand n'a plus de prix à afficher : le
      // site retomberait alors silencieusement sur les données de
      // démonstration (la référence « réapparaîtrait »). On refuse donc de
      // retirer le dernier marchand plutôt que de produire un état trompeur.
      if (entry.merchants.length <= 1) {
        throw new LiveOverrideError("last_merchant");
      }

      const remainingMerchants = entry.merchants.filter((m) => m.id !== merchantId);

      return {
        overrides: { ...overrides, [key]: { ...entry, merchants: remainingMerchants } },
        result: undefined,
      };
    });
  } catch (err) {
    if (err instanceof LiveOverrideError) {
      const status = err.code === "last_merchant" ? 409 : 400;
      return new Response(JSON.stringify({ error: err.code }), { status });
    }
    console.error("[Tracko] Échec de la suppression d'une référence marchand :", err);
    return new Response(JSON.stringify({ error: "storage" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, key, merchantId }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
