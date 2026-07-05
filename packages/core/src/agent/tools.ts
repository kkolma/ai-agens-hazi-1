// Az agent által hívható toolok Anthropic-definíciói és a dedikált toolok fix SQL-je.
//
// Kétféle tool:
//  - runSql: az LLM ír egy tetszőleges SELECT-et (guarddal ellenőrizve).
//  - dedikált toolok (listCategories, listOnSale, survivalChampion): FIX, kézzel kódolt
//    read-only lekérdezés, nincs LLM-generált SQL — egyszerűbb, biztonságosabb, gyorsabb.

import type Anthropic from '@anthropic-ai/sdk';

/** Paraméter nélküli tool-séma (a dedikált toolok nem várnak inputot). */
const NO_PARAMS: Anthropic.Tool['input_schema'] = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
};

// --- Fix SQL-ek a dedikált toolokhoz (exportálva, hogy tesztelhetők legyenek) ---

export const LIST_CATEGORIES_SQL = 'SELECT DISTINCT category FROM products ORDER BY category';

export const LIST_ON_SALE_SQL =
  'SELECT name, category, price, sale_price, (price - sale_price) AS saving, stock ' +
  'FROM products WHERE sale_price IS NOT NULL ORDER BY saving DESC';

export const SURVIVAL_CHAMPION_SQL =
  'SELECT name, latin_name, category, difficulty, watering, light, rating ' +
  "FROM products WHERE difficulty = 'kezdő' AND watering = 'ritka' " +
  'ORDER BY rating DESC, stock DESC LIMIT 3';

// --- Tool-definíciók (amit az LLM lát) ---

export const runSqlTool: Anthropic.Tool = {
  name: 'runSql',
  description:
    'Read-only SQL lekérdezés a products növény-katalóguson. CSAK egyetlen SELECT (vagy WITH ... SELECT). ' +
    'Az eredmény sorai JSON-ként térnek vissza. Használd minden olyan adat-kérdéshez, amire nincs dedikált tool.',
  input_schema: {
    type: 'object',
    properties: {
      sql: { type: 'string', description: 'Egyetlen SELECT lekérdezés a products táblán.' },
    },
    required: ['sql'],
    additionalProperties: false,
  },
};

export const listCategoriesTool: Anthropic.Tool = {
  name: 'listCategories',
  description:
    'Felsorolja az összes növény-kategóriát a katalógusban (SELECT DISTINCT category). ' +
    'Használd, ha a felhasználó a kategóriákra kíváncsi.',
  input_schema: NO_PARAMS,
};

export const listOnSaleTool: Anthropic.Tool = {
  name: 'listOnSale',
  description:
    'Kilistázza a jelenleg AKCIÓS növényeket (ahol van sale_price), a legnagyobb megtakarítással előre. ' +
    'Használd, ha a felhasználó az akciókra / leárazásokra kérdez.',
  input_schema: NO_PARAMS,
};

export const survivalChampionTool: Anthropic.Tool = {
  name: 'survivalChampion',
  description:
    'Megadja a legnehezebben elpusztítható növény(eke)t: kezdő nehézség + ritka öntözés, értékelés szerint. ' +
    'Használd a „melyik növényt szinte lehetetlen megölni / túléli az elhanyagolást" jellegű kérdésekhez.',
  input_schema: NO_PARAMS,
};
