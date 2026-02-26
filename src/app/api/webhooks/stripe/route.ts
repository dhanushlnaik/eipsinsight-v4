import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";
import type Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { constructWebhookEvent, retrieveCustomer } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature provided" }, { status: 400 });
  }

  let event: any;

  try {
    event = await constructWebhookEvent(body, signature);
  } catch (error) {
    console.error("Webhook signature verification failed:", error);
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCreated(subscription);
        break;
      }
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdated(subscription);
        break;
      }
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionDeleted(subscription);
        break;
      }
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error processing webhook:", error);
    return NextResponse.json(
      {
        error: "Webhook handler failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Safely convert a Stripe Unix timestamp to a Date, or null if missing */
function toDate(unixSeconds: number | null | undefined): Date | null {
  if (!unixSeconds || isNaN(unixSeconds)) return null;
  return new Date(unixSeconds * 1000);
}

/**
 * Find user by stripeCustomerId.
 * Falls back to looking up the userId stored in the Stripe customer metadata
 * to handle the race condition where checkout.session.completed and
 * customer.subscription.created fire nearly simultaneously.
 */
async function findUserByCustomerId(customerId: string) {
  // Primary lookup
  let user = await prisma.user.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (user) return user;

  // Fallback: retrieve customer from Stripe and check metadata
  try {
    const customer = (await retrieveCustomer(customerId)) as any;
    const userId = customer.metadata?.userId;
    if (!userId) {
      console.warn(`No userId metadata on Stripe customer ${customerId}`);
      return null;
    }
    user = await prisma.user.findUnique({ where: { id: userId } });
    if (user) {
      // Persist the stripeCustomerId so future lookups are fast
      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }
    return user ?? null;
  } catch (err) {
    console.error(`Failed to retrieve Stripe customer ${customerId}:`, err);
    return null;
  }
}

// ─── Event handlers ──────────────────────────────────────────────────────────

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  const tierSlug = session.metadata?.tierSlug;

  if (!userId) {
    throw new Error("No userId in checkout session metadata");
  }

  const subscriptionId =
    typeof session.subscription === "string"
      ? session.subscription
      : session.subscription?.id;

  if (!subscriptionId) {
    console.warn("No subscription ID in checkout session");
    return;
  }

  const customerId =
    typeof session.customer === "string"
      ? session.customer
      : session.customer?.id ?? undefined;

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscriptionId,
      membershipTier: tierSlug ?? undefined,
    },
  });

  console.log(`✅ Checkout completed for user ${userId}, tier: ${tierSlug}`);
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.warn(`No user found for customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const periodEnd = toDate((subscription as any).current_period_end);

  const tier = priceId
    ? await prisma.membershipTier.findFirst({
        where: {
          OR: [
            { stripePriceIdMonthly: priceId },
            { stripePriceIdYearly: priceId },
          ],
        },
      })
    : null;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: subscription.id,
      stripePriceId: priceId ?? null,
      stripeCurrentPeriodEnd: periodEnd,
      membershipTier: tier?.slug ?? undefined,
      membershipExpiresAt: tier ? periodEnd : undefined,
    },
  });

  console.log(`✅ Subscription created for user ${user.id}, tier: ${tier?.slug}`);
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.warn(`No user found for customer ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const periodEnd = toDate((subscription as any).current_period_end);

  const tier = priceId
    ? await prisma.membershipTier.findFirst({
        where: {
          OR: [
            { stripePriceIdMonthly: priceId },
            { stripePriceIdYearly: priceId },
          ],
        },
      })
    : null;

  const isActive =
    subscription.status === "active" || subscription.status === "trialing";
  const isCancelling =
    subscription.status === "canceled" ||
    (subscription as any).cancel_at_period_end === true;

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripePriceId: priceId ?? null,
      stripeCurrentPeriodEnd: periodEnd,
      // Only update tier if active, keep it during cancellation until period end
      membershipTier: isActive && tier ? tier.slug : undefined,
      membershipExpiresAt: isActive || isCancelling ? periodEnd : null,
    },
  });

  console.log(
    `✅ Subscription updated for user ${user.id}, status: ${subscription.status}`
  );
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId =
    typeof subscription.customer === "string"
      ? subscription.customer
      : subscription.customer.id;

  const user = await findUserByCustomerId(customerId);
  if (!user) {
    console.warn(`No user found for customer ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeSubscriptionId: null,
      stripePriceId: null,
      stripeCurrentPeriodEnd: null,
      membershipTier: "free",
      membershipExpiresAt: null,
    },
  });

  console.log(`✅ Subscription deleted for user ${user.id}, reverted to free`);
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  const subscriptionId =
    typeof (invoice as any).subscription === "string"
      ? (invoice as any).subscription
      : (invoice as any).subscription?.id;

  if (!subscriptionId) return;

  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  console.log(
    `✅ Payment succeeded for user ${user.id}: ${invoice.amount_paid / 100} ${invoice.currency}`
  );
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const customerId =
    typeof invoice.customer === "string"
      ? invoice.customer
      : invoice.customer?.id;

  if (!customerId) return;

  const user = await findUserByCustomerId(customerId);
  if (!user) return;

  console.error(
    `❌ Payment failed for user ${user.id}: ${invoice.amount_due / 100} ${invoice.currency}`
  );
}