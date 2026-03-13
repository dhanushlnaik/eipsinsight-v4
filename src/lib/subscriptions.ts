import { prisma } from "@/lib/prisma";

export const PROPOSAL_FILTERS = ["all", "status", "content"] as const;
export type ProposalFilter = (typeof PROPOSAL_FILTERS)[number];
export const REPOSITORY_FILTERS = ["all", "status"] as const;
export type RepositoryFilter = (typeof REPOSITORY_FILTERS)[number];
export const UPGRADE_FILTERS = ["all", "stage"] as const;
export type UpgradeFilter = (typeof UPGRADE_FILTERS)[number];

export const PROPOSAL_REPOS = ["eip", "erc", "rip", "eips", "ercs", "rips"] as const;
export type ProposalRepo = (typeof PROPOSAL_REPOS)[number];

const REPOSITORY_NAME_BY_REPO: Record<string, string> = {
  eip: "ethereum/EIPs",
  erc: "ethereum/ERCs",
  rip: "ethereum/RIPs",
};

const ROUTE_SEGMENT_BY_REPO: Record<string, string> = {
  eip: "eips",
  erc: "ercs",
  rip: "rips",
};

type ResolvedProposal = {
  eipId: number;
  number: number;
  title: string;
  status: string | null;
  repositoryId: number;
  repositoryName: string;
  repo: "eip" | "erc" | "rip";
};

type ResolvedRepository = {
  repositoryId: number;
  repositoryName: string;
  repo: "eip" | "erc" | "rip";
};

type ResolvedUpgrade = {
  id: number;
  slug: string;
  name: string;
};

export function normalizeProposalRepo(repo: ProposalRepo): "eip" | "erc" | "rip" {
  return repo.toLowerCase().replace(/s$/, "") as "eip" | "erc" | "rip";
}

export function getRepositoryNameForRepo(repo: ProposalRepo) {
  return REPOSITORY_NAME_BY_REPO[normalizeProposalRepo(repo)];
}

export function getProposalPath(repo: ProposalRepo, number: number) {
  const normalizedRepo = normalizeProposalRepo(repo);
  return `/${ROUTE_SEGMENT_BY_REPO[normalizedRepo]}/${number}`;
}

export function getProposalLabel(repo: ProposalRepo, number: number) {
  return `${normalizeProposalRepo(repo).toUpperCase()}-${number}`;
}

export function getRepositoryPath(repo: ProposalRepo) {
  const normalizedRepo = normalizeProposalRepo(repo);
  return normalizedRepo === "eip"
    ? "/standards?repo=eips"
    : normalizedRepo === "erc"
      ? "/standards?repo=ercs"
      : "/standards?repo=rips";
}

export function getRepositoryLabel(repo: ProposalRepo) {
  const normalizedRepo = normalizeProposalRepo(repo);
  return normalizedRepo === "eip" ? "All EIPs" : normalizedRepo === "erc" ? "All ERCs" : "All RIPs";
}

export async function resolveProposal(repo: ProposalRepo, number: number): Promise<ResolvedProposal | null> {
  const normalizedRepo = normalizeProposalRepo(repo);
  const repositoryName = getRepositoryNameForRepo(normalizedRepo);

  const repository = await prisma.repositories.findUnique({
    where: { name: repositoryName },
    select: { id: true, name: true },
  });

  if (!repository) {
    return null;
  }

  const proposal = await prisma.eips.findFirst({
    where: {
      eip_number: number,
      eip_snapshots: {
        is: {
          repository_id: repository.id,
        },
      },
    },
    select: {
      id: true,
      eip_number: true,
      title: true,
      eip_snapshots: {
        select: {
          status: true,
        },
      },
    },
  });

  if (!proposal) {
    return null;
  }

  return {
    eipId: proposal.id,
    number: proposal.eip_number,
    title: proposal.title || "",
    status: proposal.eip_snapshots?.status || null,
    repositoryId: repository.id,
    repositoryName: repository.name,
    repo: normalizedRepo,
  };
}

export async function resolveRepository(repo: ProposalRepo): Promise<ResolvedRepository | null> {
  const normalizedRepo = normalizeProposalRepo(repo);
  const repositoryName = getRepositoryNameForRepo(normalizedRepo);

  const repository = await prisma.repositories.findUnique({
    where: { name: repositoryName },
    select: { id: true, name: true },
  });

  if (!repository) {
    return null;
  }

  return {
    repositoryId: repository.id,
    repositoryName: repository.name,
    repo: normalizedRepo,
  };
}

export async function resolveUpgrade(slug: string): Promise<ResolvedUpgrade | null> {
  const upgrade = await prisma.upgrades.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      name: true,
    },
  });

  if (!upgrade) {
    return null;
  }

  return {
    id: upgrade.id,
    slug: upgrade.slug,
    name: upgrade.name || upgrade.slug,
  };
}
