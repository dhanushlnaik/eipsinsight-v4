import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { stripe } from "@/lib/stripe";

/**
 * POST /api/stripe/checkout-session
 * Verifies a Stripe Checkout session and syncs subscription data to the database.
 * Called after user returns from Stripe Checkout.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId } = body as { sessionId?: string };

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "line_items.data.price"],
    });

    // Get subscription ID
    const subscriptionId =
      typeof checkoutSession.subscription === "string"
        ? checkoutSession.subscription
        : checkoutSession.subscription?.id;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: "No subscription found in checkout session" },
        { status: 400 }
      );
    }

    // Fetch the full subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);

    // Get the price ID from the subscription
    const priceId = subscription.items.data[0]?.price?.id;

    if (!priceId) {
      return NextResponse.json(
        { error: "No price found in subscription" },
        { status: 400 }
      );
    }

    // Find the matching membership tier based on price ID
    const tier = await prisma.membershipTier.findFirst({
      where: {
        OR: [
          { stripePriceIdMonthly: priceId },
          { stripePriceIdYearly: priceId },
        ],
      },
    });

    if (!tier) {
      return NextResponse.json(
        { error: `No tier found for price ${priceId}` },
        { status: 400 }
      );
    }

    // Safely convert Stripe Unix timestamp to Date
    const rawPeriodEnd = (subscription as any).current_period_end;
    const currentPeriodEnd =
      rawPeriodEnd && !isNaN(rawPeriodEnd)
        ? new Date(rawPeriodEnd * 1000)
        : null;

    // Update user's subscription details in database
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        stripeCustomerId:
          typeof checkoutSession.customer === "string"
            ? checkoutSession.customer
            : checkoutSession.customer?.id || undefined,
        stripeSubscriptionId: subscriptionId,
        stripePriceId: priceId,
        stripeCurrentPeriodEnd: currentPeriodEnd,
        membershipTier: tier.slug,
        membershipExpiresAt: currentPeriodEnd,
      },
    });

    return NextResponse.json({ ok: true, tier: tier.slug });
  } catch (error) {
    console.error("Error syncing checkout session:", error);
    return NextResponse.json(
      {
        error: "Failed to sync checkout session",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}