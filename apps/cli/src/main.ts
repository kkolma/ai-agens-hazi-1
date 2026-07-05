// Plantbase CLI — belépési pont (commander).
// B1: visszhang (echo) — LLM és adatbázis MÉG nincs. Az `ask` egyszeri echo,
// a `chat` interaktív readline mód `exit`-ig. A logika a @plantbase/core-ban él.

import { createInterface } from 'node:readline';
import { stdin, stdout } from 'node:process';

import { Command } from 'commander';

import { echo } from '@plantbase/core';

const toMessage = (err: unknown): string => (err instanceof Error ? err.message : 'ismeretlen hiba');

const program = new Command();

program
  .name('plantbase')
  .description('Plantbase — növény-katalógus AI agent (CLI).')
  .version('0.0.0');

program
  .command('ask')
  .description('Egyszeri kérdés/visszhang (B1: echo).')
  .argument('<kerdes>', 'a természetes nyelvű szöveg')
  .action((kerdes: string) => {
    try {
      stdout.write(`${echo(kerdes)}\n`);
    } catch (err) {
      stdout.write(`(hiba) ${toMessage(err)}\n`);
      process.exitCode = 1;
    }
  });

program
  .command('chat', { isDefault: true })
  .description('Interaktív visszhang mód. Kilépés: exit')
  .action(() => {
    runInteractive();
  });

function runInteractive(): void {
  const rl = createInterface({ input: stdin, output: stdout, prompt: '> ' });
  stdout.write('Plantbase interaktív visszhang (B1). Kilépés: exit\n');
  rl.prompt();

  rl.on('line', (line) => {
    const trimmed = line.trim();
    if (trimmed === 'exit') {
      rl.close();
      return;
    }
    try {
      stdout.write(`${echo(trimmed)}\n`);
    } catch (err) {
      stdout.write(`(hiba) ${toMessage(err)}\n`);
    }
    rl.prompt();
  }).on('close', () => {
    stdout.write('Viszlát!\n');
  });
}

program.parseAsync();
