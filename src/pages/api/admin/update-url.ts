export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { updateLiveOverrides, getOverrideEntryOrDefault, LiveOverrideError } from "../../../lib/live-data";
import { variants } from "../../../data/mock-ps5";

// Validation minimale : même règle que api/admin/save.ts (http:// ou https://).
const URL_PATTERN = /^https?:\/\/.+/i;

// Modifie l'URL exacte du produit chez UN SEUL marchand pour UNE SEULE
// variante, sans jamais toucher aux autres clés déjà enregistrées dans le
// store — même logique que update-price.ts.
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return new Response(JSON.stringify({ error: "session" }), { status: 401 });
  }

  let body: { key?: unknown; merchantId?: unknown; url?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "json" }), { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  const merchantId = typeof body.merchantId === "string" ? body.merchantId : "";
  const url = typeof body.url === "string" ? body.url.trim() : "";

  const keyIsValid = variants.some((v) => `${v.familySlug}:${v.edition}:${v.version}` === key);
  if (!keyIsValid) {
    return new Response(JSON.stringify({ error: "unknown_key" }), { status: 400 });
  }

  if (!merchantId) {
    return new Response(JSON.stringify({ error: "unknown_merchant" }), { status: 400 });
  }

  if (!URL_PATTERN.test(url)) {
    return new Response(JSON.stringify({ error: "invalid_url" }), { status: 400 });
  }

  try {
    await updateLiveOverrides((overrides) => {
      const entry = getOverrideEntryOrDefault(key, overrides);
      if (!entry) {
        throw new LiveOverrideError("unknown_key");
      }

      const merchantIndex = entry.merchants.findIndex((m) => m.id === merchantId);
      if (merchantIndex === -1) {
        throw new LiveOverrideError("unknown_merchant");
      }

      const updatedMerchants = entry.merchants.map((m, i) => (i === merchantIndex ? { ...m, url } : m));

      return {
        overrides: { ...overrides, [key]: { ...entry, merchants: updatedMerchants } },
        result: undefined,
      };
    });
  } catch (err) {
    if (err instanceof LiveOverrideError) {
      return new Response(JSON.stringify({ error: err.code }), { status: 400 });
    }
    console.error("[Tracko] Échec de la mise à jour de l'URL produit :", err);
    return new Response(JSON.stringify({ error: "storage" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, key, merchantId, url }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
