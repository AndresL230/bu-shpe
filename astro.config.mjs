// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  site: 'https://shpe.bu.edu', // placeholder; update once domain is finalized
  // Pages are prerendered by default; event pages, /admin, /api and /media
  // opt out with `export const prerender = false` and run on the Worker.
  output: 'static',
  adapter: cloudflare({
    platformProxy: { enabled: true },
    imageService: 'passthrough',
  }),
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
