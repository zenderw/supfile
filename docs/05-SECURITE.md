# Sécurité

## Authentification

- Mots de passe hashés via **bcrypt** (10 rounds, salt unique par mot de passe).
- **JWT** : algorithme HS256, secrets distincts pour access et refresh.
- Access token court (15 min) + refresh token long (30 j) avec rotation possible.
- Logout = suppression côté client. Pas de session serveur. Possibilité d'invalider un refresh token en cas de besoin (à implémenter via blacklist si nécessaire).

## Scoping par utilisateur

Toutes les requêtes authentifiées extraient le `userId` du JWT décodé (via `CurrentUser` decorator). Les requêtes Prisma filtrent systématiquement par `ownerId`, ce qui empêche un utilisateur d'accéder aux ressources d'un autre, même en forgeant l'UUID.

Exemple (extrait de `FilesService.softDelete`) :

```typescript
const file = await this.prisma.file.findFirst({
  where: { id: fileId, ownerId: userId, deletedAt: null },
});
if (!file) throw new NotFoundException('Fichier introuvable');
```

L'erreur retournée est volontairement « introuvable » et non « interdit » pour ne pas révéler l'existence d'une ressource appartenant à un autre user (enumeration attack).

## Rate limiting

`@nestjs/throttler` est appliqué globalement (100 req/min/IP) et plus strictement sur les endpoints sensibles :

- `/auth/login` et `/auth/register` : 5 tentatives/min/IP
- `/s/:token/verify` : 10 tentatives/min/IP

## Validation des entrées

- Tous les corps de requête sont validés via **class-validator** (DTO décorés).
- Les UUIDs en paramètre passent par `ParseUUIDPipe({ version: '4' })`.
- Les noms de fichiers sont sanitisés à l'upload (suppression `..`, slashes, caractères de contrôle).
- Multer rejette les fichiers > taille max plan et certaines extensions (`.exe`, `.bat`, `.sh`, etc.).

## Headers HTTP

`helmet` est activé en production :

- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security` (si HTTPS)
- `Referrer-Policy: no-referrer`
- `X-Frame-Options: désactivé` (pour autoriser l'iframe PDF interne)

CORS configuré pour autoriser uniquement l'origine du front.

## Secrets

- **Aucun secret en clair dans le code.** Tous les secrets passent par variables d'environnement.
- Le fichier `.env` est dans `.gitignore`. Seul `.env.example` (avec placeholders) est versionné.
- Les images Docker sont buildées en multi-stage, les secrets ne sont jamais copiés dans le runtime.

## Liens de partage

- Token de **32 octets aléatoires** encodés en base64url (≈ 256 bits d'entropie).
- Mot de passe optionnel hashé bcrypt indépendamment du mot de passe utilisateur.
- Expiration optionnelle, vérifiée à chaque accès.
- Révocation immédiate possible : un lien révoqué renvoie 403 même si pas expiré.
- Compteur `downloads` incrémenté à chaque téléchargement réussi pour traçabilité.

## Téléchargements via token signé

Le téléchargement de fichiers privés (`/files/:id/download`) et de dossiers ZIP (`/files/folders/:id/download`) utilise un **token JWT court** signé spécifiquement pour le téléchargement (60 secondes). Cela permet :

- D'utiliser des balises `<video>` / `<img>` / `<a download>` qui n'envoient pas le header `Authorization`.
- D'éviter de mettre le JWT access global dans la query string (les URLs apparaissent en clair dans les logs serveur et l'historique du navigateur).
- D'invalider rapidement un lien temporaire de prévisualisation ou de téléchargement.

Le flow est :

```
1. Client (authentifié) demande GET /files/:id/download-token
   → reçoit { token: "<jwt 60s>" }
2. Client construit l'URL GET /files/:id/download?token=<jwt>
   → utilise cette URL dans <a download> ou <video src>
3. Serveur vérifie la signature JWT et que le fileId correspond
   → stream le fichier si OK
```

## Quotas et limites

Chaque utilisateur a un quota défini par son plan (FREE 5 Go / PRO 100 Go / BUSINESS 1 To). Les contrôles sont faits côté serveur lors :

- de l'upload (refus si quota dépassé)
- de la création d'un lien de partage (refus si limite plan dépassée)
- du choix d'un mot de passe ou d'une expiration personnalisée (PRO/BUSINESS uniquement)

Aucune logique de quota côté client. Le client peut afficher l'état mais ne peut pas contourner les vérifications serveur.

## Audit

Les actions sensibles génèrent des logs structurés via le `LoggingInterceptor` :

- Tentatives de login (succès/échec)
- Création / révocation de liens de partage
- Suppression et purge de fichiers
- Upgrade / downgrade de plan
