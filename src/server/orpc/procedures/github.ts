import { optionalAuthProcedure, publicProcedure, ORPCError } from './types'
import * as z from 'zod'

// ─── Types ────────────────────────────────────────────────────────────────

interface GitHubUser {
  login: string;
  avatar_url: string;
  html_url: string;
}

interface GitHubPRDetail {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  draft: boolean;
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  merged_at: string | null;
  merge_commit_sha: string | null;
  head: {
    sha: string;
    ref: string;
  };
  base: {
    sha: string;
    ref: string;
  };
  additions: number;
  deletions: number;
  changed_files: number;
  commits: number;
  review_comments: number;
  comments: number;
  html_url: string;
}

interface GitHubIssueDetail {
  number: number;
  title: string;
  body: string | null;
  state: 'open' | 'closed';
  user: GitHubUser;
  created_at: string;
  updated_at: string;
  closed_at: string | null;
  labels: Array<{
    name: string;
    color: string;
  }>;
  comments: number;
  html_url: string;
}

interface GitHubAPIResponse {
  status: number;
  data?: any;
  message?: string;
}

// ─── Helper: Fetch from GitHub API ────────────────────────────────────────

async function fetchGitHubAPI(url: string): Promise<any> {
  const token = process.env.GITHUB_TOKEN || '';
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'EIPsInsight',
  };

  if (token) {
    headers['Authorization'] = `token ${token}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) {
      if (res.status === 404) {
        throw new ORPCError('NOT_FOUND', {
          message: `GitHub resource not found at ${url}`,
        });
      }
      if (res.status === 403) {
        throw new ORPCError('RATE_LIMITED', {
          message: 'GitHub API rate limit exceeded',
        });
      }
      throw new ORPCError('FETCH_ERROR', {
        message: `Failed to fetch from GitHub: ${res.status}`,
      });
    }
    return await res.json();
  } catch (error: any) {
    if (error.code && error.code !== 'FETCH_FAILED') {
      throw error;
    }
    throw new ORPCError('FETCH_ERROR', {
      message: `Failed to fetch from GitHub: ${error.message}`,
    });
  }
}

// ─── Helper: Normalize PR/Issue data ───────────────────────────────────────

function normalizePRData(raw: GitHubPRDetail) {
  return {
    number: raw.number,
    title: raw.title,
    description: raw.body || '',
    state: raw.state,
    draft: raw.draft,
    author: {
      login: raw.user.login,
      avatarUrl: raw.user.avatar_url,
      profileUrl: raw.user.html_url,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    closedAt: raw.closed_at,
    mergedAt: raw.merged_at,
    mergeCommitSha: raw.merge_commit_sha,
    head: {
      sha: raw.head.sha,
      ref: raw.head.ref,
    },
    base: {
      sha: raw.base.sha,
      ref: raw.base.ref,
    },
    stats: {
      additions: raw.additions,
      deletions: raw.deletions,
      changedFiles: raw.changed_files,
      commits: raw.commits,
      reviewComments: raw.review_comments,
      comments: raw.comments,
    },
    externalUrl: raw.html_url,
  };
}

function normalizeIssueData(raw: GitHubIssueDetail) {
  return {
    number: raw.number,
    title: raw.title,
    description: raw.body || '',
    state: raw.state,
    author: {
      login: raw.user.login,
      avatarUrl: raw.user.avatar_url,
      profileUrl: raw.user.html_url,
    },
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
    closedAt: raw.closed_at,
    labels: raw.labels.map((label) => ({
      name: label.name,
      color: label.color,
    })),
    commentCount: raw.comments,
    externalUrl: raw.html_url,
  };
}

// ─── Procedures ───────────────────────────────────────────────────────────

export const githubProcedures = {
  // Get PR details
  getPRDetail: optionalAuthProcedure
    .input(z.object({
      repo: z.string().min(1),
      number: z.number().int().positive(),
    }))
    .handler(async ({ input }) => {
      const { repo, number } = input;

      // Map repo name to owner/repo format
      // Examples: 'ethereum/EIPs' -> 'ethereum/EIPs'
      let owner = 'ethereum';
      let repoName = repo;

      // Handle various repo name formats
      if (repo.includes('/')) {
        const [o, r] = repo.split('/');
        owner = o;
        repoName = r;
      }

      const url = `https://api.github.com/repos/${owner}/${repoName}/pulls/${number}`;

      try {
        const prData = await fetchGitHubAPI(url);
        return normalizePRData(prData);
      } catch (error: any) {
        console.error(`Failed to fetch PR ${repo}#${number}:`, error);
        throw error;
      }
    }),

  // Get issue details
  getIssueDetail: optionalAuthProcedure
    .input(z.object({
      repo: z.string().min(1),
      number: z.number().int().positive(),
    }))
    .handler(async ({ input }) => {
      const { repo, number } = input;

      // Map repo name to owner/repo format
      let owner = 'ethereum';
      let repoName = repo;

      if (repo.includes('/')) {
        const [o, r] = repo.split('/');
        owner = o;
        repoName = r;
      }

      const url = `https://api.github.com/repos/${owner}/${repoName}/issues/${number}`;

      try {
        const issueData = await fetchGitHubAPI(url);
        
        // Filter out pull requests (they also show up as issues in API)
        if (issueData.pull_request) {
          throw new ORPCError('NOT_FOUND', {
            message: `Issue ${repo}#${number} is actually a PR, use getPRDetail instead`,
          });
        }

        return normalizeIssueData(issueData);
      } catch (error: any) {
        console.error(`Failed to fetch issue ${repo}#${number}:`, error);
        throw error;
      }
    }),
}
