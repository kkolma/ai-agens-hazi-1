import { describe, expect, it, vi } from 'vitest';

import { assertSelectOnly } from './run-sql';
import {
  LIST_CATEGORIES_SQL,
  LIST_ON_SALE_SQL,
  SURVIVAL_CHAMPION_SQL,
  listCategoriesTool,
  listOnSaleTool,
  runSqlTool,
  survivalChampionTool,
} from './tools';

const allTools = [runSqlTool, listCategoriesTool, listOnSaleTool, survivalChampionTool];

describe('tool definitions', () => {
  it.each(allTools)('are well-formed: $name', (tool) => {
    expect(tool.name).toBeTruthy();
    expect((tool.description ?? '').length).toBeGreaterThan(10);
    expect(tool.input_schema.type).toBe('object');
  });

  it('runSql requires an sql parameter; the fixed tools take none', () => {
    expect(runSqlTool.input_schema.required).toContain('sql');
    expect(listCategoriesTool.input_schema.required).toEqual([]);
    expect(listOnSaleTool.input_schema.required).toEqual([]);
    expect(survivalChampionTool.input_schema.required).toEqual([]);
  });
});

describe('fixed tool SQL', () => {
  it.each([LIST_CATEGORIES_SQL, LIST_ON_SALE_SQL, SURVIVAL_CHAMPION_SQL])(
    'passes the SELECT-only guard: %s',
    (sql) => {
      expect(() => assertSelectOnly(sql)).not.toThrow();
    },
  );

  it('listOnSale filters for discounted rows', () => {
    expect(LIST_ON_SALE_SQL).toMatch(/sale_price IS NOT NULL/i);
  });

  it('survivalChampion filters for the low-maintenance combo', () => {
    expect(SURVIVAL_CHAMPION_SQL).toMatch(/difficulty = 'kezdő'/);
    expect(SURVIVAL_CHAMPION_SQL).toMatch(/watering = 'ritka'/);
  });
});

// A dispatch a DB nélkül, mockolt read-only kapcsolattal.
vi.mock('../db/read-only', () => ({
  queryReadOnly: vi.fn().mockResolvedValue([{ category: 'pozsgás' }, { category: 'kaktusz' }]),
}));

describe('toolHandlers dispatch (mocked DB)', () => {
  it('runs the fixed query and returns rows + the executed sql', async () => {
    const { toolHandlers } = await import('./tool-registry');
    const result = await toolHandlers.listCategories!.run({});
    expect(result.sql).toBe(LIST_CATEGORIES_SQL);
    expect(result.rows).toEqual([{ category: 'pozsgás' }, { category: 'kaktusz' }]);
  });
});
