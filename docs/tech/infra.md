# Infrastruktúra — Postgres, .env, a két DB-kapcsolat

> Lokális fejlesztői környezet. Nincs felhő-DB: helyben, Dockerben dolgozunk (a docs OrbStack-et említ; Windowson Docker Desktop ugyanaz a szerep).

## Postgres (docker-compose)

A `docker-compose.yml` egyetlen szolgáltatást hoz: `postgres:16`.

- **Konténer:** `plantbase-db`
- **Hoszt-port:** **5433** → konténer 5432. (Az 5432 gyakran foglalt egy helyi Postgrestől; ezért 5433. Ha nálad is foglalt, írd át a compose-ban és a `.env`-ben.)
- **Owner szerep / DB:** `POSTGRES_USER=plantbase`, `POSTGRES_PASSWORD=plantbase`, `POSTGRES_DB=plantbase`
- **Perzisztencia:** `pgdata` névvel ellátott volume.
- **Healthcheck:** `pg_isready -U plantbase -d plantbase`.

Indítás / leállítás:

```bash
docker compose up -d     # indít + healthy-ig vár a healthcheck
docker compose down      # leállít (a volume megmarad)
docker compose down -v   # leállít + törli az adatot (tiszta lap)
```

## Két DB-kapcsolat, két jog

A biztonság alapja **nem** az LLM jóindulata, hanem a Postgres jogosultsági rendszere.

| Kapcsolat | Szerep | Jog | Ki használja |
|-----------|--------|-----|--------------|
| `DATABASE_URL` | `plantbase` (owner) | read-write | **Prisma**: séma, migráció, seed |
| `DATABASE_URL_READONLY` | `plantbase_ro` | csak **SELECT** | **az agent `runSql`-je** |

A read-only szerep az első, üres volume-os induláskor jön létre a `docker/initdb/01-readonly-role.sql`-ből (a `docker-entrypoint-initdb.d` mechanizmussal):

```sql
CREATE ROLE plantbase_ro WITH LOGIN PASSWORD 'plantbase_ro';
GRANT CONNECT ON DATABASE plantbase TO plantbase_ro;
GRANT USAGE ON SCHEMA public TO plantbase_ro;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO plantbase_ro;
-- a Prisma (owner) által később létrehozott tablakra is SELECT:
ALTER DEFAULT PRIVILEGES FOR ROLE plantbase IN SCHEMA public GRANT SELECT ON TABLES TO plantbase_ro;
-- ovintezkedes: a szerep minden tranzakcioja read-only:
ALTER ROLE plantbase_ro SET default_transaction_read_only = on;
```

> ⚠️ Az init-script **csak üres volume-nál** fut. Ha már volt DB és utólag módosítod, `docker compose down -v` kell az újrainicializáláshoz.

Bizonyíték, hogy a read-only szerep tényleg csak olvas:

```bash
docker exec -e PGPASSWORD=plantbase_ro plantbase-db \
  psql -U plantbase_ro -d plantbase -c "INSERT INTO products(name) VALUES ('x');"
# ERROR: cannot execute INSERT in a read-only transaction
```

## Környezeti változók (`.env`)

A `.env` **nem** kerül gitbe (lásd `.gitignore`); sablon: `.env.example`.

| Kulcs | Mire kell |
|-------|-----------|
| `DATABASE_URL` | Prisma (rw) — `postgresql://plantbase:plantbase@localhost:5433/plantbase?schema=public` |
| `DATABASE_URL_READONLY` | agent runSql (read-only) — `plantbase_ro` szereppel, ugyanaz a host/port |
| `ANTHROPIC_API_KEY` | az LLM-hívás (B2/B3). A B1 echo nem igényli. |
| `GITHUB_PAT`, `CONTEXT7_API_KEY` | fejlesztői MCP-szerverek (nem a termék futásidejéhez) |

A CLI a gyökér `.env`-et `dotenv`-vel tölti be; a Prisma-parancsok `dotenv-cli`-vel kapják meg (`packages/db/package.json` scriptek).
