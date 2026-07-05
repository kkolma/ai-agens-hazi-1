// Tool-registry: név → { definíció, futtató }. Az askAgent ezen keresztül szólítja meg
// a toolokat, így a loop nem egyetlen tool nevére van drótozva.

import type Anthropic from '@anthropic-ai/sdk';

import { queryReadOnly } from '../db/read-only';
import { runSql } from './run-sql';
import {
  LIST_CATEGORIES_SQL,
  LIST_ON_SALE_SQL,
  SURVIVAL_CHAMPION_SQL,
  listCategoriesTool,
  listOnSaleTool,
  runSqlTool,
  survivalChampionTool,
} from './tools';

export interface ToolRun {
  rows: unknown;
  /** A ténylegesen lefuttatott SQL (naplózáshoz, FR4). */
  sql: string;
}

export interface ToolHandler {
  definition: Anthropic.Tool;
  run: (input: unknown) => Promise<ToolRun>;
}

/** Egy dedikált, fix-lekérdezéses tool handlere. */
const fixedQueryTool = (definition: Anthropic.Tool, sql: string): ToolHandler => ({
  definition,
  run: async () => ({ rows: await queryReadOnly(sql), sql }),
});

export const toolHandlers: Record<string, ToolHandler> = {
  runSql: {
    definition: runSqlTool,
    run: async (input) => {
      const sql = String((input as { sql?: unknown }).sql ?? '');
      const result = await runSql(sql);
      return { rows: result.rows, sql: result.sql };
    },
  },
  listCategories: fixedQueryTool(listCategoriesTool, LIST_CATEGORIES_SQL),
  listOnSale: fixedQueryTool(listOnSaleTool, LIST_ON_SALE_SQL),
  survivalChampion: fixedQueryTool(survivalChampionTool, SURVIVAL_CHAMPION_SQL),
};

/** A toolok definíciói, ahogy az Anthropic API várja őket. */
export const toolDefinitions: Anthropic.Tool[] = Object.values(toolHandlers).map((h) => h.definition);
