// Strukturált naplózás (FR4): minden interakció JSONL-be a logs/<timestamp>.jsonl fájlba.
// Nincs console.log a termékkódban — a naplózás ezen a loggeren keresztül megy.

import { appendFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

import type Anthropic from '@anthropic-ai/sdk';

export interface InteractionLog {
  model: string;
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  answer: string;
  usage: { inputTokens: number; outputTokens: number };
  /** B3-tól: a generált SQL és az eredmény is a naplóba kerül. */
  sql?: string;
  rows?: unknown;
}

const defaultLogDir = (): string => join(process.cwd(), 'logs');

/** Egy interakciót JSONL fájlba ír (soronként egy esemény). Windows-barát fájlnév. */
export const logInteraction = (entry: InteractionLog, logDir: string = defaultLogDir()): string => {
  const timestamp = new Date().toISOString();
  const safeName = timestamp.replace(/[:.]/g, '-'); // ':' nem lehet Windows fájlnévben
  mkdirSync(logDir, { recursive: true });
  const file = join(logDir, `${safeName}.jsonl`);

  const events: unknown[] = [
    { type: 'meta', timestamp, model: entry.model, usage: entry.usage },
    { type: 'system', content: entry.systemPrompt },
    ...entry.messages.map((m) => ({ type: 'message', role: m.role, content: m.content })),
  ];
  if (entry.sql !== undefined) events.push({ type: 'sql', content: entry.sql });
  if (entry.rows !== undefined) events.push({ type: 'rows', content: entry.rows });
  events.push({ type: 'answer', content: entry.answer });

  appendFileSync(file, events.map((e) => JSON.stringify(e)).join('\n') + '\n', 'utf8');
  return file;
};
