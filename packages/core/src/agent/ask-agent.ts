// Az askAgent: az Anthropic SDK-ra épülő, kézzel írt tool-use loop (agent-framework nélkül).
// B3: az agent a kérdésből SELECT-et ír, a runSql toollal read-only lefuttatja, és a
// visszakapott sorokból természetes nyelvű választ ad. Multistep a végleges válaszig.

import Anthropic from '@anthropic-ai/sdk';

import { getAnthropicClient, MODEL } from '../anthropic/client';
import { logInteraction } from '../logging/logger';
import { runSql } from './run-sql';
import { buildSystemPrompt } from './system-prompt';
import { runSqlTool } from './tools';

const MAX_STEPS = 6; // biztonsági felső korlát a tool-loopra

export interface AskAgentOptions {
  /** Injektálható kliens (teszthez). Alapból a getAnthropicClient() készíti. */
  client?: Anthropic;
  /** Alternatív napló-könyvtár (teszthez). */
  logDir?: string;
}

export interface AgentResult {
  answer: string;
  systemPrompt: string;
  messages: Anthropic.MessageParam[];
  usage: { inputTokens: number; outputTokens: number };
  /** A legutóbb futtatott SQL (ha volt tool-hívás). */
  sql?: string;
}

export const askAgent = async (
  question: string,
  options: AskAgentOptions = {},
): Promise<AgentResult> => {
  const client = options.client ?? getAnthropicClient();
  const systemPrompt = buildSystemPrompt();
  const messages: Anthropic.MessageParam[] = [
    { role: 'user', content: `<question>${question}</question>` },
  ];

  let answer = '';
  let lastSql: string | undefined;
  let lastRows: unknown;
  let inputTokens = 0;
  let outputTokens = 0;

  for (let step = 0; step < MAX_STEPS; step += 1) {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: 'disabled' },
      system: systemPrompt,
      messages,
      tools: [runSqlTool],
    });
    inputTokens += response.usage.input_tokens;
    outputTokens += response.usage.output_tokens;

    if (response.stop_reason === 'tool_use') {
      messages.push({ role: 'assistant', content: response.content });
      const toolResults: Anthropic.ToolResultBlockParam[] = [];

      for (const block of response.content) {
        if (block.type === 'tool_use' && block.name === 'runSql') {
          const input = block.input as { sql?: unknown };
          try {
            const result = await runSql(String(input.sql ?? ''));
            lastSql = result.sql;
            lastRows = result.rows;
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: JSON.stringify(result.rows),
            });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'ismeretlen hiba';
            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: `Hiba a lekérdezésben: ${message}`,
              is_error: true,
            });
          }
        }
      }

      messages.push({ role: 'user', content: toolResults });
      continue;
    }

    // Végleges válasz (end_turn): a szöveges blokkok összefűzve.
    answer = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('\n')
      .trim();
    break;
  }

  const usage = { inputTokens, outputTokens };
  logInteraction(
    { model: MODEL, systemPrompt, messages, answer, usage, sql: lastSql, rows: lastRows },
    options.logDir,
  );

  return { answer, systemPrompt, messages, usage, sql: lastSql };
};
