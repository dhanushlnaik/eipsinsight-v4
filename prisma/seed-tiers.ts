/**
 * Seed Membership Tiers
 * 
 * This script creates the default membership tiers in the database.
 * Run this after running the Stripe fields migration.
 * 
 * Usage:
 * 1. Update the Stripe Product and Price IDs below (after creating them in Stripe Dashboard)
 * 2. Run: npx tsx prisma/seed-tiers.ts
 */

import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding membership tiers...");

  // TODO: Replace these with your actual Stripe Product and Price IDs
  // Get these from: https://dashboard.stripe.com/products
  const STRIPE_PRO_PRODUCT_ID = "prod_xxxxxxxxxxxxx";
  const STRIPE_PRO_PRICE_MONTHLY = "price_xxxxxxxxxxxxx";
  const STRIPE_PRO_PRICE_YEARLY = "price_xxxxxxxxxxxxx";

  const STRIPE_ENTERPRISE_PRODUCT_ID = "prod_xxxxxxxxxxxxx";
  const STRIPE_ENTERPRISE_PRICE_MONTHLY = "price_xxxxxxxxxxxxx";
  const STRIPE_ENTERPRISE_PRICE_YEARLY = "price_xxxxxxxxxxxxx";

  const tiers = [
    {
      name: "Free",
      slug: "free",
      description: "Perfect for getting started with EIP data",
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        "1,000 API requests/month",
        "Basic EIP data access",
        "Community support",
        "Standard analytics",
      ],
      requestLimit: 1000,
    },
    {
      name: "Pro",
      slug: "pro",
      description: "For developers and teams building on Ethereum",
      priceMonthly: 29,
      priceYearly: 290,
      features: [
        "50,000 API requests/month",
        "Advanced analytics",
        "Priority support",
        "Export capabilities",
        "Custom integrations",
        "API webhooks",
      ],
      requestLimit: 50000,
      stripeProductId: STRIPE_PRO_PRODUCT_ID,
      stripePriceIdMonthly: STRIPE_PRO_PRICE_MONTHLY,
      stripePriceIdYearly: STRIPE_PRO_PRICE_YEARLY,
    },
    {
      name: "Enterprise",
      slug: "enterprise",
      description: "Advanced features for large organizations",
      priceMonthly: 99,
      priceYearly: 990,
      features: [
        "500,000 API requests/month",
        "Dedicated support",
        "Custom rate limits",
        "SLA guarantee",
        "Advanced security",
        "Custom contracts",
        "White-label options",
      ],
      requestLimit: 500000,
      stripeProductId: STRIPE_ENTERPRISE_PRODUCT_ID,
      stripePriceIdMonthly: STRIPE_ENTERPRISE_PRICE_MONTHLY,
      stripePriceIdYearly: STRIPE_ENTERPRISE_PRICE_YEARLY,
    },
  ];

  for (const tier of tiers) {
    const result = await prisma.membershipTier.upsert({
      where: { slug: tier.slug },
      update: tier,
      create: tier,
    });
    console.log(`✅ Created/Updated tier: ${result.name} (${result.slug})`);
  }

  console.log("\n✨ Seeding complete!");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding tiers:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
