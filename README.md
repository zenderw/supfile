# SUPFile

Plateforme de stockage cloud type Drive/Dropbox - projet 4PROJ SUPINFO.

App web + mobile + API, le tout dockerisable pour le déploiement.

## Stack technique

- API : NestJS + Prisma + Postgres
- Web : React + Vite + shadcn/ui + Tailwind
- Mobile : Expo (React Native) + NativeWind
- Monorepo : pnpm workspaces

## Prerequis

- Node 20 ou plus
- pnpm 9+
- Docker Desktop

## Structure du repo

```
supfile/
├── apps/
│   ├── api/         # backend NestJS
│   ├── web/         # front web
│   └── mobile/      # appli mobile Expo
├── packages/
│   └── shared/      # types partagés entre les 3 apps
├── docker-compose.yml       # docker prod (postgres + api + web)
├── docker-compose.dev.yml   # juste postgres pour dev en local
└── ...
```

## Lancer en dev

D'abord installer les deps :

```bash
pnpm install
```

Lancer la BDD avec docker (en local on lance que postgres, le reste tourne via pnpm) :

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
```

Adminer est aussi lancé sur http://localhost:8080 si tu veux inspecter la BDD (système : PostgreSQL, serveur : `postgres`).

Ensuite faut lancer les 3 apps dans des terminaux séparés :

```bash
pnpm --filter @supfile/api dev
pnpm --filter @supfile/web dev
pnpm --filter @supfile/mobile start
```

L'API tourne sur le port 3000, le web sur 5173, et le mobile affiche un QR code pour Expo Go.

## Lancer en prod via Docker

Il faut un fichier `.env` à la racine avec au minimum :

```
POSTGRES_PASSWORD=...
JWT_SECRET=...           # une vraie chaine aleatoire, genre 64 chars
JWT_REFRESH_SECRET=...   # autre chaine, differente du JWT_SECRET
```

Le `.env.example` est là pour servir de modèle.

Ensuite :

```bash
docker compose up -d --build
```

Le premier build prend quelques minutes (build de l'image API + build du front avec Vite). Une fois fini :

- web : http://localhost
- api : http://localhost:3000/api/v1
- bdd : interne au réseau Docker, pas exposée

Les containers :

- `supfile-postgres` : PostgreSQL 16
- `supfile-api` : API NestJS, applique les migrations au démarrage
- `supfile-web` : Front buildé, servi par nginx avec un rewrite SPA

Et les volumes Docker pour la persistance :

- `supfile_pg_data` : données de la BDD
- `supfile_storage` : fichiers uploadés par les users

## Stopper

```bash
docker compose down
```

Si tu veux tout reset (efface aussi les volumes, donc les données) :

```bash
docker compose down -v
```

## Doc utilisateur

Voir [docs/MANUEL-UTILISATEUR.md](docs/MANUEL-UTILISATEUR.md) pour le manuel coté utilisateur final (comment creer un compte, uploader, partager...).

## Equipe

- Wayl Zender
- Arthur Bertolotti
- Maloé Laversin
