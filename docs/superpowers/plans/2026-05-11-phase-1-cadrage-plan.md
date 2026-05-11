# Phase 1 — Cadrage : Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Scaffolder le monorepo Reset Egypt (Turborepo + pnpm workspaces) avec Docker (Postgres + Redis + MailHog), schéma Prisma complet + seed réaliste, base i18n FR/AR/EN avec RTL, et composants UI shadcn-style — fournir un environnement de dev fonctionnel pour toutes les phases suivantes.

**Architecture:** Monorepo Turborepo avec deux apps métier (`web` staff portal, `api` Fastify backend) et une app publique (`booking` réservation). Deux packages partagés (`shared` types/zod schemas, `ui` composants). Docker Compose pour Postgres + Redis + MailHog en dev. Aucune fonctionnalité métier ici — uniquement le squelette qui sera rempli phase par phase.

**Tech Stack:** Turborepo, pnpm 8, Node 20+, TypeScript strict, React 18 + Vite, Tailwind CSS, shadcn/ui (Radix), Fastify 4, Prisma 5, Postgres 16, Redis 7, react-i18next, Vitest, Zod, Pino.

---

## Décisions techniques de la Phase 1

| Décision | Choix | Justification |
|----------|-------|---------------|
| Bundler frontend | **Vite** (apps/web, apps/booking) | Spec dit React Router v6 (pas Next.js). Vite = dev rapide. Migration possible vers Next.js si SEO booking critique. |
| Tailwind version | **v3** stable | v4 (CSS-first) trop récent, écosystème shadcn pas migré. |
| shadcn/ui | **manuel** (pas CLI) | Le CLI installe dans une seule app. Pour monorepo, on extrait dans `packages/ui`. |
| bcrypt | **bcryptjs** (pas bcrypt natif) | Compilation native échoue sur Windows sans VS Build Tools. bcryptjs = pure JS, légèrement plus lent mais portable. |
| Email dev | **MailHog** | Standard, UI web, conteneur léger. |
| ORM env file | Racine `.env` + symlink/copie vers `apps/api/.env` | Prisma CLI lit `apps/api/.env`. On garde une source de vérité au root. |
| Validation env | **Zod** au démarrage de l'API | Plante au boot si var manquante = mieux que crash silencieux runtime. |
| Logger | **Pino** | Le spec le mentionne. JSON structuré, ultra rapide. |
| Cookies de session | Différé Phase 3 (Auth) | Phase 1 = squelette uniquement. |
| Multilingue clés | Plates (pas nestées) avec préfixes module : `common.save`, `module1.dashboard.title` | Facilite la grep et l'extraction. |

---

## Structure de fichiers (cible Phase 1)

```
reset/
├── .editorconfig
├── .env.example                      [doc des variables]
├── .gitattributes                    [LF partout, sauf .bat/.cmd]
├── .gitignore                        [déjà existe]
├── .nvmrc                            [Node 20.x]
├── .prettierignore
├── .prettierrc.json
├── README.md                         [déjà existe — sera mis à jour]
├── docker-compose.yml
├── eslint.config.mjs                 [flat config racine partagée]
├── package.json                      [racine, workspaces]
├── pnpm-workspace.yaml
├── tsconfig.base.json                [config TS partagée]
├── turbo.json                        [pipeline build/dev/lint/test]
│
├── apps/
│   ├── api/
│   │   ├── .env                      [gitignored, DATABASE_URL]
│   │   ├── .env.example
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vitest.config.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts
│   │   │   └── migrations/           [généré]
│   │   └── src/
│   │       ├── server.ts             [Fastify bootstrap]
│   │       ├── env.ts                [Zod parsing]
│   │       ├── lib/
│   │       │   └── logger.ts         [Pino]
│   │       ├── plugins/
│   │       │   ├── prisma.ts
│   │       │   ├── helmet.ts
│   │       │   ├── cors.ts
│   │       │   └── error-handler.ts
│   │       ├── routes/
│   │       │   ├── health.ts
│   │       │   └── index.ts          [register all]
│   │       └── tests/
│   │           └── health.test.ts
│   │
│   ├── web/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── vite.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── postcss.config.cjs
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx
│   │       ├── i18n/
│   │       │   ├── index.ts
│   │       │   ├── fr.json
│   │       │   ├── ar.json
│   │       │   └── en.json
│   │       ├── styles/
│   │       │   └── globals.css       [import des tokens UI]
│   │       └── lib/
│   │           └── query-client.ts   [TanStack Query setup]
│   │
│   └── booking/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.cjs
│       ├── index.html
│       └── src/
│           ├── main.tsx
│           ├── App.tsx
│           └── styles/
│               └── globals.css
│
└── packages/
    ├── shared/
    │   ├── package.json
    │   ├── tsconfig.json
    │   └── src/
    │       ├── index.ts
    │       ├── enums.ts              [Role, Addiction, etc. mirrorent Prisma]
    │       └── types.ts
    │
    └── ui/
        ├── package.json
        ├── tsconfig.json
        ├── tailwind-preset.ts        [exporté pour réutilisation]
        └── src/
            ├── index.ts
            ├── styles/
            │   └── tokens.css        [CSS variables Reset Egypt]
            ├── lib/
            │   └── cn.ts             [clsx + tailwind-merge]
            └── components/
                ├── Button.tsx
                ├── Input.tsx
                ├── Card.tsx
                ├── Dialog.tsx
                ├── Toast.tsx
                ├── Avatar.tsx
                ├── Badge.tsx
                └── Chip.tsx
```

---

## Pré-requis (à vérifier avant Task 1)

- Node 20+ (vérifié : 24.14)
- pnpm 8+ (vérifié : 8.15.4)
- Docker Desktop + Docker Compose (installé, daemon doit tourner)
- Git (vérifié : 2.53)
- Ports libres : **3000, 3001, 3002, 5432, 5555, 6379, 8025, 1025**

---

## Tasks

### Task 0 : Vérifier l'environnement et préparer Git pour Windows

**Files:**
- Create: `.gitattributes`
- Create: `.nvmrc`
- Create: `.editorconfig`

- [ ] **Step 1: Vérifier que Docker daemon tourne**

```powershell
docker info --format '{{.ServerVersion}}'
```
Expected: numéro de version (ex: `28.5.1`). Si "DAEMON DOWN", lancer Docker Desktop manuellement et attendre l'icône baleine verte.

- [ ] **Step 2: Vérifier les ports libres**

```powershell
$ports = @(3000, 3001, 3002, 5432, 5555, 6379, 8025, 1025)
$ports | ForEach-Object { $p = $_; $r = (Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue); if ($r) { "PORT $p : OCCUPE par PID $($r[0].OwningProcess)" } else { "PORT $p : libre" } }
```
Expected: tous "libre". Si un port est occupé, identifier le process (`Get-Process -Id <PID>`) et le terminer ou choisir un autre port.

- [ ] **Step 3: Configurer Git pour Windows (line endings)**

```powershell
git config --local core.autocrlf input
git config --local core.eol lf
```

- [ ] **Step 4: Créer `.gitattributes`**

```gitattributes
# Force LF endings for all text files
* text=auto eol=lf

# Force CRLF for Windows-specific files
*.bat text eol=crlf
*.cmd text eol=crlf
*.ps1 text eol=crlf

# Binary files
*.png binary
*.jpg binary
*.jpeg binary
*.gif binary
*.ico binary
*.pdf binary
*.zip binary
*.woff binary
*.woff2 binary
```

- [ ] **Step 5: Créer `.nvmrc`**

```
20
```

- [ ] **Step 6: Créer `.editorconfig`**

```ini
root = true

[*]
indent_style = space
indent_size = 2
end_of_line = lf
charset = utf-8
trim_trailing_whitespace = true
insert_final_newline = true

[*.md]
trim_trailing_whitespace = false

[*.{bat,cmd,ps1}]
end_of_line = crlf
```

- [ ] **Step 7: Commit**

```powershell
git add .gitattributes .nvmrc .editorconfig
git commit -m "chore: configure git, editorconfig, nvmrc for cross-platform consistency"
```

**Acceptance:** `git log --oneline` montre 2 commits. `git status` propre.

---

### Task 1 : Configuration racine du monorepo (Turborepo + pnpm workspaces)

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `turbo.json`
- Create: `tsconfig.base.json`
- Create: `.prettierrc.json`
- Create: `.prettierignore`
- Create: `eslint.config.mjs`

- [ ] **Step 1: Créer `package.json` racine**

```json
{
  "name": "reset-egypt",
  "version": "0.1.0",
  "private": true,
  "description": "Reset Egypt — application web métier centre d'auriculothérapie laser",
  "engines": {
    "node": ">=20",
    "pnpm": ">=8"
  },
  "packageManager": "pnpm@8.15.4",
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yaml,yml}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yaml,yml}\"",
    "clean": "turbo run clean && rimraf node_modules"
  },
  "devDependencies": {
    "@types/node": "^20.11.0",
    "prettier": "^3.2.0",
    "rimraf": "^5.0.5",
    "turbo": "^1.13.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Créer `pnpm-workspace.yaml`**

```yaml
packages:
  - "apps/*"
  - "packages/*"
