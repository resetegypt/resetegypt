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
      // injectManifest = on fournit notre propre sw.ts (push handler custom)
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'logo-icon.svg', 'apple-touch-icon.png', 'offline.html'],
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
      },
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
      devOptions: { enabled: false },
    }),
    sentryEnabled &&
      sentryVitePlugin({
        org: process.env.SENTRY_ORG!,
        project: process.env.SENTRY_PROJECT!,
        authToken: process.env.SENTRY_AUTH_TOKEN!,
        sourcemaps: { assets: ['./dist/**/*.js', './dist/**/*.js.map'] },
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
    sourcemap: true,
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
