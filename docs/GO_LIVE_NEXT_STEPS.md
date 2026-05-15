# Go-Live — Étapes restantes à ta charge

> Document mis à jour : 2026-05-15
> État global : **production-ready à 90%**, certains points légaux/sécurité encore ouverts.

---

## 🔴 Critique (à régler en priorité)

### 1. SSL `book.reset-egypt.com` — TXT record Cloudflare

J'ai par erreur déclenché un mode de vérification plus strict en supprimant + ré-ajoutant le domaine. Vercel demande maintenant un enregistrement TXT pour confirmer la propriété.

**Action** (2 min) :

1. https://dash.cloudflare.com/ → `reset-egypt.com` → **DNS** → **Add record**
2. Ajoute :

| Champ | Valeur |
|-------|--------|
| **Type** | `TXT` |
| **Name** | `_vercel` |
| **Content** (ou Target) | `vc-domain-verify=book.reset-egypt.com,3df23e5e879130c0735a` |
| **Proxy** | `DNS only` (n/a pour TXT, mais par défaut) |
| **TTL** | `Auto` |

3. Attends 1-2 min la propagation
4. Re-déclenche la vérification :
   ```bash
   curl -X POST -H "Authorization: Bearer $VERCEL_TOKEN" \
     "https://api.vercel.com/v9/projects/reset-booking/domains/book.reset-egypt.com/verify?teamId=team_fXp0nrCsvZKkaQk9U3mkCYPx"
   ```
   Ou simplement : va sur Vercel dashboard → reset-booking → Settings → Domains → clique "Refresh"

5. Vercel émet le cert Let's Encrypt en <2 min. `https://book.reset-egypt.com` devient accessible.

