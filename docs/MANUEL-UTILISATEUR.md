# Manuel utilisateur — SUPFile

Bienvenue sur SUPFile, plateforme de stockage cloud. Ce guide présente l'utilisation de l'application web et mobile.

## Création de compte

Deux options :

- **Email / mot de passe** : depuis la page `/register`, renseigner un email valide, un mot de passe (minimum 8 caractères) et un nom affiché.
- **Compte Google** : cliquer sur « Continuer avec Google » sur la page de connexion ou d'inscription. La création de compte se fait automatiquement à la première connexion.

## Connexion

- Page `/login` (web) ou écran « Connexion » (mobile).
- Email + mot de passe, ou bouton Google.
- La session reste active 30 jours (refresh automatique).

## Navigation des fichiers

### Web

La sidebar de gauche donne accès à :

- **Accueil** : tableau de bord avec espace utilisé, totaux, fichiers récents et répartition par type.
- **Mes fichiers** : explorateur de dossiers avec breadcrumb (chemin cliquable).
- **Recherche** : recherche par nom, séparée en sections « Dossiers » et « Fichiers ».
- **Corbeille** : fichiers et dossiers supprimés (restaurables ou purgeables).

### Mobile

L'écran d'accueil affiche un mini-dashboard et trois boutons : Mes fichiers, Rechercher, Corbeille.

## Créer un dossier

- **Web** : bouton « + Nouveau dossier » en haut à droite de la page Mes fichiers.
- **Mobile** : bouton « + Nouveau dossier » au-dessus de la liste.

## Uploader un fichier

- **Web** : bouton « Envoyer ». Sélectionner un fichier sur le disque.
- **Mobile** : bouton « ⬆ Envoyer ». Choisir entre :
  - **Document** : explorateur de fichiers
  - **Galerie** : photos et vidéos de l'appareil
  - **Caméra** : prise de photo directe

**Limites** : 5 Go max par fichier, 30 Go de quota total par utilisateur.

**Extensions bloquées** : `.exe`, `.bat`, `.cmd`, `.sh`, `.ps1`, `.msi`, `.scr`, `.vbs`, `.js`, `.jar`, `.dmg`, etc. (pour des raisons de sécurité).

## Aperçu de fichier

- **Web** : clic sur le nom du fichier, ou menu « ⋮ » → « Aperçu ». Les formats suivants sont prévisualisés directement :
  - Images (jpg, png, gif, webp, etc.)
  - Vidéos (mp4, webm) avec lecture
  - Audio (mp3, wav)
  - PDF
  - Texte brut (txt, json, xml, etc.)
- Pour les autres formats, utiliser « Télécharger ».

- **Mobile** : tap sur le fichier ouvre l'aperçu. Image et texte sont rendus nativement ; vidéo/audio/PDF proposent « Ouvrir dans le navigateur ».

## Renommer

- Menu « ⋮ » (web) ou appui long (mobile) → « Renommer ». Saisir le nouveau nom.

## Supprimer

- Menu « ⋮ » / appui long → « Supprimer ». Le fichier ou dossier va en **corbeille** (suppression douce).
- Depuis la corbeille : « Restaurer » remet à sa place d'origine, « Supprimer définitivement » purge l'objet.

## Télécharger

### Fichier individuel

- Menu « ⋮ » → « Télécharger ». Le navigateur lance le téléchargement.

### Dossier complet (archive ZIP)

- Menu « ⋮ » d'un dossier → « Télécharger ». Une archive ZIP du dossier (et ses sous-dossiers) est générée et streamée.

## Partage public

Permet de générer un lien public permettant à n'importe qui (avec le lien) de télécharger un fichier.

### Créer un lien

- **Web** : menu « ⋮ » → « Partager ». Optionnellement :
  - Définir un **mot de passe** (au moins 4 caractères) — il sera demandé au destinataire.
  - Choisir une **expiration** (1 heure, 1 jour, 7 jours, 30 jours, ou jamais).
- Le lien généré peut être copié et envoyé.

- **Mobile** : menu d'actions → « Partager ». Un lien simple (sans mot de passe ni expiration) est créé puis ouvert dans la feuille de partage native (SMS, mail, Whatsapp, etc.).

### Utiliser un lien reçu

- Ouvrir le lien `https://.../s/<token>` dans n'importe quel navigateur.
- Saisir le mot de passe si demandé.
- Cliquer sur « Télécharger ».

### Révocation

Tout lien partagé peut être révoqué côté propriétaire (un lien révoqué retourne une erreur 403 immédiatement).

## Recherche

- Page « Recherche » (web) ou écran « Rechercher » (mobile).
- Taper au moins 2 caractères, les résultats apparaissent au fil de la frappe (debounce 300 ms).
- Les résultats sont séparés en deux sections : **Dossiers** et **Fichiers**.
- Cliquer sur un résultat ouvre le dossier ou l'aperçu du fichier.

## Corbeille

- Liste tous les éléments supprimés (fichiers + dossiers).
- **Restaurer** : remet l'élément à son emplacement d'origine (si le parent existe toujours, sinon à la racine).
- **Supprimer définitivement** : purge totale, libère l'espace de stockage, irréversible.

## Déconnexion

- **Web** : menu utilisateur en haut à droite → « Se déconnecter ».
- **Mobile** : bouton « Se déconnecter » en bas de l'accueil.

## Plans d'abonnement

SUPFile propose trois plans, accessibles depuis la page « Abonnement » dans la sidebar.

|                                    | **Free** (gratuit) | **Pro** (4,99 €/mois) | **Business** (14,99 €/mois) |
| ---------------------------------- | ------------------ | --------------------- | --------------------------- |
| Quota                              | 5 Go               | 100 Go                | 1 To                        |
| Taille max par fichier             | 500 Mo             | 5 Go                  | 20 Go                       |
| Liens de partage actifs simultanés | 3                  | 100                   | 1000                        |
| Mot de passe sur lien              | ❌                 | ✅                    | ✅                          |
| Expiration personnalisée           | ❌                 | ✅                    | ✅                          |
| Support prioritaire                | ❌                 | ❌                    | ✅                          |

Par défaut tout nouveau compte est en plan **Free**. L'upgrade se fait depuis la page « Abonnement » en un clic (simulation pour le projet académique — pas de paiement réel).

## Limites techniques

- **Taille max upload** : selon le plan (500 Mo Free / 5 Go Pro / 20 Go Business)
- **Profondeur maximale de dossiers** : 50 niveaux
- **Lien de partage** : token aléatoire de 32 caractères, mot de passe optionnel (bcrypt), expiration jusqu'à 30 jours
- **Session** : token d'accès valide 15 min, refresh automatique pendant 30 jours

## Sécurité

- Mots de passe stockés avec bcrypt (10 rounds).
- Tokens JWT séparés pour access (15 min) et refresh (30 j).
- Rate limiting : 5 tentatives de login/register par minute, 10 vérifications de mot de passe de partage par minute.
- Headers de sécurité via helmet.
- Toutes les opérations sur fichiers et dossiers sont scopées par utilisateur (impossible d'accéder à un fichier d'un autre compte).

## En cas de souci

- **« Quota dépassé »** : libérer de l'espace en purgeant la corbeille.
- **Lien de partage qui ne marche pas** : il a peut-être expiré ou été révoqué.
- **Échec d'upload sur mobile** : vérifier la connexion réseau, l'API a un timeout à 15s.
