# reset-inbound-email — Cloudflare Email Worker

Reçoit les emails de la mailbox praticien (`ahmadalashry@reset-egypt.com`), les
parse et les POST au webhook `/inbound/email` de l'API RESET. Forwarde aussi vers
Gmail comme filet de sécurité v1.

## Déploiement

```bash
pnpm --filter @reset/inbound-email-worker exec wrangler login
pnpm --filter @reset/inbound-email-worker exec wrangler secret put RESET_API_URL
pnpm --filter @reset/inbound-email-worker exec wrangler secret put INBOUND_EMAIL_SECRET
pnpm --filter @reset/inbound-email-worker exec wrangler secret put GMAIL_FALLBACK
pnpm --filter @reset/inbound-email-worker deploy
```

`INBOUND_EMAIL_SECRET` doit être **identique** à la variable du même nom de l'API.

## Activer la route

Dashboard Cloudflare -> Email -> Email Routing -> Routes -> éditer l'adresse du
praticien -> « Send to a Worker » -> `reset-inbound-email`.
