// @plantbase/db — Prisma kliens (read-write) a migracio/seed szamara.
// FONTOS: az agent runSql-je NEM ezt hasznalja, hanem egy nyers, read-only
// kapcsolatot a DATABASE_URL_READONLY-n (architektura.md 2. pont).

import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export { PrismaClient };
export type { Product } from '@prisma/client';
