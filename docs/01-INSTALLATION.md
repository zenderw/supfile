# Installation

## Pré-requis

| Outil          | Version minimale | Usage                |
| -------------- | ---------------- | -------------------- |
| Docker Desktop | 24+              | Déploiement          |
| Docker Compose | v2               | Orchestration        |
| Node.js        | 20 LTS           | Dev local uniquement |
| pnpm           | 9+               | Dev local uniquement |

## Installation pour déploiement

Le déploiement de référence se fait via Docker. Aucun pré-requis Node n'est nécessaire sur la machine hôte.

```bash
git clone https://github.com/zenderw/supfile.git
cd supfile
cp .env.example .env
# Editer .env pour fixer POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
docker compose up -d --build
```

Le premier build prend 3 à 5 minutes (build de l'image API NestJS + build du front Vite + récupération de Postgres et Nginx).

Une fois les containers up :

- **Web** : http://localhost
- **API** : http://localhost:3000/api/v1
- **Healthcheck** : http://localhost:3000/api/v1/health

## Installation pour développement

```bash
pnpm install
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d   # uniquement postgres + adminer
pnpm --filter @supfile/api dev                    # API sur :3000
pnpm --filter @supfile/web dev                    # Web sur :5173
pnpm --filter @supfile/mobile start               # Mobile (QR Code Expo Go)
```

Adminer pour inspecter la base : http://localhost:8080 (système : PostgreSQL, serveur : `postgres`).

## Arrêt

```bash
docker compose down       # garde les données
docker compose down -v    # supprime les volumes (RAZ totale)
```

## Structure du repo

```
supfile/
├── apps/
│   ├── api/         backend NestJS
│   ├── web/         front web (React + Vite)
│   └── mobile/      app mobile (Expo)
├── packages/
│   └── shared/      types TypeScript partagés
├── docs/            documentation (vous êtes ici)
├── docker-compose.yml       production
├── docker-compose.dev.yml   dev (Postgres + Adminer uniquement)
└── .env.example
```
