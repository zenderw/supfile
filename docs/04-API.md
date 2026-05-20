# API REST

## Documentation interactive Swagger

L'API est documentée via **Swagger UI**, accessible en local à l'adresse :

**http://localhost:3000/api/docs**

L'interface permet de :

- Visualiser tous les endpoints groupés par module (auth, folders, files, share, search, stats, trash, plans, health)
- Tester directement les endpoints depuis le navigateur
- Voir les schémas de requête et de réponse
- Récupérer la spécification OpenAPI 3.0 brute : http://localhost:3000/api/docs-json

## Authentification dans Swagger

Pour tester les endpoints protégés (marqués 🔒) :

1. Appeler `POST /auth/login` avec ton email + mot de passe → récupérer le `accessToken`
2. Cliquer sur le bouton **Authorize** en haut à droite
3. Coller le token (sans le préfixe `Bearer`)
4. Tous les endpoints protégés sont maintenant utilisables

Le bouton « Authorize » persiste le token entre rechargements (option `persistAuthorization`).

## Préfixe global

Toutes les routes API sont préfixées par `/api/v1`. Exemple : la route `POST /auth/login` s'appelle en réalité à `POST http://localhost:3000/api/v1/auth/login`.

## Format des erreurs

Toutes les erreurs renvoient un JSON au format NestJS standard :

```json
{
  "statusCode": 403,
  "message": "Vous avez atteint la limite de 3 liens actifs..."
}
```

## Codes HTTP utilisés

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
