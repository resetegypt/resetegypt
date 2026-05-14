# Messagerie praticien — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Donner au Dr Ahmad Al Ashry une vraie messagerie email (`ahmadalashry@reset-egypt.com`) intégrée dans l'app web RESET — réception, lecture, réponse, envoi, pièces jointes — privée (propriétaire + admin uniquement).

**Architecture:** Réception via un Cloudflare Email Worker qui parse l'email et le POST à un webhook API ; persistance dans des modèles Prisma dédiés (isolation de confidentialité vs le modèle `Message` d'équipe) ; envoi via Resend ; écran `/courrier` responsive dans `apps/web`. Pièces jointes dans Supabase Storage.

**Tech Stack:** Fastify + Prisma 5 + Postgres (Supabase), Zod, Resend, Cloudflare Email Workers + `postal-mime`, React 18 + Vite + React Query + Zustand, Tailwind, `@supabase/supabase-js`.

**Spec source:** `docs/superpowers/specs/2026-05-14-practitioner-mailbox-design.md`

**Prérequis d'environnement pour exécuter ce plan :**
- Base de données joignable (`DATABASE_URL` + `DIRECT_URL` dans `apps/api/.env`). En local : `pnpm db:up` (docker-compose : postgres).
- `pnpm install` à jour à la racine.
- Les tests `apps/api` (`vitest`) tournent contre cette DB — c'est le pattern existant (`src/routes/health.test.ts`).

**Écart assumé vs spec §6.1 :** la spec listait un endpoint séparé `POST /practitioner-mail/attachments`. Pour le v1, les pièces jointes sortantes sont envoyées **inline en base64** dans le corps de `POST /practitioner-mail/send` (limite de corps relevée à 30 MB sur cette route). Cela supprime le problème œuf-poule (attachment sans email parent) et une dépendance multipart. Téléchargement et PJ entrantes restent comme spécifiés.

**Écart assumé vs spec §11 (tests frontend) :** `apps/web` n'a aucun framework de test (pas de vitest/jest/testing-library — cf. `apps/web/package.json`). Introduire un framework de test serait du hors-périmètre. La vérification frontend se fait donc par `typecheck` + `build` + revue visuelle. Toute la couverture TDD porte sur le backend (où réside la logique à risque : threading, contrôle d'accès, validation webhook, parsing) et sur la fonction pure du Worker.

---

## Phase 0 — Données & types partagés

### Task 1: Schéma Prisma + migration

**Files:**
- Modify: `apps/api/prisma/schema.prisma` (ajout de modèles + relations sur `User` et `Patient`)

- [ ] **Step 1: Ajouter les 4 modèles + l'enum à la fin de `apps/api/prisma/schema.prisma`**

Ajouter à la fin du fichier :

```prisma
// === Messagerie praticien ===================================================
// Boîte email privée d'un praticien (1 par user ayant une adresse @reset-egypt.com).
// Modèles SÉPARÉS du modèle Message (Inbox d'équipe) : isolation structurelle de
// la confidentialité — la correspondance médicale du médecin ne peut jamais fuiter
// vers l'Inbox d'équipe accessible à la secrétaire.
model Mailbox {
  id          String   @id @default(uuid())
  userId      String   @unique
  user        User     @relation(fields: [userId], references: [id])
  address     String   @unique          // "ahmadalashry@reset-egypt.com"
  displayName String                    // "Dr Ahmad Al Ashry"
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  threads EmailThread[]
  emails  EmailMessage[]
}

// Fil de discussion : regroupe les emails d'une même conversation.
model EmailThread {
  id           String   @id @default(uuid())
  mailboxId    String
  mailbox      Mailbox  @relation(fields: [mailboxId], references: [id], onDelete: Cascade)
  subject      String
  participants String[]                 // emails des interlocuteurs (hors mailbox)
  patientId    String?                  // lié si un interlocuteur est un patient connu
  patient      Patient? @relation(fields: [patientId], references: [id])
  lastEmailAt  DateTime
  unreadCount  Int      @default(0)
  isArchived   Boolean  @default(false)
  isStarred    Boolean  @default(false)
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  emails EmailMessage[]

  @@index([mailboxId, isArchived, lastEmailAt])
  @@index([mailboxId, isStarred])
  @@index([patientId])
}

// Email individuel (entrant ou sortant).
model EmailMessage {
  id           String      @id @default(uuid())
  mailboxId    String
  mailbox      Mailbox     @relation(fields: [mailboxId], references: [id], onDelete: Cascade)
  threadId     String
  thread       EmailThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  direction    Direction                // INBOUND | OUTBOUND (enum existant réutilisé)
  messageId    String      @unique       // header Message-ID RFC822
  inReplyTo    String?                  // header In-Reply-To
  references   String[]    @default([]) // header References
  fromAddress  String
  fromName     String?
  toAddresses  String[]
  ccAddresses  String[]    @default([])
  subject      String
  bodyText     String?     @db.Text
  bodyHtml     String?     @db.Text
  snippet      String                   // ~140 premiers caractères, pour la liste
  status       EmailStatus @default(RECEIVED)
  isRead       Boolean     @default(false)
  sentByUserId String?                  // qui a envoyé (OUTBOUND) — null pour INBOUND
  sentByUser   User?       @relation("EmailSentBy", fields: [sentByUserId], references: [id])
  sentAt       DateTime                 // date d'envoi (OUTBOUND) ou de réception (INBOUND)
  createdAt    DateTime    @default(now())

  attachments EmailAttachment[]

  @@index([threadId, sentAt])
  @@index([mailboxId, isRead])
  @@index([messageId])
}

// Pièce jointe : métadonnées en base, fichier dans Supabase Storage.
model EmailAttachment {
  id          String       @id @default(uuid())
  emailId     String
  email       EmailMessage @relation(fields: [emailId], references: [id], onDelete: Cascade)
  filename    String
  contentType String
  sizeBytes   Int
  storageKey  String                    // clé Supabase Storage : {mailboxId}/{emailId}/{filename}
  createdAt   DateTime     @default(now())

  @@index([emailId])
}

enum EmailStatus {
  RECEIVED      // email entrant reçu
  SENDING       // envoi en cours
  SENT          // envoyé avec succès
  FAILED        // échec d'envoi
}
```

- [ ] **Step 2: Ajouter les relations inverses sur `User` et `Patient`**

Dans le modèle `User` (après la ligne `scoreSnapshots ScoreSnapshot[] @relation("ScoreSnapshotTakenBy")`), ajouter :

```prisma
  mailbox    Mailbox?
  sentEmails EmailMessage[] @relation("EmailSentBy")
```

Dans le modèle `Patient` (après la ligne `scoreSnapshots ScoreSnapshot[]`), ajouter :

```prisma
  emailThreads EmailThread[]
```

- [ ] **Step 3: Générer et appliquer la migration**

Run: `pnpm --filter @reset/api exec prisma migrate dev --name practitioner_mailbox`
Expected: une migration créée dans `apps/api/prisma/migrations/<timestamp>_practitioner_mailbox/`, appliquée à la DB, et `prisma generate` exécuté automatiquement (« ✔ Generated Prisma Client »).

- [ ] **Step 4: Vérifier que le client Prisma typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations
git commit -m "feat(mailbox): modèles Prisma messagerie praticien + migration"
```

---

### Task 2: Enum partagé `EmailStatus`

**Files:**
- Modify: `packages/shared/src/enums.ts` (ajout en fin de fichier)

- [ ] **Step 1: Ajouter l'enum et le type**

À la fin de `packages/shared/src/enums.ts`, ajouter :

```ts
export const EMAIL_STATUSES = ['RECEIVED', 'SENDING', 'SENT', 'FAILED'] as const;
export type EmailStatus = (typeof EMAIL_STATUSES)[number];
```

(`packages/shared/src/index.ts` fait déjà `export * from './enums.js'` — pas de modif nécessaire.)

- [ ] **Step 2: Vérifier le typecheck du package**

Run: `pnpm --filter @reset/shared typecheck`
Expected: aucune erreur. (Si le script n'existe pas, lancer `pnpm --filter @reset/shared exec tsc --noEmit`.)

- [ ] **Step 3: Commit**

```bash
git add packages/shared/src/enums.ts
git commit -m "feat(shared): enum EmailStatus"
```

---

## Phase 1 — Fondations backend

### Task 3: Variables d'environnement + setup vitest

**Files:**
- Modify: `apps/api/src/env.ts:13-20`
- Modify: `.env.example:28-33`
- Create: `apps/api/vitest.setup.ts`
- Modify: `apps/api/vitest.config.ts:4-13`

- [ ] **Step 1: Ajouter les variables au schéma `env.ts`**

Dans `apps/api/src/env.ts`, dans l'objet `envSchema`, après la ligne `SMTP_FROM: ...` (ligne 17), ajouter :

```ts
  // Messagerie praticien
  INBOUND_EMAIL_SECRET: z.string().optional(), // secret partagé du webhook /inbound/email
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_SERVICE_KEY: z.string().optional(),
```

- [ ] **Step 2: Documenter les variables dans `.env.example`**

Dans `.env.example`, après la ligne `SMTP_FROM="Reset Egypt <noreply@reset-egypt.com>"` (ligne 33), ajouter :

```bash

# ====================== MESSAGERIE PRATICIEN ======================
# Secret partagé entre le Cloudflare Email Worker et le webhook /inbound/email.
# Génère avec : openssl rand -base64 32
INBOUND_EMAIL_SECRET=change-me-generate-with-openssl-rand-base64-32
# Supabase Storage pour les pièces jointes (bucket privé "email-attachments")
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxx...
```

- [ ] **Step 3: Créer le fichier de setup vitest**

Create `apps/api/vitest.setup.ts`:

```ts
// Variables d'environnement nécessaires aux tests, fixées AVANT le chargement
// de src/env.ts (qui parse process.env une seule fois à l'import).
process.env.INBOUND_EMAIL_SECRET ??= 'test-inbound-secret';
```

- [ ] **Step 4: Référencer le setup dans `vitest.config.ts`**

Dans `apps/api/vitest.config.ts`, dans l'objet `test`, après la ligne `environment: 'node',`, ajouter :

```ts
    setupFiles: ['./vitest.setup.ts'],
```

- [ ] **Step 5: Vérifier que les tests existants passent toujours**

Run: `pnpm --filter @reset/api test src/routes/health.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/env.ts .env.example apps/api/vitest.setup.ts apps/api/vitest.config.ts
git commit -m "feat(mailbox): variables d'env webhook + Supabase Storage + setup vitest"
```

---

### Task 4: Étendre `lib/email.ts` (from / replyTo / headers / cc)

**Files:**
- Modify: `apps/api/src/lib/email.ts:41-47` (interface) et `:57-106` (fonction)

- [ ] **Step 1: Étendre l'interface `EmailMessage`**

Dans `apps/api/src/lib/email.ts`, remplacer l'interface `EmailMessage` (lignes 41-47) par :

```ts
export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text?: string;
  /** Expéditeur. Défaut : env.SMTP_FROM. Format : "Nom <email@domaine>". */
  from?: string;
  /** Adresse de réponse (Reply-To). */
  replyTo?: string;
  /** Destinataires en copie. */
  cc?: string[];
  /** Headers RFC822 supplémentaires (ex: In-Reply-To, References, Message-ID). */
  headers?: Record<string, string>;
  attachments?: Array<{ filename: string; content: string | Buffer; contentType?: string }>;
}
```

- [ ] **Step 2: Utiliser les nouveaux champs dans la branche Resend**

Dans `sendEmail`, remplacer l'appel `resend.emails.send({...})` (lignes 62-72) par :

```ts
      const result = await resend.emails.send({
        from: msg.from ?? env.SMTP_FROM,
        to: msg.to,
        cc: msg.cc,
        replyTo: msg.replyTo,
        headers: msg.headers,
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        attachments: msg.attachments?.map((a) => ({
          filename: a.filename,
          content: typeof a.content === 'string' ? Buffer.from(a.content) : a.content,
        })),
      });
```

- [ ] **Step 3: Utiliser les nouveaux champs dans la branche SMTP**

Dans `sendEmail`, remplacer l'appel `transporter.sendMail({...})` (lignes 92-99) par :

```ts
    const info = await transporter.sendMail({
      from: msg.from ?? env.SMTP_FROM,
      to: msg.to,
      cc: msg.cc,
      replyTo: msg.replyTo,
      headers: msg.headers,
      subject: msg.subject,
      html: msg.html,
      text: msg.text,
      attachments: msg.attachments,
    });
