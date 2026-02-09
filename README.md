## Démarrage de la base de données (dev)

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up -d
docker compose -f docker-compose.dev.yml ps
```

- **Postgres** : `localhost:5432` (user/pass selon `.env`)
- **Adminer** : `http://localhost:8080` (système : PostgreSQL, serveur : `postgres`)

Pour stopper :

```bash
docker compose -f docker-compose.dev.yml down
```

Pour réinitialiser totalement (efface les données) :

```bash
docker compose -f docker-compose.dev.yml down -v
```