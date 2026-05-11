# 🎯 PROMPT POUR CLAUDE CODE — Projet Reset Egypt

## Contexte du projet

Tu vas développer une **application web métier complète** pour Reset Egypt, un centre d'auriculothérapie laser situé à New Cairo (Égypte). Le centre traite les addictions (tabac, alcool, drogues, sucre) et le stress par auriculothérapie + photobiomodulation laser non-invasive.

L'application est une plateforme intégrée comprenant **13 modules** servant 3 types d'utilisateurs : **Direction (admin)**, **Praticiens** et **Secrétaires**, plus une page de réservation publique pour les **Patients**.

---

## 🎯 OBJECTIF PRINCIPAL

Construire une application web SaaS métier en utilisant la stack technique précisée, en suivant les spécifications fonctionnelles complètes ci-dessous. L'application doit être **production-ready**, **sécurisée**, **multilingue (FR/AR/EN avec support RTL pour l'arabe)** et **conforme à la législation égyptienne** (Loi 151/2020 sur la protection des données + e-invoicing ETA).

---

## 📋 STACK TECHNIQUE OBLIGATOIRE

### Frontend
- **React 18 + TypeScript**
- **Tailwind CSS** pour le styling
- **shadcn/ui + Radix UI** pour les composants (support RTL natif)
- **react-i18next** pour le multilinguisme (FR/AR/EN)
- **Chart.js + Recharts** pour les graphiques
- **React Router v6** pour la navigation
- **Zustand** pour le state management global
- **TanStack Query (React Query)** pour les appels API

### Backend
- **Node.js 20+ avec Fastify** (préféré à Express pour les performances)
- **TypeScript** (strict mode)
- **PostgreSQL 16** comme base de données principale
- **Prisma ORM** pour les migrations et requêtes
- **Redis 7** pour cache et file d'attente
- **BullMQ** pour les jobs asynchrones (SMS, relances)
- **JWT** pour l'authentification (cookies httpOnly)
- **bcrypt** (cost factor 12) pour le hashage des mots de passe
- **Zod** pour la validation des schémas

### Intégrations APIs externes
- **WhatsApp Business Cloud API** (Meta) pour les messages WhatsApp
- **Twilio** pour les SMS (fallback)
- **Brevo (ex-Sendinblue)** pour les emails transactionnels
- **Instagram Graph API + Messenger Webhook** pour l'inbox unifiée
- **Paymob ou Fawry** pour les paiements en ligne (Égypte)
- **Egyptian Tax Authority (ETA) API** pour la facturation électronique
- **Google Calendar API** pour synchronisation agendas praticiens
- **AWS S3 (ou Backblaze B2)** pour le stockage de fichiers

### Infrastructure
- **Docker + docker-compose** pour le développement local
- **Nginx ou Caddy** comme reverse proxy
- **Let's Encrypt** pour SSL
- **GitHub Actions** pour CI/CD
- **Sentry** pour error tracking
- **Hetzner Cloud (Allemagne)** ou VPS local pour l'hébergement de production

---

## 🗂️ STRUCTURE DU PROJET ATTENDUE