```

- [ ] **Step 4: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/lib/email.ts
git commit -m "feat(email): support from/replyTo/cc/headers personnalisés"
```

---

### Task 5: Helper Supabase Storage

**Files:**
- Create: `apps/api/src/lib/mail-storage.ts`
- Modify: `apps/api/package.json` (dépendance)

- [ ] **Step 1: Installer `@supabase/supabase-js`**

Run: `pnpm --filter @reset/api add @supabase/supabase-js`
Expected: le package est ajouté à `apps/api/package.json`.

- [ ] **Step 2: Créer le helper de stockage**

Create `apps/api/src/lib/mail-storage.ts`:

```ts
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '../env.js';

const BUCKET = 'email-attachments';

let client: SupabaseClient | null = null;

/** Retourne le client Supabase, ou null si non configuré. */
function getClient(): SupabaseClient | null {
  if (client) return client;
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_KEY) return null;
  client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
  return client;
}

export class StorageNotConfiguredError extends Error {
  constructor() {
    super('Supabase Storage non configuré (SUPABASE_URL / SUPABASE_SERVICE_KEY manquants)');
    this.name = 'StorageNotConfiguredError';
  }
}

/** Construit la clé de stockage d'une pièce jointe. */
export function attachmentKey(mailboxId: string, emailId: string, filename: string): string {
  const safe = filename.replace(/[^\w.\-]/g, '_');
  return `${mailboxId}/${emailId}/${safe}`;
}

/** Upload une pièce jointe dans le bucket privé. Throw si le stockage n'est pas configuré. */
export async function uploadAttachment(
  key: string,
  content: Buffer,
  contentType: string,
): Promise<void> {
  const sb = getClient();
  if (!sb) throw new StorageNotConfiguredError();
  const { error } = await sb.storage.from(BUCKET).upload(key, content, {
    contentType,
    upsert: true,
  });
  if (error) throw new Error(`Échec upload pièce jointe : ${error.message}`);
}

/** Génère une URL signée de courte durée pour télécharger une pièce jointe. */
export async function signedAttachmentUrl(key: string, expiresInSec = 300): Promise<string> {
  const sb = getClient();
  if (!sb) throw new StorageNotConfiguredError();
  const { data, error } = await sb.storage.from(BUCKET).createSignedUrl(key, expiresInSec);
  if (error || !data) throw new Error(`Échec URL signée : ${error?.message ?? 'inconnu'}`);
  return data.signedUrl;
}
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/lib/mail-storage.ts apps/api/package.json pnpm-lock.yaml
git commit -m "feat(mailbox): helper Supabase Storage pour les pièces jointes"
```

> **Note rollout :** créer le bucket privé `email-attachments` dans le dashboard Supabase (Storage → New bucket → décocher "Public"). Sans bucket, l'upload échoue à l'exécution mais ne casse pas le boot.

---

## Phase 2 — Logique pure backend (TDD)

### Task 6: `webhook-auth.ts` — comparaison de secret en temps constant

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/webhook-auth.ts`
- Test: `apps/api/src/modules/practitioner-mail/webhook-auth.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `apps/api/src/modules/practitioner-mail/webhook-auth.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { secretMatches } from './webhook-auth.js';

describe('secretMatches', () => {
  it('retourne true pour deux secrets identiques', () => {
    expect(secretMatches('abc123', 'abc123')).toBe(true);
  });

  it('retourne false pour des secrets différents', () => {
    expect(secretMatches('abc123', 'xyz789')).toBe(false);
  });

  it('retourne false si le secret fourni est undefined', () => {
    expect(secretMatches(undefined, 'abc123')).toBe(false);
  });

  it('retourne false si les longueurs diffèrent', () => {
    expect(secretMatches('abc', 'abc123')).toBe(false);
  });

  it('retourne false si le secret attendu est vide', () => {
    expect(secretMatches('abc', '')).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/webhook-auth.test.ts`
Expected: FAIL — « Failed to resolve import "./webhook-auth.js" ».

- [ ] **Step 3: Écrire l'implémentation**

Create `apps/api/src/modules/practitioner-mail/webhook-auth.ts`:

```ts
import { timingSafeEqual } from 'node:crypto';

/**
 * Compare le secret fourni par le webhook au secret attendu, en temps constant.
 * Retourne false si l'un est vide ou si les longueurs diffèrent.
 */
export function secretMatches(provided: string | undefined, expected: string): boolean {
  if (!provided || !expected) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/webhook-auth.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/webhook-auth.ts apps/api/src/modules/practitioner-mail/webhook-auth.test.ts
git commit -m "feat(mailbox): comparaison de secret webhook en temps constant"
```

---

### Task 7: `threading.ts` — extraction des références de thread

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/threading.ts`
- Test: `apps/api/src/modules/practitioner-mail/threading.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `apps/api/src/modules/practitioner-mail/threading.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { extractThreadingRefs } from './threading.js';

describe('extractThreadingRefs', () => {
  it('retourne un tableau vide sans inReplyTo ni references', () => {
    expect(extractThreadingRefs(null, null)).toEqual([]);
    expect(extractThreadingRefs(undefined, undefined)).toEqual([]);
  });

  it('inclut le inReplyTo en premier', () => {
    expect(extractThreadingRefs('<a@x>', [])).toEqual(['<a@x>']);
  });

  it('inclut les references', () => {
    expect(extractThreadingRefs(null, ['<a@x>', '<b@x>'])).toEqual(['<a@x>', '<b@x>']);
  });

  it('combine inReplyTo et references et déduplique en gardant l ordre', () => {
    expect(extractThreadingRefs('<b@x>', ['<a@x>', '<b@x>'])).toEqual(['<b@x>', '<a@x>']);
  });

  it('ignore les entrées vides et trim les espaces', () => {
    expect(extractThreadingRefs('  <a@x>  ', ['', '  ', '<b@x>'])).toEqual(['<a@x>', '<b@x>']);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/threading.test.ts`
Expected: FAIL — import non résolu.

- [ ] **Step 3: Écrire l'implémentation**

Create `apps/api/src/modules/practitioner-mail/threading.ts`:

```ts
/**
 * Extrait les Message-IDs candidats pour rattacher un email entrant à un thread
 * existant. In-Reply-To en priorité, puis les References. Trim + déduplication
 * en conservant l'ordre.
 */
export function extractThreadingRefs(
  inReplyTo: string | null | undefined,
  references: string[] | null | undefined,
): string[] {
  const ids: string[] = [];
  if (inReplyTo && inReplyTo.trim()) ids.push(inReplyTo.trim());
  if (references) {
    for (const r of references) {
      const t = (r ?? '').trim();
      if (t) ids.push(t);
    }
  }
  return [...new Set(ids)];
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/threading.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/threading.ts apps/api/src/modules/practitioner-mail/threading.test.ts
git commit -m "feat(mailbox): extraction des références de threading"
```

---

### Task 8: `mail-snippet.ts` — génération d'aperçu

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/mail-snippet.ts`
- Test: `apps/api/src/modules/practitioner-mail/mail-snippet.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `apps/api/src/modules/practitioner-mail/mail-snippet.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildSnippet } from './mail-snippet.js';

describe('buildSnippet', () => {
  it('utilise le texte brut quand il est présent', () => {
    expect(buildSnippet('Bonjour docteur', '<p>ignoré</p>')).toBe('Bonjour docteur');
  });

  it('déshtmlise le HTML quand le texte brut est absent', () => {
    expect(buildSnippet(null, '<p>Bonjour <b>docteur</b></p>')).toBe('Bonjour docteur');
  });

  it('normalise les espaces multiples', () => {
    expect(buildSnippet('a\n\n  b   c', null)).toBe('a b c');
  });

  it('tronque à 140 caractères avec une ellipse', () => {
    const long = 'x'.repeat(200);
    const out = buildSnippet(long, null);
    expect(out.length).toBe(140);
    expect(out.endsWith('…')).toBe(true);
  });

  it('retourne une chaîne vide sans contenu', () => {
    expect(buildSnippet(null, null)).toBe('');
    expect(buildSnippet('', '')).toBe('');
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/mail-snippet.test.ts`
Expected: FAIL — import non résolu.

- [ ] **Step 3: Écrire l'implémentation**

Create `apps/api/src/modules/practitioner-mail/mail-snippet.ts`:

```ts
/**
 * Construit un aperçu court (max 140 caractères) d'un email, pour la liste des
 * threads. Préfère le texte brut ; à défaut, déshtmlise grossièrement le HTML.
 */
export function buildSnippet(
  bodyText?: string | null,
  bodyHtml?: string | null,
): string {
  let raw = (bodyText ?? '').trim();
  if (!raw && bodyHtml) {
    raw = bodyHtml.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
  }
  raw = raw.replace(/\s+/g, ' ').trim();
  return raw.length > 140 ? raw.slice(0, 139) + '…' : raw;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/mail-snippet.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/mail-snippet.ts apps/api/src/modules/practitioner-mail/mail-snippet.test.ts
git commit -m "feat(mailbox): génération d'aperçu d'email"
```

---

### Task 9: `mail-access.ts` — contrôle d'accès à la mailbox

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/mail-access.ts`
- Test: `apps/api/src/modules/practitioner-mail/mail-access.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `apps/api/src/modules/practitioner-mail/mail-access.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { canAccessMailbox } from './mail-access.js';
import type { JWTPayload } from '../../plugins/auth.js';

function user(role: JWTPayload['role'], sub: string): JWTPayload {
  return { sub, email: `${sub}@x`, role, firstName: 'F', lastName: 'L' };
}

describe('canAccessMailbox', () => {
  const mailbox = { userId: 'u-ahmad' };

  it('autorise le propriétaire de la mailbox', () => {
    expect(canAccessMailbox(user('PRACTITIONER', 'u-ahmad'), mailbox)).toBe(true);
  });

  it('autorise un ADMIN même non-propriétaire', () => {
    expect(canAccessMailbox(user('ADMIN', 'u-admin'), mailbox)).toBe(true);
  });

  it('refuse une SECRETARY', () => {
    expect(canAccessMailbox(user('SECRETARY', 'u-sec'), mailbox)).toBe(false);
  });

  it('refuse un autre praticien', () => {
    expect(canAccessMailbox(user('PRACTITIONER', 'u-autre'), mailbox)).toBe(false);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/mail-access.test.ts`
Expected: FAIL — import non résolu.

- [ ] **Step 3: Écrire l'implémentation**

Create `apps/api/src/modules/practitioner-mail/mail-access.ts`:

```ts
import type { JWTPayload } from '../../plugins/auth.js';

export interface MailboxOwnerRef {
  userId: string;
}

/**
 * Un utilisateur peut accéder à une mailbox s'il en est le propriétaire OU s'il
 * est ADMIN. La secrétaire et les autres praticiens n'ont jamais accès — la
 * confidentialité de la correspondance médicale en dépend.
 */
export function canAccessMailbox(user: JWTPayload, mailbox: MailboxOwnerRef): boolean {
  if (user.role === 'ADMIN') return true;
  return user.sub === mailbox.userId;
}
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/mail-access.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/mail-access.ts apps/api/src/modules/practitioner-mail/mail-access.test.ts
git commit -m "feat(mailbox): contrôle d'accès à la mailbox (propriétaire ou admin)"
```

---

### Task 10: `inbound-schema.ts` — schéma Zod du payload webhook

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/inbound-schema.ts`
- Test: `apps/api/src/modules/practitioner-mail/inbound-schema.test.ts`

- [ ] **Step 1: Écrire le test qui échoue**

Create `apps/api/src/modules/practitioner-mail/inbound-schema.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { inboundEmailSchema } from './inbound-schema.js';

const valid = {
  to: 'ahmadalashry@reset-egypt.com',
  from: 'patient@gmail.com',
  fromName: 'Un Patient',
  subject: 'Question',
  messageId: '<msg-1@gmail.com>',
  inReplyTo: null,
  references: [],
  bodyText: 'Bonjour',
  bodyHtml: null,
  attachments: [],
};

