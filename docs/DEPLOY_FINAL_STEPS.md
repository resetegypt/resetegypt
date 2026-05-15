# Reset Egypt — Étapes finales (post-déploiement)

## ✅ Déjà fait (LIVE)

| Service                | URL Vercel                                      | Statut          |
|------------------------|-------------------------------------------------|-----------------|
| API Fastify            | https://reset-api-vert.vercel.app               | ✅ LIVE         |
| Admin (web)            | https://reset-web-virid.vercel.app              | ✅ LIVE         |
| Booking public         | https://reset-booking.vercel.app                | ✅ LIVE         |
| DB Supabase            | aws-0-eu-west-1 / project pubrtdtigucvhjydtifo  | ✅ migré + seed |
| Comptes prod           | direction@reset-egypt.com  (admin)              | ✅ live         |
|                        | dr.ahmadalashry@reset-egypt.com (praticien)     | ✅ live         |
|                        | sara@reset-egypt.com  (secrétaire)              | ✅ live         |
|                        | nora@reset-egypt.com  (secrétaire)              | ✅ live         |
|                        | (mots de passe confiés en privé)                |                 |

Custom domains ajoutés côté Vercel (`verified: true`) — il manque juste le DNS IONOS.

---

## 🔧 Étape 1 — DNS IONOS (3 CNAMEs)

Connectez-vous sur **https://login.ionos.fr/** puis :

1. **Domaines & SSL** → cliquez sur **reset-egypt.com**
2. **DNS** → **Ajouter un enregistrement**
3. Créez 3 enregistrements CNAME :

| Type  | Nom du sous-domaine | Pointe vers              | TTL     |
|-------|---------------------|--------------------------|---------|
| CNAME | `api`               | `cname.vercel-dns.com`   | 3600    |
| CNAME | `app`               | `cname.vercel-dns.com`   | 3600    |
| CNAME | `book`              | `cname.vercel-dns.com`   | 3600    |

⚠️ Ne **PAS** toucher l'enregistrement A de `reset-egypt.com` (apex) — il reste sur le WordPress IONOS (217.160.0.57).

Propagation : 5–30 minutes. Vérifiez avec :
```bash
nslookup api.reset-egypt.com
nslookup app.reset-egypt.com
nslookup book.reset-egypt.com
```
Chaque résultat doit pointer vers `cname.vercel-dns.com` (ou une IP Vercel comme 76.76.21.21).

Une fois fait, Vercel émettra automatiquement les certificats SSL Let's Encrypt (< 1 min).

---

## 🔧 Étape 2 — Resend (e-mails de factures)

1. Créez compte sur https://resend.com (gratuit, 100 e-mails/jour, 3000/mois)
2. Ajoutez le domaine `reset-egypt.com` dans **Domains**
3. Resend vous donne 3 enregistrements (TXT pour SPF + DKIM + CNAME) à ajouter dans IONOS DNS
4. Une fois vérifié, **API Keys** → **Create API Key** (full access) → copiez la clé
5. Envoyez-moi la clé `re_xxxxx` pour que je la configure dans Vercel

Sans Resend les factures par e-mail ne partent pas (mais l'app fonctionne).

---

## 🔧 Étape 3 — Redirections WordPress

Sur **app.reset-egypt.com** (WordPress, vitrine), installez **Redirection** (plugin gratuit) :

1. **Plugins** → **Ajouter** → cherchez « Redirection » par John Godley
2. Activez le plugin
3. **Outils** → **Redirection** → **Ajouter une redirection** :

| URL source         | URL cible                                     | Type |
|--------------------|-----------------------------------------------|------|
| `/admin`           | `https://app.reset-egypt.com/login`           | 301  |
| `/admindr`         | `https://app.reset-egypt.com/login?role=practitioner` | 301 |
| `/resetsecretary`  | `https://app.reset-egypt.com/login?role=secretary` | 301 |
| `/reserver`        | `https://book.reset-egypt.com/`               | 301  |
| `/booking`         | `https://book.reset-egypt.com/`               | 301  |

### Alternative — `.htaccess`

Si vous préférez `.htaccess`, ajoutez en haut du fichier (juste après `RewriteEngine On`) :

```apache
# Reset Egypt redirects
RewriteRule ^admin/?$ https://app.reset-egypt.com/login [R=301,L]
RewriteRule ^admindr/?$ https://app.reset-egypt.com/login?role=practitioner [R=301,L]
RewriteRule ^resetsecretary/?$ https://app.reset-egypt.com/login?role=secretary [R=301,L]
RewriteRule ^reserver/?$ https://book.reset-egypt.com/ [R=301,L]
RewriteRule ^booking/?$ https://book.reset-egypt.com/ [R=301,L]
```

---

## 🧪 Smoke test final (après DNS + Resend)

```bash
# 1. API
curl https://api.reset-egypt.com/health
curl https://api.reset-egypt.com/health/deep
# Doit renvoyer 200 + database:ok

# 2. Admin login
curl -X POST https://api.reset-egypt.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"direction@reset-egypt.com","password":"TempPass123!"}'
# Doit renvoyer user + Set-Cookie reset_session

# 3. Frontends
open https://app.reset-egypt.com    # → page de login admin
open https://book.reset-egypt.com   # → wizard 4 étapes public
open https://reset-egypt.com/admin  # → redirige vers app.reset-egypt.com/login
```

---

## 🔒 Sécurité — actions à faire après le go-live

1. **Changer les mots de passe seed** (`TempPass123!`) via la page profil
2. **Supprimer/désactiver les comptes de démo** non utilisés (dr.reda, dr.layla, nora si pas réels)
3. **Configurer un IP whitelist** (table `IpWhitelist`) pour l'admin si vous voulez
4. **Sauvegardes Supabase** : actives par défaut sur le plan gratuit (point-in-time recovery 7 jours)
5. **Monitoring** : Vercel envoie déjà les logs runtime ; ajoutez Sentry plus tard si besoin

---

## 💰 Coût mensuel

| Service        | Plan          | Coût           |
|----------------|---------------|----------------|
| Vercel         | Hobby         | **0 €**        |
| Supabase       | Free          | **0 €**        |
| Resend         | Free          | **0 €**        |
| IONOS          | existant      | **inclus**     |
| **TOTAL**      |               | **0 €/mois**   |

Limites du plan gratuit :
- Vercel : 100 GB bandwidth/mois, 6 000 minutes serverless
- Supabase : 500 MB DB, 1 GB transfer, projet endormi après 7 jours d'inactivité (réveille automatiquement à la 1re requête)
- Resend : 100 mails/jour, 3 000/mois

À l'usage clinique typique (≤ 50 RDV/jour), vous êtes très loin des limites.
