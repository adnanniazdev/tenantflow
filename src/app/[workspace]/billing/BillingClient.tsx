"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Check, CreditCard, ExternalLink, Loader2 } from "lucide-react";
import { useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { PaymentForm } from "./PaymentForm";

// Initialize Stripe client-side SDK. Fallbacks gracefully if key is not yet set in .env
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

interface BillingClientProps {
  workspace: {
    id: string;
    name: string;
    slug: string;
    plan: "free" | "pro";
    subscriptionStatus: string | null;
    currentPeriodEnd: Date | null;
  };
}

export function BillingClient({ workspace }: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const subscriptionIntentMutation =
    trpc.billing.createSubscriptionIntent.useMutation();
  const portalMutation = trpc.billing.createPortal.useMutation();

  const handleUpgrade = async () => {
    setLoading(true);
    try {
      const res = await subscriptionIntentMutation.mutateAsync({
        workspaceSlug: workspace.slug,
        priceId:
          process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || "price_pro_tier_mock",
      });

      if (res.clientSecret) {
        setClientSecret(res.clientSecret);
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to initiate Stripe elements checkout";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  const handleManagePortal = async () => {
    setLoading(true);
    try {
      // Create portal session redirecting to Stripe Customer Portal
      const res = await portalMutation.mutateAsync({
        workspaceSlug: workspace.slug,
      });
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to open Stripe Customer Portal";
      alert(message);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current plan status panel */}
      <div className="p-5 md:p-6 bg-card border border-border rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-wider">
            Current Tier
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xl md:text-2xl font-semibold text-foreground capitalize">
              {workspace.plan} Plan
            </span>
            {workspace.plan === "pro" && (
              <span className="bg-card-subtle text-foreground text-[11px] font-mono border border-border px-2 py-0.5 rounded uppercase tracking-wider">
                Active
              </span>
            )}
          </div>
          {workspace.plan === "pro" && workspace.currentPeriodEnd && (
            <p className="text-xs text-muted-foreground pt-1">
              Renewal date:{" "}
              <span className="text-foreground font-mono">
                {new Date(workspace.currentPeriodEnd).toLocaleDateString()}
              </span>{" "}
              (Status:{" "}
              <span className="text-foreground font-mono capitalize">
                {workspace.subscriptionStatus}
              </span>
              )
            </p>
          )}
        </div>

        <div>
          {workspace.plan === "pro" ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleManagePortal}
              className="px-4 py-2 bg-secondary hover:bg-secondary-hover disabled:opacity-50 text-secondary-foreground text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none border border-border"
            >
              {loading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
              ) : (
                <CreditCard className="w-3.5 h-3.5" />
              )}
              Manage Billing & Invoices
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleUpgrade}
              className="px-5 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-primary-foreground text-xs font-medium rounded-md transition-colors flex items-center justify-center gap-2 focus:outline-none"
            >
              {loading && (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary-foreground" />
              )}
              Upgrade Workspace to Pro
            </button>
          )}
        </div>
      </div>

      {/* Plan comparisons table card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan Card */}
        <article className="p-6 bg-card border border-border rounded-lg flex flex-col justify-between">
          <div>
            <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
              Free Plan
            </span>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-foreground tracking-tight tabular-nums">
                $0
              </span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              Standard shared computing resources for testing and development
              environments.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                "Up to 5 API members",
                "Neon RLS partition database logs",
                "Rewritten subdomain context workspace",
                "5,000 monthly executions quota limits",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-xs text-muted-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          <button
            type="button"
            disabled
            className="w-full mt-6 py-2 bg-card-subtle text-muted-foreground text-xs font-medium rounded-md border border-border cursor-not-allowed"
          >
            {workspace.plan === "free"
              ? "Currently Subscribed"
              : "Downgrade unavailable"}
          </button>
        </article>

        {/* Pro Plan Card */}
        <article className="p-6 bg-card border border-border rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-foreground uppercase tracking-wider">
                Pro Plan
              </span>
              <span className="text-[10px] font-mono text-foreground border border-border bg-card-subtle px-2 py-0.5 rounded uppercase tracking-wider">
                Enterprise
              </span>
            </div>
            <div className="mt-3 flex items-baseline gap-1">
              <span className="text-3xl font-semibold text-foreground tracking-tight tabular-nums">
                $29
              </span>
              <span className="text-xs text-muted-foreground">/ month</span>
            </div>
            <p className="text-xs text-muted-foreground mt-3 leading-relaxed">
              For production workloads requiring scalable capacity and priority
              database execution.
            </p>

            <ul className="mt-6 space-y-2.5">
              {[
                "Unlimited API members",
                "Dedicated isolation DB policies",
                "Full Stripe invoice & billing portal logs",
                "Unlimited execution queries",
                "Priority uptime support logs",
              ].map((feature) => (
                <li
                  key={feature}
                  className="flex items-start gap-2.5 text-xs text-foreground"
                >
                  <Check className="w-3.5 h-3.5 text-foreground shrink-0 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {workspace.plan === "pro" ? (
            <button
              type="button"
              disabled={loading}
              onClick={handleManagePortal}
              className="w-full mt-6 py-2 bg-secondary hover:bg-secondary-hover transition-colors text-secondary-foreground text-xs font-medium rounded-md border border-border flex items-center justify-center gap-1.5 focus:outline-none"
            >
              Manage Subscription
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          ) : (
            <button
              type="button"
              disabled={loading}
              onClick={handleUpgrade}
              className="w-full mt-6 py-2 bg-primary hover:bg-primary-hover transition-colors text-primary-foreground text-xs font-medium rounded-md focus:outline-none flex items-center justify-center gap-1.5"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Upgrade to Pro
            </button>
          )}
        </article>
      </div>

      {/* Embedded Elements Modal Overlay */}
      {clientSecret && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-border p-6 rounded-lg w-full max-w-md relative text-foreground max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold text-foreground font-sans mb-1">
              Complete Upgrade
            </h2>
            <p className="text-xs text-muted-foreground mb-6">
              Enter payment details to upgrade <strong>{workspace.name}</strong>{" "}
              to the Pro plan.
            </p>
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: {
                  theme: "night",
                  variables: {
                    colorPrimary: "#fafafa",
                    colorBackground: "#121215",
                    colorText: "#fafafa",
                    colorDanger: "#fca5a5",
                    fontFamily:
                      "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif",
                  },
                },
              }}
            >
              <PaymentForm onCancel={() => setClientSecret(null)} />
            </Elements>
          </div>
        </div>
      )}
    </div>
  );
}