```
reset-egypt/
├── apps/
│   ├── web/                    # Frontend React (espaces secrétaire/praticien/admin)
│   │   ├── src/
│   │   │   ├── components/     # Composants réutilisables
│   │   │   ├── modules/        # Les 13 modules métier
│   │   │   ├── hooks/
│   │   │   ├── stores/         # Zustand stores
│   │   │   ├── lib/
│   │   │   ├── i18n/
│   │   │   │   ├── fr.json
│   │   │   │   ├── ar.json
│   │   │   │   └── en.json
│   │   │   ├── routes/
│   │   │   └── styles/
│   │   ├── public/
│   │   └── package.json
│   ├── api/                    # Backend Fastify
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   ├── plugins/
│   │   │   ├── workers/        # BullMQ workers
│   │   │   ├── lib/
│   │   │   └── server.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   └── package.json
│   └── booking/                # Site de réservation patient (public)
│       └── src/
├── packages/
│   ├── shared/                 # Types partagés
│   └── ui/                     # Composants UI partagés
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 👥 SYSTÈME D'AUTHENTIFICATION ET RÔLES (À CONSTRUIRE EN PREMIER)

### 3 rôles avec permissions distinctes

#### 👑 ADMIN (Direction)
- **Accès à TOUS les modules**
- Gestion des comptes utilisateurs (création, modification, désactivation)
- Visibilité sur les statistiques financières globales
- Logs d'audit complets
- Configuration système (tarifs, IP whitelist, paramètres sécurité)
- Page d'accueil après login : **Dashboard Statistiques globales**

#### 🩺 PRACTITIONER (Praticien)
- Accès à ses propres RDV uniquement
- Création/modification des fiches cliniques (Étape 2)
- Lecture des dossiers patients
- Notes cliniques privées (visibles uniquement par lui)
- Ses propres statistiques de performance
- **PAS d'accès** : caisse, gestion comptes, stats globales financières
- Page d'accueil : **Mon agenda du jour**

#### 👤 SECRETARY (Secrétaire)
- Tableau de bord opérationnel
- Création/modification de tous les RDV
- Création des fiches d'accueil patient (Étape 1)
- Encaissement et facturation
- Inbox unifiée multicanale
- Gestion des relances SMS/WhatsApp
- Lecture des dossiers patients (sans notes cliniques privées)
- **PAS d'accès** : notes cliniques privées, stats financières globales, gestion comptes
- Page d'accueil : **Tableau de bord secrétaire**

### Politique de sécurité

- Email + mot de passe (12 caractères min pour Admin/Praticien, 8 min pour Secrétaire)
- Hashage bcrypt cost 12
- **2FA désactivée** (selon décision client)
- **IP whitelist activée par défaut** (configurable depuis admin)
- Verrouillage automatique après 5 tentatives échouées (30 min ou déblocage admin)
- Notification email à chaque nouvelle connexion
- Sessions JWT 8 heures max, "Rester connecté" 7 jours
- Déconnexion automatique après 30 min d'inactivité
- Logs d'audit conservés 5 ans (conformité légale)
- Renouvellement de mot de passe obligatoire tous les 90 jours
- Aucune création de compte en libre-service

---

## 📐 RÈGLES MÉTIER FONDAMENTALES

### Horaires et créneaux
- **Centre ouvert 7j/7** : 10h00 → 22h00
- **2 shifts** : Matin 10h-16h (9 créneaux) + Soir 16h-22h (9 créneaux) = **18 créneaux/jour**
- **Durée d'une séance** : 40 minutes strictement, dos à dos (pas de battement)
- **Pause flexible** : selon affluence (généralement entre 13h et 14h, à la discrétion des praticiens)
- **2 praticiens** qui se relaient sur la journée complète (PAS en parallèle)
- **Capacité hebdomadaire** : 126 séances · **Capacité mensuelle** : ~540 séances

### Logique d'assignation des praticiens
- **Patient connu** → praticien précédent suggéré par défaut (continuité du suivi)
- **Patient peut demander à changer** de praticien à tout moment
- **Nouveau patient** → assignation libre selon disponibilité

### Services et tarifs (à paramétrer)
| Service | 1ère séance | Suivi (~45%) |
|---------|-------------|--------------|
| Sevrage tabagique | 3 500 EGP | ~1 500 EGP |
| Sevrage drogues | 4 000 EGP | ~1 800 EGP |
| Sevrage alcool | 4 000 EGP | ~1 800 EGP |
| Sucre | 2 500 EGP | ~1 100 EGP |
| Stress / anxiété | 2 000 EGP | ~900 EGP |

### TVA et facturation
- TVA égyptienne : **14%** (à vérifier exonération possible pour services bien-être avec comptable)
- Numérotation séquentielle obligatoire : `INV-YYYY-NNNN`
- Soumission obligatoire à l'API ETA (tax.gov.eg) avec UUID + hash + QR code
- Conservation 5 ans minimum

### Workflow patient en 5 étapes
1. **Réservation** : site web (auto-saisi dans calendrier) OU téléphone/WhatsApp (saisie manuelle secrétaire)
2. **Accueil** : secrétaire remplit la fiche administrative (Étape 1)
3. **Consultation** : praticien remplit la fiche clinique (Étape 2)
4. **Encaissement** : secrétaire émet facture conforme ETA
5. **Suivi long terme** : SMS automatiques J+1, J+7, J+30, J+90

---

## 📦 LES 13 MODULES À DÉVELOPPER

### Module 0a : Authentification multi-rôles
- Login email + mot de passe
- Sélection du rôle (admin/praticien/secrétaire)
- Récupération de mot de passe par email
- Logs de connexion
- Gestion des sessions

### Module 0b : Admin gestion utilisateurs (Admin only)
- Liste des comptes avec recherche et filtres
- Création/modification/désactivation/réactivation
- Réinitialisation de mot de passe
- Déverrouillage des comptes bloqués
- Journal d'audit avec export CSV
- Configuration politique de sécurité globale (verrouillage, durées, IP whitelist)
- KPIs : comptes actifs, connectés, verrouillés, échecs 24h

### Module 1 : Tableau de bord secrétaire
- 4 KPIs du jour : RDV programmés, demandes en attente, relances à envoyer, recettes
- Liste chronologique des RDV du jour avec statut (confirmé/en attente/en cours/terminé/no-show)
- Boîte de réception unifiée des canaux (preview)
- Boutons d'actions rapides : créer fiche, encaisser, relance SMS, agenda

### Module 2 : Création de rendez-vous
- Recherche de patient existant (nom ou téléphone) avec autocomplétion
- Création à la volée pour nouveau patient
- Sélection : service (5 types), type de visite (1ère/suivi), date, créneau (parmi 18)
- Détection automatique des conflits horaires
- Pré-suggestion du praticien habituel pour patients connus
- Calcul automatique du tarif (service × type)
- Source de la demande (tracking marketing)
- Programmation automatique des SMS de rappel à la confirmation
- Verrouillage temps réel du créneau (WebSocket)

### Module 3 : Fiche d'accueil patient (Étape 1 - Secrétaire)
**Champs collectés** :
- Identité : prénom, nom, date de naissance (avec calcul auto de l'âge), sexe
- Coordonnées : téléphone principal (obligatoire), WhatsApp, email, adresse, gouvernorat
- Profil : profession, situation familiale
- Source d'acquisition (chip select multi : Instagram, Facebook, Google, bouche-à-oreille, médecin, autre)
- Motif : type d'addiction principal, nombre de tentatives précédentes, niveau de motivation
- Contact d'urgence : nom, lien, téléphone
- 3 consentements obligatoires : RGPD/Loi 151, autorisation SMS, reconnaissance non-médical
- Zone de signature électronique (tablette)

**Logique** : détection automatique des patients déjà connus pour pré-remplissage. Bouton "Transmettre au praticien" verrouillé tant que les champs essentiels ne sont pas remplis.

### Module 4 : Fiche clinique praticien (Étape 2 - Praticien)
**Multilingue FR/AR/EN avec RTL pour l'arabe**.

**Sections** :
- **Anamnèse** : durée addiction, quantité quotidienne, tentatives précédentes, méthodes essayées, durée du plus long arrêt
- **Déclencheurs et contexte** : situations qui déclenchent l'envie (multi-select), moments de consommation typiques
- **Évaluations sur échelles 0-10** (sliders interactifs) : stress, anxiété, force des envies, qualité du sommeil, motivation
- **Antécédents médicaux et contre-indications** :
  - ⚠️ Pacemaker, Épilepsie, Grossesse → **alerte automatique en rouge**
  - Diabète, Hypertension, Maladie auto-immune
  - Médicaments en cours, Allergies connues
- **Tests cliniques** affichés **dynamiquement selon l'addiction** :
  - Tabac → **Fagerström** (6 questions, score 0-10) + HAD
  - Alcool → **AUDIT** (10 questions, score 0-40) + HAD
  - Drogues → **DUDIT** (11 questions, score 0-44) + HAD
  - Sucre → **YFAS** (Yale Food Addiction Scale) + HAD
  - Stress/anxiété → **HAD** (Hospital Anxiety Depression, 14 questions)
- **Mesures objectives** : poids, taille, **IMC auto-calculé** (alerte si <18,5 ou >30), saturation O2 (SpO2)
- **Plan thérapeutique** : points auriculaires ciblés, durée stimulation laser (15/20/25/30 min), prochaine séance recommandée (1 semaine, 15j, 1 mois, 3 mois)
- **Notes cliniques privées** (visibles uniquement par le praticien) avec pièces jointes (photos, audio, documents)

### Module 5 : Dossier patient unifié
- Bandeau identité avec étiquettes (suivi en cours, type addiction, etc.)
- 4 KPIs : nombre de séances, total payé, ancienneté du suivi, **score d'évolution calculé automatiquement**
- **Graphique d'évolution clinique multi-courbes** (Chart.js) : stress, envies, sommeil sur toutes les séances
- Historique chronologique de toutes les séances avec statut paiement
- Communications récentes par canal (avec icônes WA/IG/Email)
- Documents : consentements, photos, factures
- Profil clinique synthétique
- Actions rapides : appeler, WhatsApp, programmer un nouveau RDV, modifier, imprimer

**Calcul du score d'évolution** :
```
Score = (Σ valeurs négatives initiales − Σ valeurs négatives actuelles) ÷ valeurs initiales × 100
```

### Module 6 : Encaissement et facturation
- **Articles facturables** : ajout manuel ou via templates fréquents (forfait 5 séances, carte fidélité, suivi mensuel)
- Quantité et prix unitaire éditables
- **Remise** : pourcentage ou montant fixe
- **Codes promo** : RESET10 (-10%), RESET20 (-20%), NEWPATIENT (-15%) (paramétrables)
- **6 moyens de paiement** :
  1. Espèces (avec calcul automatique de la monnaie)
  2. Carte bancaire (référence transaction 4 derniers chiffres)
  3. Vodafone Cash (numéro téléphone)
  4. Instapay (numéro téléphone)
  5. Fawry (numéro téléphone)
  6. Virement bancaire
- **Calcul automatique TVA 14%** (HT/TTC)
- **Génération facture PDF** avec logo Reset, en-tête, identifiants fiscaux (TIN, N° commercial)
- **Soumission API ETA** automatique avec UUID retourné, hash, QR code
- **Aperçu temps réel** de la facture pendant la saisie
- Actions : Brouillon, Imprimer, Envoyer par email/WhatsApp, Encaisser

**Workflow après "Encaisser"** :
1. PDF définitif généré
2. Numéro INV-YYYY-NNNN attribué
3. Stockage S3 + dossier patient
4. Soumission ETA
5. Envoi WhatsApp/email au patient
6. SMS de remerciement
7. Mise à jour KPI
8. Programmation SMS suivi (J+7, J+30, J+90)

### Module 7 : Réservation en ligne (site web public)
**Wizard en 4 étapes pour les patients**, intégré sur reset-egypt.com via /book.
**Multilingue FR/AR/EN**.

- **Étape 1** : Sélection du service (5 cards visuelles avec icône, nom, description, tarif "à partir de")
- **Étape 2** : Type de séance (1ère / suivi) + Date (calendrier 14 jours) + Créneau (parmi 18, ceux occupés barrés en temps réel)
- **Étape 3** : Coordonnées (prénom, nom, téléphone WhatsApp obligatoires, email, âge, source acquisition, première fois ou suivi)
- **Étape 4** : Récapitulatif + message optionnel + 2 consentements + Confirmation

**Logique** :
- **WebSocket** pour synchronisation temps réel avec calendrier secrétaire (le RDV apparaît instantanément)
- **reCAPTCHA v3** invisible
- Limitation 3 RDV / IP / 24h
- Validation format téléphone international
- Confirmation immédiate par SMS + email
- Numéro de confirmation type RES-YYYY-NNNN

### Module 8 : Statistiques globales (Direction)
- **4 KPIs principaux** avec comparaison période précédente : CA, séances réalisées, patients actifs, taux de réussite
- **Sélecteur de période** : Jour / Semaine / Mois / Année
- **Graphique évolution CA** sur 30 jours (Chart.js line)
- **Répartition par service** (donut chart)
- **Sources d'acquisition** (barres horizontales)
- **Taux de réussite par addiction** (bars colorées : vert si >80%, orange si 70-80%, rouge si <70%)
- **Performance des praticiens** : séances, score moyen évolution, note ★
- **Indicateurs opérationnels** : taux no-show (cible <5%), taux confirmation, délai 1ère réponse, panier moyen
- **KPI complémentaires** : NPS, taux de fidélisation, heure de pointe, score d'évolution clinique moyen
- **Alertes intelligentes** :
  - 🔴 Patients sans suivi depuis +30 jours (risque rechute) → bouton campagne de relance
  - 🟠 Créneaux libres en soirée → suggestion marketing
  - 🟢 Canal performant → suggestion d'augmenter le budget
- **Export PDF/Excel** des rapports
- **Scheduled reports** : envoi mensuel automatique le 1er du mois

### Module 9 : Relances automatiques (SMS / WhatsApp)
**6 workflows pré-configurés** :

| Workflow | Étapes |
|----------|--------|
| **Avant rendez-vous** | J-2 rappel · J-1 confirmation (réponse OUI/REPORT) · J0 bienvenue (2h avant) |
| **Après rendez-vous** | J+1 remerciement · J+3 demande d'avis Google |
| **Suivi long terme** | Auto-évaluation J+7 · J+30 · J+90 |
| **Récupération no-show** | J+0 (jour même) · J+2 reprogrammation |
| **Réactivation** | Patients sans RDV depuis +60 jours |
| **Anniversaire patient** | Message personnalisé + offre fidélité |

**Variables dynamiques** dans les templates : `{{prenom}}`, `{{date_rdv}}`, `{{heure_rdv}}`, `{{adresse}}`, `{{praticien}}`

**Logique d'envoi** :
1. Vérifier si patient a WhatsApp actif → envoyer WhatsApp (priorité, moins cher)
2. Sinon → fallback SMS Twilio
3. Si SMS échoue → notification secrétaire pour appel manuel
4. Désinscription automatique si réponse "STOP"

**Multilingue automatique** : détection de la langue patient depuis sa fiche, envoi du template correspondant.

**Interface** :
- Liste des 6 workflows avec stats (envois, taux lecture, taux réponse)
- Édition des templates (FR/AR/EN) avec aperçu
- File d'attente des prochains envois (24h)
- Templates de réponses rapides (adresse, tarifs, horaires, méthode, reprogrammer)

### Module 10 : Vue agenda hebdomadaire
- **Grille 7 jours × 18 créneaux** (rangées heures, colonnes jours)
- **Code couleur** :
  - 🟢 Vert (Dr. Reda) / 🟣 Violet (Dr. Layla)
  - 🔵 Bleu : RDV pris en ligne
  - 🟠 Orange : à confirmer
  - ⚪ Hachuré : pause flexible
- **Colonne du jour** mise en évidence
- **4 KPIs hebdo** en tête : RDV/capacité, occupation %, CA prévu, à confirmer
- **Filtres** : par praticien, par type d'addiction, recherche
- **4 vues** : Jour / Semaine / Mois / Liste
- **Drag & drop** des RDV avec validation anti-conflit
- **Clic créneau vide** → ouvre formulaire création
- **Clic RDV** → détail avec actions (modifier, annuler, encaisser, fiche patient)
- **Tooltip** au survol : nom, téléphone, dernière séance, notes
- **Adaptation mobile** : passage automatique en vue Jour avec swipe
- **Synchronisation Google Calendar** par praticien (lecture seule)
- **Export PDF** pour affichage en salle de pause
- **WebSocket** : mises à jour temps réel sans refresh

### Module 11 : Inbox unifiée multicanale
**Architecture en 3 colonnes**.

**Colonne gauche - Liste des conversations** :
- Toutes les discussions de tous les canaux fusionnées
- Icône colorée du canal d'origine (WA vert, IG rose, Messenger bleu, Email orange)
- Avatar + nom + preview dernier message
- Badge "non lu" + horodatage
- Recherche + filtres (Tous / Non lus / par canal)

**Colonne centrale - Conversation active** :
- Bandeau contact avec photo, nom, statut en ligne, canal
- Style messagerie moderne avec bulles
- Statuts de lecture (✓✓)
- Notes système jaunes (ex: "Auto: Confirmation envoyée")
- Auto-réponses différenciées (bulles bleues)
- Détection automatique de la langue du message entrant
- **Suggestions IA** contextuelles (à valider avant envoi)
- **Templates rapides** (chips au-dessus du compose) : adresse, tarifs, horaires, méthode, reprogrammer
- **Bouton "Créer RDV"** dans le compose → ouvre formulaire pré-rempli avec infos extraites
- Pièces jointes : fichiers + photos + audio
- Mention de l'utilisateur connecté qui répond

**Colonne droite - Profil contact** :
- Avatar + nom + statut (Prospect chaud / Patient existant / Nouveau)
- Coordonnées : téléphone, email, langue, source
- Suivi : statut, 1er contact, intérêt
- **Actions rapides** : Créer fiche patient, Planifier RDV, Ajouter étiquette, Programmer relance
- **Notes internes** privées (jamais visibles par le patient)
- **Étiquettes automatiques** attribuées selon le contenu

**KPI en pied** : conversations actives, délai 1ère réponse, conversion msg→RDV, auto-réponses du mois.

### Module 12 : Bonus - Mon agenda praticien (page d'accueil praticien)
- Vue jour personnel avec ses créneaux
- Liste de SES patients du jour avec lien vers fiche
- KPIs personnels : séances aujourd'hui, score moyen évolution patients, note ★

---

## 🌐 MULTILINGUISME (FR / AR / EN)

- Implémentation avec **react-i18next**
- 3 fichiers JSON : `fr.json`, `ar.json`, `en.json` (~400 clés à traduire)
- **Détection automatique** de la langue du navigateur
- Sauvegarde de la langue choisie en BDD (champ `users.preferred_language`)
- **RTL automatique** pour l'arabe : `<html dir="rtl">` + adaptation Tailwind RTL
- **Polices** :
  - Arabe : `Cairo` ou `IBM Plex Sans Arabic`
  - FR/EN : `Inter` ou `Geist`
- **Tarifs localisés** : `2 000 EGP` en FR, `٢٠٠٠ ج.م` en AR
- **Dates** : utiliser `date-fns` avec locales `fr`, `ar-EG`, `en`
- Côté patient (booking) : sélecteur de langue visible
- Côté staff : la langue suit la préférence du compte

---

## 🗄️ MODÈLE DE DONNÉES POSTGRESQL (Prisma)

```prisma
// schema.prisma — Schéma simplifié à étendre

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

  appointments      Appointment[] @relation("PractitionerAppointments")
  createdPatients   Patient[]     @relation("CreatedBy")
  auditLogs         AuditLog[]
}

