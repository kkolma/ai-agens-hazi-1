// Plantbase CLI — belépési pont (commander).
// B2: az `ask` és az interaktív `chat` egy LLM-agentbe van kötve (DB MÉG nincs).
// A gyökér .env-et dotennel töltjük be (ANTHROPIC_API_KEY). A logika a @plantbase/core-ban él.

import 'dotenv/config';

import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

import { Command } from 'commander';

import { askAgent, type AgentResult } from '@plantbase/core';

const toMessage = (err: unknown): string => (err instanceof Error ? err.message : 'ismeretlen hiba');

const printPrompt = (result: AgentResult): void => {
  stdout.write('\n--- prompt ---\n');
  stdout.write(`system:\n${result.systemPrompt}\n\n`);
  stdout.write(`messages:\n${JSON.stringify(result.messages, null, 2)}\n`);
  stdout.write('--------------\n');
};

const respond = async (question: string, showPrompt: boolean): Promise<void> => {
  const result = await askAgent(question);
  if (showPrompt) printPrompt(result);
  stdout.write(`${result.answer}\n`);
};

const program = new Command();

program
  .name('plantbase')
  .description('Plantbase — növény-katalógus AI agent (CLI).')
  .version('0.0.0')
  .option('--show-prompt', 'a teljes prompt (system + üzenetek) kiírása');

program
  .command('ask')
  .description('Egyszeri kérdés az agenthez (B2: LLM, DB nélkül).')
  .argument('<kerdes>', 'a természetes nyelvű kérdés')
  .action(async (kerdes: string) => {
    try {
      await respond(kerdes, Boolean(program.opts().showPrompt));
    } catch (err) {
      stdout.write(`(hiba) ${toMessage(err)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command('chat', { isDefault: true })
  .description('Interaktív mód (B2: LLM, DB nélkül). Kilépés: exit')
  .action(() => {
    runInteractive(Boolean(program.opts().showPrompt));
  });

function runInteractive(showPrompt: boolean): void {
  const rl = createInterface({ input: stdin, output: stdout, prompt: '> ' });
  stdout.write('Plantbase agent (B2 — LLM, adatbázis nélkül). Kilépés: exit\n');
  rl.prompt();

  rl.on('line', async (line) => {
    const trimmed = line.trim();
    if (trimmed === 'exit') {
      rl.close();
      return;
    }
    if (trimmed.length === 0) {
      rl.prompt();
      return;
    }
    try {
      await respond(trimmed, showPrompt);
    } catch (err) {
      stdout.write(`(hiba) ${toMessage(err)}\n`);
    }
    rl.prompt();
  }).on('close', () => {
    stdout.write('Viszlát!\n');
  });
}

program.parseAsync();