```

- [ ] **Step 3: Créer `turbo.json`**

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "tsconfig.base.json"],
  "globalEnv": ["NODE_ENV"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 4: Créer `tsconfig.base.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noFallthroughCasesInSwitch": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "allowSyntheticDefaultImports": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "exclude": ["node_modules", "dist", "build", ".turbo"]
}
```

- [ ] **Step 5: Créer `.prettierrc.json`**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

- [ ] **Step 6: Créer `.prettierignore`**

```
node_modules
dist
build
.turbo
.next
coverage
pnpm-lock.yaml
*.min.js
*.min.css
docs/superpowers/specs/*
docs/superpowers/plans/*
```

- [ ] **Step 7: Créer `eslint.config.mjs` (flat config racine)**

```javascript
import tseslint from 'typescript-eslint';
import js from '@eslint/js';

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/consistent-type-imports': 'error',
    },
  },
  {
    ignores: ['**/dist/**', '**/build/**', '**/.turbo/**', '**/node_modules/**', '**/coverage/**'],
  },
);
```

- [ ] **Step 8: Installer les dépendances racine**

```powershell
pnpm install --filter "@reset-egypt" --ignore-scripts
pnpm add -D -w @eslint/js typescript-eslint
```
Expected: création de `pnpm-lock.yaml` et `node_modules` racine.

⚠️ **Note Windows** : si pnpm râle sur les symlinks, activer le Mode Développeur Windows (`Paramètres > Confidentialité et sécurité > Pour les développeurs > Mode développeur ON`) ou lancer PowerShell en admin une fois.

- [ ] **Step 9: Vérifier que turbo détecte les workspaces (vide pour l'instant)**

```powershell
pnpm exec turbo run build --dry-run
```
Expected: "No tasks were executed as part of this run." (normal, aucun workspace pour l'instant).

- [ ] **Step 10: Commit**

```powershell
git add package.json pnpm-workspace.yaml turbo.json tsconfig.base.json .prettierrc.json .prettierignore eslint.config.mjs pnpm-lock.yaml
git commit -m "feat: bootstrap monorepo with turborepo, pnpm workspaces, and shared tooling"
```

**Acceptance:** `pnpm exec turbo --version` retourne un numéro. `pnpm exec tsc --version` retourne un numéro. `pnpm exec prettier --version` idem.

---

### Task 2 : Docker Compose — Postgres 16 + Redis 7 + MailHog

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`

- [ ] **Step 1: Créer `docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16-alpine
    container_name: reset-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-reset}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-reset_dev_password}
      POSTGRES_DB: ${POSTGRES_DB:-reset_egypt_dev}
    ports:
      - "${POSTGRES_PORT:-5432}:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-reset} -d ${POSTGRES_DB:-reset_egypt_dev}"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: reset-redis
    restart: unless-stopped
    ports:
      - "${REDIS_PORT:-6379}:6379"
    volumes:
      - redis-data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

  mailhog:
    image: mailhog/mailhog:latest
    container_name: reset-mailhog
    restart: unless-stopped
    ports:
      - "${MAILHOG_SMTP_PORT:-1025}:1025"
      - "${MAILHOG_UI_PORT:-8025}:8025"

volumes:
  postgres-data:
  redis-data:
```

- [ ] **Step 2: Créer `.env.example` (racine)**

```env
# ==== POSTGRES ====
POSTGRES_USER=reset
POSTGRES_PASSWORD=reset_dev_password
POSTGRES_DB=reset_egypt_dev
POSTGRES_PORT=5432
DATABASE_URL=postgresql://reset:reset_dev_password@localhost:5432/reset_egypt_dev?schema=public

# ==== REDIS ====
REDIS_PORT=6379
REDIS_URL=redis://localhost:6379

# ==== MAILHOG (dev only) ====
MAILHOG_SMTP_PORT=1025
MAILHOG_UI_PORT=8025
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_FROM="Reset Egypt <noreply@reset-egypt.com>"

# ==== API ====
NODE_ENV=development
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000,http://localhost:3002

# ==== AUTH (Phase 3) ====
JWT_SECRET=change-me-in-production-use-openssl-rand-base64-32

# ==== SENTRY (Phase 2) ====
SENTRY_DSN=

# ==== PUBLIC URLS (prod) ====
APP_URL=http://localhost:3000
BOOKING_URL=http://localhost:3002
API_URL=http://localhost:3001

# ==== CENTRE — placeholders, à remplir avec vraies valeurs ====
CENTER_NAME=Reset Egypt
CENTER_ADDRESS=N Teseen, New Cairo 1, Le Caire 11835
CENTER_PHONE=+201xxxxxxxxx
CENTER_TAX_ID=xxx-xxx-xxx
CENTER_COMMERCIAL_NUMBER=xxx-xxx
```

- [ ] **Step 3: Copier `.env.example` → `.env` (gitignored)**

```powershell
Copy-Item .env.example .env
```

- [ ] **Step 4: Lancer les conteneurs**

```powershell
docker compose up -d
```
Expected: 3 lignes "Container reset-XXX Started".

- [ ] **Step 5: Vérifier que tout est healthy (attendre ~15s)**

```powershell
Start-Sleep -Seconds 10
docker compose ps
```
Expected: tous les services ont STATUS "Up X seconds (healthy)" pour postgres et redis, "Up X seconds" pour mailhog (pas de healthcheck).

- [ ] **Step 6: Tester la connexion Postgres**

```powershell
docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "SELECT version();"
```
Expected: ligne contenant "PostgreSQL 16.x on x86_64-pc-linux-musl..."

- [ ] **Step 7: Tester Redis**

```powershell
docker exec reset-redis redis-cli ping
```
Expected: `PONG`

- [ ] **Step 8: Tester MailHog**

```powershell
Invoke-WebRequest -Uri "http://localhost:8025/api/v2/messages" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```
Expected: `200`. Ouvre aussi http://localhost:8025 dans le navigateur pour voir l'UI MailHog.

- [ ] **Step 9: Commit**

```powershell
git add docker-compose.yml .env.example
git commit -m "feat: add docker compose with postgres 16, redis 7, mailhog for local dev"
```

**Acceptance:** `docker compose ps` montre 3 conteneurs running. http://localhost:8025 ouvre l'UI MailHog.

---

### Task 3 : Package `shared` — types et enums partagés

**Files:**
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/shared/src/index.ts`
- Create: `packages/shared/src/enums.ts`
- Create: `packages/shared/src/types.ts`

- [ ] **Step 1: Créer `packages/shared/package.json`**

```json
{
  "name": "@reset/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "devDependencies": {
    "typescript": "^5.4.0"
  },
  "dependencies": {
    "zod": "^3.22.0"
  }
}
```

- [ ] **Step 2: Créer `packages/shared/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"]
}
```

- [ ] **Step 3: Créer `packages/shared/src/enums.ts`**

```typescript
export const ROLES = ['ADMIN', 'PRACTITIONER', 'SECRETARY'] as const;
export type Role = (typeof ROLES)[number];

export const ADDICTIONS = ['TOBACCO', 'DRUGS', 'ALCOHOL', 'SUGAR', 'STRESS'] as const;
export type Addiction = (typeof ADDICTIONS)[number];

export const GENDERS = ['MALE', 'FEMALE'] as const;
export type Gender = (typeof GENDERS)[number];

export const PATIENT_STATUSES = ['ACTIVE', 'ARCHIVED', 'LOST'] as const;
export type PatientStatus = (typeof PATIENT_STATUSES)[number];

export const VISIT_TYPES = ['FIRST', 'FOLLOWUP', 'CONSOLIDATION'] as const;
export type VisitType = (typeof VISIT_TYPES)[number];

export const APPOINTMENT_STATUSES = [
  'SCHEDULED',
  'CONFIRMED',
  'IN_PROGRESS',
  'COMPLETED',
  'NO_SHOW',
  'CANCELLED',
] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  'CASH',
  'CARD',
  'VODAFONE_CASH',
  'INSTAPAY',
  'FAWRY',
  'BANK_TRANSFER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const CHANNELS = ['WHATSAPP', 'INSTAGRAM', 'MESSENGER', 'EMAIL', 'SMS'] as const;
export type Channel = (typeof CHANNELS)[number];

export const DIRECTIONS = ['INBOUND', 'OUTBOUND'] as const;
export type Direction = (typeof DIRECTIONS)[number];

export const MESSAGE_STATUSES = ['QUEUED', 'SENT', 'DELIVERED', 'READ', 'FAILED'] as const;
export type MessageStatus = (typeof MESSAGE_STATUSES)[number];

export const SUPPORTED_LOCALES = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
```

- [ ] **Step 4: Créer `packages/shared/src/types.ts`**

```typescript
import type { Addiction, AppointmentStatus, Role, VisitType } from './enums.js';

export interface EmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface Consents {
  dataProtection: { accepted: boolean; timestamp: string; ipAddress?: string };
  smsAuthorization: { accepted: boolean; timestamp: string };
  nonMedicalAcknowledgement: { accepted: boolean; timestamp: string };
}

export interface InvoiceLineItem {
  description: string;
  service: Addiction | 'OTHER';
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

export interface AppointmentSummary {
  id: string;
  patientId: string;
  patientName: string;
  practitionerId: string;
  practitionerName: string;
  scheduledAt: string;
  service: Addiction;
  visitType: VisitType;
  status: AppointmentStatus;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
  firstName: string;
  lastName: string;
  preferredLanguage: string;
}
```

- [ ] **Step 5: Créer `packages/shared/src/index.ts`**

```typescript
export * from './enums.js';
export * from './types.js';
```

- [ ] **Step 6: Vérifier que le package typecheck**

```powershell
pnpm --filter @reset/shared typecheck
```
Expected: pas d'erreur, exit code 0.

- [ ] **Step 7: Commit**

```powershell
git add packages/shared/
git commit -m "feat(shared): add shared types and enums package"
```

**Acceptance:** `pnpm --filter @reset/shared typecheck` passe.

---

### Task 4 : API workspace — squelette Fastify

**Files:**
- Create: `apps/api/package.json`
- Create: `apps/api/tsconfig.json`
- Create: `apps/api/vitest.config.ts`
- Create: `apps/api/.env.example`
- Create: `apps/api/.env`
- Create: `apps/api/src/env.ts`
- Create: `apps/api/src/lib/logger.ts`
- Create: `apps/api/src/server.ts`
- Create: `apps/api/src/plugins/error-handler.ts`
- Create: `apps/api/src/plugins/helmet.ts`
- Create: `apps/api/src/plugins/cors.ts`
- Create: `apps/api/src/routes/index.ts`
- Create: `apps/api/src/routes/health.ts`

- [ ] **Step 1: Créer `apps/api/package.json`**

```json
{
  "name": "@reset/api",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/server.ts",
    "build": "tsc -p tsconfig.json",
    "start": "node dist/server.js",
    "lint": "eslint src",
    "test": "vitest run",
    "test:watch": "vitest",
    "typecheck": "tsc --noEmit",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:seed": "tsx prisma/seed.ts",
    "prisma:studio": "prisma studio"
  },
  "dependencies": {
    "@fastify/cors": "^9.0.1",
    "@fastify/helmet": "^11.1.1",
    "@fastify/sensible": "^5.5.0",
    "@prisma/client": "^5.13.0",
    "bcryptjs": "^2.4.3",
    "dotenv": "^16.4.0",
    "fastify": "^4.27.0",
    "pino": "^9.1.0",
    "pino-pretty": "^11.0.0",
    "zod": "^3.22.0",
    "@reset/shared": "workspace:*"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/node": "^20.11.0",
    "prisma": "^5.13.0",
    "tsx": "^4.7.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

- [ ] **Step 2: Créer `apps/api/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "types": ["node"]
  },
  "include": ["src/**/*", "prisma/seed.ts"],
  "exclude": ["dist", "node_modules"]
}
```

- [ ] **Step 3: Créer `apps/api/vitest.config.ts`**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/tests/**'],
    },
  },
});
```

