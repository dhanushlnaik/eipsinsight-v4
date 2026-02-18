import GhostContentAPI from "@tryghost/content-api";

let api: InstanceType<typeof GhostContentAPI> | null = null;

export function getGhostClient() {
  if (!process.env.GHOST_API_URL || !process.env.GHOST_CONTENT_API_KEY) {
    return null;
  }

  if (!api) {
    api = new GhostContentAPI({
      url: process.env.GHOST_API_URL,
      key: process.env.GHOST_CONTENT_API_KEY,
      version: "v5.0",
    });
  }

  return api;
}
