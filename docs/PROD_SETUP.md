# PROD_SETUP — Runbook complet des tâches restantes

> À exécuter par **toi** (Reset Egypt owner). Chaque item est copy-paste ready.
> Généré par Claude Code — Batch H.

---

## 📊 État actuel

| #   | Item                                 | Effort | Bloqueur                 |
| --- | ------------------------------------ | ------ | ------------------------ |
| 1   | `ENCRYPTION_KEY` sur Vercel prod     | 2 min  | Token Vercel             |
| 2   | `NEXT_PUBLIC_BOOKING_URL` sur Vercel | 1 min  | Token Vercel             |
| 3   | Cleanup patients seed prod           | —      | ✅ **Déjà OK** (voir §3) |
| 4   | Cloudflare R2 backup                 | 15 min | Compte Cloudflare        |
| 5   | Sentry sourcemaps                    | 10 min | Sentry auth token        |
| 6   | Rotation DB_PASSWORD Supabase        | 5 min  | Dashboard Supabase       |

---

## 1️⃣ + 2️⃣ ENCRYPTION_KEY + NEXT_PUBLIC_BOOKING_URL sur Vercel

**Option A — Script automatique (préféré)** :

```bash
# 1. Récupère un token Vercel : https://vercel.com/account/tokens
# 2. Lance le script (dry-run d'abord)
VERCEL_TOKEN=vcp_xxxx bash scripts/setup-vercel-env.sh

# 3. Applique
VERCEL_TOKEN=vcp_xxxx bash scripts/setup-vercel-env.sh --apply

# 4. Redéploie pour prendre en compte les nouvelles env vars
vercel --prod --token=$VERCEL_TOKEN --cwd=apps/api
vercel --prod --token=$VERCEL_TOKEN --cwd=apps/site
```

**Option B — Manuel via dashboard Vercel** :

Une clé pré-générée pour toi (usage unique — ne la partage pas) :

```
ENCRYPTION_KEY = RqCWBFSFyLQTXDV+1B35B02rcwPNJjMXyrKKr4/U4xo=
```

1. https://vercel.com/reset-egypt/reset-api/settings/environment-variables
2. Add `ENCRYPTION_KEY` = valeur ci-dessus, target **Production**, type **Encrypted**
3. Redeploy le projet `reset-api`
4. Vérifie dans les logs Vercel : plus de warning `⚠️ ENCRYPTION_KEY absente`

Pour `NEXT_PUBLIC_BOOKING_URL` (site) :

1. https://vercel.com/reset-egypt/reset-site/settings/environment-variables
2. Add `NEXT_PUBLIC_BOOKING_URL` = `https://book.reset-egypt.com`, target **Production**
3. Idem pour `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_CONTACT_EMAIL`, `NEXT_PUBLIC_WHATSAPP_NUMBER`

---

## 3️⃣ Cleanup patients seed — ✅ DÉJÀ OK

**Résultat du dry-run** (exécuté le 2026-08-29) :

```
🔍 5 candidat(s) trouvé(s) :
  À supprimer : 0
  À conserver : 5
    - Sara El-Hosseiny (+201112345678) — facture émise (rétention fiscale 10 ans)
    - Ahmed Mostafa (+201002345678) — facture émise (rétention fiscale 10 ans)
    - Nour Hassan (+201334567890) — facture émise (rétention fiscale 10 ans)
    - Mariam Adel (+201445678901) — RDV actif 2026-05-15T08:00:00.000Z
    - Khaled Salim (+201223456789) — RDV actif 2026-05-14T12:40:00.000Z
```

**Diagnostic** : les 5 "patients seed" sont devenus de VRAIS patients (factures + RDV actifs futurs). Le script les protège correctement. **Aucune action requise**.

Si tu veux quand même vérifier :

```bash
NODE_ENV=production pnpm --filter @reset/api tsx scripts/cleanup-seed-patients.ts
```

---

## 4️⃣ Cloudflare R2 backup DB

**Setup one-shot (15 min)** :

### 4a. Créer le bucket R2

