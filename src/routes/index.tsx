import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, useMotionValue, useSpring, animate } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, GitBranch, Lock, Zap, ShieldCheck, Star } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { getAccessToken } from "@/lib/api/client";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: i18n.t("home.title") },
      { name: "description", content: i18n.t("brand.og_desc") },
      { property: "og:title", content: i18n.t("brand.og_title") },
      { property: "og:description", content: i18n.t("brand.og_desc") },
    ],
  }),
  component: LandingPage,
});

function LandingPage() {
  const isLoggedIn = typeof window !== "undefined" && !!getAccessToken();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />
      <Hero isLoggedIn={isLoggedIn} />
      <ActivityStrip />
      <Features />
      <HowItWorks />
      <Testimonials />
      <ClosingCTA isLoggedIn={isLoggedIn} />
      <MarketingFooter />
    </div>
  );
}

function Hero({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="relative overflow-hidden border-b border-border-subtle">
      <div className="absolute inset-0 bg-grid mask-fade-edges opacity-70" aria-hidden="true" />
      <div className="absolute inset-0 bg-hero-glow" aria-hidden="true" />

      <div className="relative mx-auto max-w-6xl px-4 pb-24 pt-20 sm:px-6 sm:pt-28">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="inline-flex items-center gap-2 rounded-pill border border-border bg-background/70 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              {t("home.badge")}
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05, ease: "easeOut" }}
              className="mt-6 max-w-3xl font-mono text-4xl leading-[1.05] tracking-tight text-foreground sm:text-6xl"
            >
              {t("home.hero_heading")}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.12, ease: "easeOut" }}
              className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg"
            >
              {t("home.hero_desc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18, ease: "easeOut" }}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  className="group inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)] transition-all hover:-translate-y-px hover:shadow-[0_0_20px_color-mix(in_oklab,var(--accent-lime)_30%,transparent)] active:translate-y-0 active:scale-[0.98]"
                >
                  {t("home.go_to_dashboard")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : (
                <Link
                  to="/auth/sign-in"
                  className="group inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)] transition-all hover:-translate-y-px hover:shadow-[0_0_20px_color-mix(in_oklab,var(--accent-lime)_30%,transparent)] active:translate-y-0 active:scale-[0.98]"
                >
                  {t("home.start_selling")}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
              <Link
                to="/browse"
                className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-background px-5 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
              >
                {t("common.browse_projects")}
              </Link>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.12, ease: "easeOut" }}
            className="hidden justify-center lg:flex lg:justify-end"
          >
            <HeroLogo />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.25, ease: "easeOut" }}
          className="mt-10 flex justify-center lg:hidden"
        >
          <HeroLogo />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 grid max-w-3xl grid-cols-3 gap-6 border-t border-border-subtle pt-6"
        >
          <Stat k="paid" v="$—" hint={t("home.stat.live")} />
          <Stat k="listings" v="—" hint={t("home.stat.published")} />
          <Stat k="payout_time" v="< 48h" hint={t("home.stat.stripe")} />
        </motion.div>
      </div>
    </section>
  );
}

