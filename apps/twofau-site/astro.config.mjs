// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  output: 'static',

  // Canonical origin, used to build absolute URLs for canonical/OG/Twitter tags.
  site: 'https://2fau.app',

  integrations: [react()],

  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'zh-CN', 'es', 'pt-BR', 'ja', 'de', 'fr', 'ru', 'ko', 'it', 'tr', 'pl'],
    routing: { prefixDefaultLocale: false },
  },

  server: {
      port: 4322
  },

  vite: {
      plugins: [
          tailwindcss(),
      ],
  }
});
