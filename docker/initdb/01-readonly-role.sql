-- Read-only szerep az agent runSql-jehez (NFR1: csak SELECT, read-only kapcsolat).
-- Ez a script CSAK az elso, ures volume-os inditaskor fut le (docker-entrypoint-initdb.d).
-- A 'plantbase' owner szereppel fut (POSTGRES_USER), a 'plantbase' DB-ben.

CREATE ROLE plantbase_ro WITH LOGIN PASSWORD 'plantbase_ro';

GRANT CONNECT ON DATABASE plantbase TO plantbase_ro;
GRANT USAGE ON SCHEMA public TO plantbase_ro;

-- A mar letezo tablakra SELECT (most meg nincs egy sem, de idempotens).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO plantbase_ro;

-- A jovoben (a Prisma migracio altal, 'plantbase' owner-kent) letrehozott tablakra is SELECT.
ALTER DEFAULT PRIVILEGES FOR ROLE plantbase IN SCHEMA public
  GRANT SELECT ON TABLES TO plantbase_ro;

-- Ovintezkedes: a szerep minden tranzakcioja alapertelmezetten read-only.
ALTER ROLE plantbase_ro SET default_transaction_read_only = on;
