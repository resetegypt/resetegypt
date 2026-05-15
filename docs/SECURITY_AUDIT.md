# Security Audit — Reset Egypt

> Date du dernier audit : 2026-05-15
> Outil : `pnpm audit` + revues manuelles

## 🔴 Vulnérabilités critiques (à patcher rapidement)

### 1. fast-jwt — 3 CVE critiques

Path : `apps/api > @fastify/jwt@8.0.1 > fast-jwt@4.0.5`
Version actuelle : `fast-jwt@4.0.5`
Version patchée : `>=6.2.4`

| CVE | Impact |
|-----|--------|
| GHSA-mvf2-f6gm-w987 | JWT Algorithm Confusion via Whitespace-Prefixed RSA Public Key (suite incomplète CVE-2023-48223) |
| GHSA-rp9m-7r4c-75qg | **Cache Confusion via cacheKeyBuilder Collisions** — peut retourner les claims d'un autre token (identity/authorization mixup) |
| GHSA-gmvf-9v4p-v8jc | JWT auth bypass via empty HMAC secret accepté par async key resolver |

**Le 2ème est le plus grave** pour une app médicale : risque de servir les données d'un patient à un autre utilisateur si le cache JWT collisionne.

**Fix** : upgrade `@fastify/jwt` de `8.0.1` vers `10.0.0` (latest). C'est un changement de **2 versions majeures**.

```bash
# Dans apps/api
pnpm update @fastify/jwt@latest
pnpm typecheck && pnpm test
# tester login + auth dans toutes les routes critiques
```

⚠️ Probable que ça oblige aussi à monter fastify de 4 à 5 (autre major).

### 2. fastify — 1 high

Path : `apps/api > fastify@4.29.1`
Version patchée : `>=5.7.2`

| CVE | Impact |
|-----|--------|
| GHSA-jx2c-rxcm-jvmq | Content-Type header tab character allows body validation bypass |

**Fix** : upgrade `fastify@4.29.1` → `5.x.x`. **Breaking changes attendus** — vérifier la migration guide officielle.

### 3. undici — 1 low

Path : `apps/api > @vercel/node@5.8.0 > undici@5.28.4`
Version patchée : `>=5.29.0`

Faible criticité (DoS via certificat malformé). Probablement réglé en montant `@vercel/node`.

## 🟠 Issues git history

L'historique git contient le mot de passe seed `TempPass123!` exposé sur les anciens commits (avant 2026-05-15). Comme la BDD n'accepte plus ce mot de passe (changé pour `123.resetdirection` / `123.reset*`), **l'exploitation directe est impossible**.

**Recommandations** :
- Pas d'action immédiate nécessaire
- Si le repo devient public un jour, faire un `git filter-repo` pour nettoyer l'historique
- Sinon, accepter la trace comme un événement historique

## 🟡 Configuration headers sécurité

| Domaine | HSTS | CSP | X-Frame | X-Content | Note |
|---------|------|-----|---------|-----------|------|
| api.reset-egypt.com | ✅ 180 jours | ✅ default-src 'self' | ✅ SAMEORIGIN | ✅ nosniff | Excellent (Helmet) |
| app.reset-egypt.com | ✅ 2 ans | ❌ | ❌ | ❌ | À durcir (Vercel default) |
| reset-egypt.com | ✅ 2 ans | ❌ | ❌ | ❌ | À durcir (Vercel default) |

