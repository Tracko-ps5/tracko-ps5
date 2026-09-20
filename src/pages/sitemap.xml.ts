export const prerender = true;
import type { APIRoute } from "astro";
import { families } from "../data/mock-ps5";

const SITE_URL = "https://tracko-ps5.netlify.app";

export const GET: APIRoute = () => {
  const staticUrls = ["/", "/alertes", "/a-propos", "/guides/digital-vs-lecteur", "/guides/neuf-vs-reconditionne"];

  // Une URL par modèle. Les anciennes pages /ps5/[famille]/[état]/[version]
  // sont volontairement absentes : elles redirigent en 301 vers ces pages
  // (un sitemap ne doit lister que les URLs finales, canoniques).
  const familyUrls = families.map((f) => `/ps5/${f.slug}`);

  const urls = [...staticUrls, ...familyUrls];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
};