describe('inboundEmailSchema', () => {
  it('valide un payload complet', () => {
    const r = inboundEmailSchema.safeParse(valid);
    expect(r.success).toBe(true);
  });

  it('rejette une adresse to invalide', () => {
    const r = inboundEmailSchema.safeParse({ ...valid, to: 'pas-un-email' });
    expect(r.success).toBe(false);
  });

  it('rejette un messageId vide', () => {
    const r = inboundEmailSchema.safeParse({ ...valid, messageId: '' });
    expect(r.success).toBe(false);
  });

  it('applique les défauts (subject, references, attachments)', () => {
    const r = inboundEmailSchema.safeParse({
      to: 'ahmadalashry@reset-egypt.com',
      from: 'patient@gmail.com',
      messageId: '<msg-2@gmail.com>',
    });
    expect(r.success).toBe(true);
    if (r.success) {
      expect(r.data.subject).toBe('(sans objet)');
      expect(r.data.references).toEqual([]);
      expect(r.data.attachments).toEqual([]);
    }
  });

  it('valide une pièce jointe', () => {
    const r = inboundEmailSchema.safeParse({
      ...valid,
      attachments: [
        { filename: 'doc.pdf', contentType: 'application/pdf', sizeBytes: 1024, contentBase64: 'AAAA' },
      ],
    });
    expect(r.success).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/inbound-schema.test.ts`
Expected: FAIL — import non résolu.

- [ ] **Step 3: Écrire l'implémentation**

Create `apps/api/src/modules/practitioner-mail/inbound-schema.ts`:

```ts
import { z } from 'zod';

export const inboundAttachmentSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  sizeBytes: z.number().int().nonnegative(),
  contentBase64: z.string(),
});

/** Payload envoyé par le Cloudflare Email Worker au webhook /inbound/email. */
export const inboundEmailSchema = z.object({
  to: z.string().email(),
  from: z.string().email(),
  fromName: z.string().nullable().optional(),
  subject: z.string().default('(sans objet)'),
  messageId: z.string().min(1),
  inReplyTo: z.string().nullable().optional(),
  references: z.array(z.string()).default([]),
  bodyText: z.string().nullable().optional(),
  bodyHtml: z.string().nullable().optional(),
  attachments: z.array(inboundAttachmentSchema).default([]),
});

export type InboundEmailPayload = z.infer<typeof inboundEmailSchema>;
export type InboundAttachment = z.infer<typeof inboundAttachmentSchema>;
```

- [ ] **Step 4: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/inbound-schema.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/inbound-schema.ts apps/api/src/modules/practitioner-mail/inbound-schema.test.ts
git commit -m "feat(mailbox): schéma Zod du payload webhook inbound"
```

---

## Phase 3 — Webhook inbound

### Task 11: Route `POST /inbound/email`

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/inbound.routes.ts`
- Modify: `apps/api/src/routes/index.ts:1-28`

- [ ] **Step 1: Écrire le module de route webhook**

Create `apps/api/src/modules/practitioner-mail/inbound.routes.ts`:

```ts
import type { FastifyInstance } from 'fastify';
import { env } from '../../env.js';
import { secretMatches } from './webhook-auth.js';
import { inboundEmailSchema, type InboundEmailPayload } from './inbound-schema.js';
import { extractThreadingRefs } from './threading.js';
import { buildSnippet } from './mail-snippet.js';
import { uploadAttachment, attachmentKey } from '../../lib/mail-storage.js';

const THIRTY_MB = 30 * 1024 * 1024;

export async function inboundRoutes(app: FastifyInstance): Promise<void> {
  // Route NON authentifiée par JWT : machine-à-machine, protégée par secret partagé.
  app.post('/inbound/email', { bodyLimit: THIRTY_MB }, async (req, reply) => {
    // 1. Fail-closed : si le secret n'est pas configuré, on rejette tout.
    if (!env.INBOUND_EMAIL_SECRET) {
      return reply.status(503).send({ error: 'WebhookNotConfigured' });
    }
    const provided = req.headers['x-webhook-secret'];
    if (typeof provided !== 'string' || !secretMatches(provided, env.INBOUND_EMAIL_SECRET)) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }

    // 2. Valider le payload.
    const parsed = inboundEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
    }
    const d: InboundEmailPayload = parsed.data;

    // 3. Trouver la mailbox destinataire.
    const mailbox = await app.prisma.mailbox.findUnique({
      where: { address: d.to.toLowerCase() },
    });
    if (!mailbox || !mailbox.isActive) {
      app.log.warn({ to: d.to }, 'inbound email pour une mailbox inconnue/inactive');
      return reply.status(404).send({ error: 'MailboxNotFound' });
    }

    // 4. Idempotence : si ce messageId existe déjà, no-op.
    const existing = await app.prisma.emailMessage.findUnique({
      where: { messageId: d.messageId },
    });
    if (existing) {
      return reply.status(200).send({ ok: true, deduplicated: true });
    }

    // 5. Threading : rattacher à un thread existant ou en créer un.
    const refs = extractThreadingRefs(d.inReplyTo, d.references);
    let threadId: string | null = null;
    if (refs.length > 0) {
      const refMsg = await app.prisma.emailMessage.findFirst({
        where: { mailboxId: mailbox.id, messageId: { in: refs } },
        select: { threadId: true },
      });
      if (refMsg) threadId = refMsg.threadId;
    }

    // 6. Liaison patient : si l'expéditeur correspond à un patient connu.
    const patient = await app.prisma.patient.findFirst({
      where: { email: { equals: d.from, mode: 'insensitive' } },
      select: { id: true },
    });

    const now = new Date();
    const snippet = buildSnippet(d.bodyText, d.bodyHtml);

    if (!threadId) {
      const thread = await app.prisma.emailThread.create({
        data: {
          mailboxId: mailbox.id,
          subject: d.subject,
          participants: [d.from.toLowerCase()],
          patientId: patient?.id ?? null,
          lastEmailAt: now,
          unreadCount: 1,
        },
      });
      threadId = thread.id;
    } else {
      const thread = await app.prisma.emailThread.findUnique({ where: { id: threadId } });
      const participants = new Set(thread?.participants ?? []);
      participants.add(d.from.toLowerCase());
      await app.prisma.emailThread.update({
        where: { id: threadId },
        data: {
          lastEmailAt: now,
          unreadCount: { increment: 1 },
          participants: [...participants],
          isArchived: false, // un nouvel email "désarchive" le thread
          ...(patient && !thread?.patientId ? { patientId: patient.id } : {}),
        },
      });
    }

    // 7. Persister l'email.
    const message = await app.prisma.emailMessage.create({
      data: {
        mailboxId: mailbox.id,
        threadId,
        direction: 'INBOUND',
        messageId: d.messageId,
        inReplyTo: d.inReplyTo ?? null,
        references: d.references,
        fromAddress: d.from.toLowerCase(),
        fromName: d.fromName ?? null,
        toAddresses: [mailbox.address],
        ccAddresses: [],
        subject: d.subject,
        bodyText: d.bodyText ?? null,
        bodyHtml: d.bodyHtml ?? null,
        snippet,
        status: 'RECEIVED',
        isRead: false,
        sentAt: now,
      },
    });

    // 8. Pièces jointes → Supabase Storage + lignes EmailAttachment.
    for (const att of d.attachments) {
      const key = attachmentKey(mailbox.id, message.id, att.filename);
      try {
        await uploadAttachment(key, Buffer.from(att.contentBase64, 'base64'), att.contentType);
        await app.prisma.emailAttachment.create({
          data: {
            emailId: message.id,
            filename: att.filename,
            contentType: att.contentType,
            sizeBytes: att.sizeBytes,
            storageKey: key,
          },
        });
      } catch (err) {
        // Une PJ qui échoue ne doit pas faire perdre l'email entier.
        app.log.error({ err, filename: att.filename }, 'échec stockage pièce jointe inbound');
      }
    }

    return reply.status(201).send({ ok: true, threadId, messageId: message.id });
  });
}
```

- [ ] **Step 2: Enregistrer la route dans `routes/index.ts`**

Dans `apps/api/src/routes/index.ts`, ajouter l'import après la ligne 13 :

```ts
import { inboundRoutes } from '../modules/practitioner-mail/inbound.routes.js';
```

Et dans `registerRoutes`, après `await app.register(waitingListRoutes);`, ajouter :

```ts
  await app.register(inboundRoutes);
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/inbound.routes.ts apps/api/src/routes/index.ts
git commit -m "feat(mailbox): webhook POST /inbound/email"
```

---

### Task 12: Test d'intégration du webhook

**Files:**
- Test: `apps/api/src/modules/practitioner-mail/inbound.routes.test.ts`

- [ ] **Step 1: Écrire le test d'intégration**

Create `apps/api/src/modules/practitioner-mail/inbound.routes.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../server.js';

// INBOUND_EMAIL_SECRET = 'test-inbound-secret' (fixé par vitest.setup.ts).
const SECRET = 'test-inbound-secret';

describe('POST /inbound/email', () => {
  let app: FastifyInstance;
  let userId: string;
  let mailboxId: string;
  const address = `it-mailbox-${Date.now()}@reset-egypt.com`;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
    const user = await app.prisma.user.create({
      data: {
        email: `it-doctor-${Date.now()}@reset-egypt.com`,
        passwordHash: 'x',
        role: 'PRACTITIONER',
        firstName: 'Test',
        lastName: 'Doctor',
      },
    });
    userId = user.id;
    const mailbox = await app.prisma.mailbox.create({
      data: { userId, address, displayName: 'Test Doctor' },
    });
    mailboxId = mailbox.id;
  });

  afterAll(async () => {
    await app.prisma.emailAttachment.deleteMany({ where: { email: { mailboxId } } });
    await app.prisma.emailMessage.deleteMany({ where: { mailboxId } });
    await app.prisma.emailThread.deleteMany({ where: { mailboxId } });
    await app.prisma.mailbox.delete({ where: { id: mailboxId } });
    await app.prisma.user.delete({ where: { id: userId } });
    await app.close();
  });

  it('rejette une requête sans header secret (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      payload: { to: address, from: 'x@gmail.com', messageId: '<no-secret@x>' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejette un mauvais secret (401)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': 'mauvais' },
      payload: { to: address, from: 'x@gmail.com', messageId: '<bad-secret@x>' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('rejette un payload invalide (400)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload: { to: 'pas-un-email', from: 'x@gmail.com', messageId: '<bad@x>' },
    });
    expect(res.statusCode).toBe(400);
  });

  it('crée un thread + un message pour un email entrant valide', async () => {
    const messageId = `<happy-${Date.now()}@gmail.com>`;
    const res = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload: {
        to: address,
        from: 'patient@gmail.com',
        fromName: 'Un Patient',
        subject: 'Question test',
        messageId,
        bodyText: 'Bonjour docteur',
      },
    });
    expect(res.statusCode).toBe(201);
    const body = res.json();
    expect(body.ok).toBe(true);
    expect(body.threadId).toBeDefined();

    const msg = await app.prisma.emailMessage.findUnique({ where: { messageId } });
    expect(msg).not.toBeNull();
    expect(msg!.direction).toBe('INBOUND');
    expect(msg!.snippet).toBe('Bonjour docteur');

    const thread = await app.prisma.emailThread.findUnique({ where: { id: body.threadId } });
    expect(thread!.unreadCount).toBe(1);
  });

  it('est idempotent sur un messageId déjà reçu', async () => {
    const messageId = `<dup-${Date.now()}@gmail.com>`;
    const payload = { to: address, from: 'patient@gmail.com', subject: 'Dup', messageId, bodyText: 'x' };
    const first = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload,
    });
    expect(first.statusCode).toBe(201);
    const second = await app.inject({
      method: 'POST',
      url: '/inbound/email',
      headers: { 'x-webhook-secret': SECRET },
      payload,
    });
    expect(second.statusCode).toBe(200);
    expect(second.json().deduplicated).toBe(true);
  });
});
```

- [ ] **Step 2: Lancer le test**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/inbound.routes.test.ts`
Expected: PASS (5 tests). (Nécessite la DB joignable — `pnpm db:up` si besoin.)

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/inbound.routes.test.ts
git commit -m "test(mailbox): tests d'intégration du webhook inbound"
```

---

## Phase 4 — Module practitioner-mail (routes authentifiées)

### Task 13: Squelette du module + `loadCallerMailbox` + `GET /threads`

**Files:**
- Create: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`

