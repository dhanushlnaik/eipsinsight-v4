import { optionalAuthProcedure, type Ctx, ORPCError } from './types'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'
import { buildClientTeamExclusionKeys } from '@/data/client-team-exclusions'
import { rawData, pairedUpgradeNames } from '@/data/network-upgrades'

const CLIENT_TEAM_AUTHOR_EXCLUSIONS = buildClientTeamExclusionKeys();
const CLIENT_TEAM_AUTHOR_EXCLUSION_SET = new Set(CLIENT_TEAM_AUTHOR_EXCLUSIONS);

function normalizeAuthorKeys(author: string): string[] {
  return author
    .toLowerCase()
    // Split parenthetical aliases like "sam wilson (@samwilsn)" into separate tokens
    .replace(/\(([^)]+)\)/g, ', $1')
    .replace(/\s+and\s+/g, ',')
    .replace(/\s*&\s*/g, ',')
    .replace(/;/g, ',')
    .replace(/\//g, ',')
    .split(',')
    .map((part) =>
      part
        .trim()
        .replace(/^@+/, '')
        .replace(/\s+/g, ' ')
    )
    .filter((part) => part.length > 0 && !part.includes('bot') && !CLIENT_TEAM_AUTHOR_EXCLUSION_SET.has(part));
}

function getCanonicalUpgradeName(upgrade: string, date: string): string {
  const mergeTimestamp = new Date('2022-09-15').getTime();
  const upgradeTimestamp = new Date(date).getTime();
  if (upgradeTimestamp > mergeTimestamp && pairedUpgradeNames[date]) {
    return pairedUpgradeNames[date];
  }
  return upgrade;
}

async function computeIndependentIncludedAuthorRows() {
  const eipToUpgrades = new Map<number, Set<string>>();

  rawData.forEach((item) => {
    item.eips.forEach((value) => {
      if (!value.startsWith('EIP-')) return;
      const normalizedNumber = value.replace('EIP-', '').replace('-removed', '');
      const eipNumber = Number(normalizedNumber);
      if (!Number.isFinite(eipNumber)) return;

      const upgradeName = getCanonicalUpgradeName(item.upgrade, item.date);
      if (!eipToUpgrades.has(eipNumber)) {
        eipToUpgrades.set(eipNumber, new Set<string>());
      }
      eipToUpgrades.get(eipNumber)?.add(upgradeName);
    });
  });

  const eipNumbers = Array.from(eipToUpgrades.keys());
  if (eipNumbers.length === 0) return [];

  const eips = await prisma.eips.findMany({
    where: { eip_number: { in: eipNumbers } },
    select: {
      eip_number: true,
      title: true,
      author: true,
    },
  });

  const authorMap = new Map<string, {
    eipNumbers: Set<number>;
    upgrades: Set<string>;
  }>();
  const eipTitleMap = new Map<number, string>();

  eips.forEach((eip) => {
    if (!eip.author) return;
    const authorKeys = normalizeAuthorKeys(eip.author);
    if (authorKeys.length === 0) return;

    const upgrades = eipToUpgrades.get(eip.eip_number) ?? new Set<string>();
    eipTitleMap.set(eip.eip_number, eip.title ?? '');

    authorKeys.forEach((authorKey) => {
      if (!authorMap.has(authorKey)) {
        authorMap.set(authorKey, { eipNumbers: new Set<number>(), upgrades: new Set<string>() });
      }
      const record = authorMap.get(authorKey);
      if (!record) return;

      record.eipNumbers.add(eip.eip_number);
      upgrades.forEach((upgrade) => record.upgrades.add(upgrade));
    });
  });

  return Array.from(authorMap.entries())
    .map(([authorKey, value]) => {
      const sortedEips = Array.from(value.eipNumbers).sort((a, b) => a - b);
      const sampleEip = sortedEips[0] ?? null;

      return {
        authorKey,
        totalEips: sortedEips.length,
        eipNumbers: sortedEips,
        sampleEip,
        sampleTitle: sampleEip ? (eipTitleMap.get(sampleEip) ?? '') : '',
        upgrades: Array.from(value.upgrades).sort((a, b) => a.localeCompare(b)),
      };
    })
    .sort((a, b) => (b.totalEips - a.totalEips) || a.authorKey.localeCompare(b.authorKey));
}

