import crypto from "crypto";
import { env } from "@/env";

type UnsubscribeTokenPayload =
  | {
      v: 1;
      scope: "proposal";
      userId: string;
      eipId: number;
      repositoryId: number;
    }
  | {
      v: 1;
      scope: "repository";
      userId: string;
      repositoryId: number;
    }
  | {
      v: 1;
      scope: "upgrade";
      userId: string;
      upgradeId: number;
    };

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function sign(encodedPayload: string) {
  return crypto
    .createHmac("sha256", env.BETTER_AUTH_SECRET)
    .update(encodedPayload)
    .digest("base64url");
}

export function createUnsubscribeToken(payload: UnsubscribeTokenPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export function verifyUnsubscribeToken(token: string): UnsubscribeTokenPayload | null {
  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(encodedPayload)) as UnsubscribeTokenPayload;
    if (parsed?.v !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getUnsubscribeUrl(token: string) {
  return `${env.BETTER_AUTH_URL}/api/subscriptions/unsubscribe?token=${encodeURIComponent(token)}`;
}
