import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { Check } from "lucide-react";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: i18n.t("pricing.title") },
      { name: "description", content: i18n.t("pricing.meta_desc") },
      { property: "og:title", content: i18n.t("pricing.title") },
      { property: "og:description", content: i18n.t("pricing.meta_desc") },
    ],
  }),
  component: PricingPage,
});

function PricingPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-hero-glow opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("pricing.section")}
        </div>
        <h1 className="mt-3 font-mono text-4xl tracking-tight text-foreground">
          {t("pricing.heading")}
        </h1>
        <p className="mt-3 max-w-xl text-muted-foreground">
          {t("pricing.desc")}
        </p>

        <div className="mt-12 grid gap-4 md:grid-cols-2">
          <PricingCard
            name={t("pricing.seller_card")}
            price={t("pricing.seller_fee")}
            unit={t("pricing.per_sale")}
            features={[
              t("pricing.seller_feat1"),
              t("pricing.seller_feat2"),
              t("pricing.seller_feat3"),
              t("pricing.seller_feat4"),
            ]}
            cta={{ to: "/auth/sign-up", label: t("pricing.seller_cta") }}
          />
          <PricingCard
            name={t("pricing.buyer_card")}
            price={t("pricing.buyer_fee")}
            unit={t("pricing.per_month")}
            features={[
              t("pricing.buyer_feat1"),
              t("pricing.buyer_feat2"),
              t("pricing.buyer_feat3"),
              t("pricing.buyer_feat4"),
            ]}
            cta={{ to: "/browse", label: t("pricing.buyer_cta") }}
            variant="muted"
          />
        </div>
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
