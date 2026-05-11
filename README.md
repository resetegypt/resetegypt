# Reset Egypt

Application web métier pour le centre d'auriculothérapie laser Reset Egypt (New Cairo).

Plateforme intégrée de gestion de cabinet : agenda multi-praticiens, dossier patient, fiche clinique multilingue (FR/AR/EN), encaissement conforme ETA, inbox unifiée WhatsApp/Instagram/Email, relances automatiques, statistiques direction.

## État du projet

🟡 **Phase 0 — Cadrage et spec en revue**

Le document de spécifications complet vit dans [`docs/superpowers/specs/2026-05-11-reset-egypt-design.md`](docs/superpowers/specs/2026-05-11-reset-egypt-design.md).

## Stack technique

- **Frontend** : React 18 + TypeScript + Tailwind CSS + shadcn/ui + react-i18next
- **Backend** : Node.js 20+ avec Fastify + TypeScript strict
- **Database** : PostgreSQL 16 + Prisma ORM
- **Cache/Queue** : Redis 7 + BullMQ
- **Monorepo** : Turborepo + pnpm workspaces
- **Infra** : Docker + Caddy/Nginx + Let's Encrypt
- **Hosting prod** : Hetzner Cloud (à confirmer)

## Structure (cible)

```
reset/
├── apps/
│   ├── web/         # Frontend staff (secrétaire/praticien/admin)
│   ├── api/         # Backend Fastify
│   └── booking/     # Site public de réservation
├── packages/
│   ├── shared/      # Types partagés
│   └── ui/          # Composants UI partagés
├── docs/            # Spec + design + handover
└── docker-compose.yml
```

## Prérequis

- Node.js 20+
- pnpm 8+
- Docker Desktop + Docker Compose
- Git

## Documentation

- [Spécifications complètes](docs/superpowers/specs/2026-05-11-reset-egypt-design.md)
- (à venir) Plan d'implémentation Phase 1
- (à venir) Guide d'installation locale
- (à venir) Documentation utilisateur FR/AR
