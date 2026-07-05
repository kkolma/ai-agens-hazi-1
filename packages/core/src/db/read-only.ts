// Nyers, READ-ONLY Postgres-kapcsolat az agent runSql-jéhez (architektura.md 2. pont:
// az agent NEM Prismán kérdez). A DATABASE_URL_READONLY a plantbase_ro szerepre mutat,
// amely csak SELECT-et enged (default_transaction_read_only = on) — ez az elsődleges védelem.
// Kapcsolatonként egy Client (connect/end), hogy a CLI tisztán kilépjen.

import { Client } from 'pg';

export const queryReadOnly = async (sql: string): Promise<unknown[]> => {
  if (!process.env.DATABASE_URL_READONLY) {
    throw new Error(
      'Hiányzik a DATABASE_URL_READONLY. Ellenőrizd a .env-et és hogy fut-e a Postgres (docker compose up -d).',
    );
  }
  const client = new Client({ connectionString: process.env.DATABASE_URL_READONLY });
  await client.connect();
  try {
    const result = await client.query(sql);
    return result.rows;
  } finally {
    await client.end();
  }
};