**Recommandation pour app + site** : ajouter un `_headers` Vercel ou config Next.js avec :
```
Content-Security-Policy: default-src 'self' https://api.reset-egypt.com; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;
X-Frame-Options: SAMEORIGIN
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## 🟡 Authentification

| Item | État |
|------|------|
| Bcrypt cost 12 | ✅ |
| JWT signé HS256 | ✅ |
| Cookies httpOnly + Secure + SameSite | ✅ |
| Rate limit login (5 tentatives → lockout 30 min) | ✅ |
| 2FA admin | ❌ désactivé (spec) — **recommandé pour prod médicale** |
| Mots de passe forts (12+ chars admin, 8+ secrétaire) | ⚠️ actuellement `123.rest*` (9-17 chars selon compte) — patterns prévisibles |
| Mots de passe uniques par compte | ✅ depuis 2026-05-15 |
| Audit log connexions | ✅ persistant dans `AuditLog` |
| Renouvellement obligatoire 90j | ⚠️ pas vérifié |

## 🟡 Conformité légale Égypte

| Item | État |
|------|------|
| TVA 14% sur factures | ✅ calculé automatiquement |
| Soumission ETA (tax.gov.eg) | ❌ **MOCKÉE** — pas de vraie soumission |
| N° fiscal centre (TIN) | ❌ pas configuré, affiche `xxx-xxx-xxx` |
| Téléphone centre | ❌ pas configuré, affiche `+201xxxxxxxxx` |
| Adresse centre | ✅ "CMC, Teseen, New Cairo" |
| Email contact factures | ✅ secretary@reset-egypt.com |
| Conservation 5 ans factures | ⚠️ pas de mécanisme automatique (Supabase free tier = 7 jours retention) |
| Consentements RGPD/Loi 151/2020 | ✅ collectés à l'inscription patient |
| Droit à l'oubli | ⚠️ pas d'endpoint dédié |

**Action obligatoire avant émission de factures réelles** :
1. Obtenir TIN du centre auprès du fisc égyptien
2. Compte ETA tax.gov.eg → certificat numérique
3. Brancher la vraie API ETA dans `apps/api/src/modules/payments/payments.routes.ts` (actuellement mockée)
4. Sinon : factures non conformes au décret 188/2020 ❌

## 🟢 Monitoring / observability

| Item | État |
|------|------|
| Sentry error tracking | ❌ pas configuré |
| Logs structurés Pino | ✅ dans le code |
| Audit log applicatif | ✅ table `AuditLog` |
| Health check `/health/deep` | ✅ vérifie DB |
| Uptime monitoring | ❌ pas mis en place |
| Vercel logs runtime | ✅ par défaut dans dashboard |

**Recommandation** : ajouter Sentry (15 min, gratuit jusqu'à 5k erreurs/mois).
```bash
pnpm add @sentry/node @sentry/profiling-node --filter @reset/api
# Config dans apps/api/src/server.ts + DSN dans env Vercel
```

## 🟢 Données patient / privacy

| Item | État |
|------|------|
| HTTPS partout | ✅ Let's Encrypt auto |
| Données chiffrées au transport | ✅ TLS 1.3 |
| Données chiffrées au repos | ⚠️ Supabase chiffre au niveau DB mais pas par champ (pgcrypto) |
| Mots de passe hashés bcrypt | ✅ cost 12 |
| Tokens hash en BDD | ✅ JWT_SECRET propre |
| CORS strict | ✅ `app.reset-egypt.com` + `book.reset-egypt.com` whitelist |
| Validation Zod | ✅ tous les inputs API |

## 📋 Checklist de durcissement (avant go-live grand public)

- [ ] **Critique** : upgrade @fastify/jwt → 10.x + fastify → 5.x
- [ ] **Critique** : TIN + intégration ETA réelle (sinon factures illégales)
- [ ] **Important** : 2FA pour le compte admin
- [ ] **Important** : Sentry monitoring
- [ ] **Important** : Tests E2E Playwright (login, RDV, encaissement)
- [ ] **Moyenne** : Headers CSP/X-Frame sur apps/web + apps/site
- [ ] **Moyenne** : Endpoint "droit à l'oubli" + anonymisation patient
- [ ] **Moyenne** : Backups Supabase testés (restore complet)
- [ ] **Moyenne** : Mots de passe plus forts (16+ chars, generated)
- [ ] **Basse** : Rotation JWT_SECRET tous les 6 mois
- [ ] **Basse** : Audit OWASP Top 10 par tier