1. https://dash.cloudflare.com → R2 → Create bucket
2. Name : `reset-egypt-backups`
3. Location : `EEUR` (Frankfurt, proche Supabase EU-west-1)
4. Retention : ajoute une lifecycle rule "Delete after 90 days" côté R2 UI (belt+bracers vs le script qui delete à 30j)

### 4b. Créer l'API token R2

1. R2 → API → Create Token
2. Scope : bucket `reset-egypt-backups` avec permission `Object Read & Write`
3. Copie : `Account ID`, `Access Key ID`, `Secret Access Key`

### 4c. Configurer les secrets GitHub Actions

https://github.com/resetegypt/resetegypt/settings/secrets/actions

**✅ Déjà set automatiquement par Claude** :

| Nom                          | État                                                           |
| ---------------------------- | -------------------------------------------------------------- |
| `DATABASE_URL_PROD`          | ✅ Set (Supabase URL directe port 5432)                        |
| `BACKUP_ENCRYPTION_PASSWORD` | ✅ Set (⚠️ **note-la ci-dessous, tu ne pourras plus la voir**) |

**⚠️ IMPORTANT — clé GPG backup** (garde-la précieusement, perdue = backups illisibles) :

```
BACKUP_ENCRYPTION_PASSWORD = tISyPsRxbQmh3m5JZrOIrVATQ4+9eJ62P75FQ+HEhfk=
```

**🟡 À ajouter par toi** (après création bucket R2) :

| Nom                    | Valeur                               |
| ---------------------- | ------------------------------------ |
| `R2_ACCOUNT_ID`        | Account ID Cloudflare (32 chars hex) |
| `R2_ACCESS_KEY_ID`     | Access Key R2                        |
| `R2_SECRET_ACCESS_KEY` | Secret R2                            |
| `R2_BUCKET`            | `reset-egypt-backups`                |

Via CLI (préféré) :

```bash
export GH_TOKEN=ghp_xxx
echo "<ton_r2_account_id>" | gh secret set R2_ACCOUNT_ID --repo=resetegypt/resetegypt
echo "<ta_r2_access_key>"  | gh secret set R2_ACCESS_KEY_ID --repo=resetegypt/resetegypt
echo "<ton_r2_secret>"     | gh secret set R2_SECRET_ACCESS_KEY --repo=resetegypt/resetegypt
echo "reset-egypt-backups" | gh secret set R2_BUCKET --repo=resetegypt/resetegypt
```

### 4d. Vérifier

Le workflow tourne quotidien à 03:00 UTC. Pour un test immédiat :

1. https://github.com/resetegypt/resetegypt/actions/workflows/backup-db.yml
2. Bouton "Run workflow" → main → Run

Vérifie ensuite dans R2 UI que `daily/reset-egypt-YYYYMMDD_HHMMSS.sql.gz.gpg` apparaît.

### 4e. Restauration (procédure)

```bash
# 1. Télécharge le backup
aws s3 cp s3://reset-egypt-backups/daily/reset-egypt-20260829_030000.sql.gz.gpg . \
  --endpoint-url https://<R2_ACCOUNT_ID>.r2.cloudflarestorage.com

# 2. Déchiffre
gpg --batch --passphrase "$BACKUP_ENCRYPTION_PASSWORD" \
  --decrypt reset-egypt-20260829_030000.sql.gz.gpg > backup.sql.gz

# 3. Restaure (vers une DB test, pas prod !)
gunzip -c backup.sql.gz | psql $DATABASE_URL_TEST
```

---

## 5️⃣ Sentry sourcemaps (staging + prod)

Objectif : que les stack traces Sentry montrent le code source TypeScript, pas le bundle minifié.

### 5a. Sentry Auth Token

1. https://sentry.io/settings/account/api/auth-tokens/
2. Create Token, scopes : `project:releases`, `org:read`, `project:write`
3. Copie le token (format `sntrys_xxx`)

### 5b. Récupère org + project

Dans l'URL de ton projet Sentry : `https://<org>.sentry.io/projects/<project>/` → note les 2 slugs.

