# Messagerie praticien — Design

> **Statut** : validé en brainstorming, en attente de relecture utilisateur avant plan d'implémentation
> **Date** : 2026-05-14
> **Périmètre** : v1 — boîte email intégrée pour le Dr Ahmad Al Ashry

---

## 1. Contexte & objectif

Le système RESET (monorepo `apps/api`, `apps/web`, `apps/booking`, `apps/site`) gère
une clinique d'auriculothérapie. La réception des emails du domaine `reset-egypt.com`
vient d'être configurée via **Cloudflare Email Routing** : 4 alias (`secretary@`,
`dr.ahmadalashry@`, `direction@`, `hello@`) sont forwardés vers `resetegypt@gmail.com`.
L'envoi transactionnel (factures) passe par **Resend** (domaine `reset-egypt.com`
vérifié, DKIM OK).

**Objectif** : intégrer la **réception ET l'envoi** de l'adresse email du
Dr Ahmad Al Ashry directement dans son espace praticien de l'app web RESET — une
vraie messagerie (liste de threads + lecture + composer), utilisable au quotidien.

L'ambition exprimée est de « remplacer Gmail » pour cette adresse. Le présent design
vise un **v1 solide qui couvre le workflow réel du praticien** — pas un clone de Gmail.
Les fonctions avancées d'un client mail mûr (anti-spam, labels, règles) sont
explicitement hors périmètre v1 (§10).

## 2. Exigences (issues du brainstorming)

| # | Question | Réponse | Implication |
|---|----------|---------|-------------|
| Q1 | Qui peut consulter la boîte ? | **Dr Ahmad + admin** ; secrétaire exclue | Permissions : `requireMailboxAccess` = propriétaire OU ADMIN ; SECRETARY → 403 |
| Q2 | Intensité d'usage ? | **Remplacer Gmail** (gros volume, archivage, recherche) | Pagination, recherche full-text, archivage, robustesse |
| Q3 | Quel appareil ? | **Desktop + mobile** | Écran `/courrier` responsive (3 colonnes desktop, 1 colonne mobile) |
| Q4 | Import de l'historique Gmail ? | **Non** | v1 démarre sur une boîte vide ; aucun import IMAP |

Décision complémentaire prise en présentation du design : **l'admin a un accès
lecture *et* écriture** (peut lire, envoyer, répondre, archiver). Seule la secrétaire
est exclue.

## 3. Approche retenue & alternatives rejetées

**Retenue — Approche A : Cloudflare Email Worker → webhook API.**
Pour l'adresse du praticien uniquement, la route Cloudflare passe de « Send to an
email » à « Send to a Worker ». Un petit Worker Cloudflare parse l'email entrant et
le POST vers un webhook de l'API RESET, qui le persiste. Le Worker forwarde *aussi*
vers Gmail pendant la phase de confiance (filet de sécurité).

