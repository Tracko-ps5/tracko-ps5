export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { getLiveOverrides, getEditableSnapshot, saveLiveOverrides, type VariantOverride } from "../../../lib/live-data";
import { variants } from "../../../data/mock-ps5";

// Modifie le prix d'UN SEUL marchand pour UNE SEULE variante, sans jamais
// toucher aux autres clés déjà enregistrées dans le store — contrairement au
// mode "JSON avancé" (api/admin/save.ts) qui remplace tout le blob, cette
// route ne réécrit que l'entrée concernée.
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return new Response(JSON.stringify({ error: "session" }), { status: 401 });
  }

  let body: { key?: unknown; merchantId?: unknown; price?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "json" }), { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  const merchantId = typeof body.merchantId === "string" ? body.merchantId : "";
  const price = typeof body.price === "number" ? body.price : NaN;

  // La clé doit correspondre à une variante réellement définie dans le
  // catalogue (famille:édition:version) — évite d'enregistrer une clé
  // inventée par erreur depuis le client.
  const keyIsValid = variants.some((v) => `${v.familySlug}:${v.edition}:${v.version}` === key);
  if (!keyIsValid) {
    return new Response(JSON.stringify({ error: "unknown_key" }), { status: 400 });
  }

  if (!merchantId) {
    return new Response(JSON.stringify({ error: "unknown_merchant" }), { status: 400 });
  }

  if (!Number.isFinite(price) || price <= 0) {
    return new Response(JSON.stringify({ error: "invalid_price" }), { status: 400 });
  }

  const overrides = await getLiveOverrides();

  // Si cette variante n'a encore aucun override, on part de son état actuel
  // (live si une autre partie l'a déjà, sinon démo) pour ne perdre aucun des
  // autres marchands déjà affichés — on ne remplace jamais la liste entière
  // par un seul marchand.
  let entry: VariantOverride | undefined = overrides[key];
  if (!entry) {
    const snapshot = await getEditableSnapshot();
    entry = snapshot[key];
  }

  if (!entry) {
    return new Response(JSON.stringify({ error: "unknown_key" }), { status: 400 });
  }

  const merchantIndex = entry.merchants.findIndex((m) => m.id === merchantId);
  if (merchantIndex === -1) {
    return new Response(JSON.stringify({ error: "unknown_merchant" }), { status: 400 });
  }

  const updatedMerchants = entry.merchants.map((m, i) => (i === merchantIndex ? { ...m, price } : m));
  const updatedOverrides = {
    ...overrides,
    [key]: { ...entry, merchants: updatedMerchants },
  };

  try {
    await saveLiveOverrides(updatedOverrides);
  } catch (err) {
    console.error("[Tracko] Échec de l'enregistrement rapide d'un prix :", err);
    return new Response(JSON.stringify({ error: "storage" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, key, merchantId, price }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
