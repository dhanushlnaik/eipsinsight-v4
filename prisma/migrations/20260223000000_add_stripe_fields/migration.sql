-- AlterTable User - Add Stripe fields
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeCustomerId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeSubscriptionId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripePriceId" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "stripeCurrentPeriodEnd" TIMESTAMP(3);

-- Create unique indexes for Stripe fields
CREATE UNIQUE INDEX IF NOT EXISTS "user_stripeCustomerId_key" ON "user"("stripeCustomerId");
CREATE UNIQUE INDEX IF NOT EXISTS "user_stripeSubscriptionId_key" ON "user"("stripeSubscriptionId");

-- AlterTable MembershipTier - Add Stripe fields
ALTER TABLE "membership_tier" ADD COLUMN IF NOT EXISTS "stripeProductId" TEXT;
ALTER TABLE "membership_tier" ADD COLUMN IF NOT EXISTS "stripePriceIdMonthly" TEXT;
ALTER TABLE "membership_tier" ADD COLUMN IF NOT EXISTS "stripePriceIdYearly" TEXT;

-- Create unique indexes for Stripe fields
CREATE UNIQUE INDEX IF NOT EXISTS "membership_tier_stripeProductId_key" ON "membership_tier"("stripeProductId");
CREATE UNIQUE INDEX IF NOT EXISTS "membership_tier_stripePriceIdMonthly_key" ON "membership_tier"("stripePriceIdMonthly");
CREATE UNIQUE INDEX IF NOT EXISTS "membership_tier_stripePriceIdYearly_key" ON "membership_tier"("stripePriceIdYearly");