- [ ] **Step 1: Créer le module avec le helper et la route liste**

Create `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`:

```ts
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { canAccessMailbox } from './mail-access.js';

interface ResolvedMailbox {
  id: string;
  userId: string;
  address: string;
  displayName: string;
}

/**
 * Résout la mailbox sur laquelle le caller agit et vérifie l'accès.
 * - mailboxId fourni (query ou body) : autorisé si propriétaire OU ADMIN.
 * - sinon : la mailbox du caller (propriétaire).
 * Envoie la réponse d'erreur et retourne null si refus / introuvable.
 */
async function loadCallerMailbox(
  app: FastifyInstance,
  req: FastifyRequest,
  reply: FastifyReply,
  mailboxId?: string,
): Promise<ResolvedMailbox | null> {
  const user = req.currentUser!;
  const mailbox = mailboxId
    ? await app.prisma.mailbox.findUnique({ where: { id: mailboxId } })
    : await app.prisma.mailbox.findUnique({ where: { userId: user.sub } });

  if (!mailbox || !mailbox.isActive) {
    reply.status(404).send({ error: 'MailboxNotFound' });
    return null;
  }
  if (!canAccessMailbox(user, mailbox)) {
    reply.status(403).send({ error: 'Forbidden' });
    return null;
  }
  return {
    id: mailbox.id,
    userId: mailbox.userId,
    address: mailbox.address,
    displayName: mailbox.displayName,
  };
}

export async function practitionerMailRoutes(app: FastifyInstance): Promise<void> {
  app.addHook('onRequest', app.authenticate);

  // GET /practitioner-mail/threads — liste des threads de la mailbox du caller.
  app.get('/practitioner-mail/threads', async (req, reply) => {
    const q = req.query as { mailboxId?: string; archived?: string; starred?: string; q?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, q.mailboxId);
    if (!mailbox) return;

    const where: Record<string, unknown> = {
      mailboxId: mailbox.id,
      isArchived: q.archived === 'true',
    };
    if (q.starred === 'true') where.isStarred = true;
    if (q.q && q.q.trim()) {
      const term = q.q.trim();
      where.OR = [
        { subject: { contains: term, mode: 'insensitive' } },
        { participants: { has: term.toLowerCase() } },
      ];
    }

    const threads = await app.prisma.emailThread.findMany({
      where,
      orderBy: { lastEmailAt: 'desc' },
      take: 100,
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        emails: {
          orderBy: { sentAt: 'desc' },
          take: 1,
          select: { snippet: true, fromAddress: true },
        },
      },
    });

    return {
      mailbox: { id: mailbox.id, address: mailbox.address, displayName: mailbox.displayName },
      threads: threads.map((t) => ({
        id: t.id,
        subject: t.subject,
        participants: t.participants,
        patientId: t.patientId,
        patientName: t.patient ? `${t.patient.firstName} ${t.patient.lastName}` : null,
        lastEmailAt: t.lastEmailAt.toISOString(),
        unreadCount: t.unreadCount,
        isArchived: t.isArchived,
        isStarred: t.isStarred,
        snippet: t.emails[0]?.snippet ?? '',
        lastFrom: t.emails[0]?.fromAddress ?? '',
      })),
    };
  });
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts
git commit -m "feat(mailbox): module practitioner-mail + GET /threads"
```

---

### Task 14: `GET /threads/:id` + read / archive / star

**Files:**
- Modify: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`

- [ ] **Step 1: Ajouter les 4 routes avant la fermeture de `practitionerMailRoutes`**

Dans `practitioner-mail.routes.ts`, juste avant la dernière `}` qui ferme `practitionerMailRoutes`, ajouter :

```ts
  // GET /practitioner-mail/threads/:id — un thread + tous ses emails.
  app.get('/practitioner-mail/threads/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const q = req.query as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, q.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({
      where: { id },
      include: {
        patient: { select: { id: true, firstName: true, lastName: true } },
        emails: {
          orderBy: { sentAt: 'asc' },
          include: {
            attachments: {
              select: { id: true, filename: true, contentType: true, sizeBytes: true },
            },
          },
        },
      },
    });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }

    return {
      thread: {
        id: thread.id,
        subject: thread.subject,
        participants: thread.participants,
        patientId: thread.patientId,
        patientName: thread.patient
          ? `${thread.patient.firstName} ${thread.patient.lastName}`
          : null,
        lastEmailAt: thread.lastEmailAt.toISOString(),
        unreadCount: thread.unreadCount,
        isArchived: thread.isArchived,
        isStarred: thread.isStarred,
        snippet: thread.emails[thread.emails.length - 1]?.snippet ?? '',
        lastFrom: thread.emails[thread.emails.length - 1]?.fromAddress ?? '',
      },
      messages: thread.emails.map((m) => ({
        id: m.id,
        threadId: m.threadId,
        direction: m.direction,
        fromAddress: m.fromAddress,
        fromName: m.fromName,
        toAddresses: m.toAddresses,
        ccAddresses: m.ccAddresses,
        subject: m.subject,
        bodyText: m.bodyText,
        bodyHtml: m.bodyHtml,
        isRead: m.isRead,
        sentAt: m.sentAt.toISOString(),
        attachments: m.attachments,
      })),
    };
  });

  // POST /practitioner-mail/threads/:id/read — marque tout le thread comme lu.
  app.post('/practitioner-mail/threads/:id/read', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    await app.prisma.emailMessage.updateMany({
      where: { threadId: id, isRead: false },
      data: { isRead: true },
    });
    await app.prisma.emailThread.update({ where: { id }, data: { unreadCount: 0 } });
    return { ok: true };
  });

  // POST /practitioner-mail/threads/:id/archive — toggle isArchived.
  app.post('/practitioner-mail/threads/:id/archive', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    const updated = await app.prisma.emailThread.update({
      where: { id },
      data: { isArchived: !thread.isArchived },
    });
    return { ok: true, isArchived: updated.isArchived };
  });

  // POST /practitioner-mail/threads/:id/star — toggle isStarred.
  app.post('/practitioner-mail/threads/:id/star', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const body = (req.body ?? {}) as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, body.mailboxId);
    if (!mailbox) return;

    const thread = await app.prisma.emailThread.findUnique({ where: { id } });
    if (!thread || thread.mailboxId !== mailbox.id) {
      return reply.status(404).send({ error: 'ThreadNotFound' });
    }
    const updated = await app.prisma.emailThread.update({
      where: { id },
      data: { isStarred: !thread.isStarred },
    });
    return { ok: true, isStarred: updated.isStarred };
  });
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 3: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts
git commit -m "feat(mailbox): GET /threads/:id + read/archive/star"
```

---

### Task 15: `POST /practitioner-mail/send`

**Files:**
- Modify: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`

- [ ] **Step 1: Ajouter les imports en haut du fichier**

Dans `practitioner-mail.routes.ts`, après la ligne `import { canAccessMailbox } from './mail-access.js';`, ajouter :

```ts
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { recordAudit } from '../../lib/audit.js';
import { sendEmail } from '../../lib/email.js';
import { buildSnippet } from './mail-snippet.js';
import { uploadAttachment, attachmentKey } from '../../lib/mail-storage.js';
```

- [ ] **Step 2: Ajouter le schéma de validation après les imports**

Après le bloc d'imports, avant `interface ResolvedMailbox`, ajouter :

```ts
const sendAttachmentSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  contentBase64: z.string().min(1),
});

const sendSchema = z.object({
  mailboxId: z.string().uuid().optional(),
  threadId: z.string().uuid().optional(),
  to: z.array(z.string().email()).min(1),
  cc: z.array(z.string().email()).default([]),
  subject: z.string().min(1).max(500),
  bodyText: z.string().default(''),
  bodyHtml: z.string().optional(),
  attachments: z.array(sendAttachmentSchema).default([]),
});

const SEND_BODY_LIMIT = 30 * 1024 * 1024;
```

- [ ] **Step 3: Ajouter la route `POST /send` avant la fermeture de `practitionerMailRoutes`**

```ts
  // POST /practitioner-mail/send — composer un nouvel email OU répondre.
  app.post(
    '/practitioner-mail/send',
    { bodyLimit: SEND_BODY_LIMIT },
    async (req, reply) => {
      const parsed = sendSchema.safeParse(req.body);
      if (!parsed.success) {
        return reply.status(400).send({ error: 'ValidationError', details: parsed.error.flatten() });
      }
      const d = parsed.data;
      const mailbox = await loadCallerMailbox(app, req, reply, d.mailboxId);
      if (!mailbox) return;

      // Threading : si réponse, charger le thread et son dernier message.
      let inReplyTo: string | null = null;
      let references: string[] = [];
      if (d.threadId) {
        const replyThread = await app.prisma.emailThread.findUnique({
          where: { id: d.threadId },
          include: { emails: { orderBy: { sentAt: 'desc' }, take: 1 } },
        });
        if (!replyThread || replyThread.mailboxId !== mailbox.id) {
          return reply.status(404).send({ error: 'ThreadNotFound' });
        }
        const last = replyThread.emails[0];
        if (last) {
          inReplyTo = last.messageId;
          references = [...last.references, last.messageId];
        }
      }

      const now = new Date();
      const messageId = `<${randomUUID()}@reset-egypt.com>`;
      const html = d.bodyHtml ?? `<pre style="font-family:inherit;white-space:pre-wrap">${
        d.bodyText.replace(/&/g, '&amp;').replace(/</g, '&lt;')
      }</pre>`;

      // Envoi via Resend.
      const headers: Record<string, string> = { 'Message-ID': messageId };
      if (inReplyTo) headers['In-Reply-To'] = inReplyTo;
      if (references.length) headers['References'] = references.join(' ');

      const result = await sendEmail({
        from: `${mailbox.displayName} <${mailbox.address}>`,
        to: d.to.join(', '),
        cc: d.cc.length ? d.cc : undefined,
        replyTo: mailbox.address,
        subject: d.subject,
        html,
        text: d.bodyText || undefined,
        headers,
        attachments: d.attachments.map((a) => ({
          filename: a.filename,
          content: Buffer.from(a.contentBase64, 'base64'),
          contentType: a.contentType,
        })),
      });

      // Créer le thread si nouveau.
      let threadId = d.threadId ?? null;
      if (!threadId) {
        const created = await app.prisma.emailThread.create({
          data: {
            mailboxId: mailbox.id,
            subject: d.subject,
            participants: [...d.to, ...d.cc].map((e) => e.toLowerCase()),
            lastEmailAt: now,
            unreadCount: 0,
          },
        });
        threadId = created.id;
      } else {
        await app.prisma.emailThread.update({
          where: { id: threadId },
          data: { lastEmailAt: now, isArchived: false },
        });
      }

      // Persister l'email sortant.
      const message = await app.prisma.emailMessage.create({
        data: {
          mailboxId: mailbox.id,
          threadId,
          direction: 'OUTBOUND',
          messageId,
          inReplyTo,
          references,
          fromAddress: mailbox.address,
          fromName: mailbox.displayName,
          toAddresses: d.to.map((e) => e.toLowerCase()),
          ccAddresses: d.cc.map((e) => e.toLowerCase()),
          subject: d.subject,
          bodyText: d.bodyText || null,
          bodyHtml: d.bodyHtml ?? null,
          snippet: buildSnippet(d.bodyText, d.bodyHtml),
          status: result.sent ? 'SENT' : 'FAILED',
          isRead: true,
          sentByUserId: req.currentUser!.sub,
          sentAt: now,
        },
      });

      // Pièces jointes → Supabase Storage.
      for (const att of d.attachments) {
        const key = attachmentKey(mailbox.id, message.id, att.filename);
        try {
          await uploadAttachment(key, Buffer.from(att.contentBase64, 'base64'), att.contentType);
          await app.prisma.emailAttachment.create({
            data: {
              emailId: message.id,
              filename: att.filename,
              contentType: att.contentType,
              sizeBytes: Buffer.from(att.contentBase64, 'base64').byteLength,
              storageKey: key,
            },
          });
        } catch (err) {
          app.log.error({ err, filename: att.filename }, 'échec stockage pièce jointe sortante');
        }
      }

      await recordAudit(app.prisma, req, {
        userId: req.currentUser!.sub,
        action: 'practitioner_mail_sent',
        resource: `email:${message.id}`,
        details: { mailboxId: mailbox.id, to: d.to, sent: result.sent, provider: result.provider },
      });

      if (!result.sent) {
        return reply.status(502).send({ error: 'SendFailed', message: result.error, messageId: message.id });
      }
      return reply.status(201).send({ ok: true, threadId, messageId: message.id });
    },
  );
```