**Tu peux aussi supprimer le TXT après que `book` soit verified=true** (il n'est nécessaire que pour la vérification initiale).

### 2. TIN + intégration ETA réelle

Sans le numéro fiscal du centre et la vraie intégration ETA, **toute facture émise au-dessus du seuil légal égyptien est invalide**. Décret 188/2020.

**Actions** :
- Obtenir le TIN du centre (auprès du fisc égyptien si pas déjà connu)
- Créer un compte sur https://invoicing.eta.gov.eg
- Récupérer `ETA_CLIENT_ID`, `ETA_CLIENT_SECRET`, certificat numérique
- Brancher la vraie API ETA dans `apps/api/src/modules/payments/payments.routes.ts` (actuellement mockée — cherche `etaUuid: faker...`)
- Set ces 3 env vars sur Vercel reset-api : `ETA_CLIENT_ID`, `ETA_CLIENT_SECRET`, `ETA_API_URL=https://api.invoicing.eta.gov.eg`

### 3. Vulnérabilités JWT critiques

Voir `docs/SECURITY_AUDIT.md` section "🔴 Vulnérabilités critiques". `fast-jwt` a un bug "Cache Confusion" qui peut servir les claims d'un patient à un autre. Upgrade urgent :

```bash
cd apps/api
pnpm update @fastify/jwt@latest fastify@latest
pnpm typecheck && pnpm test
# Tester manuellement login + auth dans toutes les routes
git commit -am "deps: upgrade @fastify/jwt → 10 + fastify → 5 (CVE patches)"
git push
```

Major version bump — il y aura probablement quelques fixes TypeScript à faire.

---

## 🟠 Important (à faire cette semaine)

### 4. Feature Mailbox praticien

Code 100% prêt, 3 actions côté toi pour la mettre en service :

**A. Supabase Storage bucket**
1. https://supabase.com → projet `pubrtdtigucvhjydtifo`
2. Storage → New bucket → nom **`email-attachments`** → **DÉCOCHER** "Public"

**B. Cloudflare Worker**
1. Génère un secret partagé :
   ```bash
   openssl rand -base64 32
   ```
2. Depuis le repo local :
   ```bash
   cd workers/inbound-email
   pnpm exec wrangler login
   printf '%s' 'https://api.reset-egypt.com'  | pnpm exec wrangler secret put RESET_API_URL
   printf '%s' '<secret-base64>'              | pnpm exec wrangler secret put INBOUND_EMAIL_SECRET
   printf '%s' 'resetegypt@gmail.com'         | pnpm exec wrangler secret put GMAIL_FALLBACK
   pnpm exec wrangler deploy
   ```
3. Cloudflare dashboard → **Email** → **Email Routing** → route `dr.ahmadalashry@reset-egypt.com` → **"Send to a Worker"** → choisir `reset-inbound-email`

**C. Faire tourner le script (côté ton terminal)**
1. Copie `scripts/mailbox-go-live.env.example` → `scripts/mailbox-go-live.env`
2. Remplis :
   - `SUPABASE_SERVICE_KEY` (Supabase → Settings → API → service_role key)
   - `INBOUND_EMAIL_SECRET` (le même qu'à l'étape B.2)
   - `VERCEL_TOKEN` (optionnel, génère un nouveau si l'ancien a expiré)
3. Lance :
   ```bash
   bash scripts/mailbox-go-live.sh
   ```
   Le script pose les env vars Vercel + crée la mailbox en BDD.

### 5. WhatsApp Business Cloud API

Au cœur du business (relances auto J-2, J-1, J+1...). Actuellement **mocké** — rien ne part vers les patients.

**Pré-requis** :
- Compte Meta Business
- App Meta avec WhatsApp Business product
- Numéro de téléphone vérifié

**Une fois obtenus** :
- `WHATSAPP_TOKEN` et `WHATSAPP_PHONE_ID` sur Vercel reset-api
- Brancher la vraie API dans `apps/api/src/lib/whatsapp.ts` (cherche le mock)
- Activer les 6 workflows dans `AutomationWorkflow`

### 6. Sentry monitoring

15 min, gratuit jusqu'à 5k erreurs/mois, énorme gain de fiabilité.

1. https://sentry.io → New Project → Node.js → name `reset-api`
2. Copier le DSN
3. Sur Vercel reset-api : `SENTRY_DSN=https://...@...ingest.sentry.io/...`
4. Dans `apps/api/src/server.ts`, ajouter au tout début :
   ```ts
   import * as Sentry from '@sentry/node';
   import { nodeProfilingIntegration } from '@sentry/profiling-node';
   if (process.env.SENTRY_DSN) {
     Sentry.init({
       dsn: process.env.SENTRY_DSN,
       integrations: [nodeProfilingIntegration()],
       tracesSampleRate: 0.1,
     });
   }
   ```
5. `pnpm add --filter @reset/api @sentry/node @sentry/profiling-node`
6. Commit + push → auto-deploy

### 7. Tests E2E Playwright

Pas faits. Risque de régressions à chaque deploy.

Au minimum, couvrir :
- Login + logout
- Créer un RDV
- Remplir une fiche d'accueil + clinique
- Encaisser un paiement → facture PDF générée

Modèle d'exécution : ajouter un workflow GitHub Actions qui lance les tests sur chaque PR.

---

## 🟡 Moyen (à faire dans le mois)

### 8. Tokens temporaires à révoquer

Actuellement actifs (1 jour pour Vercel, 7 jours pour GitHub) :
- **Vercel API token** : https://vercel.com/account/tokens → trouve `transfer-from-egyptttw` → Delete
- **GitHub PAT** : https://github.com/settings/tokens → trouve `push-from-tradecost` → Delete

À faire dès que tu n'en as plus besoin.

### 9. 2FA pour le compte admin

Désactivé selon spec mais recommandé pour app médicale en prod. Plusieurs libs Fastify disponibles. ~30 min de dev.

### 10. Headers CSP / X-Frame sur apps/web et apps/site

Voir `docs/SECURITY_AUDIT.md` section "Configuration headers sécurité". Ajouter un `_headers` Vercel ou config Next.js.

### 11. Formation équipe + doc utilisateur

Sara, Nora, Dr Ahmad ne savent pas encore utiliser l'app. Prévoir :
- Session de formation (2-3 h)
- Doc PDF FR + AR (cheat-sheet par rôle)

---

## 🟢 Nice to have

- Téléphone centre dans env var `CENTER_PHONE`
- N° commercial dans env var `CENTER_COMMERCIAL_NUMBER`
- Postal code centre (si voulu)
- Backups Supabase testés (restoration)
- Git filter-repo pour nettoyer l'historique de `TempPass123!`
- Rotation `JWT_SECRET` tous les 6 mois
- Audit OWASP Top 10 par un tier

---

## 📞 Tokens à utiliser (jusqu'à expiration)

| Token | Use | Expiration |
|-------|-----|------------|
| Vercel API `vcp_3JAQF...` | Set env vars + déclencher deploys via API | dans ~6h |
| GitHub PAT `ghp_3zpI...` | Push sur resetegypt/resetegypt | 2026-05-22 |

**À révoquer dès la fin du go-live final.**

---

## 🆔 Identifiants administratifs (référence)

- Compte GitHub repo : `resetegypt/reset-egypt` (anciennement tradecost — repo supprimé)
- Compte Vercel : `resetegypt's projects` (team_fXp0nrCsvZKkaQk9U3mkCYPx, plan Hobby)
- Projet Supabase : `pubrtdtigucvhjydtifo` (aws-0-eu-west-1)
- Domaine DNS : Cloudflare (nameservers `candy.ns.cloudflare.com` + `dns.cloudflare.com`)
- Resend : email transactionnel (DKIM + SPF déjà configurés dans Cloudflare)
- Praticien actif : `dr.ahmadalashry@reset-egypt.com` (Dr Ahmad Al Ashry)
- Secrétaires : `sara@`, `nora@`
- Admin : `direction@`

## 🔐 Mots de passe

Mots de passe confiés au client en privé (voir session chat de migration du 15 mai 2026). **Jamais commités** dans ce repo.

⚠️ Mots de passe actuels suivent un pattern prévisible (`123.reset[role]`). À renforcer avant grand public (16+ chars, générés aléatoirement).
