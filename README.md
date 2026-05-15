# Reset Egypt

Application web métier complète pour le centre d'auriculothérapie laser **Reset Egypt** (New Cairo).

Plateforme intégrée de gestion de cabinet : agenda multi-praticiens, dossier patient 360°, fiche clinique multilingue (FR/AR/EN avec RTL), encaissement conforme ETA, inbox unifiée WhatsApp/Instagram/Email, relances automatiques, statistiques direction, réservation publique.

## État du projet

🟢 **Phases 1, 3-9 implémentées** · v1.0.0

| Phase | Module(s) | Statut |
|-------|-----------|--------|
| 1 — Cadrage | Monorepo + Docker + Prisma + i18n + UI | ✅ |
| 2 — Infrastructure (Hetzner + CI/CD + Sentry) | — | ⏳ Déploiement |
| 3 — Auth + RBAC | 0a, 0b | ✅ |
| 4 — RDV + Patient | 1, 2, 3 | ✅ |
| 5 — Clinique + Dossier | 4, 5 | ✅ |
| 6 — Encaissement | 6 (ETA mocké) | ✅ |
| 7 — Réservation publique | 7 | ✅ |
| 8 — Communications | 9 (mock), 11 | ✅ |
| 9 — Stats + Agenda | 8, 10, 12 | ✅ |
| 10 — Tests + Production | — | ⏳ |

**À brancher en production (mocks dev)** :
- ETA Egypt (tax.gov.eg) — actuellement génère UUID fake
- WhatsApp Business Cloud API — actuellement log seulement
- Twilio SMS — non installé
- Brevo email — non installé
- Sentry — non installé

## Démarrage rapide

### Pré-requis

- Node.js 20+
- pnpm 8+
- Postgres 16+ (Docker OU installation native via Scoop)

### Installation

```powershell
# 1. Installer les deps
pnpm install

# 2. Variables d'environnement
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env

# 3. Lancer Postgres
# Option A : Docker (si daemon fonctionne)
pnpm db:up

# Option B : Native Windows via Scoop
scoop install postgresql
& "C:\Users\wiinc\scoop\apps\postgresql\current\bin\pg_ctl" -D "C:\Users\wiinc\scoop\apps\postgresql\current\data" -l "$env:TEMP\pg.log" start
# Créer user + db
& "C:\Users\wiinc\scoop\apps\postgresql\current\bin\psql" -U postgres -c "CREATE USER reset WITH PASSWORD 'reset_dev_password' CREATEDB;"
& "C:\Users\wiinc\scoop\apps\postgresql\current\bin\psql" -U postgres -c "CREATE DATABASE reset_egypt_dev OWNER reset;"

# 4. Migrer la BDD + seed
pnpm db:migrate
pnpm db:seed

# 5. Démarrer les 3 apps en parallèle
pnpm dev
```

### URLs

- **Staff portal (web)** : http://localhost:3000
- **API** : http://localhost:3001
- **Booking public** : http://localhost:3002
- MailHog : http://localhost:8025 (si Docker)
- Prisma Studio : `pnpm db:studio` → http://localhost:5555

### Identifiants de dev (seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | direction@reset-egypt.com | TempPass123! |
| Praticien (Dr Ahmad Al Ashry) | dr.ahmadalashry@reset-egypt.com | TempPass123! |
| Secrétaire (Sara) | sara@reset-egypt.com | TempPass123! |
| Secrétaire (Nora) | nora@reset-egypt.com | TempPass123! |

## Fonctionnalités

### Pour la secrétaire 👤
- **Tableau de bord** : KPIs du jour (RDV, demandes, recettes), liste chronologique des RDV
- **Agenda hebdomadaire** : grille 7 jours × 18 créneaux (10h-22h, séances de 40 min), drag-to-create
- **Création de RDV** : recherche patient autocomplete, détection conflits, calcul prix auto
- **Fiche d'accueil patient** : identité, coordonnées, motif, consentements RGPD/Loi 151
- **Encaissement** : 6 modes paiement (Espèces/Carte/Vodafone Cash/Instapay/Fawry/Virement), TVA 14%, soumission ETA mock, facture PDF preview
- **Inbox unifiée** : WhatsApp/Instagram/Messenger/Email/SMS en 3 colonnes
- **Liste patients** : recherche, statut, addiction

