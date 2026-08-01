import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: i18n.t("terms.title") },
      { name: "description", content: i18n.t("terms.meta_desc") },
      { property: "og:title", content: i18n.t("terms.title") },
      { property: "og:description", content: i18n.t("terms.meta_desc") },
    ],
  }),
  component: TermsPage,
});

function TermsPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("terms.section")}</div>
        <h1 className="mt-3 font-mono text-3xl tracking-tight text-foreground">{t("terms.heading")}</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">{t("terms.version")}</p>
        <div className="prose prose-sm mt-8 max-w-none text-foreground/90">
          <p>{t("terms.placeholder")}</p>
        </div>
      </article>
      <MarketingFooter />
    </div>
  );
}
