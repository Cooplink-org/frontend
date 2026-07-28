import { createFileRoute } from "@tanstack/react-router";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Cooplink" },
      { name: "description", content: "Cooplink is a developer-run marketplace for source code." },
      { property: "og:title", content: "About — Cooplink" },
      { property: "og:description", content: "Cooplink is a developer-run marketplace for source code." },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <MarketingHeader />
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">about</div>
        <h1 className="mt-3 font-mono text-4xl tracking-tight text-foreground">
          Built by developers.
        </h1>
        <div className="mt-8 space-y-6 text-foreground/90">
          <p>
            Cooplink exists because there was no clean way to buy or sell a working codebase
            without wrapping it in a course, a template store, or an NDA. Real repositories, real
            history, real access — nothing else.
          </p>
          <p>
            We take a 10% cut on sales. We don't sell ads. We don't sell your data. If we go away,
            your listings and your payout history are exportable.
          </p>
          <div className="rounded-md border border-border-subtle bg-surface p-5">
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              contact
            </div>
            <div className="mt-2 font-mono text-sm text-foreground">hello@cooplink.dev</div>
          </div>
        </div>
      </section>
      <MarketingFooter />
    </div>
  );
}