enum Role {
  ADMIN
  PRACTITIONER
  SECRETARY
}

model Patient {
  id                  String   @id @default(uuid())
  firstName           String
  lastName            String
  dateOfBirth         DateTime?
  age                 Int?
  gender              Gender?
  phone               String   @unique
  whatsapp            String?
  email               String?
  address             String?
  governorate         String?
  profession          String?
  maritalStatus       String?
  acquisitionSource   String[]
  primaryAddiction    Addiction
  previousAttempts    String?
  motivationLevel     String?
  emergencyContact    Json?
  consents            Json
  preferredLanguage   String   @default("fr")
  preferredPractitionerId String?
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
  createdBy           User     @relation("CreatedBy", fields: [createdById], references: [id])
  createdById         String
  status              PatientStatus @default(ACTIVE)

  appointments        Appointment[]
  medicalRecords      MedicalRecord[]
  payments            Payment[]
  messages            Message[]
}

enum Gender { MALE FEMALE }
enum Addiction { TOBACCO DRUGS ALCOHOL SUGAR STRESS }
enum PatientStatus { ACTIVE ARCHIVED LOST }

model Appointment {
  id              String   @id @default(uuid())
  patientId       String
  patient         Patient  @relation(fields: [patientId], references: [id])
  practitionerId  String
  practitioner    User     @relation("PractitionerAppointments", fields: [practitionerId], references: [id])
  scheduledAt     DateTime
  duration        Int      @default(40) // minutes
  service         Addiction
  visitType       VisitType
  status          AppointmentStatus @default(SCHEDULED)
  source          String   // online | phone | whatsapp | walk-in
  price           Decimal
  notes           String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  medicalRecord   MedicalRecord?
  payment         Payment?

  @@index([scheduledAt])
  @@index([practitionerId, scheduledAt])
}

