import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  site: 'https://blog.silveryj-atzj.me',
  build: {
    format: 'directory',
  },
  integrations: [sitemap(), react()],
});
