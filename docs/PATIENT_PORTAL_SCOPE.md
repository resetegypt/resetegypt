# Patient Self-Service Portal — Scope & options

> Estimation : 1 jour de dev (8h) pour la version A minimale.
> Décision à prendre avant de coder : feature scope + auth model.

## Pourquoi

Aujourd'hui, pour consulter ses RDV / annuler / rebooker, le patient appelle Sara ou Nora. Un portail self-service :
- **Décharge la secrétaire** (~30% des appels = "c'est quand mon RDV ?")
- **Augmente la fiabilité** (patients oublient moins)
- **24/7** vs heures d'ouverture

## 3 options par ordre de complexité

### Option A — Lien magique (le plus simple, ~1 jour)
- Patient reçoit un email/SMS avec `https://book.reset-egypt.com/me/<token>`
- Le token est un JWT 30 jours signé qui contient `patientId`
- Permet : voir ses RDV à venir, les annuler (J-2 max), bouton "Reprendre RDV"
- **Pas de compte**, pas de mot de passe
- **Pas de données médicales** (juste RDV + facturations)

✅ Pros : aucune friction patient, sécurité raisonnable (lien à usage personnel)
❌ Cons : si le patient transfère le lien à un tiers, accès partagé

### Option B — Compte avec email + code à usage unique (~2 jours)
- Patient va sur `book.reset-egypt.com/login`
- Saisit son email → reçoit un code 6 chiffres par email/SMS → entre le code → session 7 jours
- Permet : tout A + voir factures + télécharger PDF + modifier coordonnées

✅ Pros : sécurité forte (codes éphémères), pas de mot de passe à mémoriser
❌ Cons : plus de friction (2 étapes), nécessite SMS provider câblé

### Option C — Compte complet avec mot de passe (~3 jours)
- Inscription classique, mot de passe, mot de passe oublié, etc.
- Tout B + accès au dossier médical, scores d'évolution, recommandations

✅ Pros : expérience pro
❌ Cons : plus de surface d'attaque (passwords stockés), gestion lost-password, charge support

## Recommandation

**Démarrer par A**, livrable en 1 jour. Si les patients adoptent, évoluer vers B sous 3 mois.

## Stack technique (option A)

### Backend (apps/api)
Nouveau module `patient-portal/`:
- `POST /patient-portal/send-magic-link { email | phone }` (rate limited 3/hour/IP)
  - Cherche le patient par email ou phone
  - Génère un JWT 30 jours `{ patientId, purpose: 'portal' }`
  - Envoie email via Resend (ou SMS quand WhatsApp/Twilio câblés)
- `GET /patient-portal/me?token=...` — décode JWT, retourne profil + RDV à venir
- `POST /patient-portal/appointments/:id/cancel?token=...` (vérifie J-2 mini)
- `POST /patient-portal/book?token=...` — proxy vers booking module existant

### Frontend
Soit **étendre `apps/booking/`** avec routes `/me/*`, soit **créer `apps/portal/`** (nouvelle Vite app).
Recommandation : étendre `apps/booking/` car même brand + même provider.

### Sécurité
- Token JWT 30 jours, révoqué côté DB en cas de changement de phone/email patient
- Rate limit POST /patient-portal/send-magic-link
- Audit log de chaque action portail
- HTTPS strict + HSTS (déjà OK)
- Pas d'accès aux données médicales (Option A scope minimal)

## Décision à prendre

Dis-moi laquelle des 3 options tu veux, et si tu veux l'attaquer maintenant (1 / 2 / 3 jours selon l'option) ou plus tard.
