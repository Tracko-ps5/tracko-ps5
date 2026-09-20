export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { saveLiveOverrides, type LiveOverrides, type VariantOverride } from "../../../lib/live-data";

const URL_PATTERN = /^https?:\/\/.+/i;

// Garde-fou souple (avertissement uniquement, jamais bloquant) : ces
// marchands sont connus, dans les données de démonstration, pour ne
// proposer qu'une seule édition. Si l'admin les fait apparaître dans
// l'autre édition, on le signale dans les logs serveur pour vérification —
// on ne bloque jamais la sauvegarde et on ne modifie jamais la donnée,
// car un marchand peut tout à fait commencer à vendre du reconditionné (ou
// du neuf) à l'avenir.
const EDITION_ONLY_HINT: Record<string, "neuf" | "reconditionne"> = {
  playstation: "neuf",
  backmarket: "reconditionne",
};

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return redirect("/administration?error=session", 302);
  }

  const form = await request.formData();
  const raw = String(form.get("payload") || "");

  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw);
  } catch {
    return redirect("/administration?error=json", 302);
  }

  // Validation minimale de la forme des données avant sauvegarde
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return redirect("/administration?error=shape", 302);
  }

  const normalized: LiveOverrides = {};
  const warnings: string[] = [];

  for (const key of Object.keys(data)) {
    const entry = data[key];
    // Accepte l'ancien format (tableau direct de marchands) et le nouveau
    // format ({ merchants, averagePrice }), pour ne jamais casser un JSON
    // déjà copié/collé avant l'ajout du prix de référence.
    const isLegacyArrayShape = Array.isArray(entry);
    const merchantsList = isLegacyArrayShape ? entry : (entry as { merchants?: unknown })?.merchants;
    if (!Array.isArray(merchantsList)) return redirect("/administration?error=shape", 302);

    const keyEdition = key.split(":")[1]; // "familySlug:edition:version"

    let averagePrice: number | undefined;
    if (!isLegacyArrayShape) {
      const candidate = (entry as { averagePrice?: unknown }).averagePrice;
      if (candidate !== undefined) {
        if (typeof candidate !== "number" || !Number.isFinite(candidate) || candidate <= 0) {
          return redirect("/administration?error=values", 302);
        }
        averagePrice = candidate;
      }
    }

    for (const m of merchantsList) {
      const valid =
        m && typeof m.id === "string" && m.id.trim() !== "" &&
        typeof m.name === "string" && m.name.trim() !== "" &&
        typeof m.price === "number" && Number.isFinite(m.price) && m.price > 0 &&
        typeof m.available === "boolean" &&
        typeof m.url === "string" && URL_PATTERN.test(m.url) &&
        typeof m.trustRating === "number" && Number.isFinite(m.trustRating) &&
        m.trustRating >= 1 && m.trustRating <= 5;
      if (!valid) return redirect("/administration?error=values", 302);

      // Avertissement uniquement — voir EDITION_ONLY_HINT ci-dessus.
      const expectedEdition = EDITION_ONLY_HINT[m.id];
      if (expectedEdition && keyEdition && expectedEdition !== keyEdition) {
        warnings.push(
          `"${m.name}" (${m.id}) apparaît dans "${key}" (édition ${keyEdition}) alors qu'il n'est connu jusqu'ici que pour l'édition ${expectedEdition} — à vérifier si c'est intentionnel.`
        );
      }
    }

    const override: VariantOverride = { merchants: merchantsList as VariantOverride["merchants"] };
    if (averagePrice !== undefined) override.averagePrice = averagePrice;
    normalized[key] = override;
  }

  if (warnings.length > 0) {
    console.warn(`[Tracko] Avertissement marchand/édition (sauvegarde non bloquée) :\n- ${warnings.join("\n- ")}`);
  }

  try {
    await saveLiveOverrides(normalized);
  } catch (err) {
    console.error("[Tracko] Échec de l'enregistrement admin :", err);
    return redirect("/administration?error=storage", 302);
  }
  return redirect("/administration?saved=1", 302);
};
