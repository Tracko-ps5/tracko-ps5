// @ts-check
import { defineConfig } from 'astro/config';
import netlify from '@astrojs/netlify';

// https://astro.build/config
export default defineConfig({
  site: 'https://tracko-ps5.netlify.app',
  output: 'server',
  adapter: netlify(),
});
