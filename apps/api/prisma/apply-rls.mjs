// Applies prisma/rls.sql after migrations. Run via: pnpm db:migrate:deploy
// Splits on statement boundaries that respect $$-quoted bodies.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const __dirname = dirname(fileURLToPath(import.meta.url));
const sql = readFileSync(join(__dirname, 'rls.sql'), 'utf8');

/** Naive but $$-aware statement splitter. */
function splitStatements(input) {
  const statements = [];
  let current = '';
  let inDollar = false;
  for (let i = 0; i < input.length; i++) {
    const two = input.slice(i, i + 2);
    if (two === '$$') {
      inDollar = !inDollar;
      current += two;
      i++;
      continue;
    }
    const ch = input[i];
    current += ch;
    if (ch === ';' && !inDollar) {
      statements.push(current.trim());
      current = '';
    }
  }
  if (current.trim()) statements.push(current.trim());
  return statements.filter((s) => s && !s.startsWith('--'));
}

const prisma = new PrismaClient();

try {
  const statements = splitStatements(sql);
  for (const stmt of statements) {
    await prisma.$executeRawUnsafe(stmt);
  }
  console.log(`✓ Applied ${statements.length} RLS statement(s).`);
} catch (err) {
  console.error('✗ Failed to apply RLS:', err);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
