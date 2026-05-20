# Guide de déploiement

## Variables d'environnement obligatoires

Les variables suivantes doivent être positionnées dans `.env` avant le premier `docker compose up` :

| Variable               | Description                | Exemple                                                   |
| ---------------------- | -------------------------- | --------------------------------------------------------- |
| `POSTGRES_PASSWORD`    | Mot de passe de la base    | chaîne aléatoire 24 caractères                            |
| `JWT_SECRET`           | Secret JWT access tokens   | chaîne aléatoire 64+ caractères                           |
| `JWT_REFRESH_SECRET`   | Secret JWT refresh tokens  | chaîne aléatoire 64+ caractères distincte de `JWT_SECRET` |
| `GOOGLE_CLIENT_ID`     | Client ID OAuth Google     | obtenu sur Google Cloud Console                           |
| `GOOGLE_CLIENT_SECRET` | Client Secret OAuth Google | idem                                                      |

Génération d'un secret aléatoire :

```bash
openssl rand -hex 32
```

Le fichier `.env.example` à la racine du repo sert de modèle.

## Architecture des conteneurs

`docker compose up` démarre trois services en réseau interne :

| Service            | Image                | Port hôte  | Volume            |
| ------------------ | -------------------- | ---------- | ----------------- |
| `supfile-postgres` | postgres:16-alpine   | non exposé | `supfile_pg_data` |
| `supfile-api`      | image locale         | 3000       | `supfile_storage` |
| `supfile-web`      | image locale (nginx) | 80         | —                 |

Les volumes Docker `supfile_pg_data` et `supfile_storage` assurent la persistance entre redémarrages. `docker compose down` préserve les données ; `docker compose down -v` supprime les volumes et donc les données.

## Migrations base de données

L'API applique automatiquement les migrations Prisma au démarrage via le script de l'entrypoint. Aucune action manuelle n'est nécessaire.

## Healthchecks

- `GET http://localhost:3000/api/v1/health` retourne `{ status: 'ok', database: 'up' }` quand l'API est prête.
- Le service `postgres` du compose a un healthcheck `pg_isready` interne ; l'API attend que Postgres soit healthy avant de démarrer.

## Mise à jour

```bash
git pull
docker compose up -d --build
```

Les images sont rebuild avec layering Docker, donc seules les couches modifiées sont reconstruites.

## Logs et debug

```bash
docker compose logs -f api          # logs API en suivi
docker compose logs -f web          # logs nginx du web
docker compose logs -f postgres     # logs Postgres
docker compose ps                    # statut des containers
docker compose exec api sh           # shell dans le container API
docker compose exec postgres psql -U supfile  # psql dans Postgres
```

## Sauvegarde / restauration de la base

Sauvegarde :

```bash
docker compose exec postgres pg_dump -U supfile supfile > backup.sql
```

Restauration :

```bash
cat backup.sql | docker compose exec -T postgres psql -U supfile supfile
```

## Reset complet

```bash
docker compose down -v        # supprime les volumes (BDD + fichiers stockés)
docker compose up -d --build  # repart de zéro
```
