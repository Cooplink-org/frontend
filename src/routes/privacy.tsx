import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Cooplink" },
      { name: "description", content: "How Cooplink handles your data." },
      { property: "og:title", content: "Privacy Policy — Cooplink" },
      { property: "og:description", content: "How Cooplink handles your data." },
    ],
  }),
  component: () => (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <article className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">legal</div>
        <h1 className="mt-3 font-mono text-3xl tracking-tight text-foreground">Privacy Policy</h1>
        <p className="mt-2 font-mono text-xs text-muted-foreground">version 1.0</p>
        <div className="prose prose-sm mt-8 max-w-none text-foreground/90">
          <p>Placeholder policy. Final copy will be provided before public launch.</p>
        </div>
      </article>
      <MarketingFooter />
    </div>
  ),
});