- [ ] **Step 4: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts
git commit -m "feat(mailbox): POST /practitioner-mail/send (compose + réponse)"
```

---

### Task 16: `GET /attachments/:id` (téléchargement)

**Files:**
- Modify: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`

- [ ] **Step 1: Ajouter l'import du helper d'URL signée**

Dans `practitioner-mail.routes.ts`, modifier la ligne d'import de `mail-storage.js` pour ajouter `signedAttachmentUrl` :

```ts
import { uploadAttachment, attachmentKey, signedAttachmentUrl } from '../../lib/mail-storage.js';
```

- [ ] **Step 2: Ajouter la route avant la fermeture de `practitionerMailRoutes`**

```ts
  // GET /practitioner-mail/attachments/:id — URL signée de téléchargement.
  app.get('/practitioner-mail/attachments/:id', async (req, reply) => {
    const id = (req.params as { id: string }).id;
    const attachment = await app.prisma.emailAttachment.findUnique({
      where: { id },
      include: { email: { select: { mailboxId: true, mailbox: { select: { userId: true } } } } },
    });
    if (!attachment) {
      return reply.status(404).send({ error: 'AttachmentNotFound' });
    }
    if (!canAccessMailbox(req.currentUser!, { userId: attachment.email.mailbox.userId })) {
      return reply.status(403).send({ error: 'Forbidden' });
    }
    try {
      const url = await signedAttachmentUrl(attachment.storageKey, 300);
      return { url, filename: attachment.filename, contentType: attachment.contentType };
    } catch (err) {
      app.log.error({ err, attachmentId: id }, 'échec génération URL signée');
      return reply.status(503).send({ error: 'StorageUnavailable' });
    }
  });
```

- [ ] **Step 3: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts
git commit -m "feat(mailbox): GET /attachments/:id (URL signée)"
```

---

### Task 17: `GET /unread-count` + enregistrement du module

**Files:**
- Modify: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts`
- Modify: `apps/api/src/routes/index.ts`

- [ ] **Step 1: Ajouter la route `GET /unread-count` avant la fermeture de `practitionerMailRoutes`**

```ts
  // GET /practitioner-mail/unread-count — compteur pour le badge sidebar.
  app.get('/practitioner-mail/unread-count', async (req, reply) => {
    const q = req.query as { mailboxId?: string };
    const mailbox = await loadCallerMailbox(app, req, reply, q.mailboxId);
    if (!mailbox) return;
    const unread = await app.prisma.emailThread.count({
      where: { mailboxId: mailbox.id, isArchived: false, unreadCount: { gt: 0 } },
    });
    return { unread };
  });
```

- [ ] **Step 2: Enregistrer le module dans `routes/index.ts`**

Dans `apps/api/src/routes/index.ts`, ajouter l'import après celui de `inboundRoutes` :

```ts
import { practitionerMailRoutes } from '../modules/practitioner-mail/practitioner-mail.routes.js';
```

Et dans `registerRoutes`, après `await app.register(inboundRoutes);`, ajouter :

```ts
  await app.register(practitionerMailRoutes);
```

- [ ] **Step 3: Vérifier le typecheck + build**

Run: `pnpm --filter @reset/api typecheck && pnpm --filter @reset/api build`
Expected: aucune erreur.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.ts apps/api/src/routes/index.ts
git commit -m "feat(mailbox): GET /unread-count + enregistrement du module"
```

---

### Task 18: Test d'intégration des routes authentifiées

**Files:**
- Test: `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.test.ts`

- [ ] **Step 1: Écrire le test d'intégration (frontière d'authentification)**

Create `apps/api/src/modules/practitioner-mail/practitioner-mail.routes.test.ts`:

```ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import type { FastifyInstance } from 'fastify';
import { buildApp } from '../../server.js';

describe('practitioner-mail routes — frontière d auth', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildApp();
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /practitioner-mail/threads sans cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/practitioner-mail/threads' });
    expect(res.statusCode).toBe(401);
  });

  it('GET /practitioner-mail/unread-count sans cookie → 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/practitioner-mail/unread-count' });
    expect(res.statusCode).toBe(401);
  });

  it('POST /practitioner-mail/send sans cookie → 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/practitioner-mail/send',
      payload: { to: ['x@y.com'], subject: 'x', bodyText: 'x' },
    });
    expect(res.statusCode).toBe(401);
  });

  it('GET /practitioner-mail/attachments/:id sans cookie → 401', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/practitioner-mail/attachments/00000000-0000-0000-0000-000000000000',
    });
    expect(res.statusCode).toBe(401);
  });
});
```

- [ ] **Step 2: Lancer le test**

Run: `pnpm --filter @reset/api test src/modules/practitioner-mail/practitioner-mail.routes.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 3: Lancer toute la suite de tests de l'API**

Run: `pnpm --filter @reset/api test`
Expected: PASS — tous les fichiers de test (health + les 7 fichiers mailbox).

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/modules/practitioner-mail/practitioner-mail.routes.test.ts
git commit -m "test(mailbox): tests d'intégration de la frontière d'auth"
```

---

## Phase 5 — Cloudflare Email Worker

### Task 19: Package worker + `buildWebhookPayload` (TDD)

**Files:**
- Create: `workers/inbound-email/package.json`
- Create: `workers/inbound-email/tsconfig.json`
- Create: `workers/inbound-email/vitest.config.ts`
- Create: `workers/inbound-email/src/payload.ts`
- Create: `workers/inbound-email/src/payload.test.ts`
- Modify: `pnpm-workspace.yaml`

- [ ] **Step 1: Ajouter `workers/*` au workspace pnpm**

Dans `pnpm-workspace.yaml`, ajouter une entrée `workers/*`. Le fichier doit ressembler à :

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
  - 'workers/*'
```

- [ ] **Step 2: Créer le `package.json` du worker**

Create `workers/inbound-email/package.json`:

```json
{
  "name": "@reset/inbound-email-worker",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "deploy": "wrangler deploy",
    "dev": "wrangler dev",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "postal-mime": "^2.2.7"
  },
  "devDependencies": {
    "@cloudflare/workers-types": "^4.20240512.0",
    "typescript": "^5.4.0",
    "vitest": "^1.5.0",
    "wrangler": "^3.57.0"
  }
}
```

- [ ] **Step 3: Créer le `tsconfig.json` du worker**

Create `workers/inbound-email/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "Bundler",
    "lib": ["ES2022"],
    "types": ["@cloudflare/workers-types"],
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Créer le `vitest.config.ts` du worker**

Create `workers/inbound-email/vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
});
```

- [ ] **Step 5: Installer les dépendances**

Run: `pnpm install`
Expected: les dépendances de `@reset/inbound-email-worker` sont installées.

- [ ] **Step 6: Écrire le test qui échoue**

Create `workers/inbound-email/src/payload.test.ts`:

```ts
import { describe, it, expect } from 'vitest';
import { buildWebhookPayload, type ParsedEmailLike } from './payload.js';

function toArrayBuffer(s: string): ArrayBuffer {
  const enc = new TextEncoder().encode(s);
  return enc.buffer.slice(enc.byteOffset, enc.byteOffset + enc.byteLength);
}

describe('buildWebhookPayload', () => {
  it('mappe les champs de base et normalise les adresses', () => {
    const parsed: ParsedEmailLike = {
      from: { address: 'Patient@Gmail.com', name: 'Un Patient' },
      subject: 'Bonjour',
      messageId: '<m1@gmail.com>',
      text: 'Salut',
    };
    const out = buildWebhookPayload('AhmadAlAshry@Reset-Egypt.com', parsed);
    expect(out.to).toBe('ahmadalashry@reset-egypt.com');
    expect(out.from).toBe('patient@gmail.com');
    expect(out.fromName).toBe('Un Patient');
    expect(out.subject).toBe('Bonjour');
    expect(out.messageId).toBe('<m1@gmail.com>');
    expect(out.bodyText).toBe('Salut');
    expect(out.references).toEqual([]);
    expect(out.attachments).toEqual([]);
  });

  it('met un sujet par défaut si absent', () => {
    const out = buildWebhookPayload('a@b.com', { messageId: '<m@x>' });
    expect(out.subject).toBe('(sans objet)');
  });

  it('découpe les references en tableau', () => {
    const out = buildWebhookPayload('a@b.com', {
      messageId: '<m@x>',
      references: '<r1@x>  <r2@x>',
    });
    expect(out.references).toEqual(['<r1@x>', '<r2@x>']);
  });

  it('encode les pièces jointes en base64', () => {
    const out = buildWebhookPayload('a@b.com', {
      messageId: '<m@x>',
      attachments: [{ filename: 'f.txt', mimeType: 'text/plain', content: toArrayBuffer('hi') }],
    });
    expect(out.attachments).toHaveLength(1);
    expect(out.attachments[0]!.filename).toBe('f.txt');
    expect(out.attachments[0]!.sizeBytes).toBe(2);
    expect(Buffer.from(out.attachments[0]!.contentBase64, 'base64').toString()).toBe('hi');
  });

  it('génère un messageId de secours si absent', () => {
    const out = buildWebhookPayload('a@b.com', {});
    expect(out.messageId).toMatch(/@reset-egypt\.com$/);
  });
});
```

- [ ] **Step 7: Lancer le test pour vérifier qu'il échoue**

Run: `pnpm --filter @reset/inbound-email-worker test`
Expected: FAIL — import `./payload.js` non résolu.

- [ ] **Step 8: Écrire l'implémentation**

Create `workers/inbound-email/src/payload.ts`:

```ts
/** Forme minimale d'un email parsé (sous-ensemble de l'objet postal-mime). */
export interface ParsedEmailLike {
  from?: { address?: string; name?: string };
  subject?: string;
  messageId?: string;
  inReplyTo?: string;
  references?: string;
  text?: string;
  html?: string;
  attachments?: Array<{ filename?: string; mimeType?: string; content: ArrayBuffer }>;
}

export interface WebhookPayload {
  to: string;
  from: string;
  fromName: string | null;
  subject: string;
  messageId: string;
  inReplyTo: string | null;
  references: string[];
  bodyText: string | null;
  bodyHtml: string | null;
  attachments: Array<{
    filename: string;
    contentType: string;
    sizeBytes: number;
    contentBase64: string;
  }>;
}

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]!);
  return btoa(binary);
}

function splitReferences(refs: string | undefined): string[] {
  if (!refs) return [];
  return refs
    .split(/\s+/)
    .map((r) => r.trim())
    .filter(Boolean);
}

/** Transforme un email parsé en payload JSON pour le webhook /inbound/email. */
export function buildWebhookPayload(recipient: string, parsed: ParsedEmailLike): WebhookPayload {
  return {
    to: recipient.toLowerCase().trim(),
    from: (parsed.from?.address ?? '').toLowerCase().trim(),
    fromName: parsed.from?.name?.trim() || null,
    subject: parsed.subject?.trim() || '(sans objet)',
    messageId: parsed.messageId ?? `<generated-${Date.now()}@reset-egypt.com>`,
    inReplyTo: parsed.inReplyTo ?? null,
    references: splitReferences(parsed.references),
    bodyText: parsed.text ?? null,
    bodyHtml: parsed.html ?? null,
    attachments: (parsed.attachments ?? []).map((a) => ({
      filename: a.filename ?? 'attachment',
      contentType: a.mimeType ?? 'application/octet-stream',
      sizeBytes: a.content.byteLength,
      contentBase64: arrayBufferToBase64(a.content),
    })),
  };
}
```

- [ ] **Step 9: Lancer le test pour vérifier qu'il passe**

Run: `pnpm --filter @reset/inbound-email-worker test`
Expected: PASS (5 tests).

- [ ] **Step 10: Commit**

```bash
git add pnpm-workspace.yaml workers/inbound-email pnpm-lock.yaml
git commit -m "feat(worker): package inbound-email + buildWebhookPayload"
```

---

### Task 20: Handler email du Worker + `wrangler.toml`

**Files:**
- Create: `workers/inbound-email/src/index.ts`
- Create: `workers/inbound-email/wrangler.toml`
- Create: `workers/inbound-email/README.md`

- [ ] **Step 1: Créer le handler du Worker**

Create `workers/inbound-email/src/index.ts`:

```ts
import PostalMime from 'postal-mime';
import { buildWebhookPayload, type ParsedEmailLike } from './payload.js';