enum VisitType { FIRST FOLLOWUP CONSOLIDATION }
enum AppointmentStatus { SCHEDULED CONFIRMED IN_PROGRESS COMPLETED NO_SHOW CANCELLED }

model MedicalRecord {
  id                  String   @id @default(uuid())
  appointmentId       String   @unique
  appointment         Appointment @relation(fields: [appointmentId], references: [id])
  patientId           String
  patient             Patient  @relation(fields: [patientId], references: [id])

  // Anamnèse
  yearsOfAddiction    Int?
  dailyQuantity       String?
  previousMethods     String[]
  longestQuit         String?

  // Triggers
  triggers            String[]
  consumptionMoments  String?

  // Évaluations 0-10
  stressScore         Int?
  anxietyScore        Int?
  cravingScore        Int?
  sleepScore          Int?
  motivationScore     Int?

  // Médical
  contraindications   String[]
  medications         String?
  allergies           String?

  // Mesures objectives
  weight              Float?
  height              Float?
  bmi                 Float?
  spo2                Int?

  // Tests cliniques (selon addiction)
  fagerstromScore     Int?     // tabac
  auditScore          Int?     // alcool
  duditScore          Int?     // drogues
  yfasScore           Int?     // sucre
  hadAnxietyScore     Int?
  hadDepressionScore  Int?

  // Plan thérapeutique
  auricularPoints     String?
  laserDuration       Int?     // minutes
  nextSession         String?

  // Notes
  privateNotes        String?  // visibles uniquement par le praticien

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt
}

