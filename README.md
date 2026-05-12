# SUPFile

Plateforme de stockage cloud (type Drive / Dropbox) — projet 4PROJ.

## Stack

- **API** : NestJS + Prisma + PostgreSQL
- **Web** : Vite + React + shadcn/ui
- **Mobile** : Expo + React Native + NativeWind
- **Monorepo** : pnpm workspaces

## Arborescence

```
supfile/
├── apps/
│   ├── api/         # serveur NestJS
│   ├── web/         # client web React
│   └── mobile/      # client mobile Expo
├── packages/
│   └── shared/      # types et constantes partagés
├── package.json
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Démarrage rapide (dev)

```bash
# Installation des dépendances
pnpm install

# Lancement
pnpm --filter @supfile/api dev
pnpm --filter @supfile/web dev
pnpm --filter @supfile/mobile start
```

## Démarrage en production (Docker)

```bash
# 1. créer le fichier .env à la racine et remplir les secrets requis
cp .env.example .env
# editer .env pour mettre des vraies valeurs (POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET)

# 2. build + lancement
docker compose up -d --build

# 3. acceder à l'app
# - web : http://localhost
# - api : http://localhost:3000/api/v1
```

Les containers :

- `supfile-postgres` : base PostgreSQL (port 5432)
- `supfile-api` : API NestJS (port 3000), avec migrations appliquées au démarrage
- `supfile-web` : front Vite servi par nginx (port 80)

Les volumes :

- `supfile_pg_data` : données Postgres
- `supfile_storage` : fichiers uploadés

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker Desktop (pour la base de données)

## Démarrage de la base de données (dev)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

- **Postgres** : `localhost:5432` (user/pass selon `.env`)
- **Adminer** : `http://localhost:8080` (système : PostgreSQL, serveur : `postgres`)

Pour stopper :

```bash
docker compose -f docker-compose.dev.yml down
```

Pour réinitialiser totalement (efface les données) :

```bash
docker compose -f docker-compose.dev.yml down -v
```
