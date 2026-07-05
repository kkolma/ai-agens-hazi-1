// Az askAgent: az Anthropic SDK-ra épülő, kézzel írt hívás (agent-framework nélkül).
// B2: tool NÉLKÜL — sima LLM-válasz, adatbázis-hozzáférés nélkül. A B3-ban bővül tool-loppá.

import Anthropic from '@anthropic-ai/sdk';

import { getAnthropicClient, MODEL } from '../anthropic/client';
import { logInteraction } from '../logging/logger';
import { buildSystemPrompt } from './system-prompt';

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

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    thinking: { type: 'disabled' }, // B2: sima válasz, gondolkodás nélkül
    system: systemPrompt,
    messages,
  });

  const answer = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('\n')
    .trim();

  const usage = {
    inputTokens: response.usage.input_tokens,
    outputTokens: response.usage.output_tokens,
  };

  logInteraction({ model: MODEL, systemPrompt, messages, answer, usage }, options.logDir);

  return { answer, systemPrompt, messages, usage };
};
