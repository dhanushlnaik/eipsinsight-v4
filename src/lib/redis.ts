import { env } from "@/env";
import type { Redis } from "ioredis";

// Lazy load Redis only when needed (avoids edge runtime issues)
let RedisClass: new (url: string, opts?: object) => Redis;
let redisClient: Redis | undefined;

function getRedis(): Redis {
  if (!redisClient) {
    // Dynamic require to avoid bundling in edge runtime
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    RedisClass = require("ioredis");
    
    if (!env.REDIS_URL) {
      throw new Error("REDIS_URL is required for rate limiting");
    }

    const globalForRedis = globalThis as unknown as {
      redis?: Redis;
    };

    redisClient = globalForRedis.redis ?? new RedisClass(env.REDIS_URL, {
      maxRetriesPerRequest: 2,
      lazyConnect: false,
    });

    globalForRedis.redis = redisClient;
  }
  
  return redisClient;
}

export { getRedis as redis };