export interface Env {
  RESET_API_URL: string; // ex: https://api.reset-egypt.com
  INBOUND_EMAIL_SECRET: string;
  GMAIL_FALLBACK: string; // ex: resetegypt@gmail.com — filet de sécurité v1
}

export default {
  async email(message: ForwardableEmailMessage, env: Env): Promise<void> {
    // 1. Parser l'email brut.
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = (await PostalMime.parse(raw)) as ParsedEmailLike;
    const payload = buildWebhookPayload(message.to, parsed);

    // 2. POST vers le webhook de l'API RESET.
    try {
      const res = await fetch(`${env.RESET_API_URL}/inbound/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Secret': env.INBOUND_EMAIL_SECRET,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.error(`Webhook a répondu ${res.status}: ${await res.text()}`);
      }
    } catch (err) {
      console.error('Échec POST webhook /inbound/email', err);
    }

    // 3. Filet de sécurité v1 : forwarder aussi vers Gmail.
    //    (à retirer une fois la confiance établie — cf. spec §12)
    if (env.GMAIL_FALLBACK) {
      try {
        await message.forward(env.GMAIL_FALLBACK);
      } catch (err) {
        console.error('Échec forward Gmail', err);
      }
    }
  },
};
```

- [ ] **Step 2: Créer `wrangler.toml`**

Create `workers/inbound-email/wrangler.toml`:

```toml
name = "reset-inbound-email"
main = "src/index.ts"
compatibility_date = "2024-05-01"

# Les secrets se définissent via `wrangler secret put <NOM>` (jamais en clair ici) :
#   wrangler secret put RESET_API_URL
#   wrangler secret put INBOUND_EMAIL_SECRET
#   wrangler secret put GMAIL_FALLBACK
#
# Le binding "email routing" se configure dans le dashboard Cloudflare :
#   Email → Email Routing → Routes → ahmadalashry@reset-egypt.com → Send to a Worker → reset-inbound-email
```

- [ ] **Step 3: Créer le README du Worker**

Create `workers/inbound-email/README.md`:

```markdown
# reset-inbound-email — Cloudflare Email Worker

Reçoit les emails de la mailbox praticien (`ahmadalashry@reset-egypt.com`), les
parse et les POST au webhook `/inbound/email` de l'API RESET. Forwarde aussi vers
Gmail comme filet de sécurité v1.

## Déploiement

```bash
pnpm --filter @reset/inbound-email-worker exec wrangler login
pnpm --filter @reset/inbound-email-worker exec wrangler secret put RESET_API_URL
pnpm --filter @reset/inbound-email-worker exec wrangler secret put INBOUND_EMAIL_SECRET
pnpm --filter @reset/inbound-email-worker exec wrangler secret put GMAIL_FALLBACK
pnpm --filter @reset/inbound-email-worker deploy
```

`INBOUND_EMAIL_SECRET` doit être **identique** à la variable du même nom de l'API.

## Activer la route

Dashboard Cloudflare → Email → Email Routing → Routes → éditer l'adresse du
praticien → « Send to a Worker » → `reset-inbound-email`.
```

- [ ] **Step 4: Vérifier le typecheck du worker**

Run: `pnpm --filter @reset/inbound-email-worker typecheck`
Expected: aucune erreur.

- [ ] **Step 5: Commit**

```bash
git add workers/inbound-email/src/index.ts workers/inbound-email/wrangler.toml workers/inbound-email/README.md
git commit -m "feat(worker): handler email + config wrangler"
```

---

## Phase 6 — Frontend (écran Courrier)

### Task 21: Types API + clés i18n

**Files:**
- Create: `apps/web/src/pages/mail/types.ts`
- Modify: `apps/web/src/i18n/fr.json`
- Modify: `apps/web/src/i18n/en.json`
- Modify: `apps/web/src/i18n/ar.json`

- [ ] **Step 1: Créer les types frontend**

Create `apps/web/src/pages/mail/types.ts`:

```ts
export interface MailThread {
  id: string;
  subject: string;
  participants: string[];
  patientId: string | null;
  patientName: string | null;
  lastEmailAt: string;
  unreadCount: number;
  isArchived: boolean;
  isStarred: boolean;
  snippet: string;
  lastFrom: string;
}

export interface MailAttachment {
  id: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export interface MailMessage {
  id: string;
  threadId: string;
  direction: 'INBOUND' | 'OUTBOUND';
  fromAddress: string;
  fromName: string | null;
  toAddresses: string[];
  ccAddresses: string[];
  subject: string;
  bodyText: string | null;
  bodyHtml: string | null;
  isRead: boolean;
  sentAt: string;
  attachments: MailAttachment[];
}

export interface MailboxInfo {
  id: string;
  address: string;
  displayName: string;
}

export interface ThreadsResponse {
  mailbox: MailboxInfo;
  threads: MailThread[];
}

export interface ThreadDetailResponse {
  thread: MailThread;
  messages: MailMessage[];
}
```

- [ ] **Step 2: Ajouter la clé nav + le namespace `mail` dans `fr.json`**

Dans `apps/web/src/i18n/fr.json`, dans l'objet `"nav"`, après `"waitingList": "Liste d'attente",` ajouter :

```json
    "mail": "Courrier",
```

Puis, à la racine de l'objet JSON (au même niveau que `"nav"` et `"inbox"`), ajouter :

```json
  "mail": {
    "title": "Courrier",
    "subtitle": "Messagerie privée",
    "searchPlaceholder": "Rechercher dans les emails…",
    "empty": "Aucun email. Les messages reçus apparaîtront ici.",
    "selectThread": "Sélectionnez une conversation",
    "noThreadMessages": "Aucun message.",
    "compose": "Nouveau message",
    "reply": "Répondre",
    "send": "Envoyer",
    "sending": "Envoi…",
    "archive": "Archiver",
    "unarchive": "Désarchiver",
    "star": "Favori",
    "to": "À",
    "cc": "Cc",
    "subject": "Objet",
    "body": "Message",
    "attachments": "Pièces jointes",
    "addAttachment": "Ajouter une pièce jointe",
    "download": "Télécharger",
    "showArchived": "Archivés",
    "showStarred": "Favoris",
    "backToList": "Retour",
    "patientLinked": "Patient lié",
    "viewPatientFile": "Voir la fiche patient",
    "createAppointment": "Créer un RDV",
    "sendError": "Échec de l'envoi. Réessayez.",
    "newSubjectPlaceholder": "Objet de votre message"
  },
```

- [ ] **Step 3: Ajouter les mêmes clés dans `en.json`**

Dans `apps/web/src/i18n/en.json`, dans `"nav"` après `"waitingList"`, ajouter `"mail": "Mail",` et à la racine :

```json
  "mail": {
    "title": "Mail",
    "subtitle": "Private mailbox",
    "searchPlaceholder": "Search emails…",
    "empty": "No email yet. Received messages will appear here.",
    "selectThread": "Select a conversation",
    "noThreadMessages": "No messages.",
    "compose": "New message",
    "reply": "Reply",
    "send": "Send",
    "sending": "Sending…",
    "archive": "Archive",
    "unarchive": "Unarchive",
    "star": "Star",
    "to": "To",
    "cc": "Cc",
    "subject": "Subject",
    "body": "Message",
    "attachments": "Attachments",
    "addAttachment": "Add attachment",
    "download": "Download",
    "showArchived": "Archived",
    "showStarred": "Starred",
    "backToList": "Back",
    "patientLinked": "Linked patient",
    "viewPatientFile": "View patient file",
    "createAppointment": "Create appointment",
    "sendError": "Failed to send. Try again.",
    "newSubjectPlaceholder": "Subject of your message"
  },
```

- [ ] **Step 4: Ajouter les mêmes clés dans `ar.json`**

Dans `apps/web/src/i18n/ar.json`, dans `"nav"` après `"waitingList"`, ajouter `"mail": "البريد",` et à la racine :

```json
  "mail": {
    "title": "البريد",
    "subtitle": "صندوق بريد خاص",
    "searchPlaceholder": "ابحث في الرسائل…",
    "empty": "لا توجد رسائل بعد. ستظهر الرسائل الواردة هنا.",
    "selectThread": "اختر محادثة",
    "noThreadMessages": "لا توجد رسائل.",
    "compose": "رسالة جديدة",
    "reply": "رد",
    "send": "إرسال",
    "sending": "جارٍ الإرسال…",
    "archive": "أرشفة",
    "unarchive": "إلغاء الأرشفة",
    "star": "مفضلة",
    "to": "إلى",
    "cc": "نسخة",
    "subject": "الموضوع",
    "body": "الرسالة",
    "attachments": "المرفقات",
    "addAttachment": "إضافة مرفق",
    "download": "تنزيل",
    "showArchived": "المؤرشفة",
    "showStarred": "المفضلة",
    "backToList": "رجوع",
    "patientLinked": "مريض مرتبط",
    "viewPatientFile": "عرض ملف المريض",
    "createAppointment": "إنشاء موعد",
    "sendError": "فشل الإرسال. حاول مرة أخرى.",
    "newSubjectPlaceholder": "موضوع رسالتك"
  },
```

- [ ] **Step 5: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur. (Les JSON sont valides — si erreur de parsing, vérifier les virgules.)

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/mail/types.ts apps/web/src/i18n/fr.json apps/web/src/i18n/en.json apps/web/src/i18n/ar.json
git commit -m "feat(mail): types frontend + clés i18n FR/EN/AR"
```

---

### Task 22: `ThreadList`

**Files:**
- Create: `apps/web/src/pages/mail/ThreadList.tsx`

- [ ] **Step 1: Créer le composant liste de threads**

Create `apps/web/src/pages/mail/ThreadList.tsx`:

```tsx
import { useTranslation } from 'react-i18next';
import { Badge, Input } from '@reset/ui';
import { Star, Archive, Inbox } from 'lucide-react';
import type { MailThread } from './types';

interface Props {
  threads: MailThread[];
  selectedThreadId: string | null;
  onSelect: (id: string) => void;
  filter: 'inbox' | 'archived' | 'starred';
  onFilterChange: (f: 'inbox' | 'archived' | 'starred') => void;
  search: string;
  onSearchChange: (s: string) => void;
}

export function ThreadList({
  threads,
  selectedThreadId,
  onSelect,
  filter,
  onFilterChange,
  search,
  onSearchChange,
}: Props) {
  const { t, i18n } = useTranslation();

  const FILTERS: Array<{ key: 'inbox' | 'archived' | 'starred'; label: string; Icon: typeof Inbox }> = [
    { key: 'inbox', label: t('mail.title'), Icon: Inbox },
    { key: 'starred', label: t('mail.showStarred'), Icon: Star },
    { key: 'archived', label: t('mail.showArchived'), Icon: Archive },
  ];

  return (
    <div>
      <div className="p-3 border-b border-border space-y-2 bg-surface sticky top-0 z-10">
        <Input
          placeholder={t('mail.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
        />
        <div className="flex gap-1">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => onFilterChange(f.key)}
              className={`flex-1 inline-flex items-center justify-center gap-1 px-2 py-1.5 text-[11px] font-semibold rounded-md transition-colors ${
                filter === f.key
                  ? 'bg-primary text-white'
                  : 'bg-bg-secondary/50 text-text-secondary hover:bg-bg-secondary'
              }`}
            >
              <f.Icon className="w-3 h-3" />
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {threads.length === 0 && (
        <p className="p-6 text-sm text-text-secondary text-center">{t('mail.empty')}</p>
      )}

      {threads.map((thread) => (
        <button
          key={thread.id}
          onClick={() => onSelect(thread.id)}
          className={`w-full text-start p-3 border-b border-border hover:bg-bg-secondary transition-colors ${
            selectedThreadId === thread.id ? 'bg-info-light' : ''
          }`}
        >
          <div className="flex items-center gap-2 mb-1">
            {thread.isStarred && <Star className="w-3 h-3 text-warning shrink-0" fill="currentColor" />}
            <strong className={`text-sm flex-1 truncate ${thread.unreadCount > 0 ? 'text-text' : 'text-text-secondary'}`}>
              {thread.patientName ?? thread.lastFrom ?? thread.participants[0] ?? '—'}
            </strong>
            {thread.unreadCount > 0 && <Badge variant="danger">{thread.unreadCount}</Badge>}
          </div>
          <div className={`text-xs truncate ${thread.unreadCount > 0 ? 'font-semibold text-text' : 'text-text-secondary'}`}>
            {thread.subject || '(sans objet)'}
          </div>
          <p className="text-xs text-text-tertiary truncate mt-0.5">{thread.snippet}</p>
          <p className="text-[10px] text-text-tertiary mt-1" data-numeric>
            {new Date(thread.lastEmailAt).toLocaleString(i18n.language)}
          </p>
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur (le composant n'importe que `./types`, créé à la Task 21).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/mail/ThreadList.tsx
git commit -m "feat(mail): composant ThreadList"
```

---

### Task 23: `ThreadView`

**Files:**
- Create: `apps/web/src/pages/mail/ThreadView.tsx`

- [ ] **Step 1: Créer le composant d'affichage de thread**

Create `apps/web/src/pages/mail/ThreadView.tsx`:

```tsx
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Avatar, AvatarFallback, Button } from '@reset/ui';
import { ArrowLeft, Archive, Star, Reply, Paperclip, Download } from 'lucide-react';
import { apiGet, apiPost } from '../../lib/api';
import type { ThreadDetailResponse, MailAttachment } from './types';

interface Props {
  threadId: string;
  onBack: () => void;
  onReply: (to: string[], subject: string) => void;
}

export function ThreadView({ threadId, onBack, onReply }: Props) {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['mail-thread', threadId],
    queryFn: () => apiGet<ThreadDetailResponse>(`/practitioner-mail/threads/${threadId}`),
  });

  // Marquer le thread lu à l'ouverture.
  useEffect(() => {
    if (data && data.thread.unreadCount > 0) {
      apiPost(`/practitioner-mail/threads/${threadId}/read`, {}).then(() => {
        qc.invalidateQueries({ queryKey: ['mail-threads'] });
        qc.invalidateQueries({ queryKey: ['mail-unread'] });
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data?.thread.id]);

  const archiveMut = useMutation({
    mutationFn: () => apiPost(`/practitioner-mail/threads/${threadId}/archive`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      qc.invalidateQueries({ queryKey: ['mail-thread', threadId] });
    },
  });

  const starMut = useMutation({
    mutationFn: () => apiPost(`/practitioner-mail/threads/${threadId}/star`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      qc.invalidateQueries({ queryKey: ['mail-thread', threadId] });
    },
  });

  if (!data) {
    return <div className="p-6 text-sm text-text-secondary">…</div>;
  }

  const { thread, messages } = data;
  const lastInbound = [...messages].reverse().find((m) => m.direction === 'INBOUND');
  const replyTo = lastInbound ? [lastInbound.fromAddress] : thread.participants;
  const replySubject = thread.subject.startsWith('Re:') ? thread.subject : `Re: ${thread.subject}`;

  return (
    <div className="flex flex-col h-full">
      {/* Barre d'actions */}
      <div className="bg-surface border-b border-border p-3 flex items-center gap-2 sticky top-0 z-10">
        <button onClick={onBack} className="lg:hidden p-1.5 rounded hover:bg-bg-secondary" aria-label={t('mail.backToList')}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <strong className="text-sm flex-1 truncate">{thread.subject || '(sans objet)'}</strong>
        <button
          onClick={() => starMut.mutate()}
          className={`p-1.5 rounded hover:bg-bg-secondary ${thread.isStarred ? 'text-warning' : 'text-text-tertiary'}`}
          aria-label={t('mail.star')}
        >
          <Star className="w-4 h-4" fill={thread.isStarred ? 'currentColor' : 'none'} />
        </button>
        <button
          onClick={() => archiveMut.mutate()}
          className="p-1.5 rounded hover:bg-bg-secondary text-text-tertiary"
          aria-label={t('mail.archive')}
        >
          <Archive className="w-4 h-4" />
        </button>
      </div>

      {/* Messages empilés */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <p className="text-sm text-text-secondary text-center mt-12">{t('mail.noThreadMessages')}</p>
        )}
        {messages.map((m) => (
          <div key={m.id} className="bg-surface border border-border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback>{(m.fromName ?? m.fromAddress).charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">
                  {m.fromName ?? m.fromAddress}
                  {m.direction === 'OUTBOUND' && (
                    <span className="ms-2 text-[10px] font-normal text-text-tertiary uppercase">
                      {t('mail.send')}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-text-tertiary truncate" data-numeric>
                  {m.fromAddress} · {new Date(m.sentAt).toLocaleString(i18n.language)}
                </div>
              </div>
            </div>
            <div className="text-sm whitespace-pre-wrap text-text leading-relaxed">
              {m.bodyText ?? (m.bodyHtml ? m.bodyHtml.replace(/<[^>]+>/g, ' ') : '')}
            </div>
            {m.attachments.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {m.attachments.map((a) => (
                  <AttachmentChip key={a.id} attachment={a} />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Bouton répondre */}
      <div className="border-t border-border bg-surface p-3">
        <Button className="w-full" onClick={() => onReply(replyTo, replySubject)}>
          <Reply className="w-4 h-4 me-2" />
          {t('mail.reply')}
        </Button>
      </div>
    </div>
  );
}

function AttachmentChip({ attachment }: { attachment: MailAttachment }) {
  const { t } = useTranslation();
  const download = async () => {
    const { url } = await apiGet<{ url: string }>(`/practitioner-mail/attachments/${attachment.id}`);
    window.open(url, '_blank', 'noopener');
  };
  return (
    <button
      type="button"
      onClick={download}
      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border bg-bg-secondary/50 hover:bg-bg-secondary text-xs transition-colors"
      title={t('mail.download')}
    >
      <Paperclip className="w-3 h-3 text-text-tertiary" />
      <span className="truncate max-w-[160px]">{attachment.filename}</span>
      <Download className="w-3 h-3 text-text-tertiary" />
    </button>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur (le composant n'importe que `./types` et `../../lib/api`).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/mail/ThreadView.tsx
git commit -m "feat(mail): composant ThreadView (thread + pièces jointes)"
```

---

### Task 24: `Composer`

**Files:**
- Create: `apps/web/src/pages/mail/Composer.tsx`

- [ ] **Step 1: Créer le composant de composition**

Create `apps/web/src/pages/mail/Composer.tsx`:

```tsx
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button, Input } from '@reset/ui';
import { X, Paperclip } from 'lucide-react';
import { apiPost } from '../../lib/api';

type ComposerState =
  | { mode: 'new' }
  | { mode: 'reply'; threadId: string; to: string[]; subject: string };

interface Props {
  state: ComposerState;
  onClose: () => void;
}

interface PendingAttachment {
  filename: string;
  contentType: string;
  contentBase64: string;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // result = "data:<mime>;base64,<data>" → on garde la partie après la virgule
      resolve(result.split(',')[1] ?? '');
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export function Composer({ state, onClose }: Props) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [to, setTo] = useState(state.mode === 'reply' ? state.to.join(', ') : '');
  const [cc, setCc] = useState('');
  const [subject, setSubject] = useState(state.mode === 'reply' ? state.subject : '');
  const [body, setBody] = useState('');
  const [attachments, setAttachments] = useState<PendingAttachment[]>([]);
  const [error, setError] = useState<string | null>(null);

  const sendMut = useMutation({
    mutationFn: () =>
      apiPost('/practitioner-mail/send', {
        threadId: state.mode === 'reply' ? state.threadId : undefined,
        to: to.split(',').map((s) => s.trim()).filter(Boolean),
        cc: cc.split(',').map((s) => s.trim()).filter(Boolean),
        subject,
        bodyText: body,
        attachments,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['mail-threads'] });
      if (state.mode === 'reply') {
        qc.invalidateQueries({ queryKey: ['mail-thread', state.threadId] });
      }
      onClose();
    },
    onError: () => setError(t('mail.sendError')),
  });

  const onPickFiles = async (files: FileList | null) => {
    if (!files) return;
    const next: PendingAttachment[] = [];
    for (const file of Array.from(files)) {
      next.push({
        filename: file.name,
        contentType: file.type || 'application/octet-stream',
        contentBase64: await fileToBase64(file),
      });
    }
    setAttachments((prev) => [...prev, ...next]);
  };

  const canSend = to.trim().length > 0 && subject.trim().length > 0 && !sendMut.isPending;

  return (
    <div className="fixed inset-0 z-50 bg-text/30 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="w-full sm:max-w-2xl bg-surface sm:rounded-2xl shadow-2xl border border-border flex flex-col max-h-[92vh]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <strong className="text-sm">
            {state.mode === 'reply' ? t('mail.reply') : t('mail.compose')}
          </strong>
          <button onClick={onClose} className="p-1 rounded hover:bg-bg-secondary" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-2 overflow-y-auto">
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.to')}</span>
            <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="email@exemple.com" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.cc')}</span>
            <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="email@exemple.com" />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.subject')}</span>
            <Input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('mail.newSubjectPlaceholder')}
            />
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold text-text-secondary">{t('mail.body')}</span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={8}
              className="w-full mt-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary resize-y"
            />
          </label>

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg border border-border bg-bg-secondary/50 text-xs"
                >
                  <Paperclip className="w-3 h-3 text-text-tertiary" />
                  <span className="truncate max-w-[140px]">{a.filename}</span>
                  <button
                    type="button"
                    onClick={() => setAttachments((prev) => prev.filter((_, j) => j !== i))}
                    className="text-text-tertiary hover:text-danger"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {error && <p className="text-xs text-danger">{error}</p>}
        </div>

        <div className="flex items-center gap-2 px-4 py-3 border-t border-border">
          <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-border bg-surface hover:bg-bg-secondary cursor-pointer transition-colors">
            <Paperclip className="w-3.5 h-3.5" />
            {t('mail.addAttachment')}
            <input
              type="file"
              multiple
              className="hidden"
              onChange={(e) => onPickFiles(e.target.files)}
            />
          </label>
          <div className="flex-1" />
          <Button onClick={() => sendMut.mutate()} disabled={!canSend}>
            {sendMut.isPending ? t('mail.sending') : t('mail.send')}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur (le composant n'importe que `../../lib/api` et des libs).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/mail/Composer.tsx
git commit -m "feat(mail): composant Composer (compose + réponse + pièces jointes)"
```

---

### Task 25: `MailContextPanel`

**Files:**
- Create: `apps/web/src/pages/mail/MailContextPanel.tsx`

- [ ] **Step 1: Créer le panneau de contexte patient**

Create `apps/web/src/pages/mail/MailContextPanel.tsx`:

```tsx
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle, Button } from '@reset/ui';
import { apiGet } from '../../lib/api';
import type { ThreadDetailResponse } from './types';

interface Props {
  threadId: string;
}

export function MailContextPanel({ threadId }: Props) {
  const { t } = useTranslation();
  const { data } = useQuery({
    queryKey: ['mail-thread', threadId],
    queryFn: () => apiGet<ThreadDetailResponse>(`/practitioner-mail/threads/${threadId}`),
  });

  if (!data) return null;
  const { thread } = data;

  return (
    <div className="p-4 space-y-3">
      <Card>
        <CardHeader>
          <CardTitle>{t('mail.subject')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-xs">
          <p className="font-semibold text-text">{thread.subject || '(sans objet)'}</p>
          <div className="space-y-1">
            {thread.participants.map((p) => (
              <p key={p} className="text-text-secondary" data-numeric>
                {p}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>

      {thread.patientId && (
        <Card>
          <CardHeader>
            <CardTitle>{t('mail.patientLinked')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm font-semibold">{thread.patientName}</p>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/patients/${thread.patientId}`}>{t('mail.viewPatientFile')}</a>
            </Button>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <a href={`/appointments/new?patientId=${thread.patientId}`}>
                {t('mail.createAppointment')}
              </a>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur (le composant n'importe que `./types` et des libs).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/mail/MailContextPanel.tsx
git commit -m "feat(mail): composant MailContextPanel (contexte patient)"
```

---

### Task 26: `MailPage` — shell responsive

**Files:**
- Create: `apps/web/src/pages/mail/MailPage.tsx`

- [ ] **Step 1: Créer le composant shell**

Create `apps/web/src/pages/mail/MailPage.tsx`:

```tsx
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@reset/ui';
import { apiGet } from '../../lib/api';
import { PageHeader } from '../../components/AppShell';
import type { ThreadsResponse } from './types';
import { ThreadList } from './ThreadList';
import { ThreadView } from './ThreadView';
import { Composer } from './Composer';
import { MailContextPanel } from './MailContextPanel';

type ComposerState =
  | { mode: 'closed' }
  | { mode: 'new' }
  | { mode: 'reply'; threadId: string; to: string[]; subject: string };

export function MailPage() {
  const { t } = useTranslation();
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'inbox' | 'archived' | 'starred'>('inbox');
  const [search, setSearch] = useState('');
  const [composer, setComposer] = useState<ComposerState>({ mode: 'closed' });

  const params = new URLSearchParams();
  if (filter === 'archived') params.set('archived', 'true');
  if (filter === 'starred') params.set('starred', 'true');
  if (search.trim()) params.set('q', search.trim());

  const { data } = useQuery({
    queryKey: ['mail-threads', filter, search],
    queryFn: () => apiGet<ThreadsResponse>(`/practitioner-mail/threads?${params.toString()}`),
    refetchInterval: 30_000,
  });

  const threads = data?.threads ?? [];

  return (
    <>
      <PageHeader
        title={t('mail.title')}
        subtitle={data?.mailbox.address ?? t('mail.subtitle')}
        actions={
          <Button onClick={() => setComposer({ mode: 'new' })}>{t('mail.compose')}</Button>
        }
      />
      {/* Desktop : 3 colonnes ; mobile : une colonne à la fois */}
      <div className="lg:grid lg:grid-cols-[320px_1fr_280px] h-[calc(100vh-89px)]">
        {/* Colonne 1 — liste : masquée sur mobile quand un thread est ouvert */}
        <div className={`${selectedThreadId ? 'hidden lg:block' : 'block'} border-e border-border overflow-y-auto`}>
          <ThreadList
            threads={threads}
            selectedThreadId={selectedThreadId}
            onSelect={setSelectedThreadId}
            filter={filter}
            onFilterChange={setFilter}
            search={search}
            onSearchChange={setSearch}
          />
        </div>

        {/* Colonne 2 — thread ouvert */}
        <div className={`${selectedThreadId ? 'block' : 'hidden lg:block'} overflow-y-auto bg-bg-secondary/40`}>
          {selectedThreadId ? (
            <ThreadView
              threadId={selectedThreadId}
              onBack={() => setSelectedThreadId(null)}
              onReply={(to, subject) =>
                setComposer({ mode: 'reply', threadId: selectedThreadId, to, subject })
              }
            />
          ) : (
            <div className="hidden lg:flex h-full items-center justify-center text-text-secondary text-sm">
              {t('mail.selectThread')}
            </div>
          )}
        </div>

        {/* Colonne 3 — contexte patient (desktop uniquement) */}
        <div className="hidden lg:block border-s border-border overflow-y-auto bg-surface">
          {selectedThreadId && <MailContextPanel threadId={selectedThreadId} />}
        </div>
      </div>

      {composer.mode !== 'closed' && (
        <Composer
          state={composer}
          onClose={() => setComposer({ mode: 'closed' })}
        />
      )}
    </>
  );
}
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/web typecheck`
Expected: aucune erreur — `ThreadList`, `ThreadView`, `Composer`, `MailContextPanel` et `./types` existent tous (Tasks 21-25).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/pages/mail/MailPage.tsx
git commit -m "feat(mail): MailPage — shell responsive 3 colonnes"
```

---

### Task 27: Hook `useMailboxAccess` + route `/courrier` + entrée nav + badge

**Files:**
- Create: `apps/web/src/pages/mail/useMailboxAccess.ts`
- Modify: `apps/web/src/App.tsx:20-22` et `:63-65`
- Modify: `apps/web/src/components/AppShell.tsx` (NAV + badge)

- [ ] **Step 1: Créer un hook qui détermine si l'utilisateur a accès au Courrier**

Create `apps/web/src/pages/mail/useMailboxAccess.ts`:

```ts
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '../../lib/api';
import { useAuthStore } from '../../lib/auth';

interface UnreadResponse {
  unread: number;
}

/**
 * Détermine si l'utilisateur courant a accès au Courrier (a une mailbox, ou est
 * ADMIN), en sondant /practitioner-mail/unread-count. Renvoie aussi le compteur
 * non-lus pour le badge sidebar. 404 = pas de mailbox → pas d'accès.
 */
export function useMailboxAccess(): { hasAccess: boolean; unread: number } {
  const user = useAuthStore((s) => s.user);
  const { data, isError } = useQuery({
    queryKey: ['mail-unread'],
    queryFn: () => apiGet<UnreadResponse>('/practitioner-mail/unread-count'),
    refetchInterval: 30_000,
    enabled: !!user,
    retry: false,
  });
  return {
    hasAccess: !isError && data !== undefined,
    unread: data?.unread ?? 0,
  };
}
```

- [ ] **Step 2: Câbler la route dans `App.tsx`**

Dans `apps/web/src/App.tsx`, ajouter l'import après la ligne 21 (`import { WaitingListPage } ...`) :

```ts
import { MailPage } from './pages/mail/MailPage';
```

Et ajouter la route après la ligne 64 (`<Route path="waiting-list" .../>`) :

```tsx
            <Route path="courrier" element={<PageMotion><MailPage /></PageMotion>} />
```

- [ ] **Step 3: Ajouter l'entrée de nav dans `AppShell.tsx`**

Dans `apps/web/src/components/AppShell.tsx`, ajouter `Mail` à l'import `lucide-react` (après `Inbox,`) :

```ts
  Mail,
```

Dans l'interface `NavItem`, élargir `badgeKey` :

```ts
  badgeKey?: 'inboxUnread' | 'mailUnread';
```

Dans le tableau `NAV`, après l'objet `/waiting-list`, ajouter :

```ts
  {
    to: '/courrier',
    label: 'nav.mail',
    Icon: Mail,
    section: 'work',
    badgeKey: 'mailUnread',
  },
```

- [ ] **Step 4: Brancher le badge mailUnread**

Dans `apps/web/src/components/AppShell.tsx`, ajouter l'import en haut :

```ts
import { useMailboxAccess } from '../pages/mail/useMailboxAccess';
```

Dans le composant `AppShell`, après la ligne `const inboxUnread = unreadData?.unread ?? 0;`, ajouter :

```ts
  const { hasAccess: hasMailbox, unread: mailUnread } = useMailboxAccess();
```

Remplacer la ligne `const badges = { inboxUnread };` par :

```ts
  const badges = { inboxUnread, mailUnread };
```

Remplacer la ligne `const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(user.role));` par :

```ts
  const visibleNav = NAV.filter((item) => {
    if (item.to === '/courrier') return hasMailbox;
    return !item.roles || item.roles.includes(user.role);
  });
```

Dans le type du paramètre `badges` de `NavSection` (`badges: { inboxUnread: number }`), le remplacer par :

```ts
  badges: { inboxUnread: number; mailUnread: number };
```

- [ ] **Step 5: Vérifier le typecheck + build**

Run: `pnpm --filter @reset/web typecheck && pnpm --filter @reset/web build`
Expected: aucune erreur — tous les fichiers du module `mail/` existent et sont câblés.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/pages/mail/useMailboxAccess.ts apps/web/src/App.tsx apps/web/src/components/AppShell.tsx
git commit -m "feat(mail): route /courrier + entrée nav + badge non-lus"
```

---

## Phase 7 — Mise en service

### Task 28: Script de création de la Mailbox du Dr Ahmad

**Files:**
- Create: `apps/api/scripts/create-mailbox.ts`

- [ ] **Step 1: Créer le script**

Create `apps/api/scripts/create-mailbox.ts`:

```ts
// Crée (ou réactive) une Mailbox pour un praticien existant.
// Usage : pnpm --filter @reset/api exec tsx scripts/create-mailbox.ts <userEmail> <mailboxAddress> "<displayName>"
// Exemple : ... scripts/create-mailbox.ts dr.ahmad@reset-egypt.com ahmadalashry@reset-egypt.com "Dr Ahmad Al Ashry"
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const [userEmail, mailboxAddress, displayName] = process.argv.slice(2);
  if (!userEmail || !mailboxAddress || !displayName) {
    console.error(
      'Usage : tsx scripts/create-mailbox.ts <userEmail> <mailboxAddress> "<displayName>"',
    );
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email: userEmail } });
  if (!user) {
    console.error(`❌ Aucun utilisateur avec l'email ${userEmail}`);
    process.exit(1);
  }

  const mailbox = await prisma.mailbox.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      address: mailboxAddress.toLowerCase(),
      displayName,
      isActive: true,
    },
    update: {
      address: mailboxAddress.toLowerCase(),
      displayName,
      isActive: true,
    },
  });

  console.log(`✅ Mailbox prête : ${mailbox.address} (id ${mailbox.id}) → user ${userEmail}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Vérifier le typecheck**

Run: `pnpm --filter @reset/api typecheck`
Expected: aucune erreur.

> **Note rollout :** ce script se lance une fois en production avec le vrai email du compte du Dr Ahmad et l'adresse canonique `ahmadalashry@reset-egypt.com` (cf. spec §13). Il n'est pas exécuté pendant l'implémentation.

- [ ] **Step 3: Commit**

```bash
git add apps/api/scripts/create-mailbox.ts
git commit -m "feat(mailbox): script de création de la Mailbox d'un praticien"
```

---

### Task 29: Vérification finale

**Files:** aucune modification — vérification globale.

- [ ] **Step 1: Typecheck de tout le monorepo**

Run: `pnpm -r typecheck`
Expected: aucune erreur sur `@reset/api`, `@reset/web`, `@reset/shared`, `@reset/inbound-email-worker`.

- [ ] **Step 2: Lint API + web**

Run: `pnpm --filter @reset/api lint && pnpm --filter @reset/web lint`
Expected: aucune erreur.

- [ ] **Step 3: Suite de tests complète**

Run: `pnpm --filter @reset/api test && pnpm --filter @reset/inbound-email-worker test`
Expected: PASS — tous les tests (health + 7 fichiers mailbox côté API + payload côté worker).

- [ ] **Step 4: Builds de production**

Run: `pnpm --filter @reset/api build && pnpm --filter @reset/web build`
Expected: les deux builds réussissent.

- [ ] **Step 5: Commit éventuel**

S'il y a des fichiers générés/modifiés (ex: lockfile), les committer :

```bash
git add -A
git commit -m "chore(mailbox): vérification finale — typecheck/lint/test/build OK"
```

S'il n'y a rien à committer, passer cette étape.

---

## Rollout post-implémentation (hors plan de code — checklist opérationnelle)

Une fois ce plan exécuté et mergé, la mise en service suit la spec §12 :

1. Déployer l'API (migration appliquée automatiquement par le pipeline, ou `prisma migrate deploy`).
2. Créer le bucket privé `email-attachments` dans Supabase Storage.
3. Définir en prod : `INBOUND_EMAIL_SECRET`, `SUPABASE_URL`, `SUPABASE_SERVICE_KEY` (côté API).
4. Lancer `scripts/create-mailbox.ts` avec le vrai compte du Dr Ahmad et l'adresse `ahmadalashry@reset-egypt.com`.
5. Déployer le Worker (`wrangler deploy` + 3 secrets) — cf. `workers/inbound-email/README.md`.
6. Cloudflare Email Routing : router `ahmadalashry@reset-egypt.com` vers le Worker `reset-inbound-email` (créer l'alias si nécessaire — cf. spec §13).
7. Déployer le frontend.
8. Test bout-en-bout : envoyer un email à `ahmadalashry@reset-egypt.com` depuis un compte externe → vérifier qu'il apparaît dans `/courrier` ET dans Gmail (filet).
9. Phase de confiance, puis retrait du `message.forward()` Gmail du Worker quand le Dr Ahmad valide.
