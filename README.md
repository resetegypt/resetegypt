# Reset Egypt

Application web métier pour le centre d'auriculothérapie laser Reset Egypt (New Cairo).

Plateforme intégrée de gestion de cabinet : agenda multi-praticiens, dossier patient, fiche clinique multilingue (FR/AR/EN), encaissement conforme ETA, inbox unifiée WhatsApp/Instagram/Email, relances automatiques, statistiques direction.

## État du projet

🟢 **Phase 1 — Cadrage terminée** : monorepo + Docker + i18n + UI base. Prisma + seed en attente du daemon Docker.

Le document de spécifications complet vit dans [`docs/superpowers/specs/2026-05-11-reset-egypt-design.md`](docs/superpowers/specs/2026-05-11-reset-egypt-design.md).

Le plan d'implémentation Phase 1 vit dans [`docs/superpowers/plans/2026-05-11-phase-1-cadrage-plan.md`](docs/superpowers/plans/2026-05-11-phase-1-cadrage-plan.md).

## Démarrage rapide

### Pré-requis

- Node.js 20+
- pnpm 8+
- Docker Desktop running
- Git

### Installation

```powershell
# 1. Installer les deps
pnpm install

# 2. Variables d'environnement
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env

# 3. Lancer Postgres + Redis + MailHog
pnpm db:up

# 4. (à venir Task 6/7) Migrer la BDD + seed
pnpm db:migrate
pnpm db:seed

# 5. Démarrer les 3 apps en parallèle
pnpm dev
```

URLs :

- Staff portal (web) : http://localhost:3000
- API : http://localhost:3001/health
- Booking public : http://localhost:3002
- MailHog : http://localhost:8025
- Prisma Studio : `pnpm db:studio` → http://localhost:5555

## Identifiants de dev (seed — Task 7 à venir)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | direction@reset-egypt.com | TempPass123! |
| Practitioner | dr.reda@reset-egypt.com | TempPass123! |
| Practitioner | dr.layla@reset-egypt.com | TempPass123! |
| Secretary | sara@reset-egypt.com | TempPass123! |
| Secretary | nora@reset-egypt.com | TempPass123! |

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn-style components + react-i18next
- **Backend** : Node.js 20+ avec Fastify + TypeScript strict + Pino
- **Database** : PostgreSQL 16 + Prisma ORM (Task 6)
- **Cache/Queue** : Redis 7 + BullMQ (Phase 8)
- **Monorepo** : Turborepo + pnpm workspaces

## Structure

```
reset/
├── apps/
│   ├── web/         Staff portal (secrétaire/praticien/admin)
│   ├── api/         Backend Fastify
│   └── booking/     Site public de réservation
├── packages/
│   ├── shared/      Types et enums partagés
│   └── ui/          Composants UI (shadcn-style)
├── docs/            Spec + plans
└── docker-compose.yml
```

## Commandes utiles

| Commande | Effet |
|----------|-------|
| `pnpm dev` | Lance API + web + booking en parallèle |
| `pnpm dev:api` | Lance uniquement l'API |
| `pnpm dev:web` | Lance uniquement le portail staff |
| `pnpm dev:booking` | Lance uniquement le site booking |
| `pnpm build` | Build tous les workspaces |
| `pnpm test` | Lance tous les tests |
| `pnpm typecheck` | Vérification TypeScript |
| `pnpm lint` | Lint tous les workspaces |
| `pnpm format` | Format Prettier |
| `pnpm db:up` | Lance Docker (Postgres + Redis + MailHog) |
| `pnpm db:down` | Arrête Docker |
| `pnpm db:reset` | Reset complet de la DB (perd toutes les données) |
| `pnpm db:migrate` | Lance prisma migrate dev |
| `pnpm db:seed` | Réinjecte le seed |
| `pnpm db:studio` | Ouvre Prisma Studio |

## Phases du projet

| Phase | Statut | Semaines |
|-------|--------|----------|
| 1 — Cadrage (monorepo, schema, seed, i18n, UI base) | 🟡 En cours (Prisma/seed à finaliser) | 1-2 |
| 2 — Infrastructure (Hetzner, Caddy, CI/CD, Sentry, backups) | ⏳ À venir | 3 |
| 3 — Auth + RBAC (Module 0a, 0b) | ⏳ À venir | 4 |
| 4 — RDV + Patient (Modules 1, 2, 3) | ⏳ À venir | 5-6 |
| 5 — Clinique + Dossier (Modules 4, 5) | ⏳ À venir | 7-8 |
| 6 — Encaissement + ETA (Module 6) | ⏳ À venir | 9 |
| 7 — Réservation (Module 7) | ⏳ À venir | 10 |
| 8 — Communications (Modules 9, 11) | ⏳ À venir | 11-12 |
| 9 — Stats + Agenda (Modules 8, 10, 12) | ⏳ À venir | 13 |
| 10 — Tests + Production | ⏳ À venir | 14 |