*Pourquoi* : gratuit (Workers free tier), ne défait pas le setup Cloudflare existant,
isolation par-adresse (seul le courrier du praticien entre dans l'app), aucun nouveau
fournisseur.

**Rejetée — Approche B : Resend Inbound.** Exige les MX pointés vers Resend →
conflit direct avec le Cloudflare Email Routing tout juste configuré ; défait le
travail existant. Fonction inbound de Resend limitée / potentiellement payante.

**Rejetée — Approche C : boîte hébergée + IMAP.** Payante (refusée par
l'utilisateur), conflit MX également, polling IMAP fragile, et l'app n'a aucun
système de jobs/cron — il faudrait le construire.

## 4. Architecture & flux de données

### 4.1 Réception (inbound)
```
Email externe
  └→ MX reset-egypt.com (Cloudflare)
     └→ Email Routing : route ahmadalashry@ → Email Worker
        └→ Worker : parse l'email (postal-mime) — headers, corps, pièces jointes
           ├→ POST /inbound/email vers l'API RESET (header X-Webhook-Secret)
           │    └→ API : persiste EmailThread + EmailMessage + EmailAttachment
           │         └→ PJ stockées dans Supabase Storage
           │              └→ liaison patient si fromAddress = Patient.email
           └→ message.forward('resetegypt@gmail.com')  — filet de sécurité v1
```

### 4.2 Envoi (outbound)
```
Dr Ahmad (ou admin) compose/répond dans l'app
  └→ POST /practitioner-mail/send (API, authentifié JWT)
     └→ Resend : envoi (from: "Dr Ahmad Al Ashry <ahmadalashry@reset-egypt.com>",
        headers In-Reply-To / References pour le threading)
        └→ API : persiste EmailMessage (direction OUTBOUND, sentByUserId = caller)
```

### 4.3 Consultation
```
Dr Ahmad ou admin ouvre /courrier
  └→ React Query → GET /practitioner-mail/threads
     └→ API : filtre STRICTEMENT par la mailbox du user (ou admin) — scoping privé
        └→ UI : liste threads / thread ouvert / composer (responsive)
```

### 4.4 Emplacement du code
| Élément | Emplacement |
|---------|-------------|
| Cloudflare Worker | nouveau dossier `workers/inbound-email/` (déploiement Cloudflare séparé, hors build Vercel) |
| Backend module | `apps/api/src/modules/practitioner-mail/` |
| Backend webhook | route `/inbound/email` (enregistrée hors du module authentifié) |
| Frontend | `apps/web/src/pages/mail/` + route `/courrier` |
| Base de données | nouveaux modèles Prisma (§5) |
| Stockage PJ | bucket privé Supabase Storage `email-attachments` |

## 5. Modèle de données

**Décision : modèles dédiés, séparés du modèle `Message` existant.**
Le modèle `Message` est patient-centré et alimente l'**Inbox d'équipe** existante
(`apps/web/src/pages/inbox/InboxPage.tsx`), accessible à la secrétaire. Mélanger le
courrier privé du praticien dans cette table ferait reposer la confidentialité sur
un filtre `WHERE` correct dans chaque requête — un oubli = fuite de correspondance
médicale vers la secrétaire. Une table séparée rend la fuite **impossible par
construction**.

### 5.1 Nouveaux modèles Prisma

```prisma
// Boîte email d'un praticien — 1 par user ayant une adresse @reset-egypt.com
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

// Fil de discussion — regroupe les emails d'une même conversation
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

// Email individuel
model EmailMessage {
  id           String      @id @default(uuid())
  mailboxId    String
  mailbox      Mailbox     @relation(fields: [mailboxId], references: [id], onDelete: Cascade)
  threadId     String
  thread       EmailThread @relation(fields: [threadId], references: [id], onDelete: Cascade)
  direction    Direction                // INBOUND | OUTBOUND (enum existant réutilisé)
  messageId    String      @unique       // Message-ID RFC822
  inReplyTo    String?                  // header In-Reply-To, pour le threading
  references   String[]    @default([]) // header References, pour le threading
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

// Pièce jointe — métadonnées en base, fichier dans Supabase Storage
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

### 5.2 Ajouts aux modèles existants
```prisma
model User {
  // ...existant...
  mailbox    Mailbox?
  sentEmails EmailMessage[] @relation("EmailSentBy")
}

model Patient {
  // ...existant...
  emailThreads EmailThread[]
}
```

L'enum `Direction` (`INBOUND` / `OUTBOUND`) existe déjà et est réutilisé.

## 6. Backend

### 6.1 Module `apps/api/src/modules/practitioner-mail/`

Toutes les routes sont derrière `app.authenticate` (JWT) **et** un helper
`requireMailboxAccess(req, mailboxId)` :
- autorise si `req.currentUser.sub` == `mailbox.userId` (propriétaire)
- autorise si `req.currentUser.role` == `ADMIN`
- sinon → `403`

| Méthode & route | Description |
|-----------------|-------------|
| `GET /practitioner-mail/threads?archived=&starred=&q=&cursor=` | Liste paginée des threads de la mailbox du caller (admin : mailbox ciblée). Filtres archivé/favori, recherche full-text (`q` sur subject + snippet + participants). |
| `GET /practitioner-mail/threads/:id` | Un thread + tous ses `EmailMessage` (triés `sentAt` asc) + attachments. |
| `POST /practitioner-mail/threads/:id/read` | Marque tous les emails du thread comme lus ; `unreadCount = 0`. |
| `POST /practitioner-mail/threads/:id/archive` | Toggle `isArchived`. |
| `POST /practitioner-mail/threads/:id/star` | Toggle `isStarred`. |
| `POST /practitioner-mail/send` | Composer un nouvel email OU répondre. Body : `{ threadId?, to[], cc[], subject, bodyText, bodyHtml, attachmentIds[] }`. Envoie via Resend, persiste `EmailMessage` OUTBOUND avec `sentByUserId = caller`. Si `threadId` fourni → rattache au thread + remplit `inReplyTo`/`references`. |
| `POST /practitioner-mail/attachments` | Upload d'une PJ pour un email en cours de composition → Supabase Storage, retourne un `attachmentId` temporaire. |
| `GET /practitioner-mail/attachments/:id` | Download : vérifie l'ownership via le thread parent, puis renvoie une URL signée Supabase Storage de courte durée (quelques minutes). |
| `GET /practitioner-mail/unread-count` | Compteur de threads non lus, pour le badge sidebar. |

L'envoi réutilise `apps/api/src/lib/email.ts` (`sendEmail`), **étendu** pour accepter
un `from` paramétrable (actuellement figé sur `env.SMTP_FROM`) et des headers
custom (`In-Reply-To`, `References`, `Reply-To`).

### 6.2 Webhook `POST /inbound/email`

Route **non authentifiée par JWT** (machine-à-machine), enregistrée hors du module
authentifié. Authentification : header `X-Webhook-Secret` comparé à
`env.INBOUND_EMAIL_SECRET` en **temps constant**. Rate-limit appliqué.

Body (JSON, envoyé par le Worker) : `to`, `from`, `fromName`, `subject`,
`messageId`, `inReplyTo`, `references[]`, `bodyText`, `bodyHtml`, `attachments[]`
(`{ filename, contentType, sizeBytes, contentBase64 }`).

Logique :
1. Valide le secret (sinon `401`).
2. Trouve la `Mailbox` par `to` (adresse normalisée lowercase). Inconnue → `404`,
   logué (ne devrait pas arriver : Cloudflare ne route que les adresses configurées).
3. **Threading** : si `inReplyTo` ou un id de `references` correspond au `messageId`
   d'un `EmailMessage` existant de cette mailbox → rattache au même `EmailThread`.
   Sinon → crée un nouveau `EmailThread`.
4. Persiste `EmailMessage` (`direction = INBOUND`, `status = RECEIVED`,
   `isRead = false`).
5. Pièces jointes → Supabase Storage + lignes `EmailAttachment`.
6. **Liaison patient** : si `fromAddress` correspond (insensible à la casse) à un
   `Patient.email` → `EmailThread.patientId` renseigné.
7. Met à jour le thread : `lastEmailAt`, `unreadCount++`, ajoute l'expéditeur aux
   `participants` si absent.
8. Idempotence : si un `EmailMessage` avec ce `messageId` existe déjà → `200` no-op
   (Cloudflare peut rejouer).

### 6.3 Cloudflare Worker `workers/inbound-email/`

Dossier autonome avec son `wrangler.toml`, `package.json`, déployé via
`wrangler deploy` (hors pipeline Vercel). ~30-50 lignes :

```js
import PostalMime from 'postal-mime';

export default {
  async email(message, env) {
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);

    const payload = {
      to: message.to,
      from: parsed.from?.address,
      fromName: parsed.from?.name,
      subject: parsed.subject,
      messageId: parsed.messageId,
      inReplyTo: parsed.inReplyTo,
      references: parsed.references ?? [],
      bodyText: parsed.text,
      bodyHtml: parsed.html,
      attachments: (parsed.attachments ?? []).map((a) => ({
        filename: a.filename,
        contentType: a.mimeType,
        sizeBytes: a.content.byteLength,
        contentBase64: bufferToBase64(a.content),
      })),
    };

    // 1. POST vers l'API RESET
    await fetch(`${env.RESET_API_URL}/inbound/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.INBOUND_EMAIL_SECRET,
      },
      body: JSON.stringify(payload),
    });

    // 2. Filet de sécurité v1 : forward aussi vers Gmail
    await message.forward(env.GMAIL_FALLBACK);
  },
};
```

Secrets Worker (via `wrangler secret`) : `RESET_API_URL`, `INBOUND_EMAIL_SECRET`,
`GMAIL_FALLBACK`.

### 6.4 Nouvelles variables d'environnement
| Variable | Où | Rôle |
|----------|-----|------|
| `INBOUND_EMAIL_SECRET` | API + Worker | Secret partagé du webhook |
| `SUPABASE_URL` | API | Endpoint Supabase Storage (si pas déjà présent) |
| `SUPABASE_SERVICE_KEY` | API | Clé service pour Storage (si pas déjà présent) |

À ajouter à `.env.example` et `apps/api/src/env.ts`.

## 7. Frontend

### 7.1 Route & visibilité

Nouvelle route `/courrier` dans `apps/web` (React Router v6). Entrée de sidebar dans
`AppShell.tsx` (`NAV[]`), visible **uniquement** si le user courant a une `mailbox`
OU est `ADMIN`. Le compteur non-lus alimente un badge (réutilise le pattern de
polling de `/stats/unread` existant).

### 7.2 Layout responsive (exigence Q3-B)

- **Desktop ≥1024px** : 3 colonnes — `[liste threads 320px] [thread ouvert 1fr] [panneau contexte 280px]` (calque le pattern de `InboxPage.tsx`).
- **Mobile <1024px** : une seule colonne à la fois — liste → (tap) thread ouvert → (bouton retour). Composer en plein écran. Panneau contexte accessible via un bouton.

### 7.3 Composants (`apps/web/src/pages/mail/`)
| Composant | Rôle |
|-----------|------|
| `MailPage.tsx` | Shell, bascule de layout responsive, état de sélection thread |
| `ThreadList.tsx` | Liste des threads : expéditeur, sujet, snippet, date, pastille non-lu, étoile, filtre archivé/favori, champ recherche |
| `ThreadView.tsx` | Thread ouvert : emails empilés (dernier déplié), PJ en chips téléchargeables, boutons Répondre / Archiver / Étoile |
| `Composer.tsx` | Composer/répondre : champs to/cc/sujet/corps, upload PJ, bouton Envoyer ; pré-rempli en mode réponse |
| `MailContextPanel.tsx` | Panneau droit desktop : si thread lié à un patient → carte patient + liens « fiche patient » / « créer RDV » (réutilise le pattern de l'Inbox d'équipe) |

### 7.4 Données

React Query :
- `useQuery(['mail-threads', filters])` — liste, polling 30s
- `useQuery(['mail-thread', id])` — thread ouvert
- `useQuery(['mail-unread'])` — badge sidebar, polling 30s
- `useMutation` — send, read, archive, star, upload PJ

Le client API (`apps/web/src/lib/api.ts`) est réutilisé tel quel.

## 8. Sécurité & confidentialité

- **Webhook `/inbound/email`** : secret partagé `X-Webhook-Secret`, comparaison en
  temps constant, rate-limité, jamais de JWT. Pas d'info sensible dans les logs.
- **Routes `/practitioner-mail/*`** : `requireMailboxAccess` sur chaque route —
  propriétaire OU `ADMIN`. `SECRETARY` et tout autre praticien → `403`.
- **Isolation structurelle** : modèles dédiés → l'Inbox d'équipe existante
  (table `Message`) ne peut jamais afficher ce courrier, indépendamment des requêtes.
- **Traçabilité** : les accès `ADMIN` à la boîte et les envois (`sentByUserId`) sont
  enregistrés via `recordAudit` (helper existant `apps/api/src/lib/audit.ts`).
- **Pièces jointes** : bucket Supabase **privé**, jamais d'URL publique ; download
  uniquement via route API contrôlée renvoyant une URL signée de courte durée.
- **Données médicales** : la correspondance peut contenir des informations de santé.
  Le scoping par mailbox + l'exclusion de la secrétaire + l'audit log couvrent les
  exigences de confidentialité du v1.

## 9. Pièces jointes

- **Stockage** : Supabase Storage, bucket privé `email-attachments`,
  clé `{mailboxId}/{emailId}/{filename}`.
- **Inbound** : le Worker envoie les PJ en base64 dans le payload webhook ; l'API les
  décode et les upload. Limite de taille de message Cloudflare ≈ 25 MB (suffisant).
- **Outbound** : upload via `POST /practitioner-mail/attachments` avant l'envoi ;
  limite 25 MB cumulés (contrainte Resend). Types courants acceptés.
- **Download** : `GET /practitioner-mail/attachments/:id` vérifie l'ownership puis
  renvoie une URL signée Supabase Storage expirant en quelques minutes.

## 10. Périmètre

### Dans le v1 ✅
Réception, envoi, réponses avec threading (`In-Reply-To`/`References`), lu/non-lu,
archivage, favori (étoile), pièces jointes (envoi + réception + téléchargement),
recherche full-text, liaison automatique au patient, layout responsive
desktop+mobile, badge non-lus en sidebar, forward Gmail parallèle (filet de
sécurité), accès admin lecture+écriture, audit log.

### Hors v1 ❌ (YAGNI)
Anti-spam (on s'appuie sur le filtrage amont de Cloudflare), dossiers/labels
personnalisés, brouillons auto-sauvegardés, signatures multiples, règles de filtrage
automatiques, import de l'historique Gmail (refusé Q4), notifications push natives
mobile (l'app est web — le badge in-app suffit), carnet de contacts, multi-mailbox
pour un même user, rich text editor avancé dans le composer (corps en texte +
HTML simple suffit au v1).

## 11. Stratégie de tests

- **Unitaires** : parsing du payload webhook ; logique de threading
  (match `inReplyTo`/`references` → thread existant vs nouveau) ; liaison patient
  (match email) ; `requireMailboxAccess` (propriétaire ✓, admin ✓, secrétaire ✗,
  autre praticien ✗) ; idempotence webhook (`messageId` dupliqué).
- **Intégration** : `POST /inbound/email` crée thread + message + attachments ;
  `POST /practitioner-mail/send` appelle Resend (mocké) et persiste OUTBOUND avec
  `sentByUserId` ; `GET /practitioner-mail/threads` scopé à la bonne mailbox ;
  `403` pour la secrétaire.
- **Worker** : test avec un email brut (fixture RFC822) → vérifier le shape du
  payload POST et l'appel `forward`.
- **Frontend** : tests de rendu des composants clés (liste, thread, composer) et de
  la bascule de layout responsive.

## 12. Plan de déploiement (rollout)

1. Migration Prisma + déploiement API (module + webhook) — inactif tant qu'aucune
   `Mailbox` n'existe.
2. Créer la `Mailbox` du Dr Ahmad en base (seed ou endpoint admin ponctuel).
3. Déployer le Worker Cloudflare + configurer ses secrets.
4. Cloudflare Email Routing : basculer la route de l'adresse du praticien de
   « Send to an email » vers « Send to a Worker ». Le Worker forwarde **aussi** vers
   Gmail → aucun courrier perdu.
5. Déployer le frontend (`/courrier`).
6. **Phase de confiance** : le courrier arrive simultanément dans l'app ET sur Gmail.
7. Quand le Dr Ahmad est confiant : retirer le `message.forward()` Gmail du Worker
   (ou le conserver indéfiniment comme archive — au choix de l'utilisateur).

## 13. Décisions prises & questions ouvertes

### Décisions prises
- Modèles de données dédiés (pas de réutilisation de `Message`) — confidentialité
  structurelle.
- Admin : accès **lecture + écriture** ; secrétaire exclue.
- Approche A (Cloudflare Email Worker → webhook).
- Pas d'import d'historique : le v1 démarre sur une boîte vide.
- Forward Gmail parallèle conservé pendant la phase de confiance.
- Envoi via Resend (`lib/email.ts` étendu pour `from` + headers custom).
- **Adresse canonique** : `ahmadalashry@reset-egypt.com` (telle qu'écrite dans la
  demande initiale). N'affecte pas l'architecture — simple chaîne stockée dans
  `Mailbox.address`. **Action opérationnelle requise avant mise en service** :
  l'alias créé dans Cloudflare est actuellement `dr.ahmadalashry@reset-egypt.com` ;
  créer/ajuster la route Cloudflare pour qu'elle pointe vers `ahmadalashry@` (ou
  ajouter l'alias). À confirmer avec l'utilisateur au moment du rollout.

### Notes opérationnelles (post-v1, sans impact sur le code)
- **Conservation du forward Gmail** : à décider après la phase de confiance — le
  supprimer du Worker, ou le garder indéfiniment comme archive de secours.
