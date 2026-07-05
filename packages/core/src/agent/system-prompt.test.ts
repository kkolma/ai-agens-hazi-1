import { describe, expect, it } from 'vitest';

import { buildSystemPrompt } from './system-prompt';

describe('buildSystemPrompt', () => {
  it('includes the Plantbase role', () => {
    expect(buildSystemPrompt()).toContain('Plantbase asszisztens');
  });

  it('states honestly that there is no database access (B2)', () => {
    const prompt = buildSystemPrompt().toLowerCase();
    expect(prompt).toContain('nincs adatbázis-hozzáférésed');
  });

  it('uses XML-like structuring tags', () => {
    const prompt = buildSystemPrompt();
    expect(prompt).toContain('<role>');
    expect(prompt).toContain('<rules>');
  });
});
