export const prerender = false;
import type { APIRoute } from "astro";
import { checkCode, createSessionCookieValue, ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";

export const POST: APIRoute = async ({ request, cookies, redirect }) => {
  const form = await request.formData();
  const code = String(form.get("code") || "");

  if (!code || !checkCode(code)) {
    return redirect("/administration?error=code", 302);
  }

  cookies.set(ADMIN_SESSION_COOKIE, createSessionCookieValue(), {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 12,
  });

  return redirect("/administration", 302);
};
