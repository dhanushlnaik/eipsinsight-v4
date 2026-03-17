export const CLIENT_TEAM_AUTHOR_KEYS = [
  "axic",
  "pandapip1",
  "gcolvin",
  "lightclient",
  "samwilsn",
  "xinbenlv",
  "nconsigny",
  "yoavw",
  "carlbeek",
  "adietrichs",
  "jochem-brouwer",
  "abcoathup",
  "bomanaps",
  "marchhill",
  "skandabhat",
  "advaita-saha",
  "nalepae",
  "daniellehrner",
] as const;

export const CLIENT_TEAM_AUTHOR_ALIASES: Record<string, string[]> = {
  axic: ["alex beregszaszi"],
  pandapip1: ["gavin john"],
  gcolvin: ["greg colvin"],
  lightclient: ["matt garnett"],
  samwilsn: ["sam wilson"],
  carlbeek: ["carl beek"],
  "jochem-brouwer": ["jochem brouwer"],
  skandabhat: ["skanda bhat"],
};

export function buildClientTeamExclusionKeys(): string[] {
  const keys = new Set<string>();
  CLIENT_TEAM_AUTHOR_KEYS.forEach((key) => keys.add(key.toLowerCase().trim()));
  Object.values(CLIENT_TEAM_AUTHOR_ALIASES).forEach((aliases) => {
    aliases.forEach((alias) => keys.add(alias.toLowerCase().trim()));
  });
  return Array.from(keys);
}
