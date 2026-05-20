# SUPFile

Plateforme de stockage cloud type Drive/Dropbox — projet 4PROJ SUPINFO.

Application web + mobile + API, le tout dockerisable pour le déploiement.

## Documentation

- **[docs/DOCUMENTATION-TECHNIQUE.md](docs/DOCUMENTATION-TECHNIQUE.md)** — architecture, choix techniques, modèle de données, endpoints API, sécurité.
- **[docs/MANUEL-UTILISATEUR.md](docs/MANUEL-UTILISATEUR.md)** — guide pas à pas pour l'utilisateur final.

## Stack technique

- **API** : NestJS 10 + Prisma 5 + PostgreSQL 16
- **Web** : React 18 + Vite + shadcn/ui + Tailwind CSS
- **Mobile** : Expo SDK 54 (React Native) + NativeWind 4
- **Monorepo** : pnpm workspaces

## Pré-requis

- Node 20 LTS ou plus (dev local uniquement)
- pnpm 9+
- Docker Desktop (déploiement)

## Structure du repo

```
supfile/
├── apps/
│   ├── api/         backend NestJS
│   ├── web/         front web (React + Vite)
│   └── mobile/      app mobile (Expo)
├── packages/
│   └── shared/      types TypeScript partagés
├── docs/
│   ├── DOCUMENTATION-TECHNIQUE.md
│   └── MANUEL-UTILISATEUR.md
├── docker-compose.yml       production (postgres + api + web)
├── docker-compose.dev.yml   dev (postgres + adminer)
└── .env.example
```

## Démarrage rapide (Docker)

```bash
git clone https://github.com/zenderw/supfile.git
cd supfile
cp .env.example .env
# Editer .env pour fixer POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
docker compose up -d --build
```

Une fois les containers up :

- **Web** : http://localhost
- **API** : http://localhost:3000/api/v1
- **Healthcheck** : http://localhost:3000/api/v1/health

Stopper :

```bash
docker compose down       # garde les données
docker compose down -v    # supprime aussi les volumes (RAZ totale)
```

## Démarrage en dev

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # juste Postgres + Adminer
pnpm --filter @supfile/api dev                    # API   → http://localhost:3000
pnpm --filter @supfile/web dev                    # Web   → http://localhost:5173
pnpm --filter @supfile/mobile start               # Expo Go QR Code
```

Adminer pour inspecter la BDD : http://localhost:8080 (système : PostgreSQL, serveur : `postgres`).

## Fonctionnalités

### Authentification

- Inscription et connexion email / mot de passe (bcrypt + JWT)
- OAuth2 Google (web et mobile)

### Gestion de fichiers

- Arborescence de dossiers avec breadcrumb
- Upload de fichiers avec barre de progression
- Renommage, déplacement (via API), suppression douce (corbeille)
- Téléchargement individuel
- Téléchargement de dossier complet sous forme d'archive ZIP générée à la volée

### Prévisualisation

- Images, PDF, texte affichés en ligne
- Streaming audio / vidéo avec HTTP range requests

### Partage

- Génération de liens publics avec token aléatoire 256 bits
- Mot de passe optionnel (bcrypt)
- Expiration optionnelle (1h, 1j, 7j, 30j ou jamais)
- Révocation à tout moment

### Recherche

- Recherche par nom, fichiers et dossiers
- Filtres par type MIME et par date

### Dashboard

- Quota utilisé / disponible avec graphique
- Répartition par type de fichier
- 5 derniers fichiers modifiés

### Corbeille

- Soft delete pour fichiers et dossiers
- Restauration ou purge définitive

### Business model (bonus)

- Plans freemium : FREE (5 Go) / PRO (100 Go) / BUSINESS (1 To)
- Quotas, limites de partage et features différenciés par plan

## Équipe

- Wayl Zender (zenderw)
- Arthur Bertolotti
- Maloé Laversin

## Licence

Projet académique SUPINFO 4PROJ — non distribuable.
