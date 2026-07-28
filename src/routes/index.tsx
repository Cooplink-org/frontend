import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, GitBranch, Lock, Zap, ShieldCheck, Star } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cooplink — a marketplace for GitHub source code" },
      {
        name: "description",
        content:
          "Buy and sell production source code, straight from GitHub. Secure payouts, instant delivery, developer-first.",
      },
      { property: "og:title", content: "Cooplink — a marketplace for GitHub source code" },
      {
        property: "og:description",
        content:
          "Buy and sell production source code, straight from GitHub. Secure payouts, instant delivery, developer-first.",
      },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <Hero />
      <ActivityStrip />
      <Features />
      <HowItWorks />
      <ClosingCTA />
      <MarketingFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div className="absolute inset-0 bg-grid mask-fade-edges opacity-70" aria-hidden />
      <div className="absolute inset-0 bg-hero-glow" aria-hidden />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="inline-flex items-center gap-2 rounded-pill border border-border bg-background/70 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          v1 · now onboarding sellers
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
          className="mt-6 max-w-3xl font-mono text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl"
        >
          A marketplace for
          <br />
          <span className="text-foreground/40">source code you</span>{" "}
          <span className="text-foreground">actually ship</span>.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
          className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
        >
          Connect a GitHub repo, set a price, get paid. Cooplink handles delivery, licensing,
          and payouts — you keep control of the code.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
          className="mt-8 flex flex-wrap items-center gap-3"
        >
          <Link
            to="/auth/sign-up"
            className="group inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)] transition-transform hover:-translate-y-px"
          >
            Start selling
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            to="/browse"
            className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-background px-5 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            Browse projects
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 grid max-w-3xl grid-cols-3 gap-6 border-t border-border-subtle pt-6"
        >
          <Stat k="paid_to_sellers" v="$—" hint="live" />
          <Stat k="active_listings" v="—" hint="published" />
          <Stat k="avg_payout_time" v="< 48h" hint="stripe connect" />
        </motion.div>
      </div>
    </section>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint: string }) {
  return (
    <div>
      <div className="font-mono text-xs text-muted-foreground">{k}</div>
      <div className="mt-1 font-mono text-2xl tracking-tight text-foreground">{v}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {hint}
      </div>
    </div>
  );
}

function ActivityStrip() {
  // Structural / placeholder. Real feed wires to /activity once API doc lands.
  const items = [
    { who: "@auren", what: "listed", target: "auren/next-billing-kit", price: "$149" },
    { who: "@mira", what: "sold", target: "mira/edge-image-loader", price: "$79" },
    { who: "@sol", what: "listed", target: "sol/typed-webhooks", price: "$59" },
    { who: "@rin", what: "sold", target: "rin/rate-limit-postgres", price: "$29" },
    { who: "@juno", what: "listed", target: "juno/auth-boilerplate-hono", price: "$99" },
  ];
  return (
    <section className="border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-3 font-mono text-xs text-muted-foreground sm:px-6">
        <span className="shrink-0 rounded-sm border border-border-subtle bg-background px-2 py-0.5">
          live
        </span>
        {items.map((i, idx) => (
          <span key={idx} className="flex shrink-0 items-center gap-1.5">
            <span className="text-foreground">{i.who}</span>
            <span>{i.what}</span>
            <span className="text-foreground">{i.target}</span>
            <span className="text-accent-foreground/60">·</span>
            <span className="text-foreground">{i.price}</span>
            {idx < items.length - 1 && <span className="ml-3 text-border-strong">/</span>}
          </span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const rows = [
    {
      icon: GitBranch,
      title: "GitHub-native",
      body: "Sign in with GitHub. List a repo you already own. No file uploads, no zip archives.",
    },
    {
      icon: Lock,
      title: "Access on purchase",
      body: "Buyers get repo access the moment payment clears. Revoke on refund, no manual steps.",
    },
    {
      icon: Zap,
      title: "Fast payouts",
      body: "Stripe Connect under the hood. Payouts land in under 48 hours in supported regions.",
    },
    {
      icon: ShieldCheck,
      title: "Buyer & seller protections",
      body: "Disputes handled by humans. Reports, moderation, and an audit trail on every action.",
    },
  ];
  return (
    <section className="border-b border-border-subtle">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            what you get
          </div>
          <h2 className="mt-3 font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
            A marketplace with the parts that matter.
          </h2>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle md:grid-cols-2">
          {rows.map((r) => (
            <div key={r.title} className="flex gap-4 bg-background p-6">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface text-foreground">
                <r.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-mono text-sm text-foreground">{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: "01",
      title: "Connect a repo",
      body: "Authorize Cooplink for a single GitHub repository you own. Nothing else is touched.",
    },
    {
      n: "02",
      title: "Price it",
      body: "Set a price, describe what it does, tag the stack. Submit for a fast review.",
    },
    {
      n: "03",
      title: "Get paid",
      body: "When a developer buys, they get access and you get a payout. That's it.",
    },
  ];
  return (
    <section className="border-b border-border-subtle bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              how it works
            </div>
            <h2 className="mt-3 font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
              Three steps. No zip files.
            </h2>
          </div>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="relative rounded-md border border-border-subtle bg-background p-6"
            >
              <div className="font-mono text-xs text-muted-foreground">step_{s.n}</div>
              <div className="mt-4 font-mono text-5xl leading-none tracking-tighter text-foreground">
                {s.n}
              </div>
              <div className="mt-6">
                <div className="font-mono text-sm text-foreground">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function ClosingCTA() {
  return (
    <section className="border-b border-border-subtle">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-24 sm:px-6">
        <div className="absolute inset-0 bg-dots mask-fade-edges opacity-40" aria-hidden />
        <div className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h3 className="font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
              List your first repo.
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              Free to list. 10% platform fee on sales. No monthly cost, no lock-in.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/auth/sign-up"
              className="inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)]"
            >
              Start selling <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/browse"
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-background px-5 text-sm font-medium text-foreground"
            >
              <Star className="h-4 w-4" /> Browse
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
