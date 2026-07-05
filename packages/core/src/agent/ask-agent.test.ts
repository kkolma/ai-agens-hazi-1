import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import type Anthropic from '@anthropic-ai/sdk';
import { describe, expect, it, vi } from 'vitest';

import { askAgent } from './ask-agent';

// Minimál mock: csak a messages.create-t adjuk meg, a canned válasszal.
const makeMockClient = (text: string): Anthropic => {
  const create = vi.fn().mockResolvedValue({
    content: [{ type: 'text', text }],
    usage: { input_tokens: 12, output_tokens: 7 },
  });
  return { messages: { create } } as unknown as Anthropic;
};

describe('askAgent', () => {
  it('returns the text answer from the model and records usage', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'plantbase-agent-'));
    const client = makeMockClient('Nem férek hozzá az adatbázishoz.');

    const result = await askAgent('hány pozsgás van raktáron?', { client, logDir: dir });

    expect(result.answer).toBe('Nem férek hozzá az adatbázishoz.');
    expect(result.usage).toEqual({ inputTokens: 12, outputTokens: 7 });
    expect(result.messages[0]?.content).toContain('<question>');
  });

  it('writes an interaction log file', async () => {
    const dir = mkdtempSync(join(tmpdir(), 'plantbase-agent-'));
    const client = makeMockClient('teszt');

    await askAgent('kérdés', { client, logDir: dir });

    const files = readdirSync(dir).filter((f) => f.endsWith('.jsonl'));
    expect(files.length).toBe(1);
  });
});
