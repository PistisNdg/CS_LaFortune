# PROMPT WINDSURF — CSF Présence : du prototype au produit déployé

> À coller tel quel dans Windsurf (Cascade). Placer au préalable la maquette `csf-presence-qr.html` dans `/maquette/` à la racine du dépôt.

---

## 0. Ton rôle et ta manière de travailler

Tu es un **ingénieur full-stack senior** (Next.js, TypeScript, PostgreSQL, Excel/OOXML, PWA, sécurité web, déploiement Vercel) et un **designer UI/UX exigeant**. Tu reprends un projet là où une maquette front-end s'est arrêtée et tu le transformes en **application de production**.

Règles de travail :

1. **Lis d'abord** `/maquette/csf-presence-qr.html` en entier avant d'écrire du code. Elle est la référence visuelle et fonctionnelle.
2. **Avance phase par phase** (section 10). À la fin de chaque phase : lint + typecheck + tests au vert, commit Git clair (Conventional Commits), puis résumé de ce qui est fait / reste à faire.
3. **Ne devine pas.** Si une décision métier manque, pose-la dans une liste de questions (section 12) et continue avec l'hypothèse par défaut documentée.
4. **Zéro donnée fictive en production.** Les noms de la maquette (Grâce Mbuyi, etc.) servent uniquement au script de seed de démonstration.
5. Code **typé strictement** (`strict: true`), sans `any` injustifié, sans secret en dur, avec messages d'erreur utilisateur en **français**.
6. Tout le texte de l'interface est en **français (RDC)**, dates `dd/MM/yyyy`, heure 24 h, fuseau **Africa/Kinshasa (UTC+1)**. Stockage en UTC.

---

## 1. Contexte du projet

- **Client** : Complexe Scolaire La Fortune (CSF) — Maternelle, Primaire, Secondaire — Av. Sep-Congo N°12865, Masina/Petro-Congo, Kinshasa, RDC. Environ 400 élèves au départ, extensible.
- **Produit** : « CSF Présence », système de gestion de présence par **QR code**. Chaque élève a un badge avec un QR unique, scanné à l'entrée. La direction, les enseignants et les parents suivent la présence en temps réel.
- **Précurseur de l'idée** : une carte « Précurseur de l'idée » avec photo figure sur la page de connexion. **Conserve-la.** Nom et titre doivent venir de variables d'environnement (`NEXT_PUBLIC_FOUNDER_NAME`, `NEXT_PUBLIC_FOUNDER_TITLE`) ; tant qu'elles sont vides, afficher uniquement « Précurseur de l'idée ».
- **Contexte réseau** : connexion Internet parfois instable à Kinshasa → le scanner doit fonctionner **hors ligne** (section 6.4).

### État actuel (ce qui existe déjà)

Une maquette statique, un seul fichier HTML/CSS/JS, images incrustées en base64 :

- Page de connexion (split screen, sélecteur Direction/Enseignant/Parent, bouton « badge QR »). **Aucune vraie authentification.**
- Tableau de bord avec 4 compteurs, présence par classe, flux des derniers scans. **Données codées en dur.**
- Écran Scanner avec caméra **simulée** et bouton « Simuler un scan ».
- Carte élève avec un QR **factice** (motif aléatoire, non scannable).
- Menus « Classes » et « Rapports » vides.
- Design tokens à reprendre : rouge `#d7261e`, jaune `#ffc928`, bleu `#1f5fbf`, marine `#0b1b3f` / `#13306b`, police Plus Jakarta Sans, thème clair + sombre, composants arrondis (12–22 px), responsive (rupture à 900 px).

### Ce qu'il reste à construire

Tout le backend, la vraie authentification, la persistance, le vrai QR (génération + lecture), la gestion des élèves/classes/parents/enseignants, les justifications d'absence, les notifications, les rapports, **la base Excel structurée et téléchargeable**, et le **déploiement Vercel**.

---

## 2. Contrainte centrale : « base de données Excel » sur Vercel

Le propriétaire veut que **les données vivent dans une base Excel extrêmement structurée, téléchargeable**. Contrainte technique incontournable : sur Vercel, le système de fichiers des fonctions est **en lecture seule / éphémère** (seul `/tmp` est inscriptible et il disparaît). Un fichier `.xlsx` posé dans le dépôt **ne peut donc pas** servir de base écrivable en production, et réécrire un classeur entier à chaque scan provoquerait des pertes de données en cas d'écritures simultanées.

