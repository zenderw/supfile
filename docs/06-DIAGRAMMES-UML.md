# Diagrammes UML

Les diagrammes sont fournis en PNG dans `docs/diagrams/` (et `docs/diagrams/use-cases/` pour les cas d'utilisation découpés par domaine).

## Sommaire

1. [Cas d'utilisation](#1-cas-dutilisation)
   - [1.0 Vue d'ensemble](#10-vue-densemble)
   - [1.1 Authentification](#11-authentification)
   - [1.2 Gestion de fichiers](#12-gestion-de-fichiers)
   - [1.3 Prévisualisation](#13-prévisualisation)
   - [1.4 Partage public](#14-partage-public)
   - [1.5 Partage interne](#15-partage-interne-entre-utilisateurs)
   - [1.6 Recherche & Dashboard](#16-recherche--dashboard)
   - [1.7 Corbeille](#17-corbeille)
   - [1.8 Abonnement & Profil](#18-abonnement--profil)
2. [Diagramme de classes (modèle de données)](#2-diagramme-de-classes-modèle-de-données)
3. [Séquence : Login + Refresh JWT](#3-séquence--login--refresh-jwt)
4. [Séquence : OAuth Google (web)](#4-séquence--oauth-google-web)
5. [Séquence : OAuth Google (mobile)](#5-séquence--oauth-google-mobile)
6. [Séquence : Upload de fichier](#6-séquence--upload-de-fichier)
7. [Séquence : Création et utilisation d'un lien de partage](#7-séquence--création-et-utilisation-dun-lien-de-partage)
8. [Séquence : Téléchargement ZIP de dossier](#8-séquence--téléchargement-zip-de-dossier)
9. [Diagramme de déploiement](#9-diagramme-de-déploiement)

---

## 1. Cas d'utilisation

Les cas d'utilisation sont scindés par domaine fonctionnel pour faciliter la lecture. Une vue d'ensemble présente les acteurs et leurs domaines respectifs, suivie d'un diagramme détaillé par domaine.

**Acteurs** :

- **Visiteur** : utilisateur non authentifié. Peut accéder à l'authentification et aux liens publics qui lui sont envoyés.
- **Utilisateur** : utilisateur authentifié. Hérite des droits du visiteur et accède à toutes les fonctionnalités de la plateforme.

**Légende des relations** :

- Trait plein : association acteur ⇄ cas d'utilisation
- `-.include.->` : le cas source inclut systématiquement le cas cible
- `-.extend.->` : le cas source peut être étendu par le cas cible (optionnel)

### 1.0 Vue d'ensemble

![Vue d'ensemble des cas d'utilisation](diagrams/use-cases/00-overview.png)

### 1.1 Authentification

![Cas d'utilisation Authentification](diagrams/use-cases/01-authentication.png)

### 1.2 Gestion de fichiers

![Cas d'utilisation Gestion de fichiers](diagrams/use-cases/02-files.png)

### 1.3 Prévisualisation

![Cas d'utilisation Prévisualisation](diagrams/use-cases/03-preview.png)

### 1.4 Partage public

![Cas d'utilisation Partage public](diagrams/use-cases/04-public-share.png)

### 1.5 Partage interne entre utilisateurs

![Cas d'utilisation Partage interne](diagrams/use-cases/05-internal-share.png)

### 1.6 Recherche & Dashboard

![Cas d'utilisation Recherche et Dashboard](diagrams/use-cases/06-search-dashboard.png)

### 1.7 Corbeille

![Cas d'utilisation Corbeille](diagrams/use-cases/07-trash.png)

### 1.8 Abonnement & Profil

![Cas d'utilisation Abonnement et Profil](diagrams/use-cases/08-subscription.png)

---

## 2. Diagramme de classes (modèle de données)

![Diagramme de classes](diagrams/02-class-diagram.png)

**Contraintes** :

- `User.email` est unique.
- `OAuthAccount` : `(provider, providerId)` est unique.
- `ShareLink.token` est unique (génération aléatoire base64url 32 octets).
- `User.usedSpace` est plafonné à `Plan.quotaBytes` (FREE 5 Go / PRO 100 Go / BUSINESS 1 To).
- `deletedAt != null` ⟹ soft-delete (élément en corbeille).
- Cascade : `User` supprimé ⟹ toutes ses ressources cascadent. `Folder` ne peut pas être supprimé physiquement s'il contient des enfants (`onDelete: Restrict`).

---

## 3. Séquence : Login + Refresh JWT

![Séquence Login + Refresh](diagrams/03-sequence-login.png)

---

## 4. Séquence : OAuth Google (web)

![Séquence OAuth Google web](diagrams/04-sequence-oauth-web.png)

---

## 5. Séquence : OAuth Google (mobile)

![Séquence OAuth Google mobile](diagrams/05-sequence-oauth-mobile.png)

---

## 6. Séquence : Upload de fichier

![Séquence Upload](diagrams/06-sequence-upload.png)

---

## 7. Séquence : Création et utilisation d'un lien de partage

![Séquence Partage public](diagrams/07-sequence-share.png)

---

## 8. Séquence : Téléchargement ZIP de dossier

Le téléchargement ZIP utilise un token signé court (60s) pour pouvoir être utilisé dans un `<a download>` qui ne peut pas envoyer le header `Authorization`.

![Séquence Téléchargement ZIP](diagrams/08-sequence-zip.png)

---

## 9. Diagramme de déploiement

![Diagramme de déploiement](diagrams/09-deployment.png)

**Détails du déploiement** :

| Conteneur          | Image                | Ports      | Volumes montés                             |
| ------------------ | -------------------- | ---------- | ------------------------------------------ |
| `supfile-web`      | image locale (nginx) | 80:80      | —                                          |
| `supfile-api`      | image locale (node)  | 3000:3000  | `supfile_storage:/data`                    |
| `supfile-postgres` | postgres:16-alpine   | non exposé | `supfile_pg_data:/var/lib/postgresql/data` |

**Communications** :

- Le **navigateur** charge le bundle SPA depuis `nginx`, puis appelle directement l'API NestJS sur `:3000` (CORS activé).
- L'**app mobile** appelle directement l'API NestJS (pas de passage par nginx).
- L'**API** communique avec Postgres sur le réseau Docker interne (le port Postgres n'est pas exposé à l'hôte en production).
- Les **fichiers uploadés** sont écrits sur le volume `supfile_storage`, persistant entre redémarrages des conteneurs.
- La **BDD** est sur le volume `supfile_pg_data`, persistant entre redémarrages.

**Healthchecks** :

- `supfile-postgres` : `pg_isready` toutes les 5s.
- `supfile-api` : `wget http://localhost:3000/api/v1/health` toutes les 5s.
- `supfile-api` attend `supfile-postgres` healthy avant de démarrer (`depends_on`).
