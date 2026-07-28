import { createFileRoute, Link } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check } from "lucide-react";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Pricing — Cooplink" },
      {
        name: "description",
        content: "Free to list. 10% platform fee on sales. No monthly cost.",
      },
      { property: "og:title", content: "Pricing — Cooplink" },
      { property: "og:description", content: "Free to list. 10% platform fee on sales." },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          pricing
        </div>
        <h1 className="mt-3 font-mono text-4xl tracking-tight text-foreground">
          Simple. Percentage-based.
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          No subscriptions, no listing fees, no cost until you make a sale.
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <PricingCard
            name="Seller"
            price="10%"
            unit="/ sale"
            features={[
              "Unlimited listings",
              "GitHub-native delivery",
              "Stripe Connect payouts",
              "Buyer disputes handled",
            ]}
            cta={{ to: "/auth/sign-up", label: "Start selling" }}
          />
          <PricingCard
            name="Buyer"
            price="$0"
            unit="/ month"
            features={[
              "Purchase-based licensing",
              "Instant repo access",
              "Full commit history",
              "Refunds within 7 days",
            ]}
            cta={{ to: "/browse", label: "Browse projects" }}
            variant="muted"
          />
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}

function PricingCard({
  name,
  price,
  unit,
  features,
  cta,
  variant = "default",
}: {
  name: string;
  price: string;
  unit: string;
  features: string[];
  cta: { to: string; label: string };
  variant?: "default" | "muted";
}) {
  return (
    <div className="rounded-md border border-border-subtle bg-background p-6">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{name}</div>
      <div className="mt-4 flex items-end gap-2">
        <span className="font-mono text-5xl tracking-tighter text-foreground">{price}</span>
        <span className="mb-1 font-mono text-sm text-muted-foreground">{unit}</span>
      </div>
      <ul className="mt-6 space-y-2">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2 text-sm text-foreground">
            <Check className="mt-0.5 h-3.5 w-3.5 text-accent" strokeWidth={2.25} />
            {f}
          </li>
        ))}
      </ul>
      <Link
        to={cta.to}
        className={`mt-6 inline-flex h-9 w-full items-center justify-center rounded-sm px-3 text-sm font-medium transition-colors ${
          variant === "muted"
            ? "border border-border bg-background text-foreground hover:bg-secondary"
            : "bg-primary text-primary-foreground hover:opacity-90"
        }`}
      >
        {cta.label}
      </Link>
    </div>
  );
}