- [ ] **Step 4: Créer `apps/api/.env.example` et `apps/api/.env`**

`apps/api/.env.example` :
```env
DATABASE_URL=postgresql://reset:reset_dev_password@localhost:5432/reset_egypt_dev?schema=public
NODE_ENV=development
API_PORT=3001
API_HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000,http://localhost:3002
JWT_SECRET=change-me-in-production
REDIS_URL=redis://localhost:6379
SMTP_HOST=localhost
SMTP_PORT=1025
```

Copier vers `.env` :
```powershell
Copy-Item apps\api\.env.example apps\api\.env
```

- [ ] **Step 5: Créer `apps/api/src/env.ts`**

```typescript
import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  API_PORT: z.coerce.number().int().positive().default(3001),
  API_HOST: z.string().default('0.0.0.0'),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  CORS_ORIGIN: z.string().transform((s) => s.split(',').map((o) => o.trim())),
  SMTP_HOST: z.string().default('localhost'),
  SMTP_PORT: z.coerce.number().default(1025),
});

export type Env = z.infer<typeof envSchema>;

export function parseEnv(): Env {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    process.exit(1);
  }
  return result.data;
}

export const env = parseEnv();
```

- [ ] **Step 6: Créer `apps/api/src/lib/logger.ts`**

```typescript
import pino from 'pino';
import { env } from '../env.js';

export const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport:
    env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'HH:MM:ss.l',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
  redact: ['req.headers.authorization', 'req.headers.cookie', '*.password', '*.passwordHash'],
});
```

- [ ] **Step 7: Créer `apps/api/src/plugins/helmet.ts`**

```typescript
import helmet from '@fastify/helmet';
import type { FastifyInstance } from 'fastify';

export async function registerHelmet(app: FastifyInstance): Promise<void> {
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });
}
```

- [ ] **Step 8: Créer `apps/api/src/plugins/cors.ts`**

```typescript
import cors from '@fastify/cors';
import type { FastifyInstance } from 'fastify';
import { env } from '../env.js';

export async function registerCors(app: FastifyInstance): Promise<void> {
  await app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  });
}
```

- [ ] **Step 9: Créer `apps/api/src/plugins/error-handler.ts`**

```typescript
import type { FastifyError, FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error: FastifyError, _req: FastifyRequest, reply: FastifyReply) => {
    if (error instanceof ZodError) {
      reply.status(400).send({
        error: 'ValidationError',
        details: error.flatten().fieldErrors,
      });
      return;
    }
    const statusCode = error.statusCode ?? 500;
    if (statusCode >= 500) {
      app.log.error(error);
    }
    reply.status(statusCode).send({
      error: error.name || 'InternalServerError',
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  });
}
```

- [ ] **Step 10: Créer `apps/api/src/routes/health.ts`**

```typescript
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'reset-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));
}
```

- [ ] **Step 11: Créer `apps/api/src/routes/index.ts`**

```typescript
import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes);
}
```

- [ ] **Step 12: Créer `apps/api/src/server.ts`**

```typescript
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger, trustProxy: true });
  await app.register(sensible);
  await registerHelmet(app);
  await registerCors(app);
  registerErrorHandler(app);
  await registerRoutes(app);
  return app;
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`🚀 Reset API listening on http://localhost:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
```

- [ ] **Step 13: Installer les dépendances**

```powershell
pnpm install
```
Expected: nouveau lockfile, `node_modules` dans apps/api + symlink vers @reset/shared.

- [ ] **Step 14: Démarrer le serveur en dev**

```powershell
pnpm --filter @reset/api dev
```
Expected: logs en couleur "Reset API listening on http://localhost:3001". Si erreur env, lire le message et corriger `.env`.

- [ ] **Step 15: Tester le endpoint /health (dans un autre terminal)**

```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health"
```
Expected: objet avec `status: ok`, `service: reset-api`, `timestamp`, `uptime`.

- [ ] **Step 16: Arrêter le serveur (Ctrl+C dans le terminal du dev)**

- [ ] **Step 17: Commit**

```powershell
git add apps/api/ pnpm-lock.yaml
git commit -m "feat(api): bootstrap fastify server with env validation, helmet, cors, health endpoint"
```

**Acceptance:** `pnpm --filter @reset/api dev` démarre sans erreur, `GET /health` retourne 200 avec `{status: "ok"}`.

---

### Task 5 : Test unitaire du endpoint /health (TDD)

**Files:**
- Create: `apps/api/src/routes/health.test.ts`

- [ ] **Step 1: Écrire le test**

`apps/api/src/routes/health.test.ts` :
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server.js';

describe('GET /health', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({
      status: 'ok',
      service: 'reset-api',
    });
    expect(body.timestamp).toBeDefined();
    expect(typeof body.uptime).toBe('number');
  });
});
```

- [ ] **Step 2: Lancer le test**

```powershell
pnpm --filter @reset/api test
```
Expected: 1 test passes.

- [ ] **Step 3: Commit**

```powershell
git add apps/api/src/routes/health.test.ts
git commit -m "test(api): add health endpoint integration test"
```

**Acceptance:** `pnpm --filter @reset/api test` passe avec 1 test green.

---

### Task 6 : Schéma Prisma + migration initiale

**Files:**
- Create: `apps/api/prisma/schema.prisma`
- Create: `apps/api/src/plugins/prisma.ts`
- Modify: `apps/api/src/server.ts:lines 9 et 16` (ajouter prisma plugin)

- [ ] **Step 1: Créer `apps/api/prisma/schema.prisma`**

(Copié-collé depuis le spec lignes 441-682, avec corrections : ajout de la relation `preferredPractitionerId` et `createdById` Payment)

```prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String   @id @default(uuid())
  email             String   @unique
  passwordHash      String
  role              Role     @default(SECRETARY)
  firstName         String
  lastName          String
  phone             String?
  preferredLanguage String   @default("fr")
  isActive          Boolean  @default(true)
  isLocked          Boolean  @default(false)
  failedAttempts    Int      @default(0)
  lastLoginAt       DateTime?
  passwordChangedAt DateTime @default(now())
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  appointments      Appointment[]   @relation("PractitionerAppointments")
  createdPatients   Patient[]       @relation("CreatedBy")
  preferredByPatients Patient[]     @relation("PreferredPractitioner")
  payments          Payment[]       @relation("PaymentCreatedBy")
  auditLogs         AuditLog[]
  systemSettings    SystemSetting[]
}

enum Role {
  ADMIN
  PRACTITIONER
  SECRETARY
}

model Patient {
  id                      String        @id @default(uuid())
  firstName               String
  lastName                String
  dateOfBirth             DateTime?
  age                     Int?
  gender                  Gender?
  phone                   String        @unique
  whatsapp                String?
  email                   String?
  address                 String?
  governorate             String?
  profession              String?
  maritalStatus           String?
  acquisitionSource       String[]
  primaryAddiction        Addiction
  previousAttempts        String?
  motivationLevel         String?
  emergencyContact        Json?
  consents                Json
  preferredLanguage       String        @default("fr")
  preferredPractitionerId String?
  preferredPractitioner   User?         @relation("PreferredPractitioner", fields: [preferredPractitionerId], references: [id])
  createdById             String
  createdBy               User          @relation("CreatedBy", fields: [createdById], references: [id])
  status                  PatientStatus @default(ACTIVE)
  createdAt               DateTime      @default(now())
  updatedAt               DateTime      @updatedAt

  appointments    Appointment[]
  medicalRecords  MedicalRecord[]
  payments        Payment[]
  messages        Message[]

  @@index([phone])
  @@index([lastName, firstName])
}

enum Gender {
  MALE
  FEMALE
}

enum Addiction {
  TOBACCO
  DRUGS
  ALCOHOL
  SUGAR
  STRESS
}

enum PatientStatus {
  ACTIVE
  ARCHIVED
  LOST
}

model Appointment {
  id             String            @id @default(uuid())
  patientId      String
  patient        Patient           @relation(fields: [patientId], references: [id])
  practitionerId String
  practitioner   User              @relation("PractitionerAppointments", fields: [practitionerId], references: [id])
  scheduledAt    DateTime
  duration       Int               @default(40)
  service        Addiction
  visitType      VisitType
  status         AppointmentStatus @default(SCHEDULED)
  source         String
  price          Decimal           @db.Decimal(10, 2)
  notes          String?
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt

  medicalRecord MedicalRecord?
  payment       Payment?

  @@index([scheduledAt])
  @@index([practitionerId, scheduledAt])
  @@index([patientId, scheduledAt])
}

enum VisitType {
  FIRST
  FOLLOWUP
  CONSOLIDATION
}

enum AppointmentStatus {
  SCHEDULED
  CONFIRMED
  IN_PROGRESS
  COMPLETED
  NO_SHOW
  CANCELLED
}

model MedicalRecord {
  id            String      @id @default(uuid())
  appointmentId String      @unique
  appointment   Appointment @relation(fields: [appointmentId], references: [id])
  patientId     String
  patient       Patient     @relation(fields: [patientId], references: [id])

  yearsOfAddiction  Int?
  dailyQuantity     String?
  previousMethods   String[]
  longestQuit       String?

  triggers           String[]
  consumptionMoments String?

  stressScore     Int?
  anxietyScore    Int?
  cravingScore    Int?
  sleepScore      Int?
  motivationScore Int?

  contraindications String[]
  medications       String?
  allergies         String?

  weight Float?
  height Float?
  bmi    Float?
  spo2   Int?

  fagerstromScore    Int?
  auditScore         Int?
  duditScore         Int?
  yfasScore          Int?
  hadAnxietyScore    Int?
  hadDepressionScore Int?

  auricularPoints String?
  laserDuration   Int?
  nextSession     String?

  privateNotes String?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([patientId])
}

model Payment {
  id             String        @id @default(uuid())
  appointmentId  String?       @unique
  appointment    Appointment?  @relation(fields: [appointmentId], references: [id])
  patientId      String
  patient        Patient       @relation(fields: [patientId], references: [id])
  invoiceNumber  String        @unique
  items          Json
  subtotal       Decimal       @db.Decimal(10, 2)
  discount       Decimal       @default(0) @db.Decimal(10, 2)
  vat            Decimal       @db.Decimal(10, 2)
  total          Decimal       @db.Decimal(10, 2)
  paymentMethod  PaymentMethod
  paymentRef     String?
  etaUuid        String?
  etaHash        String?
  etaSubmittedAt DateTime?
  pdfUrl         String?
  createdAt      DateTime      @default(now())
  createdById    String
  createdBy      User          @relation("PaymentCreatedBy", fields: [createdById], references: [id])

  @@index([patientId, createdAt])
  @@index([invoiceNumber])
}

enum PaymentMethod {
  CASH
  CARD
  VODAFONE_CASH
  INSTAPAY
  FAWRY
  BANK_TRANSFER
}

model Message {
  id           String        @id @default(uuid())
  patientId    String?
  patient      Patient?      @relation(fields: [patientId], references: [id])
  externalId   String?
  channel      Channel
  direction    Direction
  fromAddress  String
  toAddress    String
  content      String
  status       MessageStatus @default(SENT)
  isAuto       Boolean       @default(false)
  templateName String?
  attachments  Json?
  language     String        @default("fr")
  createdAt    DateTime      @default(now())
  readAt       DateTime?

  @@index([patientId, createdAt])
  @@index([channel, createdAt])
}

enum Channel {
  WHATSAPP
  INSTAGRAM
  MESSENGER
  EMAIL
  SMS
}

enum Direction {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  QUEUED
  SENT
  DELIVERED
  READ
  FAILED
}

model AutomationWorkflow {
  id        String   @id @default(uuid())
  name      String
  trigger   String
  isActive  Boolean  @default(true)
  steps     Json
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model AuditLog {
  id        String   @id @default(uuid())
  userId    String?
  user      User?    @relation(fields: [userId], references: [id])
  action    String
  resource  String?
  details   Json?
  ipAddress String?
  userAgent String?
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
  @@index([action, createdAt])
}

model SystemSetting {
  key         String   @id
  value       Json
  updatedAt   DateTime @updatedAt
  updatedById String?
  updatedBy   User?    @relation(fields: [updatedById], references: [id])
}

model IpWhitelist {
  id          String   @id @default(uuid())
  ipAddress   String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

- [ ] **Step 2: Générer la première migration**

```powershell
pnpm --filter @reset/api exec prisma migrate dev --name init
```
Expected:
- crée `apps/api/prisma/migrations/<timestamp>_init/migration.sql`
- applique la migration sur la DB locale
- génère `@prisma/client`

Si erreur "DATABASE_URL not found", vérifier `apps/api/.env`.

- [ ] **Step 3: Vérifier les tables dans Postgres**

```powershell
docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "\dt"
```
Expected: liste des tables : User, Patient, Appointment, MedicalRecord, Payment, Message, AutomationWorkflow, AuditLog, SystemSetting, IpWhitelist, _prisma_migrations.

- [ ] **Step 4: Créer `apps/api/src/plugins/prisma.ts`**

```typescript
import { PrismaClient } from '@prisma/client';
import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log: app.log.level === 'debug' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

  await prisma.$connect();
  app.decorate('prisma', prisma);

  app.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

