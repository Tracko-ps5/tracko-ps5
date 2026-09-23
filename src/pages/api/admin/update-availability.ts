export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { getLiveOverrides, getEditableSnapshot, saveLiveOverrides, type VariantOverride } from "../../../lib/live-data";
import { variants } from "../../../data/mock-ps5";

// Modifie la disponibilité (Disponible / Indisponible) d'UN SEUL marchand pour
// UNE SEULE variante, sans jamais toucher aux autres clés déjà enregistrées
// dans le store — même logique que update-price.ts.
export const POST: APIRoute = async ({ request, cookies }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return new Response(JSON.stringify({ error: "session" }), { status: 401 });
  }

  let body: { key?: unknown; merchantId?: unknown; available?: unknown };
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "json" }), { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key : "";
  const merchantId = typeof body.merchantId === "string" ? body.merchantId : "";
  const available = typeof body.available === "boolean" ? body.available : undefined;

  const keyIsValid = variants.some((v) => `${v.familySlug}:${v.edition}:${v.version}` === key);
  if (!keyIsValid) {
    return new Response(JSON.stringify({ error: "unknown_key" }), { status: 400 });
  }

  if (!merchantId) {
    return new Response(JSON.stringify({ error: "unknown_merchant" }), { status: 400 });
  }

  if (available === undefined) {
    return new Response(JSON.stringify({ error: "invalid_available" }), { status: 400 });
  }

  const overrides = await getLiveOverrides();

  // Même logique de repli que update-price.ts : on part de l'état actuel
  // (live si présent, sinon référence) pour ne perdre aucun des autres
  // marchands déjà affichés.
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

  const updatedMerchants = entry.merchants.map((m, i) => (i === merchantIndex ? { ...m, available } : m));
  const updatedOverrides = {
    ...overrides,
    [key]: { ...entry, merchants: updatedMerchants },
  };

  try {
    await saveLiveOverrides(updatedOverrides);
  } catch (err) {
    console.error("[Tracko] Échec de la mise à jour de la disponibilité :", err);
    return new Response(JSON.stringify({ error: "storage" }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true, key, merchantId, available }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
