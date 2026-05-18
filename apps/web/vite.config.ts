import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

// Sentry source maps : actif uniquement si SENTRY_AUTH_TOKEN + SENTRY_ORG + SENTRY_PROJECT
// présents au moment du build. Vercel doit avoir ces 3 env vars set. En local : no-op.
const sentryEnabled = !!(
  process.env.SENTRY_AUTH_TOKEN &&
  process.env.SENTRY_ORG &&
  process.env.SENTRY_PROJECT
);

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo-icon.svg', 'apple-touch-icon.png', 'offline.html'],
      manifest: {
        name: 'Reset Egypt — Staff',
        short_name: 'Reset',
        description:
          "Plateforme métier Reset Egypt — auriculothérapie laser, gestion patients, agenda et facturation conforme ETA.",
        theme_color: '#1E0FBA',
        background_color: '#1E0FBA',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        lang: 'fr',
        dir: 'ltr',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          { src: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png', purpose: 'any' },
        ],
      },
      workbox: {
        // Pré-cache du shell statique
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        // Stratégies réseau :
        runtimeCaching: [
          {
            // API : NetworkFirst — données fraîches privilégiées, fallback cache si offline
            urlPattern: /^https:\/\/api\.reset-egypt\.com\/.*/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // Google Fonts
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gfonts-cache',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
        // SPA fallback (page online) + offline.html quand le client est offline
        // et tente d'accéder à une nouvelle route pas dans le cache
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/internal\//],
      },
      // Quand la navigation échoue (offline + route non cachée), Workbox sert offline.html
      // via la stratégie configurée ci-dessus + ce fichier en includeAssets.
      devOptions: { enabled: false },
    }),
    // Sentry source maps — uploaded à chaque build de prod si auth token présent
    sentryEnabled &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG!,
        project: process.env.SENTRY_PROJECT!,
        authToken: process.env.SENTRY_AUTH_TOKEN!,
        sourcemaps: { assets: ['./dist/**/*.js', './dist/**/*.js.map'] },
        // Ne pas bloquer le build si Sentry est down / mal configuré
        errorHandler: (err) => {
          // eslint-disable-next-line no-console
          console.warn('[sentry-vite-plugin] skipped:', err.message);
        },
      }),
  ].filter(Boolean),
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    // Source maps activées pour permettre Sentry de les uploader
    sourcemap: true,
    // Code-splitting agressif : chaque page route en chunk séparé
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          query: ['@tanstack/react-query', 'zustand'],
          ui: ['framer-motion', 'lucide-react'],
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          sentry: ['@sentry/react'],
        },
      },
    },
  },
});
