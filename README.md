# CSF Présence — Complexe Scolaire La Fortune

Application Next.js de gestion de présence par QR code (Direction, enseignants, parents, surveillants).

## Démarrage

```bash
npm install
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000).

## Authentification Supabase

La connexion repose sur **Supabase Auth** (e-mail / mot de passe) et la table métier `utilisateurs` (rôle, `lie_a_id`, compte actif).

### Pourquoi la table « Users » Supabase est vide ?

Les comptes de connexion doivent être créés dans **Authentication → Users** via l’API Admin. Les lignes SQL dans `utilisateurs` seules ne suffisent pas.

### Créer les comptes de démo

1. Copier `.env.example` vers `.env` et renseigner `NEXT_PUBLIC_SUPABASE_*` et `SUPABASE_SERVICE_ROLE_KEY`.
2. Appliquer le schéma : exécuter `supabase-schema.sql` dans l’éditeur SQL Supabase (ou `npm run db:push` si vous utilisez Prisma).
3. Lancer :

```bash
node scripts/create-users.js
# ou un admin interactif :
npm run create-admin
```

Comptes de démo (`create-users.js`) :

| E-mail | Mot de passe | Rôle |
|--------|--------------|------|
| direction@lafortune.cd | Admin123! | DIRECTION |
| marie.kabongo@lafortune.cd | Enseignant123! | ENSEIGNANT |
| pierre.mbuyi@example.com | Parent123! | PARENT |

### Flux technique

- Connexion : `POST /api/auth/login` → cookies de session SSR (`@supabase/ssr`).
- Middleware : rafraîchit la session et protège les routes `(app)`.
- Déconnexion : `POST /api/auth/logout`.

## Modules

| Module | Route | État |
|--------|-------|------|
| Tableau de bord | `/dashboard` | Stats API |
| Classes, élèves, parents, enseignants | CRUD API | Opérationnel |
| Calendrier, règles horaires | CRUD API | Opérationnel |
| Scanner | `/scan` | Caméra + API scan |
| Carte élève | `/card` | QR signé |
| Présences | `/presences` | Journal du jour |
| Justificatifs | `/justificatifs` | Liste |
| Rapports / Excel | `/rapports`, `/donnees-excel` | Export ExcelJS |
| PWA hors ligne, import Excel, audit | — | À venir (voir `prompt-windsurf-csf-presence (1).md`) |

## Scripts

- `npm run db:seed` — données de démo (Prisma, si `SEED_DEMO=true`)
- `npm run create-admin` — compte Direction (Supabase Auth + `utilisateurs`)