export const upgradesProcedures = {
  // List all upgrades with statistics
  listUpgrades: optionalAuthProcedure
    .input(z.object({}))
    .handler(async ({ context }) => {

      const upgrades = await prisma.upgrades.findMany({
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          slug: true,
          name: true,
          meta_eip: true,
          created_at: true,
        },
      });

      if (upgrades.length === 0) return [];

      const upgradeIds = upgrades.map(u => u.id);

      // Batch: total EIPs per upgrade + core EIPs per upgrade in 2 queries (not N)
      const [totalCounts, coreCounts] = await Promise.all([
        prisma.$queryRaw<Array<{ upgrade_id: number; count: bigint }>>`
          SELECT upgrade_id, COUNT(*)::bigint AS count
          FROM upgrade_composition_current
          WHERE upgrade_id = ANY(${upgradeIds})
          GROUP BY upgrade_id
        `,
        prisma.$queryRaw<Array<{ upgrade_id: number; count: bigint }>>`
          SELECT ucc.upgrade_id, COUNT(DISTINCT ucc.eip_number)::bigint AS count
          FROM upgrade_composition_current ucc
          JOIN eips e ON e.eip_number = ucc.eip_number
          JOIN eip_snapshots s ON s.eip_id = e.id
          WHERE ucc.upgrade_id = ANY(${upgradeIds}) AND s.category = 'Core'
          GROUP BY ucc.upgrade_id
        `,
      ]);

      const totalMap = new Map(totalCounts.map(r => [r.upgrade_id, Number(r.count)]));
      const coreMap = new Map(coreCounts.map(r => [r.upgrade_id, Number(r.count)]));

      return upgrades.map(u => ({
        id: u.id,
        slug: u.slug,
        name: u.name || '',
        meta_eip: u.meta_eip,
        created_at: u.created_at?.toISOString() || null,
        stats: {
          totalEIPs: totalMap.get(u.id) || 0,
          executionLayer: u.meta_eip ? 1 : 0,
          consensusLayer: u.meta_eip ? 0 : 1,
          coreEIPs: coreMap.get(u.id) || 0,
        },
      }));
    }),

  // Get aggregate statistics across all upgrades
  getUpgradeStats: optionalAuthProcedure
    .input(z.object({}))
    .handler(async ({ context }) => {
      const [totalUpgrades, totalEIPs, executionUpgrades, consensusUpgrades, totalCoreEIPs, independentAuthorRows] = await Promise.all([
        prisma.upgrades.count(),
        prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
          SELECT COUNT(DISTINCT eip_number)::bigint as count
          FROM upgrade_composition_current
        `).then(r => Number(r[0]?.count || 0)),
        prisma.upgrades.count({
          where: { meta_eip: { not: null } },
        }),
        prisma.upgrades.count({
          where: { meta_eip: null },
        }),
        prisma.$queryRawUnsafe<Array<{ count: bigint }>>(`
          SELECT COUNT(DISTINCT ucc.eip_number)::bigint as count
          FROM upgrade_composition_current ucc
          JOIN eips e ON e.eip_number = ucc.eip_number
          JOIN eip_snapshots s ON s.eip_id = e.id
          WHERE s.category = 'Core'
        `).then(r => Number(r[0]?.count || 0)),
        computeIndependentIncludedAuthorRows(),
      ]);

      return {
        totalUpgrades,
        totalEIPs,
        executionLayer: executionUpgrades,
        consensusLayer: consensusUpgrades,
        totalCoreEIPs,
        independentIncludedAuthors: independentAuthorRows.length,
      };
    }),

  getIndependentIncludedAuthors: optionalAuthProcedure
    .input(z.object({}))
    .handler(async () => {
      return computeIndependentIncludedAuthorRows();
    }),

  // Get upgrade by slug
  getUpgrade: optionalAuthProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .handler(async ({ context, input }) => {const upgrade = await prisma.upgrades.findUnique({
        where: { slug: input.slug },
      });

      if (!upgrade) {
        throw new ORPCError('NOT_FOUND', { 
          message: `Upgrade ${input.slug} not found` 
        });
      }

      return {
        id: upgrade.id,
        slug: upgrade.slug,
        name: upgrade.name || '',
        meta_eip: upgrade.meta_eip,
        created_at: upgrade.created_at?.toISOString() || null,
      };
    }),

  // Get current EIP composition for an upgrade
  getUpgradeCompositionCurrent: optionalAuthProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .handler(async ({ context, input }) => {const upgrade = await prisma.upgrades.findUnique({
        where: { slug: input.slug },
      });

      if (!upgrade) {
        throw new ORPCError('NOT_FOUND', { 
          message: `Upgrade ${input.slug} not found` 
        });
      }

      // Get current composition
      const composition = await prisma.upgrade_composition_current.findMany({
        where: { upgrade_id: upgrade.id },
        orderBy: [
          { bucket: 'asc' },
          { eip_number: 'asc' },
        ],
      });

      // Get EIP details for each composition entry
      const eipNumbers = composition.map(c => c.eip_number);
      const eips = await prisma.eips.findMany({
        where: { eip_number: { in: eipNumbers } },
        include: {
          eip_snapshots: {
            select: {
              status: true,
              updated_at: true,
            },
          },
        },
      });

      // Combine data
      return composition.map(comp => {
        const eip = eips.find(e => e.eip_number === comp.eip_number);
        return {
          eip_number: comp.eip_number,
          bucket: comp.bucket || null,
          title: eip?.title || '',
          status: eip?.eip_snapshots?.status || null,
          updated_at: comp.updated_at?.toISOString() || null,
        };
      });
    }),

  // Get upgrade composition events (activity feed)
  getUpgradeCompositionEvents: optionalAuthProcedure
    .input(z.object({
      slug: z.string(),
      limit: z.number().optional().default(50),
    }))
    .handler(async ({ context, input }) => {const upgrade = await prisma.upgrades.findUnique({
        where: { slug: input.slug },
      });

      if (!upgrade) {
        throw new ORPCError('NOT_FOUND', { 
          message: `Upgrade ${input.slug} not found` 
        });
      }

      // Get events
      const events = await prisma.upgrade_composition_events.findMany({
        where: { upgrade_id: upgrade.id },
        orderBy: { commit_date: 'desc' },
        take: input.limit,
        select: {
          commit_date: true,
          eip_number: true,
          event_type: true,
          bucket: true,
          commit_sha: true,
        },
      });

      return events.map(event => ({
        commit_date: event.commit_date?.toISOString() || null,
        eip_number: event.eip_number,
        event_type: event.event_type || null,
        bucket: event.bucket || null,
        commit_sha: event.commit_sha || null,
      }));
    }),

  // Get timeline data for upgrade (grouped by date with bucket statuses)
  getUpgradeTimeline: optionalAuthProcedure
    .input(z.object({
      slug: z.string(),
    }))
    .handler(async ({ context, input }) => {const upgrade = await prisma.upgrades.findUnique({
        where: { slug: input.slug },
      });

      if (!upgrade) {
        throw new ORPCError('NOT_FOUND', {
          message: `Upgrade ${input.slug} not found`,
        });
      }

      // Get all events for this upgrade, ordered by date
      const events = await prisma.upgrade_composition_events.findMany({
        where: { upgrade_id: upgrade.id },
        orderBy: { commit_date: 'asc' },
        select: {
          commit_date: true,
          eip_number: true,
          bucket: true,
          event_type: true,
        },
      });

      // Get current composition to use as final state
      const currentComposition = await prisma.upgrade_composition_current.findMany({
        where: { upgrade_id: upgrade.id },
        select: { eip_number: true, bucket: true },
      });

      // Build timeline by processing events chronologically
      // Track state changes per date
      const dateChanges = new Map<string, Array<{ eipNumber: number; bucket: string | null; type: string }>>();
      const allDates = new Set<string>();

      // Process events to track changes per date
      events.forEach((event) => {
        if (!event.commit_date || !event.eip_number) return;

        const dateStr = new Date(event.commit_date).toISOString().split('T')[0];
        allDates.add(dateStr);

        if (!dateChanges.has(dateStr)) {
          dateChanges.set(dateStr, []);
        }

        dateChanges.get(dateStr)!.push({
          eipNumber: event.eip_number,
          bucket: event.bucket ? event.bucket.toLowerCase() : null,
          type: event.event_type || 'added',
        });
      });

      const fallbackFinalDate =
        upgrade.created_at?.toISOString().split('T')[0] ??
        new Date().toISOString().split('T')[0];
      const finalSnapshotDate = events.length > 0
        ? new Date(events[events.length - 1]!.commit_date!).toISOString().split('T')[0]
        : fallbackFinalDate;

      if (currentComposition.length > 0 || allDates.size === 0) {
        allDates.add(finalSnapshotDate);
      }

      // Build cumulative state (each date includes all EIPs up to that point)
      const sortedDates = Array.from(allDates).sort();
      const result: Array<{
        date: string;
        included: string[];
        scheduled: string[];
        declined: string[];
        considered: string[];
        proposed: string[];
      }> = [];

      const cumulativeState = new Map<number, string>();

      sortedDates.forEach((date) => {
        // Apply changes for this date
        const changes = dateChanges.get(date) || [];

        changes.forEach((change) => {
          if (change.type === 'added' || change.type === 'moved') {
            if (change.bucket) {
              cumulativeState.set(change.eipNumber, change.bucket);
            }
          } else if (change.type === 'removed') {
            cumulativeState.delete(change.eipNumber);
          }
        });

        // Anchor the latest composition snapshot to the last real timeline date.
        if (date === finalSnapshotDate) {
          cumulativeState.clear();
          currentComposition.forEach((comp) => {
            if (comp.bucket) {
              cumulativeState.set(comp.eip_number, comp.bucket.toLowerCase());
            }
          });
        }

        // Group EIPs by bucket
        const dayData = {
          date,
          included: [] as number[],
          scheduled: [] as number[],
          considered: [] as number[],
          declined: [] as number[],
          proposed: [] as number[],
        };

        cumulativeState.forEach((bucket, eipNumber) => {
          if (bucket === 'included') {
            dayData.included.push(eipNumber);
          } else if (bucket === 'scheduled') {
            dayData.scheduled.push(eipNumber);
          } else if (bucket === 'considered') {
            dayData.considered.push(eipNumber);
          } else if (bucket === 'declined') {
            dayData.declined.push(eipNumber);
          } else if (bucket === 'proposed') {
            dayData.proposed.push(eipNumber);
          }
        });

        result.push({
          date,
          included: dayData.included.map(String),
          scheduled: dayData.scheduled.map(String),
          considered: dayData.considered.map(String),
          declined: dayData.declined.map(String),
          proposed: dayData.proposed.map(String),
        });
      });

      return result;
    }),
}
