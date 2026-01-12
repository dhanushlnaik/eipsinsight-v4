import { os, checkAPIToken, type Ctx } from './types'
import { prisma } from '@/lib/prisma'
import * as z from 'zod'

export const governanceTimelineProcedures = {
  getTimelineByCategory: os
    .$context<Ctx>()
    .input(z.object({
      includeRIPs: z.boolean().optional().default(true)
    }))
    .handler(async ({ input, context }) => {
      await checkAPIToken(context.headers);

      const sql = `
        WITH CombinedProposals AS (
          -- EIPs joined with their Snapshot for Category
          SELECT 
            EXTRACT(YEAR FROM e.created_at)::int as year,
            CASE
              WHEN s.category IS NOT NULL AND s.category != '' THEN s.category
              WHEN s.type = 'Meta' THEN 'Meta'
              WHEN s.type = 'Informational' THEN 'Informational'
              ELSE 'Core'
            END as dimension
          FROM eips e
          JOIN eip_snapshots s ON e.id = s.eip_id
          WHERE e.created_at IS NOT NULL
          UNION ALL
          -- RIPs (Category is always 'RIP')
          SELECT 
            EXTRACT(YEAR FROM created_at)::int as year,
            'RIP' as dimension
          FROM rips
          WHERE created_at IS NOT NULL
          ${!input.includeRIPs ? 'AND 1=0' : ''}
        )
        SELECT 
          year,
          dimension as category,
          COUNT(*) as count
        FROM CombinedProposals
        GROUP BY year, dimension
        ORDER BY year ASC, count DESC
      `;

      const results = await prisma.$queryRawUnsafe<Array<{
        year: number | null;
        category: string;
        count: bigint;
      }>>(sql);

      console.log('[getTimelineByCategory] Raw results:', results.length, 'rows');

      // Group by year, filtering out NULL years
      const timelineMap = new Map<number, { year: number; total: number; breakdown: Array<{ key: string; count: number }> }>();
      for (const row of results) {
        const year = row.year;
        if (year === null || year === undefined) continue;
        
        if (!timelineMap.has(year)) {
          timelineMap.set(year, { year, total: 0, breakdown: [] });
        }
        const entry = timelineMap.get(year)!;
        const count = Number(row.count);
        entry.total += count;
        entry.breakdown.push({ key: row.category, count });
      }
      
      const final = Array.from(timelineMap.values()).sort((a, b) => a.year - b.year);
      console.log('[getTimelineByCategory] Final result:', final.length, 'years');
      return final;
    }),

  getTimelineByStatus: os
    .$context<Ctx>()
    .input(z.object({
      includeRIPs: z.boolean().optional().default(true)
    }))
    .handler(async ({ input, context }) => {
      await checkAPIToken(context.headers);

      const sql = `
        WITH CombinedProposals AS (
          -- EIPs
          SELECT 
            EXTRACT(YEAR FROM e.created_at)::int as year,
            s.status as dimension
          FROM eips e
          JOIN eip_snapshots s ON e.id = s.eip_id
          WHERE e.created_at IS NOT NULL
          UNION ALL
          -- RIPs
          SELECT 
            EXTRACT(YEAR FROM created_at)::int as year,
            status as dimension
          FROM rips
          WHERE created_at IS NOT NULL
          ${!input.includeRIPs ? 'AND 1=0' : ''}
        )
        SELECT 
          year,
          dimension as status,
          COUNT(*) as count
        FROM CombinedProposals
        GROUP BY year, dimension
        ORDER BY year ASC, count DESC
      `;

      const results = await prisma.$queryRawUnsafe<Array<{
        year: number | null;
        status: string;
        count: bigint;
      }>>(sql);

      console.log('[getTimelineByStatus] Raw results:', results.length, 'rows');

      // Group by year, filtering out NULL years
      const timelineMap = new Map<number, { year: number; total: number; breakdown: Array<{ key: string; count: number }> }>();
      for (const row of results) {
        const year = row.year;
        if (year === null || year === undefined) continue;
        
        if (!timelineMap.has(year)) {
          timelineMap.set(year, { year, total: 0, breakdown: [] });
        }
        const entry = timelineMap.get(year)!;
        const count = Number(row.count);
        entry.total += count;
        entry.breakdown.push({ key: row.status, count });
      }
      
      const final = Array.from(timelineMap.values()).sort((a, b) => a.year - b.year);
      console.log('[getTimelineByStatus] Final result:', final.length, 'years');
      return final;
    }),

  getDetailedDataByYear: os
    .$context<Ctx>()
    .input(z.object({
      year: z.number(),
      includeRIPs: z.boolean().optional().default(true)
    }))
    .handler(async ({ input, context }) => {
      await checkAPIToken(context.headers);

      const sql = `
        WITH EIPData AS (
          SELECT 
            e.eip_number,
            e.title,
            e.author,
            e.created_at,
            COALESCE(s.type, 'EIP') as type,
            s.status,
            CASE
              WHEN s.category IS NOT NULL AND s.category != '' THEN s.category
              WHEN s.type = 'Meta' THEN 'Meta'
              WHEN s.type = 'Informational' THEN 'Informational'
              ELSE 'Core'
            END as category,
            r.name as repository,
            'https://eips.ethereum.org/EIPS/eip-' || e.eip_number as url
          FROM eips e
          JOIN eip_snapshots s ON e.id = s.eip_id
          LEFT JOIN repositories r ON s.repository_id = r.id
          WHERE EXTRACT(YEAR FROM e.created_at) = ${input.year}
          ${!input.includeRIPs ? `AND (r.name IS NULL OR r.name NOT LIKE '%RIPs%')` : ''}
        ),
        RIPData AS (
          SELECT 
            rip_number as eip_number,
            title,
            author,
            created_at,
            'RIP' as type,
            status,
            'RIP' as category,
            'ethereum/RIPs' as repository,
            'https://github.com/ethereum/RIPs/blob/master/RIPS/rip-' || rip_number || '.md' as url
          FROM rips
          WHERE EXTRACT(YEAR FROM created_at) = ${input.year}
          ${!input.includeRIPs ? 'AND 1=0' : ''}
        )
        SELECT * FROM EIPData
        UNION ALL
        SELECT * FROM RIPData
        ORDER BY eip_number ASC
      `;

      const results = await prisma.$queryRawUnsafe<Array<{
        eip_number: number;
        title: string | null;
        author: string | null;
        created_at: Date | null;
        type: string;
        status: string;
        category: string;
        repository: string | null;
        url: string;
      }>>(sql);

      return results.map(row => ({
        eipNumber: row.eip_number,
        title: row.title || '',
        author: row.author || '',
        createdAt: row.created_at ? row.created_at.toISOString().split('T')[0] : '',
        type: row.type,
        status: row.status,
        category: row.category,
        repository: row.repository || '',
        url: row.url
      }));
    }),

  getTrendingProposals: os
    .$context<Ctx>()
    .input(z.object({
      limit: z.number().optional().default(6)
    }))
    .handler(async ({ input, context }) => {
      await checkAPIToken(context.headers);

      try {
        // Fetch latest topics from Ethereum Magicians
        const response = await fetch('https://ethereum-magicians.org/latest.json', {
          headers: {
            'User-Agent': 'EIPsInsight/1.0',
          },
          next: { revalidate: 300 } // Cache for 5 minutes
        });

        if (!response.ok) {
          throw new Error(`Ethereum Magicians API returned ${response.status}`);
        }

        const data = await response.json();
        const topics = data.topic_list?.topics || [];

        // Parse and process topics
        const proposalRegex = /^(eip|erc|rip)-(\d+):\s+/i;
        const processed: Array<{
          proposalNumber: number;
          proposalType: 'EIP' | 'ERC' | 'RIP';
          title: string;
          status?: string;
          category?: string;
          replies: number;
          lastActivityAt: string;
          destination: 'internal' | 'magicians';
          url: string;
          magiciansUrl: string;
        }> = [];

        for (const topic of topics.slice(0, 40)) {
          const title = topic.title || '';
          const match = title.match(proposalRegex);

          if (!match) continue;

          const proposalType = match[1].toUpperCase() as 'EIP' | 'ERC' | 'RIP';
          const proposalNumber = parseInt(match[2], 10);

          if (!proposalNumber || proposalNumber <= 0) continue;

          // Extract clean title (remove prefix)
          const cleanTitle = title.replace(proposalRegex, '').trim();

          // Get discussion metadata
          const replies = topic.reply_count || 0;
          const lastActivityAt = topic.last_posted_at || topic.created_at || new Date().toISOString();
          const magiciansUrl = `https://ethereum-magicians.org/t/${topic.slug}/${topic.id}`;

          // Check if proposal exists in internal database
          let internalProposal: {
            status?: string;
            category?: string;
            url?: string;
            title?: string;
          } | null = null;

          if (proposalType === 'RIP') {
            const rip = await prisma.rips.findUnique({
              where: { rip_number: proposalNumber },
            });
            if (rip) {
              internalProposal = {
                status: rip.status || undefined,
                category: 'RIP',
                url: `https://github.com/ethereum/RIPs/blob/master/RIPS/rip-${proposalNumber}.md`,
                title: rip.title || undefined,
              };
            }
          } else {
            // EIP or ERC
            const eip = await prisma.eips.findUnique({
              where: { eip_number: proposalNumber },
            });

            // "snapshots" property may not exist on eip; safely handle and default if not present
            const snapshot: any = (eip as any)?.snapshots?.[0];

            if (eip && snapshot) {
              internalProposal = {
                status: snapshot.status || undefined,
                category: snapshot.category || (snapshot.type === 'Meta' ? 'Meta' : snapshot.type === 'Informational' ? 'Informational' : 'Core'),
                url: proposalType === 'ERC' 
                  ? `https://github.com/ethereum/ERCs/blob/master/ERCS/erc-${proposalNumber}.md`
                  : `https://eips.ethereum.org/EIPS/eip-${proposalNumber}`,
                title: eip.title || undefined,
              };
            }
          }

          processed.push({
            proposalNumber,
            proposalType,
            title: cleanTitle || internalProposal?.title || 'Untitled',
            status: internalProposal?.status,
            category: internalProposal?.category,
            replies,
            lastActivityAt,
            destination: internalProposal ? 'internal' : 'magicians',
            url: internalProposal?.url || magiciansUrl,
            magiciansUrl,
          });
        }

        // Sort by: most recently active, then by reply count, prefer internal
        processed.sort((a, b) => {
          // Prefer internal proposals
          if (a.destination === 'internal' && b.destination !== 'internal') return -1;
          if (b.destination === 'internal' && a.destination !== 'internal') return 1;
          
          // Then by last activity
          const timeA = new Date(a.lastActivityAt).getTime();
          const timeB = new Date(b.lastActivityAt).getTime();
          if (timeB !== timeA) return timeB - timeA;
          
          // Finally by reply count
          return b.replies - a.replies;
        });

        return processed.slice(0, input.limit);
      } catch (error) {
        console.error('Failed to fetch trending proposals:', error);
        return [];
      }
    }),
}
