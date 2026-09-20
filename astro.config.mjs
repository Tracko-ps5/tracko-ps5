// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://tracko-ps5.netlify.app',
  output: 'server',
  adapter: netlify(),
  // Une seule forme d'URL canonique (sans slash final) pour éviter que
  // Google voie /ps5/ps5 et /ps5/ps5/ comme deux pages différentes.
  trailingSlash: 'never',
});
