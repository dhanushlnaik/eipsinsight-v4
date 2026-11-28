import { prisma } from '@/lib/prisma';
import { callLLM, extractJson, isMachineAuthored } from '@/lib/ai-curation';
import { STAKEHOLDER_KEYS } from '@/lib/stakeholders';
import { Prisma } from '@/generated/prisma/client';

const XAI_MODEL = process.env.XAI_MODEL || 'grok-4.7';

const inFlight = new Map<number, Promise<unknown>>();

async function fetchSpecMarkdown(eipNumber: number, repoHint?: string): Promise<string | null> {
  const short = (repoHint || 'eip').toLowerCase().replace(/s$/, '');
  const candidates =
    short === 'erc'
      ? [
          `https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-${eipNumber}.md`,
          `https://raw.githubusercontent.com/ethereum/EIPs/master/EIPS/eip-${eipNumber}.md`,
        ]
      : short === 'rip'
        ? [
            `https://raw.githubusercontent.com/ethereum/RIPs/master/RIPS/rip-${eipNumber}.md`,
            `https://raw.githubusercontent.com/ethereum/EIPs/master/EIPS/eip-${eipNumber}.md`,
          ]
        : [
            `https://raw.githubusercontent.com/ethereum/EIPs/master/EIPS/eip-${eipNumber}.md`,
            `https://raw.githubusercontent.com/ethereum/ERCs/master/ERCS/erc-${eipNumber}.md`,
          ];

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
      if (res.ok) return await res.text();
    } catch {
      // try next
    }
  }
  return null;
}

function extractResponseText(data: Record<string, unknown>): string | null {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text;
  }
  const output = data.output as Array<{ content?: Array<{ text?: string }> }> | undefined;
  if (Array.isArray(output)) {
    for (const item of output) {
      if (Array.isArray(item.content)) {
        for (const c of item.content) {
          if (typeof c.text === 'string' && c.text.trim()) return c.text;
        }
      }
    }
  }
  return null;
}

function buildPrompt(eipNumber: number, title: string, specBody: string): string {
  const trimmed = specBody.slice(0, 6000);
  return `You are writing a plain-language AND institutional/enterprise reference entry for Ethereum proposal #${eipNumber} ("${title}").
Base every claim strictly on the specification below. Return ONLY valid JSON (no markdown fences) with this exact shape:
{
  "laymanTitle": "short plain-language subtitle (<= 70 chars)",
  "laymanSummary": "2-4 sentences explaining what this proposal does and why it matters in plain language",
  "benefits": ["3-4 concise concrete benefits, each <= 120 chars"],
  "tradeoffs": ["1-3 honest tradeoffs, costs, or constraints implied by the spec, each <= 120 chars"],
  "stakeholderImpacts": {
    "endUsers": { "description": "1-2 sentences if affected, else omit key" },
    "appDevs": { "description": "..." },
    "walletDevs": { "description": "..." },
    "toolingInfra": { "description": "..." },
    "layer2s": { "description": "..." },
    "stakersNodes": { "description": "..." },
    "elClients": { "description": "..." },
    "clClients": { "description": "..." }
  },
  "faq": [
    { "question": "concise practical question", "answer": "1-3 sentence grounded answer" }
  ],
  "enterpriseImpact": {
    "tier": "direct | limited | none",
    "summary": "1-2 sentences for institutional risk/engineering teams",
    "readiness": "1-2 sentences on what institutions should test or monitor",
    "organizations": [
      {
        "role": "Custodians & wallets | Staking providers | Infrastructure operators | Banks & payment providers | Asset managers | Auditors & accountants | L2-using companies | Digital-asset advisors",
        "level": "high | medium | low | none",
        "summary": "1 short sentence",
        "how": "how this org type is affected",
        "why": "why it matters operationally",
        "action": "concrete next step"
      }
    ],
    "businessImpact": [
      { "area": "e.g. Custody & Key Management", "summary": "1 short sentence", "detail": "1-2 sentence explanation" }
    ]
  }
}
Include 3-4 FAQ items, only stakeholder keys genuinely affected, and 2-4 most relevant enterprise organizations + 2-3 businessImpact areas.

--- SPEC ---
${trimmed}
--- END SPEC ---`;
}

async function generateViaGrokOrFallback(eipNumber: number, title: string, specBody: string) {
  const prompt = buildPrompt(eipNumber, title, specBody);
  const xaiKey = process.env.XAI_API_KEY;

  if (xaiKey) {
    const res = await fetch('https://api.x.ai/v1/responses', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${xaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: XAI_MODEL,
        reasoning: { effort: 'low' },
        input: prompt,
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(90000),
    });

    const bodyText = await res.text();
    if (!res.ok) {
      const isQuota =
        res.status === 402 ||
        res.status === 429 ||
        /quota|credit|balance|limit|exhausted|billing/i.test(bodyText);
      throw new Error(`${isQuota ? 'QUOTA_EXHAUSTED' : 'API_ERROR'}:${res.status}:${bodyText.slice(0, 300)}`);
    }

    const data = JSON.parse(bodyText) as Record<string, unknown>;
    const usage = data.usage as { total_tokens?: number } | undefined;
    const text = extractResponseText(data);
    if (!text) throw new Error('EMPTY_RESPONSE');
    const jsonStr = extractJson(text) || text;
    return { parsed: JSON.parse(jsonStr), tokens: usage?.total_tokens ?? 0, actor: XAI_MODEL };
  }

  // Fallback to configured app LLM (Gemini / Anthropic / Groq)
  const raw = await callLLM('You are an Ethereum protocol technical writer. Return only valid JSON.', prompt);
  if (!raw) throw new Error('NO_LLM_AVAILABLE');
  const jsonStr = extractJson(raw) || raw;
  return { parsed: JSON.parse(jsonStr), tokens: 0, actor: 'ai:fallback' };
}