export default fp(prismaPlugin, { name: 'prisma' });
```

- [ ] **Step 5: Ajouter `fastify-plugin` aux deps**

```powershell
pnpm --filter @reset/api add fastify-plugin
```

- [ ] **Step 6: Enregistrer le plugin Prisma dans `server.ts`**

Modifier `apps/api/src/server.ts` :

```typescript
import Fastify from 'fastify';
import sensible from '@fastify/sensible';
import { env } from './env.js';
import { logger } from './lib/logger.js';
import { registerHelmet } from './plugins/helmet.js';
import { registerCors } from './plugins/cors.js';
import { registerErrorHandler } from './plugins/error-handler.js';
import prismaPlugin from './plugins/prisma.js';
import { registerRoutes } from './routes/index.js';

export async function buildApp() {
  const app = Fastify({ loggerInstance: logger, trustProxy: true });
  await app.register(sensible);
  await registerHelmet(app);
  await registerCors(app);
  await app.register(prismaPlugin);
  registerErrorHandler(app);
  await registerRoutes(app);
  return app;
}

async function start() {
  const app = await buildApp();
  try {
    await app.listen({ port: env.API_PORT, host: env.API_HOST });
    app.log.info(`🚀 Reset API listening on http://localhost:${env.API_PORT}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  start();
}
```

- [ ] **Step 7: Mettre à jour le endpoint health pour inclure le check DB**

Modifier `apps/api/src/routes/health.ts` :

```typescript
import type { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    service: 'reset-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  }));

  app.get('/health/deep', async () => {
    let db: 'ok' | 'down' = 'down';
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      db = 'ok';
    } catch {
      db = 'down';
    }
    return {
      status: db === 'ok' ? 'ok' : 'degraded',
      service: 'reset-api',
      checks: { database: db },
      timestamp: new Date().toISOString(),
    };
  });
}
```

- [ ] **Step 8: Relancer le serveur et tester**

```powershell
pnpm --filter @reset/api dev
```
Dans un autre terminal :
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health/deep"
```
Expected: `status: ok`, `checks: { database: 'ok' }`.

Arrêter le serveur (Ctrl+C).

- [ ] **Step 9: Mettre à jour le test health pour le deep check**

`apps/api/src/routes/health.test.ts` (ajouter le bloc test) :

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../server.js';

describe('Health endpoints', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 with status ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body).toMatchObject({ status: 'ok', service: 'reset-api' });
  });

  it('GET /health/deep returns 200 with database ok when DB is reachable', async () => {
    const response = await app.inject({ method: 'GET', url: '/health/deep' });
    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.checks.database).toBe('ok');
  });
});
```

- [ ] **Step 10: Lancer les tests**

```powershell
pnpm --filter @reset/api test
```
Expected: 2 tests pass.

- [ ] **Step 11: Commit**

```powershell
git add apps/api/prisma/ apps/api/src/plugins/prisma.ts apps/api/src/server.ts apps/api/src/routes/health.ts apps/api/src/routes/health.test.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(api): add prisma schema, initial migration, prisma plugin, deep health check"
```

**Acceptance:**
- `docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "\dt"` montre 11 tables
- `GET /health/deep` retourne `status: ok` avec `database: ok`
- `pnpm --filter @reset/api test` : 2 tests passent

---

### Task 7 : Seed data Prisma (1 admin + 2 prat + 2 sec + 5 patients + 20 RDV)

**Files:**
- Create: `apps/api/prisma/seed.ts`

- [ ] **Step 1: Créer `apps/api/prisma/seed.ts`**

```typescript
import { PrismaClient, Role, Addiction, Gender, AppointmentStatus, VisitType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const PASSWORD_PLAIN = 'TempPass123!';

const PRACTITIONERS_DATA = [
  { email: 'dr.reda@reset-egypt.com', firstName: 'Reda', lastName: 'Hassan' },
  { email: 'dr.layla@reset-egypt.com', firstName: 'Layla', lastName: 'Mansour' },
] as const;

const SECRETARIES_DATA = [
  { email: 'sara@reset-egypt.com', firstName: 'Sara', lastName: 'Mostafa' },
  { email: 'nora@reset-egypt.com', firstName: 'Nora', lastName: 'Ibrahim' },
] as const;

const PATIENTS_DATA: Array<{
  firstName: string;
  lastName: string;
  phone: string;
  dateOfBirth: Date;
  gender: Gender;
  governorate: string;
  primaryAddiction: Addiction;
  preferredLanguage: string;
}> = [
  {
    firstName: 'Ahmed',
    lastName: 'Mostafa',
    phone: '+201002345678',
    dateOfBirth: new Date('1985-03-12'),
    gender: 'MALE',
    governorate: 'Le Caire',
    primaryAddiction: 'TOBACCO',
    preferredLanguage: 'ar',
  },
  {
    firstName: 'Sara',
    lastName: 'El-Hosseiny',
    phone: '+201112345678',
    dateOfBirth: new Date('1990-07-22'),
    gender: 'FEMALE',
    governorate: 'Gizeh',
    primaryAddiction: 'STRESS',
    preferredLanguage: 'fr',
  },
  {
    firstName: 'Khaled',
    lastName: 'Salim',
    phone: '+201223456789',
    dateOfBirth: new Date('1978-11-05'),
    gender: 'MALE',
    governorate: 'Le Caire',
    primaryAddiction: 'SUGAR',
    preferredLanguage: 'ar',
  },
  {
    firstName: 'Nour',
    lastName: 'Hassan',
    phone: '+201334567890',
    dateOfBirth: new Date('1995-02-18'),
    gender: 'FEMALE',
    governorate: 'Alexandrie',
    primaryAddiction: 'ALCOHOL',
    preferredLanguage: 'en',
  },
  {
    firstName: 'Mariam',
    lastName: 'Adel',
    phone: '+201445678901',
    dateOfBirth: new Date('1982-08-30'),
    gender: 'FEMALE',
    governorate: 'Le Caire',
    primaryAddiction: 'TOBACCO',
    preferredLanguage: 'ar',
  },
];

const PRICE_BY_SERVICE: Record<Addiction, { first: number; followup: number }> = {
  TOBACCO: { first: 3500, followup: 1500 },
  DRUGS: { first: 4000, followup: 1800 },
  ALCOHOL: { first: 4000, followup: 1800 },
  SUGAR: { first: 2500, followup: 1100 },
  STRESS: { first: 2000, followup: 900 },
};

function ageFromDob(dob: Date): number {
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) age--;
  return age;
}

function slotForDay(dayOffset: number, slotIndex: number): Date {
  // 18 créneaux/jour, 40 min, 10h-22h
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  base.setDate(base.getDate() + dayOffset);
  const startMinutes = 10 * 60 + slotIndex * 40;
  base.setMinutes(startMinutes);
  return base;
}

async function main() {
  console.log('🌱 Seeding database...');
  const passwordHash = await bcrypt.hash(PASSWORD_PLAIN, 12);

  // === ADMIN ===
  const admin = await prisma.user.upsert({
    where: { email: 'direction@reset-egypt.com' },
    update: {},
    create: {
      email: 'direction@reset-egypt.com',
      passwordHash,
      role: Role.ADMIN,
      firstName: 'Direction',
      lastName: 'Reset Egypt',
      preferredLanguage: 'fr',
    },
  });
  console.log(`✔ Admin: ${admin.email}`);

  // === PRACTITIONERS ===
  const practitioners = await Promise.all(
    PRACTITIONERS_DATA.map((p) =>
      prisma.user.upsert({
        where: { email: p.email },
        update: {},
        create: {
          ...p,
          passwordHash,
          role: Role.PRACTITIONER,
          preferredLanguage: 'fr',
        },
      }),
    ),
  );
  practitioners.forEach((p) => console.log(`✔ Practitioner: ${p.email}`));

  // === SECRETARIES ===
  const secretaries = await Promise.all(
    SECRETARIES_DATA.map((s) =>
      prisma.user.upsert({
        where: { email: s.email },
        update: {},
        create: {
          ...s,
          passwordHash,
          role: Role.SECRETARY,
          preferredLanguage: 'fr',
        },
      }),
    ),
  );
  secretaries.forEach((s) => console.log(`✔ Secretary: ${s.email}`));

  const secretarySara = secretaries[0]!;

  // === PATIENTS ===
  const patients = await Promise.all(
    PATIENTS_DATA.map((p) =>
      prisma.patient.upsert({
        where: { phone: p.phone },
        update: {},
        create: {
          firstName: p.firstName,
          lastName: p.lastName,
          phone: p.phone,
          dateOfBirth: p.dateOfBirth,
          age: ageFromDob(p.dateOfBirth),
          gender: p.gender,
          governorate: p.governorate,
          primaryAddiction: p.primaryAddiction,
          preferredLanguage: p.preferredLanguage,
          acquisitionSource: ['instagram'],
          consents: {
            dataProtection: { accepted: true, timestamp: new Date().toISOString() },
            smsAuthorization: { accepted: true, timestamp: new Date().toISOString() },
            nonMedicalAcknowledgement: { accepted: true, timestamp: new Date().toISOString() },
          },
          createdById: secretarySara.id,
        },
      }),
    ),
  );
  patients.forEach((p) => console.log(`✔ Patient: ${p.firstName} ${p.lastName}`));

  // === APPOINTMENTS (20 RDV répartis sur 7 jours) ===
  let appointmentsCreated = 0;
  for (let i = 0; i < 20; i++) {
    const patient = patients[i % patients.length]!;
    const practitioner = practitioners[i % practitioners.length]!;
    const dayOffset = Math.floor(i / 3); // ~3 RDV/jour sur 7 jours
    const slotIndex = i % 9; // shift matin (9 créneaux)
    const scheduledAt = slotForDay(dayOffset, slotIndex);
    const isFirst = i < patients.length;
    const visitType: VisitType = isFirst ? 'FIRST' : 'FOLLOWUP';
    const price = isFirst
      ? PRICE_BY_SERVICE[patient.primaryAddiction].first
      : PRICE_BY_SERVICE[patient.primaryAddiction].followup;

    const existing = await prisma.appointment.findFirst({
      where: { patientId: patient.id, scheduledAt },
    });
    if (existing) continue;

    await prisma.appointment.create({
      data: {
        patientId: patient.id,
        practitionerId: practitioner.id,
        scheduledAt,
        service: patient.primaryAddiction,
        visitType,
        status: i < 5 ? AppointmentStatus.COMPLETED : AppointmentStatus.SCHEDULED,
        source: 'phone',
        price,
      },
    });
    appointmentsCreated++;
  }
  console.log(`✔ Appointments created: ${appointmentsCreated}`);

  console.log('🎉 Seed complete!');
  console.log(`\nLogin credentials (dev only):`);
  console.log(`  Admin       : direction@reset-egypt.com / ${PASSWORD_PLAIN}`);
  console.log(`  Practitioner: dr.reda@reset-egypt.com / ${PASSWORD_PLAIN}`);
  console.log(`  Secretary   : sara@reset-egypt.com / ${PASSWORD_PLAIN}`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Lancer le seed**

```powershell
pnpm --filter @reset/api prisma:seed
```
Expected: logs avec ✔ pour chaque entité créée, terminé par "🎉 Seed complete!" et les identifiants.

- [ ] **Step 3: Vérifier en BDD**

```powershell
docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "SELECT role, COUNT(*) FROM \"User\" GROUP BY role;"
```
Expected:
```
    role     | count
-------------+-------
 ADMIN       |     1
 PRACTITIONER|     2
 SECRETARY   |     2
```

```powershell
docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "SELECT COUNT(*) FROM \"Patient\";"
```
Expected: 5

```powershell
docker exec reset-postgres psql -U reset -d reset_egypt_dev -c "SELECT COUNT(*), status FROM \"Appointment\" GROUP BY status;"
```
Expected: 5 COMPLETED + 15 SCHEDULED (ou très proche, dépend des doublons skippés).

- [ ] **Step 4: Ouvrir Prisma Studio pour vérification visuelle**

```powershell
pnpm --filter @reset/api prisma:studio
```
Expected: ouvre http://localhost:5555. Naviguer dans User, Patient, Appointment — toutes les données présentes. Fermer (Ctrl+C).

- [ ] **Step 5: Commit**

```powershell
git add apps/api/prisma/seed.ts
git commit -m "feat(api): seed database with admin, practitioners, secretaries, patients, appointments"
```

**Acceptance:** `pnpm --filter @reset/api prisma:seed` se termine sans erreur. Postgres contient 5 users, 5 patients, ≥18 appointments.

---

### Task 8 : Package `ui` — design tokens + composants shadcn-style de base

**Files:**
- Create: `packages/ui/package.json`
- Create: `packages/ui/tsconfig.json`
- Create: `packages/ui/tailwind-preset.ts`
- Create: `packages/ui/src/index.ts`
- Create: `packages/ui/src/styles/tokens.css`
- Create: `packages/ui/src/lib/cn.ts`
- Create: `packages/ui/src/components/Button.tsx`
- Create: `packages/ui/src/components/Input.tsx`
- Create: `packages/ui/src/components/Card.tsx`
- Create: `packages/ui/src/components/Dialog.tsx`
- Create: `packages/ui/src/components/Toast.tsx`
- Create: `packages/ui/src/components/Avatar.tsx`
- Create: `packages/ui/src/components/Badge.tsx`
- Create: `packages/ui/src/components/Chip.tsx`

- [ ] **Step 1: Créer `packages/ui/package.json`**

```json
{
  "name": "@reset/ui",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": "./src/index.ts",
    "./styles/tokens.css": "./src/styles/tokens.css",
    "./tailwind-preset": "./tailwind-preset.ts"
  },
  "scripts": {
    "lint": "eslint src",
    "typecheck": "tsc --noEmit"
  },
  "peerDependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "dependencies": {
    "@radix-ui/react-avatar": "^1.0.4",
    "@radix-ui/react-dialog": "^1.0.5",
    "@radix-ui/react-toast": "^1.1.5",
    "@radix-ui/react-slot": "^1.0.2",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0"
  }
}
```

- [ ] **Step 2: Créer `packages/ui/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "jsx": "react-jsx",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": []
  },
  "include": ["src/**/*", "tailwind-preset.ts"]
}
```

- [ ] **Step 3: Créer `packages/ui/src/styles/tokens.css`**

```css
@layer base {
  :root {
    /* Reset Egypt palette */
    --primary: 29 158 117;
    --primary-dark: 15 110 86;
    --primary-light: 225 245 238;
    --primary-lightest: 242 250 246;

    --secondary: 83 74 183;
    --secondary-light: 238 237 254;

    --info: 24 95 165;
    --info-light: 230 241 251;
    --info-dark: 12 68 124;

    --warning: 186 117 23;
    --warning-light: 250 238 218;
    --warning-dark: 133 79 11;

    --danger: 226 75 74;
    --danger-light: 252 235 235;
    --danger-dark: 121 31 31;

    --pink: 212 83 126;
    --pink-light: 252 224 233;
    --pink-dark: 163 58 92;

    --bg: 250 250 247;
    --bg-secondary: 241 239 232;
    --surface: 255 255 255;

    --text: 44 44 42;
    --text-secondary: 95 94 90;
    --text-tertiary: 136 135 128;

    --border: 211 209 199;
    --border-light: 229 227 219;

    --radius-sm: 4px;
    --radius: 8px;
    --radius-lg: 12px;
  }
}

