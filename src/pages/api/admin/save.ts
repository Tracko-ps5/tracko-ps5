export const prerender = false;
import type { APIRoute } from "astro";
import { isValidSession, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";
import { saveLiveOverrides, type LiveOverrides } from "../../../lib/live-data";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const session = cookies.get(ADMIN_SESSION_COOKIE)?.value;
  if (!isValidSession(session)) {
    return redirect("/administration?error=session", 302);
  }

  const form = await request.formData();
  const raw = String(form.get("payload") || "");

  let data: LiveOverrides;
  try {
    data = JSON.parse(raw);
  } catch {
    return redirect("/administration?error=json", 302);
  }

  // Validation minimale de la forme des données avant sauvegarde
  if (typeof data !== "object" || data === null || Array.isArray(data)) {
    return redirect("/administration?error=shape", 302);
  }
  for (const key of Object.keys(data)) {
    const list = data[key];
    if (!Array.isArray(list)) return redirect("/administration?error=shape", 302);
    for (const m of list) {
      const valid =
        m && typeof m.id === "string" && typeof m.name === "string" &&
        typeof m.price === "number" && !Number.isNaN(m.price) &&
        typeof m.available === "boolean" && typeof m.url === "string" &&
        typeof m.trustRating === "number";
      if (!valid) return redirect("/administration?error=shape", 302);
    }
  }

  try {
    await saveLiveOverrides(data);
  } catch (err) {
    console.error("[Tracko] Échec de l'enregistrement admin :", err);
    return redirect("/administration?error=storage", 302);
  }
  return redirect("/administration?saved=1", 302);
};