### Pour le praticien 🩺
- **Mon agenda** : ses RDV du jour
- **Fiche clinique** (Étape 2) : anamnèse, échelles 0-10 (stress/anxiété/envies/sommeil/motivation), contre-indications (⚠️ pacemaker, épilepsie, grossesse), test Fagerström (tabac), mesures objectives + IMC auto, plan thérapeutique (points auriculaires, durée laser), notes privées
- **Dossier patient 360°** : timeline complète, score d'évolution calculé, historique séances

### Pour la direction 👑
- **Statistiques globales** : CA + tendance, séances, patients actifs, sources d'acquisition, performance praticiens
- **Gestion comptes** : création/désactivation utilisateurs, déverrouillage, reset mot de passe
- **Journal d'audit** : 200 derniers événements (logins, créations, paiements...) avec IP

### Pour le patient (public) 🌐
- **Réservation 4 étapes** : service → date+créneau → coordonnées → confirmation
- **18 créneaux/jour** affichés en temps réel (créneaux pris barrés)
- **Confirmation immédiate** avec numéro `RES-YYYY-XXXX`

## Stack technique

- **Frontend** : React 18 + TypeScript strict + Vite + Tailwind CSS + shadcn-style components + react-i18next + TanStack Query + Zustand + React Router v6
- **Backend** : Node.js 20+ avec Fastify 4 + TypeScript strict + Pino + Zod + @fastify/jwt + @fastify/cookie
- **Database** : PostgreSQL 16 + Prisma ORM 5 (10 modèles)
- **Auth** : JWT httpOnly cookie, bcryptjs (cost 12), audit log persistant
- **Cache/Queue** : Redis 7 + BullMQ (configuré, workers pour automations en Phase 8.5)
- **Monorepo** : Turborepo + pnpm workspaces

## Structure

```
reset/
├── apps/
│   ├── web/             Staff portal (admin/praticien/secrétaire)
│   │   ├── src/
│   │   │   ├── pages/   (Login, Dashboard, Patients, Agenda, Payment, Stats, Inbox, Admin...)
│   │   │   ├── lib/     (api client, auth store, i18n)
│   │   │   └── components/ (AppShell, ProtectedRoute)
│   ├── api/             Backend Fastify
│   │   └── src/modules/ (auth, users, patients, appointments, medical-records, payments, messages, stats, automations, booking)
│   └── booking/         Site public de réservation (wizard 4 étapes)
├── packages/
│   ├── shared/          Types et enums partagés
│   └── ui/              Composants UI (Button, Input, Card, Dialog, Toast, Avatar, Badge, Chip)
├── docs/                Spec + plans
└── docker-compose.yml
```

## Commandes utiles

| Commande | Effet |
|----------|-------|
| `pnpm dev` | Lance API + web + booking en parallèle |
| `pnpm dev:api` | API uniquement |
| `pnpm dev:web` | Web uniquement |
| `pnpm dev:booking` | Booking uniquement |
| `pnpm build` | Build tous les workspaces |
| `pnpm test` | Lance tous les tests |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | Lint tous les workspaces |
| `pnpm format` | Format Prettier |
| `pnpm db:up` | Lance Docker (Postgres + Redis + MailHog) |
| `pnpm db:migrate` | `prisma migrate dev` |
| `pnpm db:seed` | Réinjecte le seed |
| `pnpm db:studio` | Ouvre Prisma Studio |

## API Endpoints

### Auth (public)
- `POST /api/auth/login` - login + cookie JWT
- `POST /api/auth/logout` - clear cookie + audit
- `GET /api/auth/me` - current user (auth required)
- `POST /api/auth/password/forgot` - mock reset