function HeroLogo() {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [isTouch, setIsTouch] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(true);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setReduceMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  }, []);

  const rawRotateX = useMotionValue(0);
  const rawRotateY = useMotionValue(0);
  const rawShadowX = useMotionValue(0);
  const rawShadowY = useMotionValue(0);

  const spring = { stiffness: 150, damping: 20, mass: 0.5 };
  const rotateX = useSpring(rawRotateX, spring);
  const rotateY = useSpring(rawRotateY, spring);
  const shadowX = useSpring(rawShadowX, spring);
  const shadowY = useSpring(rawShadowY, spring);

  const floatY = useMotionValue(0);
  useEffect(() => {
    if (reduceMotion) return;
    const ctrl = animate(floatY, [0, -5, 0], {
      duration: 4,
      repeat: Infinity,
      ease: "easeInOut",
    });
    return () => ctrl.stop();
  }, [reduceMotion]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isTouch || reduceMotion || !ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      rawRotateX.set(-y * 6);
      rawRotateY.set(x * 6);
      rawShadowX.set(x * 10);
      rawShadowY.set(y * 10);
    },
    [isTouch, reduceMotion],
  );

  const handleMouseLeave = useCallback(() => {
    if (isTouch || reduceMotion) return;
    rawRotateX.set(0);
    rawRotateY.set(0);
    rawShadowX.set(0);
    rawShadowY.set(0);
  }, [isTouch, reduceMotion]);

  if (reduceMotion) {
    return (
      <div className="relative w-full max-w-[180px] sm:max-w-[280px] lg:max-w-[380px] aspect-[3/2]">
        <div
          className="absolute -inset-4 rounded-2xl"
          style={{
            background: "color-mix(in oklab, var(--accent-lime) 15%, transparent)",
            filter: "blur(32px)",
          }}
        />
        <img
          src="/hero-logo.webp"
          alt={t("brand.name")}
          className="absolute inset-0 h-full w-full object-contain"
          draggable={false}
          loading="eager"
        />
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full max-w-[180px] sm:max-w-[280px] lg:max-w-[380px] aspect-[3/2]"
      style={{ perspective: 1000 }}
    >
      <motion.div
        className="absolute -inset-4 rounded-2xl"
        style={{
          background: "color-mix(in oklab, var(--accent-lime) 15%, transparent)",
          filter: "blur(32px)",
          x: shadowX,
          y: shadowY,
        }}
      />
      <motion.img
        src="/hero-logo.webp"
        alt={t("brand.name")}
        className="absolute inset-0 h-full w-full object-contain"
        style={{
          rotateX: rotateX,
          rotateY: rotateY,
          y: floatY,
        }}
        draggable={false}
        loading="eager"
      />
    </motion.div>
  );
}

function Stat({ k, v, hint }: { k: string; v: string; hint: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <div className="font-mono text-xs text-muted-foreground">{t("home.stat." + k)}</div>
      <div className="mt-1 font-mono text-2xl tracking-tight text-foreground">{v}</div>
      <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {hint}
      </div>
    </div>
  );
}

function ActivityStrip() {
  const { t } = useTranslation();
  const items = [
    { who: "@auren", what: t("home.activity.listed"), target: "auren/next-billing-kit", price: "$149" },
    { who: "@mira", what: t("home.activity.sold"), target: "mira/edge-image-loader", price: "$79" },
    { who: "@sol", what: t("home.activity.listed"), target: "sol/typed-webhooks", price: "$59" },
    { who: "@rin", what: t("home.activity.sold"), target: "rin/rate-limit-postgres", price: "$29" },
    { who: "@juno", what: t("home.activity.listed"), target: "juno/auth-boilerplate-hono", price: "$99" },
  ];
  return (
    <section className="border-b border-border-subtle bg-surface">
      <div className="mx-auto flex max-w-6xl items-center gap-3 overflow-x-auto px-4 py-3 font-mono text-xs text-muted-foreground sm:px-6">
        <span className="shrink-0 rounded-sm border border-border-subtle bg-background px-2 py-0.5">
          {t("home.stat.live")}
        </span>
        {items.map((i, idx) => (
          <motion.span
            key={idx}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3, delay: 0.4 + idx * 0.08, ease: "easeOut" }}
            className="flex shrink-0 items-center gap-1.5"
          >
            <span className="text-foreground">{i.who}</span>
            <span>{i.what}</span>
            <span className="text-foreground">{i.target}</span>
            <span className="text-accent-foreground/60">·</span>
            <span className="font-semibold text-accent">{i.price}</span>
            {idx < items.length - 1 && <span className="ml-3 text-border-strong">/</span>}
          </motion.span>
        ))}
      </div>
    </section>
  );
}

