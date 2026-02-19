export const API_SCOPES = {
  ANALYTICS_READ: "analytics:read",
  PROPOSALS_READ: "proposals:read",
  UPGRADES_READ: "upgrades:read",
  BLOG_WRITE: "blog:write",
  ACCOUNT_READ: "account:read",
} as const

export type ApiScope = typeof API_SCOPES[keyof typeof API_SCOPES]
