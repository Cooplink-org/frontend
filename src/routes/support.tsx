import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Mail, Send } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/support")({
  head: () => ({
    meta: [
      { title: i18n.t("support.title") },
      { name: "description", content: i18n.t("support.meta_desc") },
      { property: "og:title", content: i18n.t("support.title") },
      { property: "og:description", content: i18n.t("support.meta_desc") },
    ],
  }),
  component: SupportPage,
});

function SupportPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-50" aria-hidden />
        <div className="absolute inset-0 bg-hero-glow opacity-60" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("support.section")}
          </div>
          <h1 className="mt-3 font-mono text-4xl tracking-tight text-foreground">
            {t("support.heading")}
          </h1>
          <p className="mt-4 text-foreground/80">{t("support.desc")}</p>

          <div className="mt-10 space-y-4">
            <div className="rounded-md border border-border-subtle bg-surface p-5">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t("support.email_label")}
                  </div>
                  <a
                    href="mailto:abushtein@proton.me"
                    className="mt-1 font-mono text-sm text-foreground hover:text-primary transition-colors"
                  >
                    abushtein@proton.me
                  </a>
                </div>
              </div>
            </div>

            <div className="rounded-md border border-border-subtle bg-surface p-5">
              <div className="flex items-center gap-3">
                <Send className="h-5 w-5 text-muted-foreground" />
                <div>
                  <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t("support.telegram_label")}
                  </div>
                  <a
                    href="https://t.me/yordam_42"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 font-mono text-sm text-foreground hover:text-primary transition-colors"
                  >
                    @yordam_42
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
