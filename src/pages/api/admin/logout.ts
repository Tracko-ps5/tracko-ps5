export const prerender = false;
import type { APIRoute } from "astro";
import { ADMIN_SESSION_COOKIE } from "../../../lib/admin-auth";

export const POST: APIRoute = async ({ cookies, redirect }) => {
  cookies.delete(ADMIN_SESSION_COOKIE, { path: "/" });
  return redirect("/administration", 302);
};
