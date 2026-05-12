# Reset Egypt — Guide de déploiement

Stack : **GitHub + Vercel + Supabase + Resend + IONOS DNS**. Coût : 0€/mois en free tier.

## 🗺️ Architecture

```
GitHub (code)
   ↓ push triggers auto-deploy
Vercel (3 projets) ← Frankfurt fra1
   ├── reset-api      → api.reset-egypt.com (serverless Fastify)
   ├── reset-web      → app.reset-egypt.com (staff portal)
   └── reset-booking  → book.reset-egypt.com (public — pas utilisé, optionnel)

Supabase (Postgres + backups quotidiens) ← Frankfurt
   └── reset-egypt project

Resend (emails transactionnels) ← global
   └── reset-egypt-prod API key

IONOS (domaine + WordPress vitrine, inchangé)
   ├── reset-egypt.com → WordPress vitrine (217.160.0.57)
   ├── api.reset-egypt.com → CNAME → cname.vercel-dns.com
   ├── app.reset-egypt.com → CNAME → cname.vercel-dns.com
   └── (book.reset-egypt.com si activé)
```

## 🚀 Procédure complète (1ère fois)

### 1. Supabase — créer le projet

1. [supabase.com](https://supabase.com) → New project → name `reset-egypt`, password fort, region `eu-central-1`
2. Attendre 2 min que la DB soit prête
3. **Project Settings → Database** :
   - Copier l'URI **"Transaction pooler"** (port 6543) → ce sera `DATABASE_URL` (ajouter `?pgbouncer=true&connection_limit=1` à la fin)
   - Copier l'URI **"Session pooler"** ou direct (port 5432) → ce sera `DIRECT_URL`
   - Remplacer `[YOUR-PASSWORD]` par le password choisi

### 2. Migrer le schéma sur Supabase

Depuis le repo local :

```bash
# .env doit contenir DATABASE_URL et DIRECT_URL Supabase
export DATABASE_URL='postgresql://postgres.xxxx:...@aws-0-eu-central-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1'
export DIRECT_URL='postgresql://postgres.xxxx:...@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'

pnpm --filter @reset/api exec prisma migrate deploy
pnpm --filter @reset/api prisma:seed
```

### 3. Resend — créer la clé API

1. [resend.com](https://resend.com) → API Keys → Create → name `reset-egypt-prod`, scope `Full access`
2. **Copier la clé immédiatement** (`re_xxxxx`) — non visible après
3. **Domain** → Add Domain → `reset-egypt.com` → copier les records DNS à ajouter dans IONOS plus tard

### 4. GitHub — pousser le code

```bash
gh repo create reset-egypt --private --source=. --remote=origin --push
```

Ou manuellement : créer un repo sur github.com, puis :

```bash
git remote add origin git@github.com:<TON_USERNAME>/reset-egypt.git
git push -u origin main
```

### 5. Vercel — créer 3 projets

Pour chaque dossier `apps/api`, `apps/web`, `apps/booking` :

1. [vercel.com/new](https://vercel.com/new) → Import Git Repository → choisir `reset-egypt`
2. **Root Directory** : `apps/api` (puis `apps/web`, puis `apps/booking`)
3. **Framework Preset** : automatique (vercel.json présent)
4. **Environment Variables** :
   - Pour **api** : `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `RESEND_API_KEY`, `APP_URL=https://app.reset-egypt.com`, `API_URL=https://api.reset-egypt.com`, `CORS_ORIGIN=https://app.reset-egypt.com,https://book.reset-egypt.com,https://reset-egypt.com`, `NODE_ENV=production`
   - Pour **web** : `VITE_API_URL=https://api.reset-egypt.com`
   - Pour **booking** : `VITE_API_URL=https://api.reset-egypt.com`
5. **Deploy** → patiente ~2 min

### 6. Vercel — connecter les domaines custom

Sur chaque projet Vercel :

- `reset-api` → Settings → Domains → Add → `api.reset-egypt.com`
- `reset-web` → Settings → Domains → Add → `app.reset-egypt.com`
- `reset-booking` → Settings → Domains → Add → `book.reset-egypt.com` (optionnel)

Vercel donne les enregistrements DNS à créer (CNAME vers `cname.vercel-dns.com`).

### 7. IONOS — ajouter les sous-domaines DNS

Espace IONOS → Domaines & SSL → `reset-egypt.com` → DNS → Ajouter un enregistrement :

| Type | Nom d'hôte | Valeur |
|------|-----------|--------|
| CNAME | `api` | `cname.vercel-dns.com` |
| CNAME | `app` | `cname.vercel-dns.com` |
| CNAME | `book` | `cname.vercel-dns.com` (optionnel) |

Plus les records Resend (Domain verification) si email custom.

⚠️ **Ne touche pas** aux records `@` et `www` (WordPress).

### 8. WordPress — redirections pour les 3 URLs custom

Installer le plugin **Redirection** (gratuit, John Godley) → Outils → Redirection → Ajouter :

| Source | Cible | Type |
|--------|-------|------|
| `/admin` | `https://app.reset-egypt.com/login?role=admin` | 302 |
| `/admindr` | `https://app.reset-egypt.com/login?role=practitioner` | 302 |
| `/resetsecretary` | `https://app.reset-egypt.com/login?role=secretary` | 302 |

### 9. Tester

- https://api.reset-egypt.com/health → `{"status":"ok"}`
- https://api.reset-egypt.com/health/deep → DB check OK
- https://app.reset-egypt.com → login screen
- https://reset-egypt.com/admin → redirige vers app.reset-egypt.com/login

---

## 🔄 Mises à jour (après la 1ère fois)

À chaque push sur `main`, **Vercel redéploie automatiquement les 3 projets**. Pour migrer le schéma :

```bash
# Depuis local avec DATABASE_URL prod dans .env
pnpm --filter @reset/api exec prisma migrate deploy
```

---

## 🛟 Backups Supabase

- **Free tier** : Supabase fait des **daily backups** automatiques, rétention 7 jours
- **Restauration** : Supabase dashboard → Database → Backups → Restore
- **Bonus** : ajouter un cron qui fait `pg_dump` vers ton stockage perso (à mettre en place plus tard)

---

## 💸 Limites des free tiers

| Service | Free tier limit | Quand passer payant |
|---------|----------------|---------------------|
| **Vercel** | 100 GB bande passante / mois, 100 000 invocations function | Si trafic > 10k visites/jour |
| **Supabase** | 500 MB DB, 50 000 utilisateurs actifs, 1 GB stockage | Si > 5 000 patients ou DB > 500 MB |
| **Resend** | 100 emails/jour, 3 000/mois | Si > 100 factures/jour |

Pour Reset Egypt (un centre, ~5 personnes, ~50 RDV/jour), **on est très loin des limites pendant au moins 1 an**.

---

## 🐛 Troubleshooting

### "Cookie not set" en prod
- Vérifier `NODE_ENV=production` sur Vercel api
- Vérifier que `APP_URL` contient `reset-egypt.com` (pour activer `domain=.reset-egypt.com`)

### "CORS error" en prod
- Vérifier `CORS_ORIGIN` sur Vercel api inclut bien `https://app.reset-egypt.com`

### "Prisma client init error"
- Re-run `pnpm --filter @reset/api exec prisma generate`
- Sur Vercel : la `buildCommand` du vercel.json le fait automatiquement

### Connection refused Supabase
- Vérifier que `DATABASE_URL` utilise le **pooler** (port 6543, pas 5432) et a `?pgbouncer=true&connection_limit=1`
- Le 5432 (`DIRECT_URL`) n'est utilisé QUE pour les migrations, pas en runtime