body {
  background: rgb(var(--bg));
  color: rgb(var(--text));
}
```

- [ ] **Step 4: Créer `packages/ui/tailwind-preset.ts`**

```typescript
import type { Config } from 'tailwindcss';

const preset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
          dark: 'rgb(var(--primary-dark) / <alpha-value>)',
          light: 'rgb(var(--primary-light) / <alpha-value>)',
          lightest: 'rgb(var(--primary-lightest) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'rgb(var(--secondary) / <alpha-value>)',
          light: 'rgb(var(--secondary-light) / <alpha-value>)',
        },
        info: {
          DEFAULT: 'rgb(var(--info) / <alpha-value>)',
          light: 'rgb(var(--info-light) / <alpha-value>)',
          dark: 'rgb(var(--info-dark) / <alpha-value>)',
        },
        warning: {
          DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
          light: 'rgb(var(--warning-light) / <alpha-value>)',
          dark: 'rgb(var(--warning-dark) / <alpha-value>)',
        },
        danger: {
          DEFAULT: 'rgb(var(--danger) / <alpha-value>)',
          light: 'rgb(var(--danger-light) / <alpha-value>)',
          dark: 'rgb(var(--danger-dark) / <alpha-value>)',
        },
        pink: {
          DEFAULT: 'rgb(var(--pink) / <alpha-value>)',
          light: 'rgb(var(--pink-light) / <alpha-value>)',
          dark: 'rgb(var(--pink-dark) / <alpha-value>)',
        },
        bg: {
          DEFAULT: 'rgb(var(--bg) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
        },
        surface: 'rgb(var(--surface) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--text) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--text-tertiary) / <alpha-value>)',
        },
        border: {
          DEFAULT: 'rgb(var(--border) / <alpha-value>)',
          light: 'rgb(var(--border-light) / <alpha-value>)',
        },
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        DEFAULT: 'var(--radius)',
        lg: 'var(--radius-lg)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        arabic: ['Cairo', 'sans-serif'],
      },
    },
  },
};

