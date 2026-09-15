// Authentification admin : le code est vérifié côté serveur uniquement (jamais
// dans le navigateur), et la session est un cookie signé avec une comparaison
// à temps constant pour éviter les attaques par mesure de timing.
import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "tracko_admin_session";
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000; // 12h

function getSecret(): string {
  const code = import.meta.env.ADMIN_CODE;
  if (!code) {
    throw new Error(
      "ADMIN_CODE n'est pas configuré. Ajoute une variable d'environnement ADMIN_CODE dans les paramètres du site Netlify."
    );
  }
  return code;
}

function sign(value: string): string {
  return createHmac("sha256", getSecret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function checkCode(code: string): boolean {
  try {
    return safeEqual(code, getSecret());
  } catch {
    return false;
  }
}

export function createSessionCookieValue(): string {
  const expiry = Date.now() + SESSION_DURATION_MS;
  return `${expiry}.${sign(String(expiry))}`;
}

export function isValidSession(cookieValue: string | undefined): boolean {
  if (!cookieValue) return false;
  const [expiryStr, signature] = cookieValue.split(".");
  if (!expiryStr || !signature) return false;
  const expiry = Number(expiryStr);
  if (!Number.isFinite(expiry) || Date.now() > expiry) return false;
  try {
    return safeEqual(signature, sign(expiryStr));
  } catch {
    return false;
  }
}
