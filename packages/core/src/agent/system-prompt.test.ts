import { describe, expect, it } from 'vitest';

import { buildSystemPrompt } from './system-prompt';

describe('buildSystemPrompt', () => {
  it('includes the Plantbase role', () => {
    expect(buildSystemPrompt()).toContain('Plantbase asszisztens');
  });

  it('includes the products schema and SQL rules', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<schema>');
    expect(prompt).toContain('products(');
    expect(prompt).toContain('COALESCE(sale_price, price)');
  });

  it('routes to the dedicated tools (tool routing)', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<tools>');
    expect(prompt).toContain('listCategories');
    expect(prompt).toContain('listOnSale');
    expect(prompt).toContain('survivalChampion');
    expect(prompt).toContain('runSql');
  });

  it('provides few-shot NL->SQL examples', () => {
    expect(buildSystemPrompt()).toContain('<examples>');
  });

  it('uses XML-like structuring tags', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<role>');
    expect(prompt).toContain('<rules>');
  });
});