**Architecture imposée (à respecter) :**

| Couche | Rôle | Techno |
|---|---|---|
| **Source de vérité opérationnelle** | Écritures concurrentes, scans, transactions | **PostgreSQL** (Neon via Vercel Marketplace) + **Prisma** |
| **BDD Excel canonique** | Représentation structurée, lisible, téléchargeable, **ré-importable** de toute la base | Classeur `.xlsx` généré par **ExcelJS** |
| **Sauvegarde Excel automatique** | Copie quotidienne datée du classeur complet | **Vercel Cron** + **Vercel Blob** |

Principe : *« PostgreSQL stocke, Excel expose »*. Le classeur Excel est **fidèle à 100 %** à la base : tout ce qui est en base apparaît dans le classeur, et un classeur valide peut **restaurer** ou **alimenter** la base (import).

Introduis une **interface `Repository`** par entité (élèves, classes, présences…) pour qu'un adaptateur différent (ex. Excel dans Blob) puisse être branché plus tard sans toucher à la logique métier. **N'implémente pas** cet adaptateur Excel-écrivable maintenant ; documente-le seulement dans `docs/ARCHITECTURE.md` avec ses limites (concurrence, taille, latence).

Dans `docs/ARCHITECTURE.md`, explique en 10 lignes maximum, pour un lecteur non technicien, pourquoi ce choix protège les données de l'école.

---

## 3. Stack technique

- **Next.js (App Router) + TypeScript strict**, Server Actions et Route Handlers.
- **Tailwind CSS** + variables CSS pour les tokens de la maquette ; composants UI maison ou **shadcn/ui** (jamais d'UI kit lourd qui casse l'identité visuelle).
- **Prisma** + **PostgreSQL (Neon)**, migrations versionnées, `directUrl` pour les migrations.
- **Auth** : sessions par **cookie httpOnly, Secure, SameSite=Lax**, JWT signés avec `jose` (ou Auth.js v5 en mode Credentials), mots de passe hachés avec `bcryptjs` (compatible serverless) coût ≥ 12.
- **Validation** : `zod` partout (formulaires, API, import Excel).
- **Excel** : `exceljs` (génération + lecture).
- **QR** : génération avec `qrcode` (SVG) ; lecture caméra avec `html5-qrcode` (ou alternative maintenue équivalente).
- **PDF des badges** : `@react-pdf/renderer` ou `pdf-lib`.
- **PWA** : service worker (Workbox ou `serwist`), IndexedDB (`idb`) pour la file hors ligne.
- **Tests** : Vitest (unitaires), Playwright (E2E parcours critiques).
- **Qualité** : ESLint, Prettier, `tsc --noEmit`, Husky + lint-staged.
- **Rate limiting** : Upstash Redis (Vercel Marketplace) ou compteur en base.

---

## 4. Arborescence cible

```
/maquette/                  # référence, ne pas modifier
/prisma/schema.prisma
/prisma/seed.ts             # données de démonstration (flag SEED_DEMO=true uniquement)
/src/app/(auth)/login/
/src/app/(app)/dashboard/
/src/app/(app)/scan/
/src/app/(app)/eleves/
/src/app/(app)/classes/
/src/app/(app)/parents/
/src/app/(app)/enseignants/
/src/app/(app)/presences/
/src/app/(app)/justificatifs/
/src/app/(app)/rapports/
/src/app/(app)/donnees-excel/     # export / import / sauvegardes
/src/app/(app)/parametres/
/src/app/(app)/audit/
/src/app/api/...                  # scan, export, import, cron, webhooks
/src/lib/{auth,rbac,qr,excel,notify,time,audit,env}.ts
/src/lib/excel/schema.ts          # SOURCE UNIQUE des feuilles/colonnes (section 5)
/src/components/ui/
/tests/{unit,e2e}/
/docs/{ARCHITECTURE.md,EXCEL_SCHEMA.md,DEPLOY.md,SECURITY.md,RUNBOOK.md}
vercel.json
.env.example
```

---

## 5. Base Excel : spécification « extrêmement structurée »

### 5.1 Principe : un schéma unique

