import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { queryClient } from './lib/query-client';
import { initSentry, Sentry } from './lib/sentry';
import './i18n';
import './styles/globals.css';

// Init Sentry au plus tôt (avant React render). No-op si VITE_SENTRY_DSN absente.
initSentry();

const rootEl = document.getElementById('root');
if (!rootEl) throw new Error('Root element not found');

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div style={{ padding: 32, fontFamily: 'system-ui, sans-serif', maxWidth: 600, margin: '40px auto' }}>
          <h1 style={{ fontSize: 20, fontWeight: 600 }}>Une erreur s'est produite</h1>
          <p style={{ marginTop: 8, color: '#666' }}>
            Notre équipe a été notifiée automatiquement.
          </p>
          <details style={{ marginTop: 12, fontSize: 12, color: '#999' }}>
            <summary>Détails techniques</summary>
            <pre style={{ marginTop: 8, padding: 8, background: '#f5f5f5', borderRadius: 4, overflow: 'auto' }}>
              {error instanceof Error ? error.message : String(error)}
            </pre>
          </details>
          <button
            onClick={resetError}
            style={{ marginTop: 16, padding: '8px 16px', background: '#1E0FBA', color: 'white', border: 0, borderRadius: 6, cursor: 'pointer' }}
          >
            Recharger
          </button>
        </div>
      )}
    >
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </React.StrictMode>,
);