### 5c. Setup Vercel env vars (préféré : via script)

```bash
export SENTRY_AUTH_TOKEN=sntrys_xxx
export SENTRY_ORG=reset-egypt
export SENTRY_PROJECT=reset-api
VERCEL_TOKEN=vcp_xxx bash scripts/setup-vercel-env.sh --apply
```

### 5d. Config vite/next pour uploader les sourcemaps

À faire dans un batch ultérieur — pour l'instant Sentry marchera SANS sourcemaps (les erreurs sont capturées, juste les stack traces sont minifiées).

Config référence : `docs/SENTRY_SOURCEMAPS_SETUP.md` (déjà présent dans le repo).

---

## 6️⃣ Rotation DB_PASSWORD Supabase

⚠️ **Downtime attendu** : ~30 secondes pendant la rotation. Prévois d'appliquer hors des heures d'ouverture (11h-22h Cairo).

### 6a. Génère un nouveau password

```bash
openssl rand -base64 32 | tr -d '/+=' | head -c 32
```

### 6b. Change dans Supabase Dashboard

1. https://supabase.com/dashboard/project/pubrtdtigucvhjydtifo/settings/database
2. Section "Database password" → Reset database password
3. Colle le nouveau password → Save

### 6c. Update DATABASE_URL sur Vercel (les 4 projets si applicable)

```bash
# Récupère le nouveau URL depuis Supabase Settings → Database → Connection String
NEW_URL="postgresql://postgres.pubrtdtigucvhjydtifo:<NEW_PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
NEW_DIRECT="postgresql://postgres.pubrtdtigucvhjydtifo:<NEW_PASSWORD>@aws-0-eu-west-1.pooler.supabase.com:5432/postgres"

# Set sur Vercel (reset-api) — via CLI :
echo "$NEW_URL" | vercel env add DATABASE_URL production --token=$VERCEL_TOKEN
echo "$NEW_DIRECT" | vercel env add DIRECT_URL production --token=$VERCEL_TOKEN

# Ou via dashboard : https://vercel.com/reset-egypt/reset-api/settings/environment-variables
```

### 6d. Redeploy + verify

```bash
vercel --prod --token=$VERCEL_TOKEN --cwd=apps/api
# Attendre 60s
curl -s https://api.reset-egypt.com/health/deep | jq
# Doit renvoyer status:ok
```

### 6e. Update GH secret `DATABASE_URL_PROD` (backup workflow)

https://github.com/resetegypt/resetegypt/settings/secrets/actions → edit `DATABASE_URL_PROD`

### 6f. Update local `apps/api/.env`

Remplace le password dans `apps/api/.env` (⚠️ ne commit surtout pas — c'est dans .gitignore normalement).

---

## ✅ Vérification finale

Après tous les setup :

```bash
# API healthy
curl -s https://api.reset-egypt.com/health/deep | jq .status
# → "ok"

# security.txt
curl -s https://reset-egypt.com/.well-known/security.txt | head -3
# → doit renvoyer les 3 premières lignes

# BOOKING_URL bien injecté
curl -s https://reset-egypt.com | grep -oE 'href="[^"]*book[^"]*"' | head -1
# → https://book.reset-egypt.com

# Backup a bien tourné (après le premier cron)
# Regarde https://github.com/resetegypt/resetegypt/actions
```

Si tout est vert → **prod hardened**.

---

## 📎 Références

- Setup Sentry sourcemaps : [docs/SENTRY_SOURCEMAPS_SETUP.md](SENTRY_SOURCEMAPS_SETUP.md)
- Deploy final steps : [docs/DEPLOY_FINAL_STEPS.md](DEPLOY_FINAL_STEPS.md)
- Script Vercel env : [scripts/setup-vercel-env.sh](../scripts/setup-vercel-env.sh)
- Script cleanup patients : [apps/api/scripts/cleanup-seed-patients.ts](../apps/api/scripts/cleanup-seed-patients.ts)
- Backup workflow : [.github/workflows/backup-db.yml](../.github/workflows/backup-db.yml)
