export interface UpgradeArticle {
  image: string;
  title: string;
  content: string;
  link: string;
  publishedAt: string;
}

const UPGRADE_TAG_ALIASES: Record<string, string[]> = {
  frontier: ['frontier'],
  homestead: ['homestead'],
  'dao-fork': ['dao-fork', 'dao'],
  'tangerine-whistle': ['tangerine-whistle'],
  'spurious-dragon': ['spurious-dragon'],
  byzantium: ['byzantium'],
  constantinople: ['constantinople', 'petersburg'],
  istanbul: ['istanbul'],
  berlin: ['berlin'],
  london: ['london'],
  paris: ['merge', 'paris'],
  shanghai: ['shapella', 'shanghai', 'capella'],
  cancun: ['dencun', 'cancun', 'deneb'],
  pectra: ['pectra', 'prague', 'electra'],
  fusaka: ['fusaka', 'osaka', 'fulu'],
  glamsterdam: ['glamsterdam'],
  hegota: ['hegota', 'heze-bogota', 'hezebogota', 'bogota', 'heze'],
};

export function getUpgradeTagAliases(slug: string): string[] {
  return UPGRADE_TAG_ALIASES[slug.toLowerCase()] ?? [slug.toLowerCase()];
}

export function getUpgradeGhostFilter(slug: string): string {
  const aliases = Array.from(new Set(getUpgradeTagAliases(slug)));
  return `tag:[${aliases.join(',')}]`;
}
