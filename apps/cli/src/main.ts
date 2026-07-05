// Plantbase CLI — belépési pont (commander).
// A4: futtatható váz. Az `ask` és az interaktív mód VALÓDI viselkedése a B fázisokban jön:
//   B1 = visszhang, B2 = LLM (DB nélkül), B3 = runSql tool.

import { Command } from 'commander';

const program = new Command();

program
  .name('plantbase')
  .description('Plantbase — növény-katalógus AI agent (CLI).')
  .version('0.0.0');

program
  .command('ask')
  .description('Egyszeri kérdés a katalógusról (valódi válasz a B2 fázistól).')
  .argument('<kerdes>', 'a természetes nyelvű kérdés')
  .action((kerdes: string) => {
    process.stdout.write(
      `plantbase ask (A4 váz): a kérdésed „${kerdes}”. Az agent a B2 fázistól válaszol.\n`,
    );
  });

program
  .command('chat', { isDefault: true })
  .description('Interaktív mód (valódi visszhang a B1 fázistól).')
  .action(() => {
    process.stdout.write('plantbase interaktív mód (A4 váz). A B1 fázistól él.\n');
  });

program.parseAsync();
