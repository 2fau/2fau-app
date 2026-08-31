// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite'

// https://astro.build/config
export default defineConfig({
  output: 'static',

  integrations: [react()],

  server: {
      port: 4322
  },

  vite: {
      plugins: [
          tailwindcss(),
      ],
  }
});
