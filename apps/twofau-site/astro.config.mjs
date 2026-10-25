// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath } from 'node:url';

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
      // The homepage demo renders @twofau/ui from source, which imports through
      // its own "@/" alias.
      resolve: {
          alias: { '@': fileURLToPath(new URL('../../packages/ui/src', import.meta.url)) },
          dedupe: ['react', 'react-dom'],
      },
  }
});
