"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2 } from "lucide-react";
import { useSession } from "@/hooks/useSession";

interface PricingTier {
  name: string;
  slug: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  features: string[];
  stripePriceIdMonthly?: string;
  stripePriceIdYearly?: string;
  popular?: boolean;
  cta: string;
}

const PRICING_TIERS: PricingTier[] = [
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
    cta: "Get Started",
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
    stripePriceIdMonthly: "price_1T3z7RATJNEiu6uCl16uk65s",
    stripePriceIdYearly: "price_1T3zDrATJNEiu6uCvmFt2ao5",
    popular: true,
    cta: "Start Pro Trial",
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
    stripePriceIdMonthly: "price_1T3z7wATJNEiu6uC4Q9ZPh0i",
    stripePriceIdYearly: "price_1T3zE7ATJNEiu6uC5Ver6TZd",
    cta: "Contact Sales",
  },
];

export default function PricingPage() {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">(
    "monthly"
  );
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const router = useRouter();
  const { data: session } = useSession();

  const handleSubscribe = async (tier: PricingTier) => {
    // Redirect to sign in if not authenticated
    if (!session?.user) {
      router.push("/login?callbackUrl=/pricing");
      return;
    }

    // Free tier - just update user
    if (tier.slug === "free") {
      router.push("/dashboard");
      return;
    }

    // Enterprise - contact sales
    if (tier.slug === "enterprise") {
      window.location.href = "mailto:sales@eipsinsight.com";
      return;
    }

    // Get the appropriate price ID
    const priceId =
      billingPeriod === "monthly"
        ? tier.stripePriceIdMonthly
        : tier.stripePriceIdYearly;

    if (!priceId || priceId === "price_xxxxxxxxxxxxx") {
      alert(
        "Stripe Price ID not configured. Please add your Stripe Price IDs in the pricing configuration."
      );
      return;
    }

    setLoadingPlan(tier.slug);

    try {
      // Create checkout session
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          priceId,
          tierSlug: tier.slug,
          billingPeriod,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error("Error creating checkout session:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to start checkout. Please try again."
      );
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20 py-16 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-linear-to-r from-primary via-cyan-500 to-blue-500 bg-clip-text text-transparent">
            Choose Your Plan
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock powerful EIP insights and API access. Start free, upgrade as
            you grow.
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-4 mb-12">
          <span
            className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Monthly
          </span>
          <button
            onClick={() =>
              setBillingPeriod(billingPeriod === "monthly" ? "yearly" : "monthly")
            }
            className="relative inline-flex h-6 w-11 items-center rounded-full bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label="Toggle billing period"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-primary transition-transform ${billingPeriod === "yearly" ? "translate-x-6" : "translate-x-1"}`}
            />
          </button>
          <span
            className={`text-sm font-medium ${billingPeriod === "yearly" ? "text-foreground" : "text-muted-foreground"}`}
          >
            Yearly
            <span className="ml-1 text-xs text-green-500">(Save ~17%)</span>
          </span>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {PRICING_TIERS.map((tier) => {
            const price =
              billingPeriod === "monthly"
                ? tier.priceMonthly
                : tier.priceYearly / 12;
            const isLoading = loadingPlan === tier.slug;

            return (
              <div
                key={tier.slug}
                className={`relative rounded-2xl p-8 ${
                  tier.popular
                    ? "bg-linear-to-b from-primary/10 to-background border-2 border-primary shadow-lg shadow-primary/20"
                    : "bg-card border border-border"
                }`}
              >
                {tier.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-xs font-semibold">
                    Most Popular
                  </div>
                )}

                <div className="mb-6">
                  <h3 className="text-2xl font-bold mb-2">{tier.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {tier.description}
                  </p>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold">
                      ${price.toFixed(0)}
                    </span>
                    <span className="text-muted-foreground">/month</span>
                  </div>
                  {billingPeriod === "yearly" && tier.priceYearly > 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      ${tier.priceYearly} billed annually
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(tier)}
                  disabled={isLoading}
                  className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                    tier.popular
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "bg-muted hover:bg-muted/80"
                  } disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    tier.cta
                  )}
                </button>
              </div>
            );
          })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <p className="text-sm text-muted-foreground">
            All plans include access to historical EIP data and standard
            analytics.
            <br />
            Need a custom plan?{" "}
            <a
              href="mailto:sales@eipsinsight.com"
              className="text-primary hover:underline"
            >
              Contact our sales team
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
