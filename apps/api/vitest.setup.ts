// Variables d'environnement nécessaires aux tests, fixées AVANT le chargement
// de src/env.ts (qui parse process.env une seule fois à l'import).
process.env.INBOUND_EMAIL_SECRET ??= 'test-inbound-secret';
