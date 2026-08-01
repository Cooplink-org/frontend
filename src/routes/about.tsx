import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: i18n.t("about.title") },
      { name: "description", content: i18n.t("about.meta_desc") },
      { property: "og:title", content: i18n.t("about.title") },
      { property: "og:description", content: i18n.t("about.meta_desc") },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-hero-glow opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("about.section")}</div>
        <h1 className="mt-3 font-mono text-4xl tracking-tight text-foreground">
          {t("about.heading")}
        </h1>
        <div className="mt-8 space-y-6 text-foreground/90">
          <p>{t("about.para1")}</p>
          <p>{t("about.para2")}</p>
          <div className="rounded-md border border-border-subtle bg-surface p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t("about.contact_label")}
            </div>
            <div className="mt-2 font-mono text-sm text-foreground">{t("about.email")}</div>
          </div>
        </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