export default preset;
```

- [ ] **Step 5: Créer `packages/ui/src/lib/cn.ts`**

```typescript
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Créer `packages/ui/src/components/Button.tsx`**

```typescript
import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        primary: 'bg-primary text-white hover:bg-primary-dark',
        secondary: 'bg-bg-secondary text-text hover:bg-border-light',
        ghost: 'hover:bg-bg-secondary text-text',
        danger: 'bg-danger text-white hover:bg-danger-dark',
        outline: 'border border-border bg-surface hover:bg-bg-secondary',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = 'Button';
```

- [ ] **Step 7: Créer `packages/ui/src/components/Input.tsx`**

```typescript
import * as React from 'react';
import { cn } from '../lib/cn.js';

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        'flex h-10 w-full rounded border border-border bg-surface px-3 py-2 text-sm transition-colors',
        'placeholder:text-text-tertiary',
        'focus-visible:outline-none focus-visible:border-info focus-visible:ring-2 focus-visible:ring-info/20',
        'disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
```

- [ ] **Step 8: Créer `packages/ui/src/components/Card.tsx`**

```typescript
import * as React from 'react';
import { cn } from '../lib/cn.js';

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('rounded-lg border border-border bg-surface shadow-sm', className)}
      {...props}
    />
  ),
);
Card.displayName = 'Card';

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center justify-between p-4 border-b border-border', className)}
      {...props}
    />
  ),
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn('text-sm font-semibold text-text', className)} {...props} />
  ),
);
CardTitle.displayName = 'CardTitle';

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-4', className)} {...props} />
  ),
);
CardContent.displayName = 'CardContent';
```

- [ ] **Step 9: Créer `packages/ui/src/components/Dialog.tsx`**

```typescript
import * as React from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../lib/cn.js';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2',
        'w-full max-w-lg rounded-lg border border-border bg-surface p-6 shadow-lg',
        className,
      )}
      {...props}
    >
      {children}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn('text-lg font-semibold', className)} {...props} />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn('text-sm text-text-secondary', className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;
```

- [ ] **Step 10: Créer `packages/ui/src/components/Toast.tsx`**

```typescript
import * as React from 'react';
import * as ToastPrimitive from '@radix-ui/react-toast';
import { cn } from '../lib/cn.js';

export const ToastProvider = ToastPrimitive.Provider;
export const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      'fixed bottom-0 right-0 z-50 flex max-h-screen w-full flex-col-reverse p-4 gap-2 sm:max-w-[420px]',
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

export const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Root> & { variant?: 'default' | 'success' | 'error' }
>(({ className, variant = 'default', ...props }, ref) => {
  const variants = {
    default: 'bg-surface text-text border-border',
    success: 'bg-primary-light text-primary-dark border-primary',
    error: 'bg-danger-light text-danger-dark border-danger',
  };
  return (
    <ToastPrimitive.Root
      ref={ref}
      className={cn(
        'rounded-lg border p-4 shadow-md flex items-start gap-3 transition-all',
        variants[variant],
        className,
      )}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitive.Root.displayName;

export const ToastTitle = ToastPrimitive.Title;
export const ToastDescription = ToastPrimitive.Description;
export const ToastClose = ToastPrimitive.Close;
```

- [ ] **Step 11: Créer `packages/ui/src/components/Avatar.tsx`**

```typescript
import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../lib/cn.js';

export const Avatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn('relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full', className)}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

export const AvatarImage = AvatarPrimitive.Image;

export const AvatarFallback = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex h-full w-full items-center justify-center rounded-full bg-info-light text-info-dark text-xs font-semibold',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;
```

- [ ] **Step 12: Créer `packages/ui/src/components/Badge.tsx`**

```typescript
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../lib/cn.js';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-semibold',
  {
    variants: {
      variant: {
        default: 'bg-bg-secondary text-text',
        success: 'bg-primary-light text-primary-dark',
        warning: 'bg-warning-light text-warning-dark',
        danger: 'bg-danger-light text-danger-dark',
        info: 'bg-info-light text-info-dark',
        neutral: 'bg-border-light text-text-secondary',
      },
    },
    defaultVariants: { variant: 'default' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, className }))} {...props} />;
}
```

- [ ] **Step 13: Créer `packages/ui/src/components/Chip.tsx`**

```typescript
import * as React from 'react';
import { cn } from '../lib/cn.js';

export interface ChipProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  warn?: boolean;
}

export const Chip = React.forwardRef<HTMLButtonElement, ChipProps>(
  ({ className, active = false, warn = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active && 'bg-primary text-white border-primary',
        !active && !warn && 'bg-surface text-text border-border hover:bg-bg-secondary',
        warn && 'bg-warning-light text-warning-dark border-warning',
        className,
      )}
      {...props}
    />
  ),
);
Chip.displayName = 'Chip';
```

- [ ] **Step 14: Créer `packages/ui/src/index.ts`**

```typescript
export * from './components/Button.js';
export * from './components/Input.js';
export * from './components/Card.js';
export * from './components/Dialog.js';
export * from './components/Toast.js';
export * from './components/Avatar.js';
export * from './components/Badge.js';
export * from './components/Chip.js';
export { cn } from './lib/cn.js';
```

- [ ] **Step 15: Installer dépendances**

```powershell
pnpm install
```

- [ ] **Step 16: Typecheck**

```powershell
pnpm --filter @reset/ui typecheck
```
Expected: pas d'erreur.

- [ ] **Step 17: Commit**

```powershell
git add packages/ui/ pnpm-lock.yaml
git commit -m "feat(ui): add design tokens and base components (Button, Input, Card, Dialog, Toast, Avatar, Badge, Chip)"
```

**Acceptance:** `pnpm --filter @reset/ui typecheck` passe sans erreur.

---

### Task 9 : App `web` (staff portal) — Vite + React + Tailwind + i18n

**Files:**
- Create: `apps/web/package.json`
- Create: `apps/web/tsconfig.json`
- Create: `apps/web/tsconfig.node.json`
- Create: `apps/web/vite.config.ts`
- Create: `apps/web/tailwind.config.ts`
- Create: `apps/web/postcss.config.cjs`
- Create: `apps/web/index.html`
- Create: `apps/web/src/main.tsx`
- Create: `apps/web/src/App.tsx`
- Create: `apps/web/src/i18n/index.ts`
- Create: `apps/web/src/i18n/fr.json`
- Create: `apps/web/src/i18n/ar.json`
- Create: `apps/web/src/i18n/en.json`
- Create: `apps/web/src/styles/globals.css`
- Create: `apps/web/src/lib/query-client.ts`

- [ ] **Step 1: Créer `apps/web/package.json`**

```json
{
  "name": "@reset/web",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "@reset/shared": "workspace:*",
    "@reset/ui": "workspace:*",
    "@tanstack/react-query": "^5.32.0",
    "i18next": "^23.11.0",
    "i18next-browser-languagedetector": "^7.2.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-i18next": "^14.1.0",
    "react-router-dom": "^6.23.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: Créer `apps/web/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "allowImportingTsExtensions": false,
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Créer `apps/web/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Créer `apps/web/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
```

- [ ] **Step 5: Créer `apps/web/postcss.config.cjs`**

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Créer `apps/web/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';
import uiPreset from '@reset/ui/tailwind-preset';

const config: Config = {
  presets: [uiPreset as Config],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
```

- [ ] **Step 7: Créer `apps/web/index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Reset Egypt — Staff portal</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Créer `apps/web/src/styles/globals.css`**

```css
@import '@reset/ui/styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: theme('fontFamily.sans');
  }
  html[dir='rtl'] {
    font-family: theme('fontFamily.arabic');
  }
}
```

- [ ] **Step 9: Créer `apps/web/src/i18n/fr.json`**

```json
{
  "common": {
    "save": "Enregistrer",
    "cancel": "Annuler",
    "delete": "Supprimer",
    "edit": "Modifier",
    "loading": "Chargement…",
    "search": "Rechercher",
    "yes": "Oui",
    "no": "Non"
  },
  "app": {
    "title": "Reset Egypt",
    "subtitle": "Centre d'auriculothérapie laser",
    "tagline": "Application métier — Phase 1 (cadrage)"
  },
  "languages": {
    "fr": "Français",
    "ar": "العربية",
    "en": "English"
  }
}
```

- [ ] **Step 10: Créer `apps/web/src/i18n/ar.json`**

```json
{
  "common": {
    "save": "حفظ",
    "cancel": "إلغاء",
    "delete": "حذف",
    "edit": "تعديل",
    "loading": "جاري التحميل…",
    "search": "بحث",
    "yes": "نعم",
    "no": "لا"
  },
  "app": {
    "title": "ريسيت إيجيبت",
    "subtitle": "مركز العلاج بالليزر للأذن",
    "tagline": "تطبيق إدارة — المرحلة 1 (الإعداد)"
  },
  "languages": {
    "fr": "Français",
    "ar": "العربية",
    "en": "English"
  }
}
```

⚠️ **Note** : ces traductions arabes sont à faire valider par un locuteur natif avant production.

- [ ] **Step 11: Créer `apps/web/src/i18n/en.json`**

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel",
    "delete": "Delete",
    "edit": "Edit",
    "loading": "Loading…",
    "search": "Search",
    "yes": "Yes",
    "no": "No"
  },
  "app": {
    "title": "Reset Egypt",
    "subtitle": "Laser auriculotherapy center",
    "tagline": "Business app — Phase 1 (scaffolding)"
  },
  "languages": {
    "fr": "Français",
    "ar": "العربية",
    "en": "English"
  }
}
```

- [ ] **Step 12: Créer `apps/web/src/i18n/index.ts`**

```typescript
import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';
import fr from './fr.json';
import ar from './ar.json';
import en from './en.json';

const RTL_LANGUAGES = new Set(['ar']);

export const SUPPORTED_LANGUAGES = ['fr', 'ar', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      fr: { translation: fr },
      ar: { translation: ar },
      en: { translation: en },
    },
    fallbackLng: 'fr',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  });

i18n.on('languageChanged', (lng) => {
  document.documentElement.lang = lng;
  document.documentElement.dir = RTL_LANGUAGES.has(lng) ? 'rtl' : 'ltr';
});

if (RTL_LANGUAGES.has(i18n.language)) {
  document.documentElement.dir = 'rtl';
}
document.documentElement.lang = i18n.language;