### Booking (public)
- `GET /api/booking/slots?date=YYYY-MM-DD` - 18 slots avec disponibilité
- `POST /api/booking` - create patient + appointment

### Users (admin only)
- `GET/POST/PATCH /api/users`
- `POST /api/users/:id/unlock`, `/reset-password`
- `GET /api/audit-logs`
- `GET /api/admin/kpis`

### Patients
- `GET/POST/PATCH /api/patients`
- `GET /api/patients/:id` (avec timeline + stats + evolution)

### Appointments
- `GET/POST/PATCH/DELETE /api/appointments`
- `GET /api/appointments/today` - RDV du jour (filtré par praticien)
- `GET /api/appointments/week?start=...` - vue hebdo
- `GET /api/practitioners` - liste praticiens actifs

### Medical Records (praticien only)
- `POST /api/medical-records` - création/upsert + marque RDV completed
- `GET /api/medical-records/:id`
- `GET /api/appointments/:id/medical-record`

### Payments (secrétaire + admin)
- `POST /api/payments` - calcul TVA + mock ETA submit + audit
- `GET /api/payments/:id`, `GET /api/payments`

### Messages
- `GET /api/messages/conversations` - groupées par patient/canal
- `GET /api/messages?channel=...&unread=true`
- `POST /api/messages` (envoi mocké)
- `POST /api/messages/:id/read`

### Stats
- `GET /api/stats/dashboard` - KPIs du jour
- `GET /api/stats/global?period=day|week|month|year` (admin only)

### Automations
- `GET /api/automation-workflows` - 6 workflows seed à la 1ère lecture
- `PATCH /api/automation-workflows/:id`

## Sécurité

- JWT httpOnly cookies (SameSite=Lax)
- Verrouillage automatique après 5 tentatives échouées
- Audit log de toutes les actions sensibles (login, paiement, modifications patient/user)
- TypeScript strict + Zod validation sur tous les inputs
- Helmet (CSP, HSTS, X-Frame-Options)
- CORS strict configurable
- Bcrypt cost 12

## Conformité Loi 151/2020

- Consentements explicites à l'inscription (data protection + SMS + non-medical)
- Stockés avec timestamp + IP
- Audit trail conservé 5 ans
- TVA 14% (avec exonération bien-être à valider avec comptable)

## TODO post-v1.0.0

- [ ] Brancher API ETA réelle (tax.gov.eg)
- [ ] Brancher WhatsApp Business Cloud API (Meta)
- [ ] Brancher Twilio fallback SMS
- [ ] Brancher Brevo email
- [ ] Brancher reCAPTCHA v3 sur booking public
- [ ] Brancher Sentry error tracking
- [ ] CI/CD GitHub Actions
- [ ] Déploiement Hetzner Cloud + Caddy + Let's Encrypt
- [ ] Backups Postgres automatiques (WAL + snapshots)
- [ ] Tests E2E Playwright (login, créer RDV, encaisser)
- [ ] Relecture traductions arabes par locuteur natif
- [ ] Génération PDF facture réelle (puppeteer/pdfkit)
- [ ] Stockage S3/B2 pour PDF factures + photos
- [ ] BullMQ workers pour automations (envoi WA programmé)
- [ ] WebSocket temps réel calendrier (booking ↔ secrétaire)
- [ ] Tests unitaires sur logique métier critique (TVA, score évolution, conflits)
- [ ] 2FA TOTP pour admin (recommandé)
- [ ] IP whitelist activable depuis admin UI
- [ ] Vrais identifiants centre (TIN, numéro commercial, adresse)
- [x] Vrais noms praticiens (Dr Ahmad Al Ashry — Reda/Layla désactivés)

## Documentation

- [Spécifications complètes](docs/superpowers/specs/2026-05-11-reset-egypt-design.md)
- [Plan d'implémentation Phase 1](docs/superpowers/plans/2026-05-11-phase-1-cadrage-plan.md)
