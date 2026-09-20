export const prerender = true;
import type { APIRoute } from "astro";
import { families, versionsForFamily } from "../data/mock-ps5";

const SITE_URL = "https://tracko-ps5.netlify.app";
const editions = ["neuf", "reconditionne"] as const;

export const GET: APIRoute = () => {
  const staticUrls = ["/", "/alertes", "/a-propos", "/guides/digital-vs-lecteur", "/guides/neuf-vs-reconditionne"];

  const familyUrls = families.map((f) => `/ps5/${f.slug}`);

  const comparisonUrls = families.flatMap((f) =>
    editions.flatMap((edition) => versionsForFamily(f.slug).map((version) => `/ps5/${f.slug}/${edition}/${version}`))
  );

  const urls = [...staticUrls, ...familyUrls, ...comparisonUrls];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")}
</urlset>`;

  return new Response(body, {
    headers: { "Content-Type": "application/xml" },
  });
};
