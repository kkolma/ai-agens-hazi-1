import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { logInteraction } from './logger';

describe('logInteraction', () => {
  it('writes a JSONL file with meta, system, message and answer events', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plantbase-log-'));
    const file = logInteraction(
      {
        model: 'claude-sonnet-5',
        systemPrompt: '<role>teszt</role>',
        messages: [{ role: 'user', content: 'szia' }],
        answer: 'helló',
        usage: { inputTokens: 10, outputTokens: 5 },
      },
      dir,
    );

    const lines = readFileSync(file, 'utf8').trim().split('\n').map((l) => JSON.parse(l));
    const types = lines.map((l) => l.type);
    expect(types).toEqual(['meta', 'system', 'message', 'answer']);
    expect(lines[0].usage).toEqual({ inputTokens: 10, outputTokens: 5 });
    expect(lines[3].content).toBe('helló');
  });

  it('creates a Windows-safe filename (no colons)', () => {
    const dir = mkdtempSync(join(tmpdir(), 'plantbase-log-'));
    const file = logInteraction(
      {
        model: 'm',
        systemPrompt: 's',
        messages: [],
        answer: 'a',
        usage: { inputTokens: 0, outputTokens: 0 },
      },
      dir,
    );
    expect(basename(file)).not.toContain(':');
    expect(file.endsWith('.jsonl')).toBe(true);
  });
});