export default i18n;
```

- [ ] **Step 13: Créer `apps/web/src/lib/query-client.ts`**

```typescript
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
```

- [ ] **Step 14: Créer `apps/web/src/App.tsx`**

```typescript
import { useTranslation } from 'react-i18next';
import { Button, Card, CardHeader, CardTitle, CardContent, Badge } from '@reset/ui';
import { SUPPORTED_LANGUAGES, type Language } from './i18n';

export function App() {
  const { t, i18n } = useTranslation();

  const switchLang = (lng: Language) => i18n.changeLanguage(lng);

  return (
    <div className="min-h-screen bg-bg p-8 max-w-3xl mx-auto space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-primary">{t('app.title')}</h1>
        <p className="text-text-secondary">{t('app.subtitle')}</p>
        <Badge variant="info">{t('app.tagline')}</Badge>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Langue / اللغة / Language</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 flex-wrap">
          {SUPPORTED_LANGUAGES.map((lng) => (
            <Button
              key={lng}
              variant={i18n.language === lng ? 'primary' : 'outline'}
              size="sm"
              onClick={() => switchLang(lng)}
            >
              {t(`languages.${lng}`)}
            </Button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API status</CardTitle>
        </CardHeader>
        <CardContent>
          <ApiStatus />
        </CardContent>
      </Card>
    </div>
  );
}

function ApiStatus() {
  const url = '/api/health';
  return (
    <div className="text-sm space-y-2">
      <p className="text-text-secondary">
        Vérification : <a href={url} target="_blank" rel="noreferrer" className="text-info underline">{url}</a>
      </p>
      <p className="text-text-tertiary">
        Ouvre ce lien — tu dois voir <code className="bg-bg-secondary px-1 rounded">{`{"status":"ok",...}`}</code>
      </p>
    </div>
  );
}
```

- [ ] **Step 15: Créer `apps/web/src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { queryClient } from './lib/query-client';
import './i18n';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
);
```

- [ ] **Step 16: Installer dépendances**

```powershell
pnpm install
```

- [ ] **Step 17: Démarrer l'app web**

```powershell
pnpm --filter @reset/web dev
```
Expected: "Local: http://localhost:3000/" dans le terminal.

- [ ] **Step 18: Smoke test dans le navigateur**

Ouvrir http://localhost:3000 dans Chrome/Firefox.

Vérifier :
- Le titre "Reset Egypt" apparaît en vert
- Le badge "Application métier — Phase 1 (cadrage)" apparaît
- Les 3 boutons de langue (Français / العربية / English)
- Cliquer "العربية" → la page passe en RTL, le texte change, la police passe à Cairo
- Cliquer "English" → retour LTR, texte anglais
- Cliquer le lien "/api/health" → ouvre `http://localhost:3000/api/health` qui est proxifié vers l'API et retourne le JSON

⚠️ **Si erreur 404 sur /api/health** : vérifier que l'API tourne (`pnpm --filter @reset/api dev` dans un autre terminal).

- [ ] **Step 19: Arrêter les serveurs (Ctrl+C dans chaque terminal)**

- [ ] **Step 20: Commit**

```powershell
git add apps/web/ pnpm-lock.yaml
git commit -m "feat(web): bootstrap react app with vite, tailwind, i18n (fr/ar/en + RTL), ui components"
```

**Acceptance:** http://localhost:3000 charge, switch FR/AR/EN fonctionne, RTL activé en AR, proxy `/api/*` vers l'API fonctionnel.

---

### Task 10 : App `booking` (réservation publique) — squelette minimal

**Files:**
- Create: `apps/booking/package.json`
- Create: `apps/booking/tsconfig.json`
- Create: `apps/booking/tsconfig.node.json`
- Create: `apps/booking/vite.config.ts`
- Create: `apps/booking/tailwind.config.ts`
- Create: `apps/booking/postcss.config.cjs`
- Create: `apps/booking/index.html`
- Create: `apps/booking/src/main.tsx`
- Create: `apps/booking/src/App.tsx`
- Create: `apps/booking/src/styles/globals.css`

- [ ] **Step 1: Créer `apps/booking/package.json`**

```json
{
  "name": "@reset/booking",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite --port 3002 --strictPort",
    "build": "tsc -b && vite build",
    "preview": "vite preview --port 3002",
    "lint": "eslint src",
    "typecheck": "tsc -b --noEmit"
  },
  "dependencies": {
    "@reset/shared": "workspace:*",
    "@reset/ui": "workspace:*",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.0",
    "typescript": "^5.4.0",
    "vite": "^5.2.0"
  }
}
```

- [ ] **Step 2: Créer `apps/booking/tsconfig.json`**

```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "noEmit": true,
    "types": ["vite/client"]
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

- [ ] **Step 3: Créer `apps/booking/tsconfig.node.json`**

```json
{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "allowSyntheticDefaultImports": true,
    "strict": true
  },
  "include": ["vite.config.ts"]
}
```

- [ ] **Step 4: Créer `apps/booking/vite.config.ts`**

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3002,
    strictPort: true,
  },
});
```

- [ ] **Step 5: Créer `apps/booking/postcss.config.cjs`** (idem apps/web)

```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

- [ ] **Step 6: Créer `apps/booking/tailwind.config.ts`**

```typescript
import type { Config } from 'tailwindcss';
import uiPreset from '@reset/ui/tailwind-preset';

const config: Config = {
  presets: [uiPreset as Config],
  content: ['./index.html', './src/**/*.{ts,tsx}', '../../packages/ui/src/**/*.{ts,tsx}'],
};

export default config;
```

- [ ] **Step 7: Créer `apps/booking/index.html`**

```html
<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Cairo:wght@400;500;600;700&display=swap" rel="stylesheet" />
    <title>Reset Egypt — Réservation</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 8: Créer `apps/booking/src/styles/globals.css`**

```css
@import '@reset/ui/styles/tokens.css';

@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 9: Créer `apps/booking/src/App.tsx`**

```typescript
import { Card, CardHeader, CardTitle, CardContent, Button } from '@reset/ui';

export function App() {
  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Reset Egypt — Réservation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-text-secondary">
            Cette page sera la borne de réservation publique (Module 7, Phase 7).
          </p>
          <p className="text-xs text-text-tertiary">
            Squelette Phase 1 — aucune fonctionnalité métier ici.
          </p>
          <Button variant="primary" disabled>
            Réserver une séance (bientôt)
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 10: Créer `apps/booking/src/main.tsx`**

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 11: Installer dépendances**

```powershell
pnpm install
```

- [ ] **Step 12: Démarrer l'app booking**

```powershell
pnpm --filter @reset/booking dev
```
Expected: "Local: http://localhost:3002/".

- [ ] **Step 13: Smoke test**

Ouvrir http://localhost:3002. Vérifier qu'on voit la carte "Reset Egypt — Réservation" centrée avec le bouton désactivé.

- [ ] **Step 14: Arrêter (Ctrl+C)**

- [ ] **Step 15: Commit**

```powershell
git add apps/booking/ pnpm-lock.yaml
git commit -m "feat(booking): bootstrap public booking app skeleton"
```

**Acceptance:** http://localhost:3002 charge avec une carte minimale.

---

### Task 11 : Pipeline turbo + scripts root + smoke test global

**Files:**
- Modify: `turbo.json` (ajuster outputs)
- Modify: `package.json` (root, scripts dev:all)
- Modify: `README.md` (instructions)

- [ ] **Step 1: Ajuster `turbo.json` pour inclure les sorties Vite/Prisma**

Remplacer le contenu de `turbo.json` par :

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local", "tsconfig.base.json"],
  "globalEnv": ["NODE_ENV", "DATABASE_URL", "REDIS_URL"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", "build/**", ".next/**", "!.next/cache/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true,
      "dependsOn": ["^build"]
    },
    "lint": {
      "outputs": []
    },
    "test": {
      "dependsOn": ["^build"],
      "outputs": ["coverage/**"],
      "inputs": ["src/**/*.ts", "src/**/*.tsx", "tests/**/*.ts", "prisma/seed.ts"]
    },
    "typecheck": {
      "dependsOn": ["^build"],
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

- [ ] **Step 2: Ajouter scripts root dans `package.json`**

Modifier le bloc `"scripts"` du `package.json` racine :

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev --parallel",
    "dev:api": "pnpm --filter @reset/api dev",
    "dev:web": "pnpm --filter @reset/web dev",
    "dev:booking": "pnpm --filter @reset/booking dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "typecheck": "turbo run typecheck",
    "format": "prettier --write \"**/*.{ts,tsx,js,jsx,json,md,yaml,yml}\"",
    "format:check": "prettier --check \"**/*.{ts,tsx,js,jsx,json,md,yaml,yml}\"",
    "db:up": "docker compose up -d postgres redis mailhog",
    "db:down": "docker compose down",
    "db:reset": "docker compose down -v && docker compose up -d postgres redis mailhog",
    "db:migrate": "pnpm --filter @reset/api prisma:migrate",
    "db:seed": "pnpm --filter @reset/api prisma:seed",
    "db:studio": "pnpm --filter @reset/api prisma:studio",
    "clean": "turbo run clean && rimraf node_modules"
  }
}
```

- [ ] **Step 3: Tester `pnpm dev` (parallel des 3 apps)**

S'assurer que Docker tourne et que l'API peut se connecter à la DB :
```powershell
pnpm db:up
Start-Sleep -Seconds 5
pnpm dev
```
Expected: 3 serveurs démarrent en parallèle :
- API sur http://localhost:3001
- Web sur http://localhost:3000
- Booking sur http://localhost:3002

⚠️ Si conflit de port, Ctrl+C et identifier le process qui bloque.

- [ ] **Step 4: Smoke test global dans le navigateur**

Onglet 1 : http://localhost:3000 → switch FR/AR/EN OK, clic sur lien /api/health → JSON OK
Onglet 2 : http://localhost:3002 → carte booking OK
Onglet 3 : http://localhost:3001/health → JSON `{status:"ok"}`
Onglet 4 : http://localhost:3001/health/deep → JSON `{status:"ok", checks:{database:"ok"}}`

- [ ] **Step 5: Arrêter tous les serveurs (Ctrl+C)**

- [ ] **Step 6: Mettre à jour le README**

Remplacer le contenu de `README.md` par :

```markdown
# Reset Egypt

Application web métier pour le centre d'auriculothérapie laser Reset Egypt (New Cairo).

Plateforme intégrée de gestion de cabinet : agenda multi-praticiens, dossier patient, fiche clinique multilingue (FR/AR/EN), encaissement conforme ETA, inbox unifiée WhatsApp/Instagram/Email, relances automatiques, statistiques direction.

## État du projet

🟢 **Phase 1 — Cadrage terminée** : monorepo + Docker + Prisma + seed + i18n + UI base.

Le document de spécifications complet vit dans [`docs/superpowers/specs/2026-05-11-reset-egypt-design.md`](docs/superpowers/specs/2026-05-11-reset-egypt-design.md).

## Démarrage rapide

### Pré-requis
- Node.js 20+
- pnpm 8+
- Docker Desktop running

### Installation

```powershell
# 1. Cloner et installer
pnpm install

# 2. Variables d'environnement
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env

# 3. Lancer Postgres + Redis + MailHog
pnpm db:up

# 4. Migrer la BDD + seed
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
- Prisma Studio : \`pnpm db:studio\` → http://localhost:5555

## Identifiants de dev (seed)

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | direction@reset-egypt.com | TempPass123! |
| Practitioner | dr.reda@reset-egypt.com | TempPass123! |
| Practitioner | dr.layla@reset-egypt.com | TempPass123! |
| Secretary | sara@reset-egypt.com | TempPass123! |
| Secretary | nora@reset-egypt.com | TempPass123! |

## Stack technique

- **Frontend** : React 18 + TypeScript + Vite + Tailwind CSS + shadcn/ui + react-i18next
- **Backend** : Node.js 20+ avec Fastify + TypeScript strict + Pino
- **Database** : PostgreSQL 16 + Prisma ORM
- **Cache/Queue** : Redis 7 + BullMQ (Phase 8)
- **Monorepo** : Turborepo + pnpm workspaces

## Structure

\`\`\`
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
\`\`\`

## Commandes utiles

| Commande | Effet |
|----------|-------|
| \`pnpm dev\` | Lance API + web + booking en parallèle |
| \`pnpm build\` | Build tous les workspaces |
| \`pnpm test\` | Lance tous les tests |
| \`pnpm typecheck\` | Vérification TypeScript |
| \`pnpm lint\` | Lint tous les workspaces |
| \`pnpm format\` | Format Prettier |
| \`pnpm db:up\` | Lance Docker (Postgres + Redis + MailHog) |
| \`pnpm db:down\` | Arrête Docker |
| \`pnpm db:reset\` | Reset complet de la DB (perd toutes les données) |
| \`pnpm db:migrate\` | Lance prisma migrate dev |
| \`pnpm db:seed\` | Réinjecte le seed |
| \`pnpm db:studio\` | Ouvre Prisma Studio |

## Documentation

- [Spécifications complètes](docs/superpowers/specs/2026-05-11-reset-egypt-design.md)
- [Plan d'implémentation Phase 1](docs/superpowers/plans/2026-05-11-phase-1-cadrage-plan.md)
- Phase suivante : Phase 2 (Infrastructure) — provisioning Hetzner, CI/CD, Sentry, backups

## Phases du projet

| Phase | Statut | Semaines |
|-------|--------|----------|
| 1 — Cadrage (monorepo, schema, seed, i18n, UI base) | ✅ Terminée | 1-2 |
| 2 — Infrastructure (Hetzner, Caddy, CI/CD, Sentry, backups) | ⏳ À venir | 3 |
| 3 — Auth + RBAC (Module 0a, 0b) | ⏳ À venir | 4 |
| 4 — RDV + Patient (Modules 1, 2, 3) | ⏳ À venir | 5-6 |
| 5 — Clinique + Dossier (Modules 4, 5) | ⏳ À venir | 7-8 |
| 6 — Encaissement + ETA (Module 6) | ⏳ À venir | 9 |
| 7 — Réservation (Module 7) | ⏳ À venir | 10 |
| 8 — Communications (Modules 9, 11) | ⏳ À venir | 11-12 |
| 9 — Stats + Agenda (Modules 8, 10, 12) | ⏳ À venir | 13 |
| 10 — Tests + Production | ⏳ À venir | 14 |
```

(échapper les backticks PowerShell dans le bloc commande)

- [ ] **Step 7: Commit**

```powershell
git add turbo.json package.json README.md
git commit -m "chore: add root dev scripts, db helpers, and update README with phase 1 instructions"
```

**Acceptance:** `pnpm dev` démarre les 3 apps. Les 4 URLs (web, api/health, booking, api/health/deep) répondent OK.

---

### Task 12 : Vérification globale Phase 1 et tag v0.1.0

**Files:** (aucun nouveau)

- [ ] **Step 1: Vérifier le typecheck global**

```powershell
pnpm typecheck
```
Expected: 5 packages typecheckent sans erreur (api, web, booking, shared, ui).

- [ ] **Step 2: Vérifier les tests**

```powershell
pnpm test
```
Expected: 2 tests passent (les 2 du health endpoint).

- [ ] **Step 3: Vérifier le format**

```powershell
pnpm format:check
```
Expected: tout est formaté. Si erreurs, lancer `pnpm format` pour corriger.

- [ ] **Step 4: Vérifier l'arrêt propre des conteneurs**

```powershell
docker compose down
docker compose ps
```
Expected: liste vide ou STATUS "Exited".

- [ ] **Step 5: Relancer la stack from scratch (smoke test final)**

```powershell
pnpm db:up
Start-Sleep -Seconds 8
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Ouvrir http://localhost:3000 → switch FR/AR/EN OK, lien API health OK.

Stopper (Ctrl+C) et `docker compose down`.

- [ ] **Step 6: Vérifier le `git status` est propre**

```powershell
git status
```
Expected: "nothing to commit, working tree clean".

- [ ] **Step 7: Tagger v0.1.0**

```powershell
git tag -a v0.1.0 -m "Phase 1 (Cadrage) complete: monorepo + docker + prisma + seed + i18n + ui base"
git log --oneline -20
```
Expected: liste des commits + tag v0.1.0 sur le HEAD.

- [ ] **Step 8: Checkpoint utilisateur**

🟡 **STOP — checkpoint humain.**

Montrer à l'utilisateur :
1. http://localhost:3000 (web) avec switch de langue
2. http://localhost:3001/health/deep (API + DB)
3. `pnpm db:studio` → Prisma Studio avec les données seed
4. `git log --oneline` → historique propre des commits Phase 1

Demander à l'utilisateur :
- ✅ "Tout fonctionne, je passe à la Phase 2 (Infrastructure)"
- 🔧 "Quelque chose à ajuster avant la Phase 2 ?"

**Acceptance Phase 1 globale:**
- [ ] `pnpm typecheck` passe pour les 5 packages
- [ ] `pnpm test` passe les 2 tests
- [ ] `pnpm format:check` passe
- [ ] `docker compose up -d` puis `pnpm dev` démarre tout
- [ ] http://localhost:3000 affiche la page d'accueil avec switch FR/AR/EN fonctionnel et RTL en AR
- [ ] http://localhost:3001/health/deep retourne `{status:"ok", checks:{database:"ok"}}`
- [ ] http://localhost:3002 affiche la carte booking minimale
- [ ] Prisma Studio (`pnpm db:studio`) montre : 5 users, 5 patients, ~20 appointments
- [ ] `git log --oneline` montre ~12 commits propres
- [ ] Tag `v0.1.0` posé sur le HEAD

---

## Risques techniques Windows-spécifiques

| Risque | Symptôme | Mitigation |
|--------|----------|------------|
| Symlinks pnpm bloqués | `EPERM` ou symlinks manquants | Activer le **Mode Développeur Windows** ou lancer PowerShell admin |
| Line endings (CRLF/LF) | Git affiche tout le fichier comme modifié | `.gitattributes` configuré en Task 0 + `core.autocrlf=input` |
| MAX_PATH (260 chars) | Erreur "filename too long" sur node_modules profonds | Activer Long Paths : `git config --global core.longpaths true` + dans Windows : Registre `LongPathsEnabled=1` |
| Docker Desktop WSL2 lent | I/O lente sur les volumes montés | Garder Docker volumes (postgres-data, redis-data) plutôt que des bind mounts |
| bcrypt natif fail | Erreur de compile au pnpm install | Utilisé bcryptjs (pure JS) — pas de compile native |
| pnpm + Windows hoist | Modules non trouvés bizarrement | `.npmrc` racine avec `shamefully-hoist=false` (par défaut) suffit ; ne pas hoister |
| Ports en conflit | EADDRINUSE | Task 0 step 2 vérifie les ports avant tout |
| Antivirus Windows | Lent sur node_modules | Exclure `C:\Users\wiinc\reset` de Windows Defender |

---

## Estimations de durée (référence)

| Task | Durée estimée (engineer expérimenté) |
|------|--------------------------------------|
| 0 — Env check + Git config | 10 min |
| 1 — Monorepo bootstrap | 25 min |
| 2 — Docker compose | 15 min |
| 3 — Shared package | 15 min |
| 4 — API skeleton | 45 min |
| 5 — Health test | 10 min |
| 6 — Prisma schema + migration | 30 min |
| 7 — Seed data | 35 min |
| 8 — UI components | 60 min |
| 9 — Web app | 60 min |
| 10 — Booking app | 20 min |
| 11 — Turbo pipeline + scripts | 20 min |
| 12 — Smoke test final + tag | 15 min |
| **Total** | **~6 heures** de dev pur |

(la spec prévoyait 2 semaines pour la Phase 1 — la marge couvre la résolution de bugs imprévus, les pauses, et l'apprentissage de nouvelles libs)

---

## Ce que la Phase 1 NE fait PAS (rappel)

- ❌ Authentification (login UI, JWT, sessions) → Phase 3
- ❌ Aucun module métier (RDV, fiches, etc.) → Phases 4-9
- ❌ Aucune intégration externe (WhatsApp, ETA, Twilio, S3) → Phases 6, 8
- ❌ Aucun déploiement production → Phase 2 + 10
- ❌ Aucune route métier dans l'API (juste /health) → Phases 3+
- ❌ Aucune E2E test → Phase 10
- ❌ Aucun monitoring (Sentry, logs prod) → Phase 2

Phase 1 produit un **squelette fonctionnel** prêt à recevoir les phases suivantes.