model Payment {
  id              String   @id @default(uuid())
  appointmentId   String?  @unique
  appointment     Appointment? @relation(fields: [appointmentId], references: [id])
  patientId       String
  patient         Patient  @relation(fields: [patientId], references: [id])
  invoiceNumber   String   @unique // INV-YYYY-NNNN
  items           Json     // lignes de facture
  subtotal        Decimal
  discount        Decimal  @default(0)
  vat             Decimal  // 14%
  total           Decimal
  paymentMethod   PaymentMethod
  paymentRef      String?
  etaUuid         String?  // UUID retourné par ETA
  etaHash         String?
  etaSubmittedAt  DateTime?
  pdfUrl          String?  // URL S3
  createdAt       DateTime @default(now())
  createdById     String
}

enum PaymentMethod { CASH CARD VODAFONE_CASH INSTAPAY FAWRY BANK_TRANSFER }

model Message {
  id              String   @id @default(uuid())
  patientId       String?
  patient         Patient? @relation(fields: [patientId], references: [id])
  externalId      String?  // ID du message côté API externe
  channel         Channel
  direction       Direction
  fromAddress     String   // numéro/email/handle
  toAddress       String
  content         String
  status          MessageStatus @default(SENT)
  isAuto          Boolean  @default(false)
  templateName    String?
  attachments     Json?
  language        String   @default("fr")
  createdAt       DateTime @default(now())
  readAt          DateTime?

  @@index([patientId, createdAt])
}

enum Channel { WHATSAPP INSTAGRAM MESSENGER EMAIL SMS }
enum Direction { INBOUND OUTBOUND }
enum MessageStatus { QUEUED SENT DELIVERED READ FAILED }

