# API REST

Toutes les routes API sont préfixées par `/api/v1`. Les routes marquées 🔒 nécessitent un header `Authorization: Bearer <accessToken>`.

## Auth

| Méthode | Route                   | Description                                         |
| ------- | ----------------------- | --------------------------------------------------- |
| POST    | `/auth/register`        | Inscription email/mot de passe                      |
| POST    | `/auth/login`           | Connexion email/mot de passe                        |
| POST    | `/auth/refresh`         | Échange refresh token contre nouveau access token   |
| GET     | `/auth/me` 🔒           | Profil de l'utilisateur courant                     |
| GET     | `/auth/google`          | Démarre le flow OAuth Google (web)                  |
| GET     | `/auth/google/callback` | Callback Google, redirige vers le front avec tokens |
| POST    | `/auth/google/mobile`   | Connexion Google depuis mobile (idToken PKCE)       |

## Folders

| Méthode | Route                               | Description                                 |
| ------- | ----------------------------------- | ------------------------------------------- |
| GET     | `/folders?parentId=<uuid\|null>` 🔒 | Liste fichiers + sous-dossiers d'un dossier |
| GET     | `/folders/:id/breadcrumb` 🔒        | Fil d'Ariane d'un dossier                   |
| POST    | `/folders` 🔒                       | Créer un dossier                            |
| PATCH   | `/folders/:id` 🔒                   | Renommer un dossier                         |
| DELETE  | `/folders/:id` 🔒                   | Soft-delete (vers corbeille)                |

## Files

| Méthode | Route                                   | Description                                                                               |
| ------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| POST    | `/files/upload` 🔒                      | Upload (multipart, champ `file`)                                                          |
| GET     | `/files/:id` 🔒                         | Métadonnées                                                                               |
| PATCH   | `/files/:id` 🔒                         | Renommer                                                                                  |
| DELETE  | `/files/:id` 🔒                         | Soft-delete                                                                               |
| GET     | `/files/:id/download-token` 🔒          | Génère un token signé court (pour passer en query string sur balises `<video>` / `<img>`) |
| GET     | `/files/:id/download?token=...`         | Téléchargement / streaming (range requests supportées)                                    |
| GET     | `/files/folders/:id/download-token` 🔒  | Génère un token signé pour télécharger un dossier en ZIP                                  |
| GET     | `/files/folders/:id/download?token=...` | Téléchargement ZIP à la volée d'un dossier complet                                        |

## Share

| Méthode | Route                             | Description                                                   |
| ------- | --------------------------------- | ------------------------------------------------------------- |
| POST    | `/share/files/:fileId` 🔒         | Créer un lien de partage (options : mot de passe, expiration) |
| GET     | `/share/mine` 🔒                  | Liste de mes liens actifs                                     |
| DELETE  | `/share/:id` 🔒                   | Révoquer un lien                                              |
| GET     | `/s/:token`                       | Métadonnées publiques d'un lien                               |
| POST    | `/s/:token/verify`                | Vérifier le mot de passe d'un lien (10 req/min max)           |
| GET     | `/s/:token/download?password=...` | Télécharger via lien public                                   |

## Search

| Méthode | Route                                       | Description                                                    |
| ------- | ------------------------------------------- | -------------------------------------------------------------- |
| GET     | `/search?q=...&type=...&from=...&to=...` 🔒 | Recherche unifiée fichiers + dossiers, avec filtres optionnels |

## Stats

| Méthode | Route       | Description                                                                |
| ------- | ----------- | -------------------------------------------------------------------------- |
| GET     | `/stats` 🔒 | Quota utilisé, total fichiers, fichiers récents, répartition par type MIME |

## Trash

| Méthode | Route                           | Description                     |
| ------- | ------------------------------- | ------------------------------- |
| GET     | `/trash` 🔒                     | Liste des éléments en corbeille |
| POST    | `/trash/folders/:id/restore` 🔒 | Restaurer un dossier            |
| POST    | `/trash/files/:id/restore` 🔒   | Restaurer un fichier            |
| DELETE  | `/trash/folders/:id` 🔒         | Purge définitive d'un dossier   |
| DELETE  | `/trash/files/:id` 🔒           | Purge définitive d'un fichier   |

## Plans (business model freemium)

| Méthode | Route                  | Description                                         |
| ------- | ---------------------- | --------------------------------------------------- |
| GET     | `/plans`               | Liste des plans disponibles avec features et tarifs |
| GET     | `/plans/me` 🔒         | Plan courant + features de l'utilisateur            |
| POST    | `/plans/me/upgrade` 🔒 | Changer de plan (FREE / PRO / BUSINESS)             |

## Health

| Méthode | Route     | Description                                |
| ------- | --------- | ------------------------------------------ |
| GET     | `/health` | Statut API + BDD (pour Docker healthcheck) |

## Format des erreurs

Toutes les erreurs renvoient un JSON au format :

```json
{
  "statusCode": 403,
  "message": "Vous avez atteint la limite de 3 liens actifs..."
}
```

Codes HTTP utilisés :

| Code | Sens                                                          |
| ---- | ------------------------------------------------------------- |
| 200  | OK                                                            |
| 201  | Created (inscription, création dossier, upload, lien partage) |
| 204  | No Content (suppression, restauration, révocation)            |
| 400  | Validation échouée (DTO invalide, range invalide)             |
| 401  | Non authentifié (token manquant, invalide, expiré)            |
| 403  | Interdit (quota dépassé, limite plan, lien révoqué)           |
| 404  | Ressource introuvable                                         |
| 410  | Lien expiré                                                   |
| 416  | Range requested not satisfiable (streaming)                   |
| 429  | Trop de requêtes (rate limit)                                 |
| 500  | Erreur serveur                                                |
