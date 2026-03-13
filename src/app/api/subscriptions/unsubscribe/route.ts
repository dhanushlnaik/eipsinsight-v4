import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/subscription-links";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token) {
    return new NextResponse("Missing unsubscribe token.", { status: 400, headers: { "content-type": "text/plain; charset=utf-8" } });
  }

  const payload = verifyUnsubscribeToken(token);

  if (!payload) {
    return new NextResponse("This unsubscribe link is invalid or has been tampered with.", {
      status: 400,
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  }

  if (payload.scope === "proposal") {
    await prisma.proposalSubscription.deleteMany({
      where: {
        user_id: payload.userId,
        eip_id: payload.eipId,
        repository_id: payload.repositoryId,
      },
    });
  } else if (payload.scope === "repository") {
    await prisma.repositorySubscription.deleteMany({
      where: {
        user_id: payload.userId,
        repository_id: payload.repositoryId,
      },
    });
  } else if (payload.scope === "upgrade") {
    await prisma.upgradeSubscription.deleteMany({
      where: {
        user_id: payload.userId,
        upgrade_id: payload.upgradeId,
      },
    });
  }

  return new NextResponse("You have been unsubscribed successfully. You can resubscribe any time from the app.", {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}
