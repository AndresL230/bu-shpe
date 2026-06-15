// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://shpe.bu.edu', // placeholder; update once domain is finalized
  output: 'static',
  redirects: {
    // 2026-06 consolidation: history folded into /about,
    // competitions + delegations merged into /conferences/record,
    // board moved under the about section.
    '/about/history': '/about',
    '/board': '/about/board',
    '/conferences/competitions': '/conferences/record',
    '/conferences/delegations': '/conferences/record',
  },
  vite: {
    plugins: [tailwindcss()],
  },
  build: {
    inlineStylesheets: 'auto',
  },
});
