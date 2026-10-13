import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { PrismaClient } from '@prisma/client';

const baselineMigration = '20261009000000_legacy_baseline';
const prisma = new PrismaClient();
let applicationTables = [];
let successfulMigrations = [];

try {
  const tables = await prisma.$queryRaw`SELECT TABLE_NAME AS tableName FROM information_schema.tables WHERE table_schema = DATABASE()`;
  const tableNames = new Set(tables.map(({ tableName }) => tableName));
  applicationTables = [...tableNames].filter((name) => !name.startsWith('_'));

  if (tableNames.has('_prisma_migrations')) {
    successfulMigrations = await prisma.$queryRaw`SELECT migration_name AS migrationName FROM _prisma_migrations WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`;
  }
} finally {
  await prisma.$disconnect();
}

if (applicationTables.length > 0 && successfulMigrations.length === 0) {
  const prismaCli = path.join(process.cwd(), 'node_modules', 'prisma', 'build', 'index.js');
  const result = spawnSync(process.execPath, [prismaCli, 'migrate', 'resolve', '--applied', baselineMigration], { stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
  console.log('Prisma legacy schema baseline registered; existing data was preserved.');
}
