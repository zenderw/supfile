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

## Démarrage rapide

```bash
# Installation des dépendances
pnpm install

# Lancement (à venir dans les prochaines PRs)
pnpm api dev
pnpm web dev
pnpm mobile start
```

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker Desktop (pour la base de données)
