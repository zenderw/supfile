# Diagrammes UML

Tous les diagrammes sont en syntaxe **Mermaid**. Ils se rendent automatiquement sur GitHub, GitLab, VS Code (extension Markdown Preview Mermaid Support) et la plupart des éditeurs Markdown modernes.

## Sommaire

1. [Diagramme de cas d'utilisation](#1-diagramme-de-cas-dutilisation)
2. [Diagramme de classes (modèle de données)](#2-diagramme-de-classes-modèle-de-données)
3. [Diagramme de séquence : Login + Refresh JWT](#3-diagramme-de-séquence--login--refresh-jwt)
4. [Diagramme de séquence : OAuth Google (web)](#4-diagramme-de-séquence--oauth-google-web)
5. [Diagramme de séquence : OAuth Google (mobile)](#5-diagramme-de-séquence--oauth-google-mobile)
6. [Diagramme de séquence : Upload de fichier](#6-diagramme-de-séquence--upload-de-fichier)
7. [Diagramme de séquence : Création et utilisation d'un lien de partage](#7-diagramme-de-séquence--création-et-utilisation-dun-lien-de-partage)
8. [Diagramme de séquence : Téléchargement ZIP de dossier](#8-diagramme-de-séquence--téléchargement-zip-de-dossier)
9. [Diagramme de déploiement](#9-diagramme-de-déploiement)

---

## 1. Diagramme de cas d'utilisation

Acteurs : **Visiteur** (non authentifié) et **Utilisateur** (authentifié, hérite des droits du visiteur).

```mermaid
graph TB
    Visiteur((Visiteur))
    Utilisateur((Utilisateur))

    Utilisateur -.hérite de.-> Visiteur

    subgraph Authentification
        UC_Register[S'inscrire email/mdp]
        UC_LoginStd[Se connecter email/mdp]
        UC_LoginOAuth[Se connecter via Google]
        UC_Logout[Se déconnecter]
        UC_Refresh[Rafraîchir la session]
    end

    subgraph PartagePublic[Acces public]
        UC_OpenLink[Ouvrir un lien public]
        UC_VerifyPwd[Saisir mot de passe du lien]
        UC_DownloadPublic[Télécharger via lien]
    end

    subgraph GestionFichiers[Gestion de fichiers]
        UC_Upload[Uploader un fichier]
        UC_CreateFolder[Créer un dossier]
        UC_Navigate[Naviguer dans l'arborescence]
        UC_Rename[Renommer fichier ou dossier]
        UC_Delete[Supprimer fichier ou dossier]
        UC_Download[Télécharger un fichier]
        UC_DownloadZip[Télécharger dossier ZIP]
    end

    subgraph Previsualisation[Prévisualisation]
        UC_Preview[Prévisualiser un fichier]
        UC_StreamVideo[Streamer vidéo/audio]
    end

    subgraph Partage
        UC_CreateShare[Créer un lien de partage]
        UC_SharePwd[Ajouter mot de passe au lien]
        UC_ShareExp[Définir expiration du lien]
        UC_Revoke[Révoquer un lien]
        UC_ListShares[Lister mes liens]
    end

    subgraph Corbeille
        UC_ListTrash[Consulter la corbeille]
        UC_Restore[Restaurer un élément]
        UC_Purge[Purger définitivement]
    end

    subgraph Decouverte[Recherche et tableau de bord]
        UC_Search[Rechercher fichiers/dossiers]
        UC_Dashboard[Consulter le dashboard]
    end

    subgraph Abonnement
        UC_ViewPlans[Consulter les plans]
        UC_Upgrade[Changer de plan]
    end

    Visiteur --> UC_Register
    Visiteur --> UC_LoginStd
    Visiteur --> UC_LoginOAuth
    Visiteur --> UC_OpenLink
    UC_OpenLink -.include.-> UC_VerifyPwd
    UC_OpenLink --> UC_DownloadPublic

    Utilisateur --> UC_Logout
    Utilisateur --> UC_Upload
    Utilisateur --> UC_CreateFolder
    Utilisateur --> UC_Navigate
    Utilisateur --> UC_Rename
    Utilisateur --> UC_Delete
    Utilisateur --> UC_Download
    Utilisateur --> UC_DownloadZip
    Utilisateur --> UC_Preview
    UC_Preview -.extend.-> UC_StreamVideo
    Utilisateur --> UC_CreateShare
    UC_CreateShare -.extend.-> UC_SharePwd
    UC_CreateShare -.extend.-> UC_ShareExp
    Utilisateur --> UC_Revoke
    Utilisateur --> UC_ListShares
    Utilisateur --> UC_ListTrash
    UC_ListTrash -.extend.-> UC_Restore
    UC_ListTrash -.extend.-> UC_Purge
    Utilisateur --> UC_Search
    Utilisateur --> UC_Dashboard
    Utilisateur --> UC_ViewPlans
    Utilisateur --> UC_Upgrade
```

**Légende** :

- Trait plein : association acteur ⇄ cas d'utilisation
- `-.include.->` : le cas source inclut systématiquement le cas cible
- `-.extend.->` : le cas source peut être étendu par le cas cible (optionnel)

---

## 2. Diagramme de classes (modèle de données)

```mermaid
classDiagram
    class User {
        +UUID id
        +string email
        +string passwordHash
        +string displayName
        +string avatarUrl
        +bigint usedSpace
        +Plan plan
        +DateTime planUpdatedAt
        +DateTime createdAt
        +DateTime updatedAt
    }

    class OAuthAccount {
        +UUID id
        +string provider
        +string providerId
        +UUID userId
        +DateTime createdAt
    }

    class Folder {
        +UUID id
        +string name
        +UUID parentId
        +UUID ownerId
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
    }

    class File {
        +UUID id
        +string name
        +bigint size
        +string mimeType
        +string storagePath
        +UUID folderId
        +UUID ownerId
        +DateTime createdAt
        +DateTime updatedAt
        +DateTime deletedAt
    }

    class ShareLink {
        +UUID id
        +string token
        +UUID fileId
        +UUID ownerId
        +string passwordHash
        +DateTime expiresAt
        +DateTime revokedAt
        +int downloads
        +DateTime createdAt
        +DateTime updatedAt
    }

    class Plan {
        <<enumeration>>
        FREE
        PRO
        BUSINESS
    }

    User "1" --> "*" OAuthAccount : possède
    User "1" --> "*" Folder : possède
    User "1" --> "*" File : possède
    User "1" --> "*" ShareLink : émet
    User --> Plan : a un
    Folder "0..1" --> "*" Folder : parent / enfants
    Folder "0..1" --> "*" File : contient
    File "1" --> "*" ShareLink : partagé via
```

**Contraintes** :

- `User.email` est unique.
- `OAuthAccount` : `(provider, providerId)` est unique.
- `ShareLink.token` est unique (génération aléatoire base64url 32 octets).
- `User.usedSpace` est plafonné à `Plan.quotaBytes` (FREE 5 Go / PRO 100 Go / BUSINESS 1 To).
- `deletedAt != null` ⟹ soft-delete (élément en corbeille).
- Cascade : `User` supprimé ⟹ toutes ses ressources cascadent. `Folder` ne peut pas être supprimé physiquement s'il contient des enfants (`onDelete: Restrict`).

---

## 3. Diagramme de séquence : Login + Refresh JWT

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Client as Client (Web/Mobile)
    participant API as API NestJS
    participant DB as PostgreSQL

    Note over User,DB: Connexion initiale

    User->>Client: Saisit email + mot de passe
    Client->>API: POST /auth/login { email, password }
    API->>DB: SELECT user WHERE email = ?
    DB-->>API: User { passwordHash }
    API->>API: bcrypt.compare(password, passwordHash)

    alt Mot de passe invalide
        API-->>Client: 401 Unauthorized
        Client-->>User: Affiche erreur
    else Mot de passe valide
        API->>API: jwt.sign(accessToken, 15min)
        API->>API: jwt.sign(refreshToken, 30j)
        API-->>Client: 200 { user, accessToken, refreshToken }
        Client->>Client: Stocke tokens (localStorage / SecureStore)
        Client-->>User: Redirige vers /
    end

    Note over User,DB: Requêtes ultérieures

    Client->>API: GET /files (Authorization: Bearer <access>)
    API->>API: jwt.verify(access)
    API->>DB: SELECT files WHERE ownerId = ?
    DB-->>API: liste
    API-->>Client: 200 { ... }

    Note over User,DB: Rafraîchissement automatique à expiration

    Client->>API: GET /files (Authorization: Bearer <access expiré>)
    API-->>Client: 401 Unauthorized
    Client->>API: POST /auth/refresh { refreshToken }
    API->>API: jwt.verify(refreshToken)
    API->>DB: SELECT user WHERE id = ?
    DB-->>API: User
    API->>API: jwt.sign(new accessToken)
    API->>API: jwt.sign(new refreshToken)
    API-->>Client: 200 { accessToken, refreshToken }
    Client->>Client: Met à jour tokens
    Client->>API: GET /files (retry avec new access)
    API-->>Client: 200 { ... }
```

---

## 4. Diagramme de séquence : OAuth Google (web)

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Web as Client Web
    participant API as API NestJS
    participant Google as Google OAuth
    participant DB as PostgreSQL

    User->>Web: Clic "Continuer avec Google"
    Web->>API: Redirect GET /auth/google
    API->>Google: Redirect avec client_id + scope + state
    Google-->>User: Page consentement
    User->>Google: Approuve
    Google->>API: Redirect GET /auth/google/callback?code=...
    API->>Google: POST échange code -> access_token
    Google-->>API: access_token + profil { id, email, name }
    API->>DB: SELECT oauth_account WHERE provider=google AND providerId=?

    alt Compte existant
        DB-->>API: OAuthAccount { userId }
        API->>DB: SELECT user WHERE id = ?
    else Première connexion
        DB-->>API: null
        API->>DB: INSERT user { email, displayName }
        API->>DB: INSERT oauth_account { provider, providerId, userId }
    end

    API->>API: jwt.sign(accessToken)
    API->>API: jwt.sign(refreshToken)
    API->>Web: Redirect WEB_OAUTH_REDIRECT_URL?accessToken=...&refreshToken=...
    Web->>Web: Parse query string + stocke tokens
    Web-->>User: Affiche dashboard
```

---

## 5. Diagramme de séquence : OAuth Google (mobile)

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Mobile as App Mobile (Expo)
    participant Google as Google OAuth
    participant API as API NestJS
    participant DB as PostgreSQL

    User->>Mobile: Clic "Continuer avec Google"
    Mobile->>Mobile: Génère code_verifier + code_challenge (PKCE)
    Mobile->>Google: Ouvre navigateur in-app (authorization endpoint + PKCE)
    Google-->>User: Page consentement
    User->>Google: Approuve
    Google->>Mobile: Redirect deep-link supfile://auth?code=...
    Mobile->>Google: POST échange code + code_verifier
    Google-->>Mobile: idToken
    Mobile->>API: POST /auth/google/mobile { idToken }
    API->>Google: Vérifie idToken (clé publique)
    Google-->>API: profil { sub, email, name } validé
    API->>DB: Lookup ou création user + oauth_account
    DB-->>API: User
    API->>API: jwt.sign(accessToken + refreshToken)
    API-->>Mobile: 200 { user, accessToken, refreshToken }
    Mobile->>Mobile: SecureStore.set(tokens)
    Mobile-->>User: Affiche écran d'accueil
```

---

## 6. Diagramme de séquence : Upload de fichier

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Client as Client (Web/Mobile)
    participant API as API NestJS
    participant Plans as PlansService
    participant Storage as LocalStorageService
    participant DB as PostgreSQL
    participant FS as Volume Docker

    User->>Client: Sélectionne fichier + cible (dossier)
    Client->>API: POST /files/upload (multipart, Authorization)
    API->>API: JwtAuthGuard.canActivate()
    API->>Plans: getMaxFileSizeFor(userId)
    Plans->>DB: SELECT plan FROM users
    DB-->>Plans: plan
    Plans-->>API: maxFileBytes

    alt Fichier > maxFileBytes
        API-->>Client: 413 Payload Too Large
        Client-->>User: Affiche erreur
    else Taille OK
        API->>Plans: getQuotaFor(userId)
        Plans-->>API: quotaBytes
        API->>DB: SELECT usedSpace FROM users
        DB-->>API: usedSpace

        alt usedSpace + file.size > quotaBytes
            API-->>Client: 403 Forbidden (Quota dépassé)
        else Quota OK
            API->>Storage: write(buffer)
            Storage->>FS: fs.writeFile(/data/<uuid>)
            FS-->>Storage: storagePath
            Storage-->>API: storagePath
            API->>DB: BEGIN
            API->>DB: INSERT file { name, size, mime, storagePath, folderId, ownerId }
            API->>DB: UPDATE users SET usedSpace = usedSpace + size
            API->>DB: COMMIT
            DB-->>API: file { id }
            API-->>Client: 201 { id, name, size, mimeType, ... }
            Client-->>User: Toast "Fichier uploadé"
        end
    end
```

---

## 7. Diagramme de séquence : Création et utilisation d'un lien de partage

```mermaid
sequenceDiagram
    actor Owner as Propriétaire
    actor Recipient as Destinataire
    participant Client as Client Web
    participant API as API NestJS
    participant Plans as PlansService
    participant DB as PostgreSQL
    participant Storage as LocalStorageService

    Note over Owner,Storage: Création du lien

    Owner->>Client: Ouvre dialog "Partager", saisit mdp + expiration
    Client->>API: POST /share/files/:fileId { password?, expiresInHours? } (Authorization)
    API->>Plans: assertActiveLinksUnderLimit(userId)

    alt Limite plan atteinte
        Plans-->>API: ForbiddenException
        API-->>Client: 403 + message clair
    else OK
        opt password présent
            API->>Plans: assertCanCreatePasswordShare(userId)
        end
        opt expiresInHours présent
            API->>Plans: assertCanCreateCustomExpiry(userId)
        end
        API->>API: token = randomBytes(32).toString('base64url')
        API->>API: passwordHash = bcrypt.hash(password)
        API->>DB: INSERT share_link { token, fileId, ownerId, passwordHash, expiresAt }
        DB-->>API: shareLink
        API-->>Client: 201 { token, hasPassword, expiresAt }
        Client->>Client: Affiche URL https://.../s/<token>
        Client-->>Owner: Owner copie l'URL
    end

    Owner->>Recipient: Envoie l'URL (mail, SMS, ...)

    Note over Owner,Storage: Accès par le destinataire

    Recipient->>Client: Ouvre l'URL /s/<token>
    Client->>API: GET /s/:token
    API->>DB: SELECT share_link WHERE token = ?

    alt Lien inexistant / révoqué / expiré
        API-->>Client: 404 / 403 / 410
        Client-->>Recipient: Affiche erreur
    else Lien valide
        API-->>Client: 200 { name, mimeType, size, requiresPassword }
        Client-->>Recipient: Affiche métadonnées

        opt requiresPassword
            Recipient->>Client: Saisit mot de passe
            Client->>API: POST /s/:token/verify { password }
            API->>API: bcrypt.compare(password, passwordHash)
            alt Mauvais mdp
                API-->>Client: 401 (max 10 tentatives/min)
            else OK
                API-->>Client: 200
            end
        end

        Recipient->>Client: Clic "Télécharger"
        Client->>API: GET /s/:token/download?password=<si demandé>
        API->>Storage: read(storagePath)
        Storage-->>API: stream
        API->>DB: UPDATE share_link SET downloads += 1
        API-->>Recipient: Stream du fichier (attachment)
    end
```

---

## 8. Diagramme de séquence : Téléchargement ZIP de dossier

Le téléchargement ZIP utilise un token signé court (60s) pour pouvoir être utilisé dans un `<a download>` qui ne peut pas envoyer le header `Authorization`.

```mermaid
sequenceDiagram
    actor User as Utilisateur
    participant Client as Client Web
    participant API as API NestJS
    participant Token as DownloadTokenService
    participant ZipSvc as ZipService
    participant DB as PostgreSQL
    participant FS as Volume Docker

    User->>Client: Clic "Télécharger" sur un dossier
    Client->>API: GET /files/folders/:id/download-token (Authorization)
    API->>API: JwtAuthGuard.canActivate()
    API->>Token: signFolder(userId, folderId)
    Token-->>API: jwt 60s { sub, folderId }
    API-->>Client: 200 { token }
    Client->>Client: Construit URL /files/folders/:id/download?token=<jwt>
    Client->>Client: Crée <a download> + click programmé

    Client->>API: GET /files/folders/:id/download?token=<jwt>
    API->>Token: verifyFolder(token)
    Token-->>API: payload { sub, folderId }

    alt Token invalide / expiré / mauvais folderId
        API-->>Client: 401 Unauthorized
    else OK
        API->>API: setHeader Content-Type application/zip
        API->>ZipSvc: streamFolder(userId, folderId, res)
        ZipSvc->>DB: SELECT folders + files récursif WHERE ownerId
        DB-->>ZipSvc: arborescence
        loop pour chaque fichier
            ZipSvc->>FS: fs.createReadStream(storagePath)
            FS-->>ZipSvc: stream
            ZipSvc->>Client: archiver.append(stream, path)
        end
        ZipSvc->>Client: archiver.finalize() -> end of stream
        Client-->>User: Téléchargement archive-XXXX.zip
    end
```

---

## 9. Diagramme de déploiement

```mermaid
graph TB
    subgraph PosteUser[Poste utilisateur]
        Browser[Navigateur Chrome/Firefox]
        Mobile[App SUPFile<br/>Android ou iOS]
    end

    subgraph DockerHost[Serveur Docker]
        subgraph Network[Réseau interne supfile_default]
            Nginx["Container supfile-web<br/>nginx:alpine<br/>port hôte 80"]
            NestJS["Container supfile-api<br/>node:20-alpine<br/>port hôte 3000"]
            Postgres["Container supfile-postgres<br/>postgres:16-alpine<br/>port interne 5432"]
        end

        VolDB[(Volume<br/>supfile_pg_data<br/>/var/lib/postgresql/data)]
        VolStore[(Volume<br/>supfile_storage<br/>/data)]
    end

    Browser -->|HTTP :80| Nginx
    Mobile -->|HTTPS :3000| NestJS
    Nginx -->|fichiers statiques| Browser
    Browser -.->|/api/v1/* :3000| NestJS

    NestJS -->|TCP :5432| Postgres
    Postgres --> VolDB
    NestJS -->|read/write fichiers| VolStore

    classDef container fill:#e1f5ff,stroke:#0288d1,stroke-width:2px
    classDef volume fill:#fff3e0,stroke:#f57c00,stroke-width:2px
    classDef client fill:#f3e5f5,stroke:#7b1fa2,stroke-width:2px

    class Nginx,NestJS,Postgres container
    class VolDB,VolStore volume
    class Browser,Mobile client
```

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