model AutomationWorkflow {
  id          String   @id @default(uuid())
  name        String
  trigger     String   // before_appointment, after_appointment, etc.
  isActive    Boolean  @default(true)
  steps       Json     // [{offset_days, time, channel, template_fr, template_ar, template_en}]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

model AuditLog {
  id          String   @id @default(uuid())
  userId      String?
  user        User?    @relation(fields: [userId], references: [id])
  action      String   // login_success, payment_validated, etc.
  resource    String?  // patient:1234, appointment:5678
  details     Json?
  ipAddress   String?
  userAgent   String?
  createdAt   DateTime @default(now())

  @@index([userId, createdAt])
  @@index([action, createdAt])
}

model SystemSetting {
  key         String   @id
  value       Json
  updatedAt   DateTime @updatedAt
  updatedById String?
}

model IpWhitelist {
  id          String   @id @default(uuid())
  ipAddress   String
  description String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
}
```

---

## 🔒 SÉCURITÉ ET CONFORMITÉ

### Sécurité technique
- **HTTPS partout** (TLS 1.3 minimum, Let's Encrypt)
- **Données patients chiffrées au repos** (PostgreSQL avec pgcrypto pour les champs sensibles)
- **Rate limiting** : 100 req/min par IP, 5 tentatives login / 15 min
- **CORS** strict : uniquement depuis app.reset-egypt.com et reset-egypt.com
- **Headers sécurité** : Helmet (CSP, HSTS, X-Frame-Options, etc.)
- **Validation Zod** sur tous les inputs API
- **SQL Injection** : impossible grâce à Prisma
- **XSS** : React échappe par défaut + DOMPurify pour HTML user
- **CSRF** : double cookie pattern + SameSite=Strict
- **Sauvegardes** : PostgreSQL daily snapshots + WAL archives, conservation 30 jours minimum

### Conformité légale
- **Loi 151/2020** (Égypte) sur la protection des données personnelles
- **RGPD compatible** (en bonus)
- **Consentements explicites** stockés avec timestamp et IP
- **Droit à l'oubli** : possibilité de supprimer un patient avec historique anonymisé
- **E-invoicing ETA** obligatoire (Décret 188/2020)
- **Conservation 5 ans** des factures et logs d'audit

---

## 🎨 DESIGN SYSTEM

### Palette de couleurs (cohérence avec reset-egypt.com)
```css
--primary: #1D9E75      /* Vert nature - Dr. Reda */
--primary-dark: #0F6E56
--secondary: #534AB7    /* Violet - Dr. Layla */
--info: #185FA5         /* Bleu - actions */
--warning: #BA7517      /* Orange - attention */
--danger: #E24B4A       /* Rouge - erreur */
--success: #1D9E75
--background: #FAFAF7
--text: #2C2C2A
--text-secondary: #5F5E5A
--border: #D3D1C7
```

### Composants UI à créer (shadcn/ui)
- Button (primary, secondary, ghost, danger)
- Input, Textarea, Select, Checkbox, Radio, Switch
- Card, Dialog, Sheet, Tabs
- Calendar, DatePicker, TimeSlotPicker (custom pour 18 créneaux)
- DataTable avec tri, filtres, pagination
- Toast notifications
- Avatar, Badge, Chip
- Skeleton loaders

### Principes UX
- **Mobile-first** mais optimisé desktop pour la secrétaire
- **Densité d'information** élevée (la secrétaire passe sa journée dessus)
- **Actions à 1 clic** pour les tâches fréquentes
- **Validation progressive** des formulaires (boutons grisés tant que champs requis manquants)
- **Feedback immédiat** (loaders, toasts, animations légères)
- **Navigation clavier** complète (accessibilité)
- **Dark mode** optionnel en bonus

---

## 📅 PLAN DE DÉVELOPPEMENT EN 10 PHASES

### Phase 1 — Cadrage (Semaines 1-2)
- Setup monorepo (Turborepo ou Nx)
- Configuration Docker compose (PostgreSQL + Redis + API + Web)
- Schéma Prisma initial
- Migrations + seed data
- Mise en place i18n
- Charte graphique + composants UI de base

### Phase 2 — Infrastructure (Semaine 3)
- Configuration Hetzner / VPS
- Reverse proxy (Caddy)
- SSL Let's Encrypt
- CI/CD GitHub Actions
- Monitoring Sentry
- Backups automatiques PostgreSQL

### Phase 3 — Authentification + RBAC (Semaine 4)
- Module 0a : Auth (login, logout, recovery)
- Module 0b : Admin gestion utilisateurs
- Logs d'audit
- IP whitelist
- Middlewares de permissions

### Phase 4 — RDV + Patient (Semaines 5-6)
- Module 1 : Tableau de bord secrétaire
- Module 2 : Création RDV
- Module 3 : Fiche d'accueil patient
- Logique 18 créneaux + 2 praticiens
- WebSocket temps réel

### Phase 5 — Clinique + Dossier (Semaines 7-8)
- Module 4 : Fiche clinique multilingue
- Module 5 : Dossier patient unifié
- Tests cliniques (Fagerström, AUDIT, DUDIT, YFAS, HAD)
- Calcul score d'évolution
- Graphiques Chart.js
- Support RTL pour l'arabe

### Phase 6 — Encaissement + ETA (Semaine 9)
- Module 6 : Caisse multi-paiements
- Génération facture PDF (puppeteer ou pdfkit)
- Intégration API ETA (tax.gov.eg)
- QR code de vérification

### Phase 7 — Réservation site (Semaine 10)
- Module 7 : Wizard 4 étapes
- App séparée /book à intégrer sur reset-egypt.com
- WebSocket vers calendrier secrétaire
- Anti-spam reCAPTCHA

### Phase 8 — Communications (Semaines 11-12)
- Module 9 : 6 workflows SMS automatiques
- Module 11 : Inbox unifiée
- Intégration WhatsApp Business API (Meta)
- Connexion Instagram + Messenger
- Workers BullMQ pour relances programmées

### Phase 9 — Stats + Agenda (Semaine 13)
- Module 8 : Dashboard statistiques
- Module 10 : Vue agenda hebdomadaire
- Module 12 : Mon agenda praticien
- Export PDF/Excel
- Alertes intelligentes

### Phase 10 — Tests + Production (Semaine 14)
- Tests E2E (Playwright)
- Tests unitaires backend (Vitest)
- Tests utilisateurs avec secrétaire
- Documentation utilisateur (FR/AR)
- Migration des données existantes
- Formation 2 jours
- Go-live + monitoring 30 jours

---

## ✅ CRITÈRES D'ACCEPTATION

L'application sera considérée terminée quand :

- [ ] Les 13 modules sont fonctionnels et accessibles selon les rôles
- [ ] Multilingue FR/AR/EN parfaitement traduit avec RTL pour l'arabe
- [ ] Conformité ETA validée (factures soumises et acceptées)
- [ ] WhatsApp Business API connectée et fonctionnelle
- [ ] Tests E2E passent sur les flux critiques (login, créer RDV, encaisser)
- [ ] Sécurité auditée (OWASP Top 10)
- [ ] Performance : Lighthouse score > 90 sur toutes les pages
- [ ] Accessibilité : WCAG 2.1 niveau AA
- [ ] Documentation technique complète (README + API docs Swagger)
- [ ] Documentation utilisateur (PDF FR + AR)
- [ ] Backups automatiques configurés et testés (restauration)
- [ ] Monitoring Sentry actif avec alertes configurées
- [ ] Formation équipe terminée avec recette signée

---

## 🚀 INSTRUCTIONS POUR DÉMARRER

### Ordre d'exécution recommandé

**Étape 1** — Initialiser le monorepo
```bash
npx create-turbo@latest reset-egypt
cd reset-egypt
# Configurer les workspaces apps/web, apps/api, apps/booking
```

**Étape 2** — Setup Docker
Créer un `docker-compose.yml` avec PostgreSQL 16, Redis 7, et un service de mailcatcher pour le développement.

**Étape 3** — Schéma Prisma
Créer le schéma complet ci-dessus, lancer `prisma migrate dev` et créer un seed avec :
- 1 admin (direction@reset-egypt.com / TempPass123!)
- 2 praticiens (Dr. Reda, Dr. Layla)
- 2 secrétaires (Sara, Nora)
- 5 patients de test
- 20 RDV répartis sur la semaine

**Étape 4** — Backend API
Mettre en place Fastify avec :
- Plugin auth JWT
- Plugin Prisma
- Plugin Zod validation
- Plugin Swagger pour la doc
- Plugin rate-limit
- Plugin Helmet pour les headers

**Étape 5** — Frontend Auth
Construire l'écran de login + admin gestion utilisateurs en premier (modules 0a et 0b).

**Étape 6** — Modules métier dans l'ordre
1. Module 1 (Dashboard secrétaire)
2. Module 2 (Création RDV)
3. Module 3 (Fiche accueil)
4. Module 4 (Fiche clinique)
5. Module 5 (Dossier unifié)
6. Module 10 (Agenda hebdo)
7. Module 6 (Encaissement)
8. Module 9 (Relances)
9. Module 11 (Inbox)
10. Module 7 (Booking patient)
11. Module 8 (Statistiques)

### Conseils importants

1. **Ne pas tout faire en une fois** : développer module par module, tester, puis passer au suivant
2. **Mocker les APIs externes** au début (WhatsApp, ETA, Twilio) avec des données factices, brancher les vraies APIs en fin de chaque phase
3. **Tester en arabe régulièrement** pour vérifier le RTL ne casse pas la mise en page
4. **Prendre des screenshots** à chaque module terminé pour démo client
5. **Garder une seed data réaliste** pour faciliter les tests
6. **Documenter au fur et à mesure** dans le README

### Variables d'environnement (.env.example)

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/reset_egypt
REDIS_URL=redis://localhost:6379

# Auth
JWT_SECRET=change-me-in-production-use-openssl-rand-base64-32
SESSION_DURATION=8h

# APIs externes
WHATSAPP_TOKEN=xxx
WHATSAPP_PHONE_ID=xxx
TWILIO_ACCOUNT_SID=xxx
TWILIO_AUTH_TOKEN=xxx
TWILIO_PHONE=+201xxxxxxxxx
BREVO_API_KEY=xxx
INSTAGRAM_TOKEN=xxx
ETA_CLIENT_ID=xxx
ETA_CLIENT_SECRET=xxx
ETA_API_URL=https://api.invoicing.eta.gov.eg
PAYMOB_API_KEY=xxx

# Storage
S3_ACCESS_KEY=xxx
S3_SECRET_KEY=xxx
S3_BUCKET=reset-egypt-storage
S3_REGION=eu-central-1
S3_ENDPOINT=https://s3.eu-central-1.amazonaws.com

# Sentry
SENTRY_DSN=xxx

# Public URLs
APP_URL=https://app.reset-egypt.com
BOOKING_URL=https://reset-egypt.com/book
API_URL=https://api.reset-egypt.com

# Reset center info
CENTER_NAME=Reset Egypt
CENTER_ADDRESS=N Teseen, New Cairo 1, Le Caire 11835
CENTER_PHONE=+201xxxxxxxxx
CENTER_TAX_ID=xxx-xxx-xxx
CENTER_COMMERCIAL_NUMBER=xxx-xxx
```

---

## 📞 INFORMATIONS DU CENTRE

- **Nom** : Reset Egypt
- **Adresse** : N Teseen, New Cairo 1, Le Caire, Égypte 11835
- **Site web** : https://www.reset-egypt.com
- **Horaires** : 7j/7, 10h00 — 22h00
- **Praticiens** : Dr. Reda, Dr. Layla (à confirmer noms réels)
- **Spécialité** : Auriculothérapie + Photobiomodulation laser non-invasive

---

## 🎯 INSTRUCTIONS FINALES POUR CLAUDE CODE

**À faire en priorité absolue** :

1. **Lis ce document en entier** avant de commencer à coder
2. **Confirme** que tu as bien compris en résumant les points clés
3. **Pose des questions** si quelque chose n'est pas clair
4. **Propose un plan d'attaque** avec l'ordre des modules à développer
5. **Initialise le monorepo** avec Turborepo
6. **Crée le docker-compose.yml** pour PostgreSQL + Redis
7. **Génère le schéma Prisma** complet avec migrations
8. **Crée le seed** avec des données réalistes
9. **Démarre par le module 0a (Auth)** car tout dépend de lui
10. **Procède phase par phase** sans sauter d'étape

**Standards de code à respecter** :
- TypeScript strict mode partout
- Pas de `any` toléré (sauf si justifié en commentaire)
- ESLint + Prettier configurés
- Conventional commits (`feat:`, `fix:`, `chore:`)
- Tests unitaires sur la logique métier critique (calcul TVA, score évolution, conflits horaires)
- Tests E2E sur les flux critiques
- Documentation JSDoc sur les fonctions publiques
- Variables d'environnement validées au démarrage avec Zod
- Logs structurés (pino) avec niveaux appropriés
- Erreurs typées et gérées proprement
- Pas de console.log en production

**Bon développement ! Le client compte sur toi pour livrer un produit de qualité professionnelle.** 🚀

---

## 📌 ANNEXE — Points à clarifier (ajout Claude · 2026-05-11)

Cette annexe liste les points du spec qui demandent une décision client, ainsi que les défauts que je propose là où le spec laisse de la place.

### 🔴 BLOCKING — nécessite décision avant la mise en production

| # | Point | Pourquoi ça bloque | Phase concernée |
|---|-------|---------------------|-----------------|
| 1 | **Noms réels des praticiens** (Dr. Reda / Dr. Layla = placeholders) | Apparaissent dans les factures ETA → conformité légale | Phase 6 |
| 2 | **Identifiants fiscaux du centre** : TIN, n° commercial, adresse complète, n° téléphone | Obligatoires sur facture ETA | Phase 6 |
| 3 | **TVA 14% vs exonération bien-être** (à valider avec comptable) | Détermine la logique de facturation | Phase 6 |
| 4 | **Démarches WhatsApp Business API** : démarrées ou pas ? Délai 2-4 sem. | Sans ça, Module 9 + 11 inutilisables en prod | Phase 8 |
| 5 | **Démarches ETA tax.gov.eg** : compte + certificat numérique. Délai 4-8 sem. | Sans ça, factures non valides légalement | Phase 6 |
| 6 | **Domaine reset-egypt.com** : qui gère le DNS ? Sous-domaines `app.` + `api.` à créer | Bloque déploiement final | Phase 10 |
| 7 | **Serveur d'hébergement** : Hetzner provisionné ? Sinon, quel hébergeur ? | Bloque déploiement | Phase 2 + 10 |
| 8 | **Système existant pour migration** : Excel ? Logiciel ? Papier seul ? | Détermine l'effort de migration | Phase 10 |

### 🟠 IMPORTANT — décisions métier à clarifier mais ne bloquent pas le démarrage

| # | Point | Mon défaut proposé |
|---|-------|---------------------|
| 9 | **Logique de relais Dr. Reda ↔ Dr. Layla** : alternance par shift (matin/soir) ou par jour entier ? | Par shift : un praticien sur 10h-16h, l'autre sur 16h-22h. Modifiable via planning admin. |
| 10 | **Score d'évolution** — quelles métriques entrent dans le calcul ? | `(stress_initial + anxiety_initial + craving_initial) − (stress_actuel + anxiety_actuel + craving_actuel)` ÷ initial × 100. Sommeil et motivation tracked séparément. |
| 11 | **2FA désactivée pour Admin** : confirmé ? **⚠️ risque** : Admin a accès données médicales 5000+ patients. | **Je recommande fortement 2FA TOTP pour Admin uniquement**. À ré-arbitrer. |
| 12 | **Champs chiffrés pgcrypto** | phone, whatsapp, email, address, privateNotes, signature — chiffrement au niveau colonne. |
| 13 | **Notes cliniques privées après changement de praticien** | Restent visibles uniquement par le praticien initial. Le nouveau praticien voit "Notes antérieures (Dr. X)" sans le contenu. |
| 14 | **Pause flexible 13h-14h** | Auto : créneaux 13h-14h marqués "Pause libre" sur le calendrier, désactivables au cas par cas par la secrétaire. |
| 15 | **Codes promo** | Création Admin only. Stockage table `PromoCode` (code, type, value, validFrom, validTo, maxUses, usedCount). |
| 16 | **Multilingue : qui traduit AR ?** | Je génère FR + EN. AR à faire **relire par un locuteur natif** avant prod. |
| 17 | **Anti-spam booking** : 3 RDV/IP/24h | IP + téléphone E.164 normalisé (deux limites distinctes). |
| 18 | **No-show auto-flag** | 30 min après l'heure prévue, si statut toujours "À confirmer" ou "Confirmé" → passe en NO_SHOW. Notification secrétaire. |
| 19 | **Reset mot de passe 90 jours** | Interdiction de réutiliser les 5 derniers passwords (hash comparison). |
| 20 | **Sessions JWT 8h** : refresh token ? | Pas de refresh. Re-login après 8h ou après 30min d'inactivité (le plus court gagne). |
| 21 | **Lock après 5 tentatives** : compteur où ? | Deux compteurs séparés : par utilisateur (5/15min) + par IP (10/15min). |
| 22 | **Anniversaire patient** | Auto-déclenché à la date dateOfBirth, à 09h00 heure du Caire. |

### 🟢 NICE-TO-HAVE — ambiguïtés mineures, défauts choisis

| # | Point | Mon défaut |
|---|-------|------------|
| 23 | reCAPTCHA v3 : API key Google manquante dans `.env.example` | Ajouté à l'env. À obtenir gratuitement sur google.com/recaptcha. |
| 24 | Backups WAL retention | 30j dans bucket S3 chiffré, snapshots quotidiens. |
| 25 | Audit trail post-suppression patient | Logs `AuditLog` conservés 5 ans (loi égyptienne), patientId remplacé par hash après "droit à l'oubli". |
| 26 | Architecture WebSocket booking → calendar | Socket.IO via API Fastify, room par centre (préparé multitenant futur). |
| 27 | Police arabe : Cairo vs IBM Plex Sans Arabic | **Cairo** (plus léger, support large). |
| 28 | Forfait 5 séances : -10%, -15%, autre ? | -15% par défaut, paramétrable via Admin. |

### 🔒 RISQUES À FLAG

- **2FA désactivée + admin avec accès complet aux données médicales** = vecteur d'attaque critique. Un compte admin compromis = fuite des dossiers de tous les patients.
- **IP whitelist activée par défaut** = si la secrétaire travaille de chez elle / change d'IP, lockout. Prévoir procédure de déblocage admin par téléphone.
- **Sauvegarde** : le doc dit "PostgreSQL daily snapshots + WAL". À tester en restauration **avant** le go-live, pas après.
- **Migration des données existantes** non spécifiée. Si Excel ou cahier papier, un script d'import doit être écrit et testé.

### ✅ Ce qui n'est PAS bloquant pour démarrer la Phase 1

Pour scaffolder le monorepo + Docker + Prisma + seed + i18n + UI base (Phase 1, semaines 1-2), **aucun des points ci-dessus n'est bloquant**. Le seed utilisera les valeurs placeholder du spec (Dr. Reda, Dr. Layla, Sara, Nora, 5 patients fictifs). Les vrais noms/identifiants seront injectés lors du seed de production.

→ **On peut démarrer la Phase 1 immédiatement.**

