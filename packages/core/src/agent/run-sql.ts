// A runSql tool logikája. Védelmi rétegek (dev-workflow.md):
//  1) elsődleges: a read-only DB-szerep (nem itt, hanem a kapcsolatban);
//  2) itt: SELECT-only guard (Zod + ellenőrzések), egyetlen utasítás, tiltott kulcsszavak;
//  3) automatikus LIMIT, ha hiányzik.

import { z } from 'zod';

import { queryReadOnly } from '../db/read-only';

const SqlInput = z.object({ sql: z.string().trim().min(1, 'Üres SQL.') });

// Írási / DDL kulcsszavak — ezek egyike sem lehet a lekérdezésben.
const FORBIDDEN =
  /\b(insert|update|delete|drop|alter|create|truncate|grant|revoke|copy|merge|call|vacuum|analyze|reindex|into)\b/i;

const DEFAULT_LIMIT = 100;

export interface RunSqlResult {
  sql: string;
  rows: unknown[];
}

/** Ellenőrzi, hogy a lekérdezés egyetlen, olvasó SELECT-e; szükség esetén LIMIT-et tesz rá. */
export const assertSelectOnly = (raw: string): string => {
  const { sql } = SqlInput.parse({ sql: raw });
  let statement = sql.replace(/;+\s*$/, '').trim(); // záró pontosvessző(k) le

  if (statement.includes(';')) {
    throw new Error('Csak egyetlen utasítás futtatható (nem lehet több, ";"-vel elválasztva).');
  }
  if (!/^(select|with)\b/i.test(statement)) {
    throw new Error('Csak SELECT (vagy WITH ... SELECT) lekérdezés engedélyezett.');
  }
  if (FORBIDDEN.test(statement)) {
    throw new Error('Csak olvasó lekérdezés engedélyezett; írási vagy DDL kulcsszó nem szerepelhet.');
  }
  if (!/\blimit\b/i.test(statement)) {
    statement = `${statement} LIMIT ${DEFAULT_LIMIT}`;
  }
  return statement;
};

/** Validálja és lefuttatja a lekérdezést a read-only kapcsolaton. */
export const runSql = async (raw: string): Promise<RunSqlResult> => {
  const sql = assertSelectOnly(raw);
  const rows = await queryReadOnly(sql);
  return { sql, rows };
};