/**
 * Ensures a proposal has both layman_summary and enterprise_impact in `eip_curations`.
 * Safe against concurrent calls and never overwrites human-edited rows.
 */
export async function ensureProposalCuration(params: {
  number: number;
  repo?: string;
  title?: string;
}): Promise<{ saved: boolean; tokens: number; row: Awaited<ReturnType<typeof prisma.eip_curations.findUnique>> }> {
  const { number, repo, title } = params;

  const existing = await prisma.eip_curations.findUnique({
    where: { eip_number: number },
  });

  if (existing?.layman_summary && existing?.enterprise_impact) {
    return { saved: false, tokens: 0, row: existing };
  }
  if (existing && !isMachineAuthored(existing.updated_by) && existing.layman_summary) {
    return { saved: false, tokens: 0, row: existing };
  }

  const running = inFlight.get(number);
  if (running) {
    return (await running) as {
      saved: boolean;
      tokens: number;
      row: Awaited<ReturnType<typeof prisma.eip_curations.findUnique>>;
    };
  }

  const task = (async () => {
    const eipRow = !title
      ? await prisma.eips.findUnique({ where: { eip_number: number }, select: { title: true } })
      : null;
    const resolvedTitle = title || eipRow?.title || `EIP-${number}`;
    const spec = await fetchSpecMarkdown(number, repo);
    if (!spec) {
      return { saved: false, tokens: 0, row: existing };
    }

    const { parsed, tokens, actor } = await generateViaGrokOrFallback(number, resolvedTitle, spec);

    const impacts: Record<string, { description: string }> = {};
    for (const key of STAKEHOLDER_KEYS) {
      const desc = parsed.stakeholderImpacts?.[key]?.description?.trim();
      if (desc) impacts[key] = { description: desc };
    }

    const benefits = Array.isArray(parsed.benefits)
      ? parsed.benefits.map((b: unknown) => String(b).trim()).filter(Boolean).slice(0, 5)
      : [];
    const tradeoffs = Array.isArray(parsed.tradeoffs)
      ? parsed.tradeoffs.map((t: unknown) => String(t).trim()).filter(Boolean).slice(0, 4)
      : [];
    const faq = Array.isArray(parsed.faq)
      ? parsed.faq
          .filter((f: { question?: string; answer?: string }) => f?.question?.trim() && f?.answer?.trim())
          .slice(0, 5)
          .map((f: { question: string; answer: string }) => ({
            question: f.question.trim(),
            answer: f.answer.trim(),
          }))
      : [];

    const ent = parsed.enterpriseImpact && typeof parsed.enterpriseImpact === 'object'
      ? parsed.enterpriseImpact
      : null;

    const row = await prisma.eip_curations.upsert({
      where: { eip_number: number },
      create: {
        eip_number: number,
        layman_title: parsed.laymanTitle?.trim() || null,
        layman_summary: parsed.laymanSummary?.trim() || null,
        benefits: benefits.length > 0 ? (benefits as Prisma.InputJsonValue) : Prisma.JsonNull,
        tradeoffs: tradeoffs.length > 0 ? (tradeoffs as Prisma.InputJsonValue) : Prisma.JsonNull,
        stakeholder_impacts: Object.keys(impacts).length > 0 ? (impacts as Prisma.InputJsonValue) : Prisma.JsonNull,
        faq: faq.length > 0 ? (faq as Prisma.InputJsonValue) : Prisma.JsonNull,
        enterprise_impact: ent ? (ent as Prisma.InputJsonValue) : Prisma.JsonNull,
        updated_by: actor,
      },
      update: {
        ...(!existing?.layman_summary && parsed.laymanSummary?.trim()
          ? {
              layman_title: parsed.laymanTitle?.trim() || undefined,
              layman_summary: parsed.laymanSummary.trim(),
              benefits: benefits.length > 0 ? (benefits as Prisma.InputJsonValue) : undefined,
              tradeoffs: tradeoffs.length > 0 ? (tradeoffs as Prisma.InputJsonValue) : undefined,
              stakeholder_impacts: Object.keys(impacts).length > 0 ? (impacts as Prisma.InputJsonValue) : undefined,
              faq: faq.length > 0 ? (faq as Prisma.InputJsonValue) : undefined,
            }
          : {}),
        ...(!existing?.enterprise_impact && ent
          ? { enterprise_impact: ent as Prisma.InputJsonValue }
          : {}),
        updated_by: actor,
      },
    });

    return { saved: true, tokens, row };
  })();

  inFlight.set(number, task);
  try {
    return await task;
  } finally {
    inFlight.delete(number);
  }
}
