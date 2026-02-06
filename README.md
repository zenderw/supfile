Contexte
On a un monorepo vide (PR-01) mais pas encore d'infrastructure pour faire tourner quoi que ce soit. Cette PR pose le docker-compose.yml de développement : un service PostgreSQL pour les métadonnées de SUPFile, et Adminer (interface web légère) pour visualiser la base pendant le dev.

C'est intentionnellement séparé du docker-compose.yml final (qui viendra en PR-62 avec api + web + db dans un seul fichier comme l'exige le sujet). Pourquoi deux composes ? En dev, on veut lancer Postgres en conteneur mais garder l'API et le web en local (avec hot-reload, debugger attaché, logs directement dans le terminal). Le compose final servira à la démo et à la correction.

Adminer remplace pgAdmin volontairement : 12 Mo au lieu de 600 Mo, démarre en 2s, suffisant pour inspecter une BDD pendant le dev. Pas accessible en prod, c'est un outil de poste de travail.

Fichiers modifiés
docker-compose.dev.yml (créé) — stack de dev (Postgres + Adminer)
.env.example (créé) — gabarit des variables d'environnement attendues
README.md (modifié) — ajout d'une section "Démarrage" avec les commandes Docker
Code
docker-compose.dev.yml
services:
  postgres:
    image: postgres:16-alpine
    container_name: supfile-postgres-dev
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-supfile}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-supfile}
      POSTGRES_DB: ${POSTGRES_DB:-supfile}
    ports:
      - "5432:5432"
    volumes:
      - supfile_pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-supfile}"]
      interval: 5s
      timeout: 5s
      retries: 5

  adminer:
    image: adminer:4-standalone
    container_name: supfile-adminer-dev
    restart: unless-stopped
    ports:
      - "8080:8080"
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  supfile_pg_data:
    name: supfile_pg_data
.env.example
# === PostgreSQL ===
# Reprise par docker-compose.dev.yml et par l'API en PR-06
POSTGRES_USER=supfile
POSTGRES_PASSWORD=changeme
POSTGRES_DB=supfile
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Connexion complete (utilisee par Prisma plus tard)
DATABASE_URL=postgresql://supfile:changeme@localhost:5432/supfile?schema=public
README.md — section ajoutée à la fin
## Démarrage de la base de données (dev)

```bash
# Copier le gabarit d'env (à faire une seule fois)
cp .env.example .env

# Lancer Postgres + Adminer
docker compose -f docker-compose.dev.yml up -d

# Vérifier que tout est sain
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