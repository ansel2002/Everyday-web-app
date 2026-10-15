import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Relative paths, so the built app works from any folder on any static host.
  base: './',
  plugins: [
    react(),
    // Installable PWA. Our own service worker (src/sw/sw.ts) precaches the app's files so it
    // works offline, and shows Web Push reminders.
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src/sw',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Everyday',
        short_name: 'Everyday',
        description: 'A calm, private self-development app. Small daily lessons, a short journal and gentle habits.',
        lang: 'en',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#eef3ef',
        theme_color: '#eef3ef',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,woff2,svg,png}'],
      },
    }),
  ],
  server: {
    // Lesson content lives in ../data/lessons.seed.json, outside this folder.
    fs: { allow: ['.', '../data'] },
  },
});
