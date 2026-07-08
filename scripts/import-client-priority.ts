/**
 * One-time seed: load the client-priority snapshot into the DB so it becomes
 * an owned, admin-editable record instead of a static file.
 *
 * Usage: bun run scripts/import-client-priority.ts
 *
 * Never overwrites a row already edited by an admin (updated_by !== seed actor).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { prisma } from '../src/lib/prisma';

const SEED_ACTOR = 'snapshot-import';

async function seedFork(slug: string, file: string) {
  const raw = JSON.parse(readFileSync(join(process.cwd(), 'src/data', file), 'utf8')) as {
    fork?: string;
    lastUpdated?: string;
    eips?: unknown[];
  };

  const existing = await prisma.upgrade_client_priority.findUnique({
    where: { fork_slug: slug },
    select: { updated_by: true },
  });
  if (existing && existing.updated_by !== SEED_ACTOR) {
    console.log(`Skipping ${slug} — already edited by ${existing.updated_by}.`);
    return;
  }

  await prisma.upgrade_client_priority.upsert({
    where: { fork_slug: slug },
    create: {
      fork_slug: slug,
      last_updated: raw.lastUpdated ?? null,
      eips: (raw.eips ?? []) as object,
      updated_by: SEED_ACTOR,
    },
    update: {
      last_updated: raw.lastUpdated ?? null,
      eips: (raw.eips ?? []) as object,
      updated_by: SEED_ACTOR,
    },
  });
  console.log(`Seeded ${slug}: ${(raw.eips ?? []).length} EIPs.`);
}

async function main() {
  await seedFork('glamsterdam', 'prioritization-glamsterdam.json');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
