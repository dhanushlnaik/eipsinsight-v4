import Stripe from "stripe";
import { env } from "@/env";

/**
 * Server-side Stripe client
 * Initialized with secret key from environment variables
 */
export const stripe = new Stripe(env.STRIPE_SECRET_KEY, {
  apiVersion: "2026-01-28.clover",
  typescript: true,
});

/**
 * Membership tier configuration that maps to Stripe products
 * Update these with your actual Stripe Product and Price IDs
 */
export const STRIPE_PLANS = {
  free: {
    name: "Free",
    slug: "free",
    priceMonthly: 0,
    priceYearly: 0,
    requestLimit: 1000,
    features: [
      "1,000 API requests/month",
      "Basic EIP data access",
      "Community support",
      "Standard analytics",
    ],
  },
  pro: {
    name: "Pro",
    slug: "pro",
    priceMonthly: 29,
    priceYearly: 290, // ~17% discount
    requestLimit: 50000,
    features: [
      "50,000 API requests/month",
      "Advanced analytics",
      "Priority support",
      "Export capabilities",
      "Custom integrations",
      "API webhooks",
    ],
    // Add your Stripe Product and Price IDs here
     stripeProductId: "prod_U23DtoM1jcOkOw",
    stripePriceIdMonthly: "price_1T3z7RATJNEiu6uCl16uk65s",
    stripePriceIdYearly: "price_1T3zDrATJNEiu6uCvmFt2ao5",
  },
  enterprise: {
    name: "Enterprise",
    slug: "enterprise",
    priceMonthly: 99,
    priceYearly: 990,
    requestLimit: 500000,
    features: [
      "500,000 API requests/month",
      "Dedicated support",
      "Custom rate limits",
      "SLA guarantee",
      "Advanced security",
      "Custom contracts",
      "White-label options",
    ],
    // Add your Stripe Product and Price IDs here
     stripeProductId: "prod_U23EzfqOtDsC1E",
    stripePriceIdMonthly: "price_1T3z7wATJNEiu6uC4Q9ZPh0i",
    stripePriceIdYearly: "price_1T3zE7ATJNEiu6uC5Ver6TZd",
  },
} as const;

export type PlanSlug = keyof typeof STRIPE_PLANS;

/**
 * Create or retrieve a Stripe customer for a user
 */
export async function getOrCreateStripeCustomer(params: {
  userId: string;
  email: string;
  name: string;
  stripeCustomerId?: string | null;
}) {
  const { userId, email, name, stripeCustomerId } = params;

  // If customer already exists, return their ID
  if (stripeCustomerId) {
    return stripeCustomerId;
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

/**
 * Create a checkout session for a subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}) {
  const { customerId, priceId, successUrl, cancelUrl, metadata } = params;

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: "subscription",
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    allow_promotion_codes: true,
    billing_address_collection: "auto",
    customer_update: {
      address: "auto",
      name: "auto",
    },
  });

  return session;
}

/**
 * Create a portal session for managing subscriptions
 */
export async function createPortalSession(params: {
  customerId: string;
  returnUrl: string;
}) {
  const { customerId, returnUrl } = params;

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get subscription status
 */
export async function getSubscription(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error("Error retrieving subscription:", error);
    return null;
  }
}

/**
 * Cancel a subscription at period end
 */
export async function cancelSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
  return subscription;
}

/**
 * Resume a cancelled subscription
 */
export async function resumeSubscription(subscriptionId: string) {
  const subscription = await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
  return subscription;
}

/**
 * Verify Stripe webhook signature
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
) {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    env.STRIPE_WEBHOOK_SECRET
  );
}
