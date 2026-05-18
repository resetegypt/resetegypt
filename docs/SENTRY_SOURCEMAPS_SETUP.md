# Sentry Source Maps — Setup (5 min)

Status: **plugin déjà câblé dans `apps/web/vite.config.ts`**. Reste juste à fournir 3 env vars dans Vercel pour activer l'upload automatique des source maps à chaque build.

## Pourquoi

Sans source maps, Sentry te montre des stack traces sur du JS minifié :
```
TypeError: t.x is not a function
  at A (/assets/index-DOctwiaR.js:1:14823)
```

Avec source maps :
```
TypeError: patient.diagnoses is not a function
  at PatientDetailPage (src/pages/patients/PatientDetailPage.tsx:127:18)
```

Indispensable pour debug en prod.

## Setup (5 min)

### 1. Sentry → Settings → Account → API → User Auth Tokens

- Va sur https://sentry.io/settings/account/api/auth-tokens/
- Bouton **Create New Token**
- Scopes (minimum) :
  - `project:read`
  - `project:releases`
  - `org:read`
- Note bien ton token `sntrys_...` — il ne sera plus jamais visible

### 2. Récupère l'org slug + project slug

Visite ton dashboard Sentry :
```
https://sentry.io/organizations/<ORG-SLUG>/projects/<PROJECT-SLUG>/
```
Les 2 slugs sont dans l'URL.

### 3. Ajoute les 3 env vars dans Vercel

Project Vercel : **reset-web** → Settings → Environment Variables

| Key | Value | Target |
|-----|-------|--------|
| `SENTRY_AUTH_TOKEN` | `sntrys_...` (token de l'étape 1) | Production + Preview + Development |
| `SENTRY_ORG` | ton org slug | Production + Preview + Development |
| `SENTRY_PROJECT` | ton project slug | Production + Preview + Development |

### 4. Redéploie

Push n'importe quelle modif minime sur main, ou clique "Redeploy" sur le dernier deploy Vercel. Le build doit afficher dans les logs :
```
> sentry-vite-plugin: uploaded N sourcemaps to Sentry
```

### 5. Provoquer une erreur pour tester

```bash
curl -H "X-Debug-Token: SDJm797U2KAsZhdAz1qFD5TFWkOgLXPdH2bBiQ" \
  https://api.reset-egypt.com/__debug/sentry
```

Va sur Sentry → Issues → la dernière erreur doit montrer le code source réel + ligne précise.

## Si ça ne marche pas

- Vérifie les build logs Vercel : `[sentry-vite-plugin] skipped: ...` indique le problème
- Sans les 3 env vars : no-op silencieux (le plugin ne casse pas le build)
- Si une seule des 3 manque : idem no-op (vérifié par la condition `sentryEnabled` dans vite.config.ts)