function Features() {
  const { t } = useTranslation();
  const rows = [
    {
      icon: GitBranch,
      title: t("home.feature.github_title"),
      body: t("home.feature.github_body"),
    },
    {
      icon: Lock,
      title: t("home.feature.access_title"),
      body: t("home.feature.access_body"),
    },
    {
      icon: Zap,
      title: t("home.feature.payouts_title"),
      body: t("home.feature.payouts_body"),
    },
    {
      icon: ShieldCheck,
      title: t("home.feature.protections_title"),
      body: t("home.feature.protections_body"),
    },
  ];
  return (
    <section className="border-b border-border-subtle">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          className="max-w-2xl"
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("home.what_you_get")}
          </div>
          <h2 className="mt-3 font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
            {t("home.what_you_get_heading")}
          </h2>
        </motion.div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-md border border-border-subtle bg-border-subtle md:grid-cols-2">
          {rows.map((r, i) => (
            <motion.div
              key={r.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              whileHover={{ y: -2, backgroundColor: "var(--surface)" }}
              className="flex gap-4 bg-background p-6 transition-colors"
            >
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface text-foreground">
                <r.icon className="h-4 w-4" strokeWidth={1.75} />
              </div>
              <div>
                <div className="font-mono text-sm text-foreground">{r.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{r.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const { t } = useTranslation();
  const steps = [
    {
      n: "01",
      title: t("home.step.connect_title"),
      body: t("home.step.connect_body"),
    },
    {
      n: "02",
      title: t("home.step.price_title"),
      body: t("home.step.price_body"),
    },
    {
      n: "03",
      title: t("home.step.get_paid_title"),
      body: t("home.step.get_paid_body"),
    },
  ];
  return (
    <section className="border-b border-border-subtle bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t("home.how_section")}
            </div>
            <h2 className="mt-3 font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
              {t("home.how_title")}
            </h2>
          </div>
        </div>

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map((s, i) => (
            <motion.li
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.1, ease: "easeOut" }}
              whileHover={{ y: -3 }}
              className="group relative rounded-md border border-border-subtle bg-background p-6 transition-colors hover:border-border"
            >
              <div className="font-mono text-xs text-muted-foreground">step_{s.n}</div>
              <div className="mt-4 font-mono text-5xl leading-none tracking-tighter text-foreground transition-colors group-hover:text-accent">
                {s.n}
              </div>
              <div className="mt-6">
                <div className="font-mono text-sm text-foreground">{s.title}</div>
                <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Testimonials() {
  const { t } = useTranslation();
  const items = [
    { text: t("home.testimonial.1.text"), author: t("home.testimonial.1.author") },
    { text: t("home.testimonial.2.text"), author: t("home.testimonial.2.author") },
    { text: t("home.testimonial.3.text"), author: t("home.testimonial.3.author") },
    { text: t("home.testimonial.4.text"), author: t("home.testimonial.4.author") },
    { text: t("home.testimonial.5.text"), author: t("home.testimonial.5.author") },
  ];

  return (
    <section className="border-b border-border-subtle overflow-hidden">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        >
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("home.testimonials_title")}
          </div>
        </motion.div>

        <div className="relative mt-10 overflow-hidden">
          <motion.div
            className="flex w-max gap-5"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          >
            {[...items, ...items].map((item, i) => (
              <div
                key={i}
                className="flex w-[280px] shrink-0 flex-col justify-between rounded-md border border-border-subtle bg-background p-5 sm:w-[320px]"
              >
                <p className="text-sm leading-relaxed text-foreground/80">
                  &ldquo;{item.text}&rdquo;
                </p>
                <div className="mt-5 font-mono text-xs text-muted-foreground">
                  {item.author}
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function ClosingCTA({ isLoggedIn }: { isLoggedIn: boolean }) {
  const { t } = useTranslation();
  return (
    <section className="border-b border-border-subtle">
      <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-24 sm:px-6">
        <div className="absolute inset-0 bg-dots mask-fade-edges opacity-40" aria-hidden="true" />
        <motion.div
          className="relative flex flex-col items-start justify-between gap-6 md:flex-row md:items-center"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div>
            <h3 className="font-mono text-3xl tracking-tight text-foreground sm:text-4xl">
              {t("home.cta_heading")}
            </h3>
            <p className="mt-2 max-w-md text-sm text-muted-foreground">
              {t("home.cta_desc")}
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {isLoggedIn ? (
              <Link
                to="/dashboard"
                className="inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)]"
              >
                {t("home.go_to_dashboard")} <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <Link
                to="/auth/sign-in"
                className="inline-flex h-11 items-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)]"
              >
                {t("home.start_selling")} <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link
              to="/browse"
              className="inline-flex h-11 items-center gap-2 rounded-pill border border-border bg-background px-5 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.98]"
            >
              <Star className="h-4 w-4" /> {t("common.browse_projects")}
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
