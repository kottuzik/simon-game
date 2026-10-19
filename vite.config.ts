import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the project at https://<owner>.github.io/<repo>/; change only this if the repo is renamed.
const REPO = 'simon-game';
const base = `/${REPO}/`;

export default defineConfig({
  base,
  plugins: [
    VitePWA({
      // The new version waits for the player's approval so an active game is never refreshed.
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'משחק הזיכרון סיימון',
        short_name: 'סיימון',
        lang: 'he',
        dir: 'rtl',
        display: 'standalone',
        start_url: base,
        scope: base,
        theme_color: '#F8F8F8',
        background_color: '#F8F8F8',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{html,js,css,svg,png,woff2,webmanifest}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
});
