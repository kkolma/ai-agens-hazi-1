import { describe, expect, it } from 'vitest';

import { buildSystemPrompt } from './system-prompt';

describe('buildSystemPrompt', () => {
  it('includes the Plantbase role', () => {
    expect(buildSystemPrompt()).toContain('Plantbase asszisztens');
  });

  it('includes the products schema and SQL rules (B3)', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<schema>');
    expect(prompt).toContain('products(');
    expect(prompt).toContain('runSql');
    expect(prompt).toContain('COALESCE(sale_price, price)');
  });

  it('uses XML-like structuring tags', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<role>');
    expect(prompt).toContain('<rules>');
  });
});