Crée `src/lib/excel/schema.ts` : **une seule définition déclarative** (feuilles → colonnes → type, obligatoire, unique, énumération, clé étrangère, exemple, description). Elle pilote **simultanément** : l'export, l'import, la validation Zod, les listes déroulantes Excel, la feuille `Dictionnaire` et `docs/EXCEL_SCHEMA.md` (généré). Aucune duplication manuelle.

### 5.2 Règles de structure du classeur

- Nom de fichier : `CSF_Presence_BDD_AAAA-MM-JJ_HHmm_v{schemaVersion}.xlsx`.
- **Une feuille par entité**, nom sans accents ni espaces (`Eleves`, `Classes`…), ligne 1 = en-têtes techniques en `snake_case`, données dès la ligne 2.
- Chaque feuille est un **Tableau Excel** nommé (`tbl_eleves`…), avec filtres, lignes alternées, **volets figés** (en-tête + colonne ID), largeurs ajustées, en-têtes aux couleurs CSF.
- **Pas de cellules fusionnées, pas de lignes vides, pas de formules dans les feuilles de données.**
- **Identifiants stables lisibles**, jamais réutilisés : `ELV-2026-0001`, `CLS-2026-6PA`, `PAR-0001`, `ENS-0001`, `USR-0001`, `PRS-20261002-000123`.
- Dates en vraies dates Excel (formatées `dd/mm/yyyy`), heures en `hh:mm:ss`, horodatages complets en UTC **et** colonne locale Kinshasa.
- Booléens : `OUI`/`NON`. Énumérations : listes déroulantes (**validation de données**) alimentées par la feuille `Listes`.
- Intégrité référentielle : les clés étrangères sont vérifiées à l'import (rapport d'erreurs ligne par ligne).
- Feuilles de gestion en tête : `LISEZMOI` (objet, version du schéma, date d'export, utilisateur, nombre de lignes par feuille, **empreinte SHA-256** du contenu), `Dictionnaire` (toutes les colonnes), `Listes` (énumérations).

### 5.3 Feuilles et colonnes minimales

| Feuille | Colonnes (liste minimale, à compléter si nécessaire) |
|---|---|
| `Annees_Scolaires` | id, libelle, date_debut, date_fin, est_active |
| `Classes` | id, annee_id, niveau (MATERNELLE/PRIMAIRE/SECONDAIRE), nom, section, titulaire_ens_id, effectif_max |
| `Eleves` | id, matricule, nom, postnom, prenom, sexe, date_naissance, classe_id, statut (ACTIF/SUSPENDU/SORTI), date_inscription, qr_public_id, photo_ref |
| `Parents` | id, nom, postnom, prenom, lien (PERE/MERE/TUTEUR/AUTRE), telephone_e164, whatsapp_e164, email, canal_prefere (SMS/WHATSAPP/EMAIL/AUCUN) |
| `Liens_Parent_Eleve` | parent_id, eleve_id, est_contact_principal |
| `Enseignants` | id, nom, postnom, prenom, telephone_e164, email, matiere_principale |
| `Affectations` | enseignant_id, classe_id, annee_id |
| `Utilisateurs` | id, email, role (DIRECTION/ENSEIGNANT/PARENT/SURVEILLANT), lie_a_id, actif, derniere_connexion_utc *(jamais de mot de passe ni de hash dans l'export)* |
| `Calendrier` | date, type (COURS/FERIE/VACANCES/EXAMEN), libelle |
| `Regles_Horaires` | id, niveau, heure_ouverture, heure_limite_retard, heure_limite_absence, date_effet |
| `Presences` | id, date, eleve_id, classe_id, statut (PRESENT/RETARD/ABSENT/ABSENT_JUSTIFIE/EXCLU), heure_arrivee_locale, minutes_retard, source (SCAN/MANUEL/IMPORT), scan_id, saisi_par_user_id |
| `Scans` | id, horodatage_utc, horodatage_local, eleve_id, appareil_id, user_id, resultat (VALIDE/DOUBLON/QR_INVALIDE/ELEVE_INACTIF/HORS_CALENDRIER), synchronise_apres_hors_ligne |
| `Justificatifs` | id, eleve_id, date_debut, date_fin, motif, statut (EN_ATTENTE/ACCEPTE/REFUSE), depose_par_parent_id, traite_par_user_id, commentaire |
| `Notifications` | id, parent_id, eleve_id, type, canal, statut (EN_FILE/ENVOYE/ECHEC), horodatage_utc, erreur |
| `Journal_Audit` | id, horodatage_utc, user_id, action, entite, entite_id, ip_hash, details_json |
| `Parametres` | cle, valeur, description |

> Le **mapping PostgreSQL ⇄ feuilles** est défini une seule fois dans `schema.ts` ; les modèles Prisma doivent permettre d'obtenir chaque feuille sans transformation hasardeuse.

### 5.4 Fonctionnalités « Données Excel » (page `/donnees-excel`, réservée DIRECTION)

1. **Télécharger la BDD complète** (toutes les feuilles) — génération en flux, nom daté.
2. **Télécharger une feuille** isolée, ou **filtrée** (classe, période, statut).
3. **Télécharger un modèle d'import vide** : en-têtes, listes déroulantes, 2 lignes d'exemple grisées.
4. **Importer un classeur** (`.xlsx`) : étapes **Téléverser → Analyser (dry-run) → Rapport d'erreurs téléchargeable → Confirmer**. Import transactionnel (tout ou rien), idempotent (upsert par `id`), refus si `schemaVersion` incompatible. Limite de 4,5 Mo pour les fonctions Vercel : au-delà, téléversement direct vers Blob puis traitement.
5. **Sauvegardes automatiques** : liste des classeurs quotidiens (30 derniers jours), téléchargement, **restauration** (avec double confirmation + sauvegarde préalable automatique).
6. **Rapports Excel** distincts de la BDD : présence par classe/mois, assiduité par élève, retards récurrents, absences non justifiées — avec totaux **calculés par formules Excel vivantes** et graphiques natifs.
7. Chaque export/import/restauration est écrit dans `Journal_Audit`.
8. Données personnelles d'élèves mineurs : exports réservés à la DIRECTION, jamais d'URL publique, téléchargements via route authentifiée.

---

## 6. Fonctionnalités à implémenter (par module)

### 6.1 Authentification et rôles (RBAC)

- Vraie connexion e-mail + mot de passe ; rôles `DIRECTION`, `ENSEIGNANT`, `PARENT`, `SURVEILLANT` (scan uniquement).
- Le sélecteur de profil de la maquette devient un **indicateur de rôle** déduit du compte (pas un choix libre).
- Bouton « Se connecter avec mon badge QR » : réservé au rôle `SURVEILLANT` (QR d'appareil/agent), sinon le retirer proprement.
- Premier démarrage : script `pnpm create-admin` (variables d'env ou invite) — **aucun compte par défaut en production**.
- Limitation de tentatives (5 / 15 min / IP+e-mail), verrouillage temporaire, message générique anti-énumération.
- Réinitialisation de mot de passe par lien signé à usage unique (expiration 30 min) ; changement forcé à la première connexion.
- Matrice de droits testée (tests unitaires) : un enseignant ne voit que ses classes ; un parent ne voit que ses enfants.
- Middleware Next.js pour protéger toutes les routes `(app)` ; contrôle **aussi** côté serveur dans chaque action (jamais seulement côté UI).

### 6.2 Gestion des données de base

CRUD complets avec recherche, tri, pagination serveur, archivage (pas de suppression physique d'un élève ayant un historique) pour : années scolaires, classes, élèves (photo optionnelle), parents (liaisons multiples), enseignants (affectations), calendrier scolaire (jours fériés RDC préchargés, modifiables), règles horaires par niveau. Formulaires zod, états de chargement/erreur/vide soignés, conformes à la charte de la maquette.

### 6.3 QR codes

- **Contenu du QR** : `CSF1.<qr_public_id>.<signature>` avec `signature = base64url(HMAC-SHA256(QR_SECRET, qr_public_id))` tronquée à 16 octets. **Aucune donnée personnelle dans le QR.** `qr_public_id` aléatoire (≥ 12 caractères), distinct du matricule.
- Vérification de signature **côté serveur** ; pour le mode hors ligne, le client ne vérifie que le format et l'appartenance à la liste d'`qr_public_id` valides mise en cache (jamais `QR_SECRET` côté client), la signature étant revérifiée à la synchronisation.
- **Régénération** d'un QR (badge perdu) : invalide l'ancien, journalisé.
- **Badges imprimables** : PDF A4 (8 badges/page, traits de coupe) par classe ou sélection, au format de la carte de la maquette (logo, nom, classe, matricule, QR, année). Génération par lots avec barre de progression.

### 6.4 Scanner (cœur du produit)

- Caméra réelle (`getUserMedia`, caméra arrière par défaut, bascule, lampe torche si supportée), cadre et laser de la maquette conservés.
- Retour **instantané** : vibration + bip + couleur plein écran (vert PRÉSENT, orange RETARD, rouge refus) + identité de l'élève (nom, classe, photo).
- Règles : une seule présence par élève et par jour (le 2ᵉ scan = `DOUBLON`, sans erreur bloquante) ; retard si heure locale > `heure_limite_retard` du niveau ; refus si élève non `ACTIF`, jour non `COURS`, QR invalide.
- **Mode hors ligne** : PWA installable ; liste d'élèves/QR valides mise en cache (IndexedDB) ; scans empilés avec horodatage de l'appareil, **synchronisés automatiquement** au retour du réseau, dédoublonnage par `(eleve_id, date)` et idempotence par `scan_uuid` ; indicateur visible « X scans en attente ».
- Saisie manuelle de secours (recherche par nom/matricule) avec trace `source = MANUEL`.
- Anti-fraude : horodatage serveur prioritaire, détection d'écart d'horloge > 5 min, `appareil_id` enregistré.

### 6.5 Tableau de bord et présences

- Remplacer toutes les valeurs codées en dur par des données réelles (compteurs, présence par classe, flux « en direct » par **polling court (5 s)** ou SSE — pas de WebSocket sur Vercel).
- Filtres : date, niveau, classe. Vue par classe avec appel du jour, correction manuelle (motif obligatoire + audit).
- Vue enseignant : ses classes uniquement. Vue parent : présence/historique de ses enfants, dépôt de justificatif (texte + pièce jointe image/PDF ≤ 5 Mo vers Blob).
- Calcul des **absents** : élèves actifs attendus − présents − justifiés, **automatiquement figé** à l'heure limite d'absence (tâche planifiée, voir section 8).

### 6.6 Justificatifs d'absence

Workflow `EN_ATTENTE → ACCEPTE/REFUSE`, notification au parent, impact sur le statut (`ABSENT_JUSTIFIE`), historique complet.

### 6.7 Notifications parents

- Événements : élève arrivé, retard, absence non justifiée, décision sur justificatif.
- **Fournisseur interchangeable** via l'interface `NotificationProvider` (`sendSms`, `sendWhatsapp`, `sendEmail`). Livrer : `ConsoleProvider` (dev), `ResendProvider` (e-mail), et un squelette documenté pour **Africa's Talking** (SMS) et **WhatsApp Business Cloud API**.
- File d'envoi avec **reprise sur échec** (3 tentatives, back-off) tracée dans `Notifications`. Désactivable par parent (`canal_prefere = AUCUN`). Aucun envoi tant que le fournisseur n'est pas configuré.

### 6.8 Rapports

Écran `/rapports` : taux de présence (jour/semaine/mois/trimestre), classement des classes, élèves à assiduité faible, retards récurrents, comparaison de périodes ; export Excel (5.4) et impression PDF.

### 6.9 Audit, paramètres, protection des données

- `Journal_Audit` consultable (DIRECTION) avec filtres ; actions sensibles toujours tracées.
- `/parametres` : horaires, calendrier, canaux de notification, informations école, rétention des données.
- Minimisation : photos facultatives, données de mineurs protégées, politique de rétention documentée dans `docs/SECURITY.md`.

---

## 7. Sécurité (obligatoire)

- Variables d'env validées au démarrage par zod (`src/lib/env.ts`) ; `.env.example` complet, aucun secret commité.
- En-têtes de sécurité (CSP stricte adaptée à la caméra et aux polices Google, HSTS, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy: camera=(self)`).
- Protection CSRF sur les mutations, requêtes Prisma paramétrées, échappement de sortie, nettoyage des cellules Excel à l'export (**neutraliser l'injection de formules** : préfixer `'` toute valeur texte commençant par `= + - @`).
- Import Excel : taille max, types MIME et signature de fichier vérifiés, limites de lignes, aucune exécution de macros (`.xlsm` refusé).
- Fichiers uploadés (justificatifs, photos) : type/taille contrôlés, stockés dans Blob, accès **uniquement par route authentifiée** (vérifier dans la documentation Vercel actuelle l'option d'accès privé ; sinon URLs non devinables + proxy authentifié).
- Journalisation sans données personnelles inutiles ; IP hachées dans l'audit.
- Dépendances : `pnpm audit` dans la CI.

---

## 8. Déploiement Vercel

1. Dépôt GitHub → projet Vercel (framework Next.js), **Node 20 LTS**, gestionnaire `pnpm`.
2. Intégrations Marketplace : **Neon (Postgres)**, **Vercel Blob**, **Upstash Redis** (rate limit).
3. Variables d'environnement (Production / Preview / Development) documentées dans `.env.example` et `docs/DEPLOY.md` : `DATABASE_URL`, `DIRECT_URL`, `AUTH_SECRET`, `QR_SECRET`, `BLOB_READ_WRITE_TOKEN`, `CRON_SECRET`, `APP_URL`, `NEXT_PUBLIC_FOUNDER_NAME`, `NEXT_PUBLIC_FOUNDER_TITLE`, clés des fournisseurs de notification, `SEED_DEMO`.
4. `vercel.json` : région des fonctions **la plus proche de la base** (ex. `fra1`/`cdg1`, même région que Neon — mesurer et justifier dans `DEPLOY.md`) ; `maxDuration` relevé uniquement pour les routes d'export/import.
5. **Cron jobs** (protégés par `Authorization: Bearer ${CRON_SECRET}`) :
   - sauvegarde Excel quotidienne vers Blob + purge > 30 jours ;
   - figement des absences à l'heure limite ;
   - relance de la file de notifications.
   *(Attention : sur le plan Hobby, les crons sont limités à une exécution quotidienne ; adapte la conception et signale-le dans `DEPLOY.md`.)*
6. Migrations en production : `prisma migrate deploy` dans la commande de build ; **jamais** `migrate dev` ni `db push` en production.
7. Environnements : `main` → production, branches/PR → Preview avec base Neon **branchée** (jamais la base de production).
8. Pipeline CI (GitHub Actions) : install → lint → typecheck → tests unitaires → build → E2E sur Preview.
9. Livrer `docs/DEPLOY.md` pas-à-pas pour une personne non experte et `docs/RUNBOOK.md` (restauration depuis un classeur Excel, rotation des secrets, que faire si le scanner ne synchronise plus).

> Vérifie dans la documentation Vercel **actuelle** les limites en vigueur (durée des fonctions, taille des requêtes, fréquence des crons, accès privé à Blob) avant de figer la conception.

---

## 9. Design et UX (à ne pas dégrader)

- Reprendre **fidèlement** l'identité de la maquette (tokens, rayons, ombres, animations du laser et des listes), thème clair/sombre, mobile-first pour le scanner (utilisé sur téléphone).
- Accessibilité : contraste AA, navigation clavier, `aria-live` pour les résultats de scan, cibles tactiles ≥ 44 px, `prefers-reduced-motion` respecté.
- États vides, squelettes de chargement, erreurs réseau explicites, confirmation avant toute action destructive.
- Performance : Lighthouse mobile ≥ 90 (Performance, Accessibilité, Bonnes pratiques) sur login, dashboard et scan.
- Images de la maquette (logo CSF, photo du précurseur) : **extraire** les data-URI base64 vers `/public/assets/` en fichiers optimisés (WebP/PNG), servis via `next/image`.

---

## 10. Plan de livraison par phases (critères d'acceptation)

| # | Phase | Livrable | Critère d'acceptation |
|---|---|---|---|
| 0 | **Socle** | Projet Next.js, Tailwind, tokens, layout, extraction des assets, CI | `pnpm build` OK ; login et coquille de l'app visuellement identiques à la maquette |
| 1 | **Données + Auth** | Schéma Prisma, migrations, seed démo, auth, RBAC, audit | Connexion réelle ; tests de la matrice de droits au vert |
| 2 | **Référentiels** | CRUD années, classes, élèves, parents, enseignants, calendrier, règles | Création d'une classe avec 30 élèves en < 3 min via l'UI |
| 3 | **Excel (cœur)** | `schema.ts`, export complet, modèle, import dry-run + réel, dictionnaire | Export → vidage de la base de test → import = **base strictement identique** (test automatisé) |
| 4 | **QR** | Génération signée, badges PDF, régénération | QR lu par un téléphone ; QR falsifié rejeté |
| 5 | **Scanner** | Caméra réelle, règles, doublons, PWA hors ligne, sync | 20 scans hors ligne se synchronisent sans doublon ; E2E Playwright |
| 6 | **Présences & tableau de bord** | Données réelles, appel, corrections, justificatifs | Compteurs = requêtes SQL de contrôle ; un parent ne voit que ses enfants |
| 7 | **Notifications** | Provider, file, reprises | Échec simulé → 3 tentatives tracées |
| 8 | **Rapports & sauvegardes** | Rapports Excel/PDF, cron de sauvegarde, restauration | Sauvegarde nocturne visible et restaurable en préproduction |
| 9 | **Durcissement** | Sécurité, a11y, perf, docs, tests E2E complets | Checklist section 11 entièrement cochée |
| 10 | **Mise en production** | Déploiement Vercel, domaine, secrets, runbook | Parcours complet réussi en production avec un compte DIRECTION réel |

---

## 11. Définition de « terminé »

- [ ] Aucune donnée codée en dur côté interface ; plus aucun bouton « Simuler ».
- [ ] Toutes les écritures passent par PostgreSQL ; la BDD Excel complète est téléchargeable et ré-importable à l'identique.
- [ ] Sauvegarde Excel quotidienne opérationnelle et restauration testée.
- [ ] Scanner testé hors ligne et en ligne sur au moins 2 téléphones.
- [ ] Droits par rôle vérifiés côté serveur, tests au vert.
- [ ] Couverture de tests unitaires ≥ 70 % sur `lib/` ; parcours critiques E2E verts.
- [ ] Lighthouse mobile ≥ 90 sur login/dashboard/scan.
- [ ] Documentation livrée (`ARCHITECTURE`, `EXCEL_SCHEMA`, `DEPLOY`, `SECURITY`, `RUNBOOK`) et `.env.example` à jour.
- [ ] Déployé sur Vercel, variables configurées, crons actifs, domaine HTTPS.

---

## 12. Questions à me poser (ne bloque pas, avance avec l'hypothèse par défaut)

1. **Nom et titre du précurseur** à afficher sous la photo ? *(défaut : « Précurseur de l'idée » seul)*
2. **Canal de notification prioritaire** : SMS, WhatsApp ou e-mail ? Fournisseur déjà choisi ? *(défaut : aucun envoi, fournisseur console)*
3. **Horaires réels** : ouverture, limite de retard, limite d'absence, par niveau ? *(défaut : 07:00 / 07:30 / 09:00)*
4. **Matin seulement ou matin + après-midi** (double pointage) ? *(défaut : un pointage par jour)*
5. **Nombre d'appareils de scan** et lieux (portail principal, par classe) ? *(défaut : un point d'entrée)*
6. **Année scolaire en cours** et format de matricule officiel de l'école ? *(défaut : ELV-AAAA-NNNN)*
7. **Comptes parents** : création par l'école ou auto-inscription avec validation ? *(défaut : création par l'école)*
8. **Nom de domaine** souhaité ? *(défaut : sous-domaine `.vercel.app`)*
9. **Plan Vercel** (Hobby/Pro) ? Il conditionne la fréquence des crons et la durée maximale des fonctions.
10. **Politique de conservation** des données d'anciens élèves ? *(défaut : 5 ans puis archivage)*

---

## 13. Interdictions

- Ne jamais stocker les mots de passe, hash ni secrets dans les exports Excel.
- Ne jamais utiliser le système de fichiers de Vercel comme stockage persistant.
- Ne jamais exécuter `prisma db push` / `migrate dev` en production.
- Ne jamais exposer de données d'élèves via une URL publique non authentifiée.
- Ne pas supprimer ni modifier `/maquette/`.
- Ne pas remplacer la charte graphique par un thème générique.

**Commence maintenant par la Phase 0, puis annonce-moi les questions bloquantes éventuelles avant d'attaquer la Phase 1.**
