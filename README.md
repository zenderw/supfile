# SUPFile

Plateforme de stockage cloud type Drive/Dropbox, livrée comme projet de fin d'année 4PROJ à SUPINFO. Le périmètre couvre une application web React, une application mobile Expo et une API NestJS qui sert les deux, le tout déployable d'un coup via Docker Compose.

## Sommaire

- [Aperçu](#aperçu)
- [Stack technique](#stack-technique)
- [Pré-requis](#pré-requis)
- [Démarrage rapide (Docker)](#démarrage-rapide-docker)
- [Démarrage en dev local](#démarrage-en-dev-local)
- [Variables d'environnement obligatoires](#variables-denvironnement-obligatoires)
- [Structure du repo](#structure-du-repo)
- [Fonctionnalités implémentées](#fonctionnalités-implémentées)
- [Documentation complète](#documentation-complète)
- [Équipe](#équipe)

## Aperçu

| Service            | URL après `docker compose up`                                      | Description                                                  |
| ------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------ |
| Application web    | http://localhost                                                   | SPA React servie par nginx                                   |
| API REST           | http://localhost:3000/api/v1                                       | Backend NestJS, JWT obligatoires sauf routes publiques       |
| Swagger UI         | http://localhost:3000/api/docs                                     | Documentation API interactive, testable depuis le navigateur |
| Healthcheck        | http://localhost:3000/api/v1/health                                | Statut API + connexion BDD                                   |
| Application mobile | Expo Go (QR code généré par `pnpm --filter @supfile/mobile start`) | Compatible iOS et Android                                    |

L'application est entièrement en français (interface, messages d'erreur, documentation).

## Stack technique

**Backend** — NestJS 10 (TypeScript) avec Prisma 5 comme ORM sur PostgreSQL 16. Authentification JWT (access + refresh) avec bcrypt pour le hash des mots de passe, OAuth Google via Passport, validation des entrées avec class-validator, rate limiting global via `@nestjs/throttler`, helmet pour les headers HTTP, multer pour les uploads. Stockage des fichiers sur volume Docker via un service abstrait `StorageService` (interface qui pourrait pointer plus tard sur S3 sans toucher au reste).

**Frontend web** — React 18 + Vite + TypeScript. UI construite avec shadcn/ui + Tailwind CSS, navigation par React Router, gestion d'état serveur avec TanStack Query, état client avec Zustand. Toasts via Sonner, formulaires avec React Hook Form + Zod.

**Application mobile** — Expo SDK 54 + React Native + TypeScript. Navigation file-based via Expo Router, styles via NativeWind 4 (Tailwind pour RN), uploads natifs via expo-image-picker / expo-document-picker / expo-camera. Compatible iOS et Android via Expo Go pour le dev.

**Containerisation** — `docker-compose.yml` orchestre trois services (Postgres, API, web servi par nginx). Images multi-stage pour réduire la taille finale. Volumes nommés pour la persistance de la BDD et des fichiers uploadés.

## Pré-requis

| Outil          | Version | Quand                                                       |
| -------------- | ------- | ----------------------------------------------------------- |
| Docker Desktop | 24+     | Pour le déploiement (suffit à tout faire tourner)           |
| Docker Compose | v2      | Inclus dans Docker Desktop récent                           |
| Node.js        | 20 LTS  | Uniquement pour développer / lancer l'app mobile localement |
| pnpm           | 9+      | Idem                                                        |

Pour la démo, **Docker suffit**. Le développement local n'est utile que pour relancer rapidement après modification d'un fichier source ou pour lancer le mobile via Expo Go.

## Démarrage rapide (Docker)

```bash
git clone https://github.com/zenderw/supfile.git
cd supfile
cp .env.example .env
# Ouvrir le .env et fixer au minimum POSTGRES_PASSWORD, JWT_SECRET, JWT_REFRESH_SECRET
docker compose up -d --build
```

Premier build : 3 à 5 minutes (récupération des images Postgres / nginx, build de l'image API et du bundle Vite). Les builds suivants tirent partie du cache et durent moins d'une minute.

Vérifier que tout est sain :

```bash
docker compose ps
curl http://localhost:3000/api/v1/health
```

Ouvrir http://localhost dans un navigateur, créer un compte via le formulaire d'inscription, et c'est parti.

**Arrêt sans perte de données** :

```bash
docker compose down
```

**Reset complet (purge BDD + fichiers stockés)** :

```bash
docker compose down -v
```

## Démarrage en dev local

Utile pour itérer rapidement sur le code sans rebuild Docker à chaque fois.

```bash
pnpm install                                       # installe les deps du monorepo
cp .env.example .env                               # configure les variables
docker compose -f docker-compose.dev.yml up -d     # juste Postgres + Adminer
pnpm --filter @supfile/api dev                     # API   sur http://localhost:3000
pnpm --filter @supfile/web dev                     # Web   sur http://localhost:5173
pnpm --filter @supfile/mobile start                # Expo Go QR code
```

Adminer pour inspecter la BDD : http://localhost:8080 (système : PostgreSQL, serveur : `postgres`, login/mdp depuis le `.env`).

**Particularité mobile** : le `.env` racine est automatiquement copié dans `apps/mobile/.env` au démarrage de `pnpm --filter @supfile/mobile start`. C'est nécessaire pour qu'Expo voit les variables `EXPO_PUBLIC_*`. Si tu modifies le `.env` racine, relance Expo.

## Variables d'environnement obligatoires

Le fichier `.env` à la racine doit définir au minimum :

| Variable               | Description                           | Comment générer                                 |
| ---------------------- | ------------------------------------- | ----------------------------------------------- |
| `POSTGRES_PASSWORD`    | Mot de passe Postgres                 | Chaîne aléatoire 24+ caractères                 |
| `JWT_SECRET`           | Secret pour signer les access tokens  | `openssl rand -hex 32`                          |
| `JWT_REFRESH_SECRET`   | Secret pour signer les refresh tokens | `openssl rand -hex 32` (différent du précédent) |
| `GOOGLE_CLIENT_ID`     | Client OAuth Google Web               | Console Google Cloud → Credentials              |
| `GOOGLE_CLIENT_SECRET` | Secret OAuth Google Web               | Idem                                            |

Le fichier `.env.example` sert de modèle complet et liste aussi les variables optionnelles (ports, tailles d'image, healthcheck, etc.).

## Structure du repo

```
supfile/
├── apps/
│   ├── api/                NestJS — modules par domaine (auth, files, folders, share, search, stats, trash, plans, storage)
│   ├── web/                React + Vite — pages, components shadcn, hooks TanStack Query
│   └── mobile/             Expo Router — écrans, composants, lib OAuth, stores Zustand
├── packages/
│   └── shared/             Types TypeScript partagés (User, ErrorCode, JwtPayload)
├── docs/                   Documentation (cf section ci-dessous)
│   ├── 01-INSTALLATION.md
│   ├── 02-DEPLOIEMENT.md
│   ├── 03-ARCHITECTURE.md
│   ├── 04-API.md
│   ├── 06-DIAGRAMMES-UML.md
│   ├── MANUEL-UTILISATEUR.md
│   └── diagrams/           17 diagrammes UML en PNG (cas d'usage par domaine + classes + séquences + déploiement)
├── docker-compose.yml      Production : postgres + api + web (nginx)
├── docker-compose.dev.yml  Dev : postgres + adminer uniquement
├── pnpm-workspace.yaml
└── .env.example
```

## Fonctionnalités implémentées

### Authentification et profil

- Inscription email + mot de passe (bcrypt 10 rounds)
- Connexion email + mot de passe avec gestion d'erreurs
- Connexion OAuth Google sur le web (flow standard Passport)
- Connexion OAuth Google sur le mobile (navigateur système + state OAuth pour retour vers l'app)
- Refresh automatique des access tokens via interceptor axios
- Édition du profil : nom d'affichage, email, avatar (upload image directement, stocké sur le volume Docker)
- Changement de mot de passe avec contrôle de l'ancien

### Gestion de fichiers

- Arborescence de dossiers (profondeur max 50 niveaux), navigation breadcrumb
- Création, renommage, déplacement, suppression douce (corbeille)
- Upload simple via bouton + glisser-déposer depuis l'explorateur Windows / macOS
- Glisser-déposer interne : déplacer un fichier ou un dossier vers un autre dossier, vers un item du breadcrumb (pour remonter) ou vers la corbeille
- Téléchargement individuel avec range requests (utile pour le streaming audio/vidéo)
- Téléchargement d'un dossier complet sous forme d'archive ZIP générée à la volée (streaming, pas de buffer mémoire)

### Prévisualisation

- Images (jpg, png, gif, webp)
- PDF en iframe
- Texte brut (txt, md, json, xml)
- Streaming vidéo (mp4, webm) avec contrôles natifs
- Streaming audio (mp3, wav, ogg)
- Bouton "Télécharger" pour les formats non prévisualisables

### Partage

- Liens publics avec token aléatoire 256 bits encodé en base64url
- Mot de passe optionnel sur le lien (hashé bcrypt indépendamment)
- Expiration optionnelle : 1 heure, 1 jour, 7 jours, 30 jours, ou jamais
- Révocation immédiate (le lien révoqué renvoie 403 même avant expiration)
- Compteur de téléchargements affiché à côté de chaque lien
- Partage interne d'un dossier entre utilisateurs de la plateforme : le dossier apparaît à la racine du destinataire avec un badge "Partagé par X", en lecture seule

### Recherche et dashboard

- Recherche par nom (debounce 300 ms, insensible à la casse)
- Filtres : catégorie MIME (images, vidéos, audio, PDF, documents, autres) et date de modification (7j, 30j, 90j, 1 an)
- URL synchronisée avec les filtres (bookmark / partage possibles)
- Dashboard avec quota utilisé / disponible et graphique donut SVG de la répartition par catégorie
- Les segments du graphique et les tuiles "par catégorie" sont cliquables et ouvrent la recherche filtrée
- Liste des 5 derniers fichiers modifiés, cliquable vers l'aperçu

### Corbeille

- Liste de tous les éléments soft-deleted
- Restauration à l'emplacement d'origine (si le parent existe encore, sinon à la racine)
- Purge définitive avec libération de l'espace stockage
- Glisser-déposer d'un fichier ou dossier vers le lien "Corbeille" de la sidebar pour suppression rapide

### Plans freemium (bonus)

| Plan                    | Quota  | Taille max fichier | Liens actifs | Mot de passe lien | Expiration custom |
| ----------------------- | ------ | ------------------ | ------------ | ----------------- | ----------------- |
| FREE                    | 5 Go   | 500 Mo             | 3            | non               | non               |
| PRO (4,99 €/mois)       | 100 Go | 5 Go               | 100          | oui               | oui               |
| BUSINESS (14,99 €/mois) | 1 To   | 20 Go              | 1000         | oui               | oui               |

Upgrade ou downgrade depuis la page `/pricing`. Les contrôles de quota et de limite sont faits côté serveur, jamais sur le client.

### Apparence

- Thème clair / sombre côté web, persistant en localStorage, init avant hydratation pour éviter le flash blanc

## Documentation complète

Le dossier `docs/` détaille chaque aspect du projet :

- [docs/01-INSTALLATION.md](docs/01-INSTALLATION.md) — prérequis détaillés, install Docker, install dev, arborescence
- [docs/02-DEPLOIEMENT.md](docs/02-DEPLOIEMENT.md) — variables d'env, conteneurs, migrations, backup/restore, logs
- [docs/03-ARCHITECTURE.md](docs/03-ARCHITECTURE.md) — justification des choix techniques, découpage en modules NestJS, modèle de données
- [docs/04-API.md](docs/04-API.md) — accès Swagger, format des erreurs, codes HTTP utilisés
- [docs/06-DIAGRAMMES-UML.md](docs/06-DIAGRAMMES-UML.md) — 9 diagrammes de cas d'usage (un par domaine), diagramme de classes, 6 diagrammes de séquence, diagramme de déploiement
- [docs/MANUEL-UTILISATEUR.md](docs/MANUEL-UTILISATEUR.md) — guide pas à pas pour l'utilisateur final, avec les cas d'usage courants

La documentation API interactive est servie en live par l'application sur http://localhost:3000/api/docs (Swagger UI). Le jury peut tester chaque endpoint directement depuis le navigateur.

## Équipe

- **Wayl Zender** ([zenderw](https://github.com/zenderw))
- **Arthur Bertolotti** ([Artberto83](https://github.com/Artberto83))
- **Maloé Laversin** ([UneVreche](https://github.com/UneVreche))

## Licence

Projet académique SUPINFO 4PROJ. Non distribuable.
