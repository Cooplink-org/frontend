import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, CheckCircle, ExternalLink, Loader2, Search, XCircle } from "lucide-react";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import BorderGlow from "@/components/ui/BorderGlow";
import { formatUZSCompact, formatUZSParts, formatCount } from "@/lib/format";
import { leaderboardApi } from "@/lib/api/endpoints/leaderboard";
import type { LeaderboardEntry, LeaderboardData } from "@/lib/api/endpoints/leaderboard";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/crack-it")({
  validateSearch: (s: Record<string, unknown>) => ({
    entry: s.entry ? Number(s.entry) : undefined,
    payment: typeof s.payment === "string" ? s.payment : undefined,
  }),
  head: () => ({
    meta: [
      { title: i18n.t("crack_it.title") },
      { name: "description", content: i18n.t("crack_it.meta_desc") },
      { property: "og:title", content: i18n.t("crack_it.title") },
      { property: "og:description", content: i18n.t("crack_it.meta_desc") },
    ],
  }),
  component: CrackItPage,
});

/* ── Types & constants ────────────────────────────────────────────────────── */

type FormPhase = "domain" | "details" | "submitting" | "paying";
type VerifyState = "idle" | "verifying" | "paid" | "failed" | "error";
type SortMode = "stake" | "clicks";

interface FormData {
  domain: string;
  brand_name: string;
  description: string;
  logo_url: string;
  amount_uzs: string;
  category: string;
}

const EMPTY_FORM: FormData = {
  domain: "",
  brand_name: "",
  description: "",
  logo_url: "",
  amount_uzs: "",
  category: "tech",
};

const CATEGORIES = [
  { slug: "tech", key: "crack_it.cat_tech" },
  { slug: "trade", key: "crack_it.cat_trade" },
  { slug: "media", key: "crack_it.cat_media" },
  { slug: "edu", key: "crack_it.cat_edu" },
  { slug: "ai", key: "crack_it.cat_ai" },
] as const;

const POS_KEY = "ci_rank_positions";

function categoryLabel(slug: string | undefined): string {
  if (!slug) return "";
  const cat = CATEGORIES.find((c) => c.slug === slug);
  return cat ? i18n.t(cat.key) : "";
}

function prospectivePositionOf(data: LeaderboardData | null, amountRaw: string): number | null {
  if (!data || !amountRaw) return null;
  const amount = parseFloat(amountRaw);
  if (Number.isNaN(amount) || amount <= 0) return null;
  return (
    data.entries.filter((e) => parseFloat(e.amount_uzs) > amount).length +
    data.entries.filter((e) => parseFloat(e.amount_uzs) === amount).length +
    1
  );
}

/* ── Count-up tween (ease-out, respects reduced motion) ───────────────────── */

function useCountUp(target: number | null, duration = 800): number {
  const [value, setValue] = useState(0);
  const currentRef = useRef(0);

  useEffect(() => {
    if (target === null) return undefined;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      currentRef.current = target;
      setValue(target);
      return undefined;
    }
    const from = currentRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = from + (target - from) * eased;
      currentRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);

  return target === null ? 0 : value;
}

/* ── Component ────────────────────────────────────────────────────────────── */

function CrackItPage() {
  const { t } = useTranslation();
  const search = Route.useSearch();

  // Data
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [rankDeltas, setRankDeltas] = useState<Record<number, number>>({});

  // Discovery state
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("all");
  const [sort, setSort] = useState<SortMode>("stake");

  // Inline stake widget — one open at a time
  const [stakeOpenId, setStakeOpenId] = useState<number | null>(null);

  // Form
  const [phase, setPhase] = useState<FormPhase>("domain");
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createdEntryId, setCreatedEntryId] = useState<number | null>(null);
  const [serverError, setServerError] = useState("");

  // Verify (return from payment)
  const [verifyState, setVerifyState] = useState<VerifyState>("idle");
  const [retrying, setRetrying] = useState(false);
  const submitRef = useRef<HTMLDivElement>(null);
  const domainInputRef = useRef<HTMLInputElement>(null);

  const fetchBoard = useCallback(async () => {
    try {
      const d = await leaderboardApi.get();
      setData(d);
    } catch {
      /* empty board on error */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoard();
  }, [fetchBoard]);

  useEffect(() => {
    if (search.payment === "return" && search.entry && verifyState === "idle") {
      setVerifyState("verifying");
      leaderboardApi
        .verify({ entry_id: search.entry })
        .then((r) => {
          setVerifyState(r.status === "paid" ? "paid" : "failed");
          if (r.status === "paid") fetchBoard();
        })
        .catch(() => setVerifyState("error"));
    }
  }, [search, verifyState, fetchBoard]);

  // Rank change indicators — compare against the visitor's previous visit
  useEffect(() => {
    if (!data) return;
    let prev: Record<string, number> = {};
    try {
      prev = JSON.parse(sessionStorage.getItem(POS_KEY) ?? "{}");
    } catch {
      prev = {};
    }
    const next: Record<string, number> = {};
    const deltas: Record<number, number> = {};
    for (const e of data.entries) {
      if (e.position == null) continue;
      next[String(e.id)] = e.position;
      const p = prev[String(e.id)];
      if (p != null && p !== e.position) deltas[e.id] = p - e.position;
    }
    setRankDeltas(deltas);
    try {
      sessionStorage.setItem(POS_KEY, JSON.stringify(next));
    } catch {
      /* private mode */
    }
  }, [data]);

  // ── Form handlers ─────────────────────────────────────────────────────────

  const setField = (key: keyof FormData, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const n = { ...e };
      delete n[key];
      return n;
    });
    setServerError("");
  };

  const handleDomainSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.domain || !form.domain.includes(".")) {
      setErrors({ domain: t("crack_it.error.domain") });
      return;
    }
    setPhase("details");
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setServerError("");
    setPhase("submitting");

    try {
      const res = await leaderboardApi.createEntry({
        domain: form.domain,
        brand_name: form.brand_name,
        description: form.description,
        logo_url: form.logo_url,
        amount_uzs: form.amount_uzs,
        category: form.category,
      });
      setCreatedEntryId(res.entry.id);

      const pay = await leaderboardApi.payEntry(res.entry.id);
      setPhase("paying");
      window.location.href = pay.redirect_url;
    } catch (err: unknown) {
      setPhase("details");
      const msg =
        err && typeof err === "object" && "errors" in err
          ? (err.errors as Record<string, string>)
          : null;
      if (msg) {
        setErrors(msg);
      } else {
        const detail =
          err && typeof err === "object" && "detail" in err
            ? String((err as { detail: string }).detail)
            : t("crack_it.error.server");
        setServerError(detail);
      }
    }
  };

  const handleRetryPayment = async () => {
    if (!search.entry || retrying) return;
    setRetrying(true);
    try {
      const pay = await leaderboardApi.payEntry(search.entry);
      window.location.href = pay.redirect_url;
    } catch {
      setVerifyState("error");
      setRetrying(false);
    }
  };

  const focusSubmission = () => {
    submitRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (phase === "domain") {
      window.setTimeout(() => domainInputRef.current?.focus(), 350);
    }
  };

  // Stake widget submit — prefill the bid into the real submission flow
  const handleSubmitStake = (_entry: LeaderboardEntry, total: number) => {
    setStakeOpenId(null);
    setForm((f) => ({ ...f, amount_uzs: String(Math.round(total)) }));
    setErrors({});
    setServerError("");
    focusSubmission();
  };

  // ── Derived data ──────────────────────────────────────────────────────────

  const lang = i18n.language?.startsWith("uz")
    ? "uz"
    : i18n.language?.startsWith("ru")
      ? "ru"
      : "en";

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    if (Number.isNaN(diff)) return "";
    const min = Math.floor(diff / 60_000);
    if (min < 60) return t("crack_it.time_min", { n: Math.max(min, 1) });
    const hr = Math.floor(min / 60);
    if (hr < 24) return t("crack_it.time_hour", { n: hr });
    return t("crack_it.time_day", { n: Math.floor(hr / 24) });
  };

  const metaLine = (entry: LeaderboardEntry, withLikes = true): string =>
    [
      timeAgo(entry.created_at),
      categoryLabel(entry.category),
      ...(withLikes ? [t("crack_it.meta_likes", { count: formatCount(entry.likes, lang) })] : []),
      t("crack_it.meta_clicks", { count: formatCount(entry.clicks, lang) }),
    ]
      .filter(Boolean)
      .join(" · ");

  const entries = useMemo(() => data?.entries ?? [], [data]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = entries;
    if (q) {
      list = list.filter((e) =>
        [e.brand_name, e.description, e.domain].some((f) => f?.toLowerCase().includes(q)),
      );
    }
    if (category !== "all") {
      list = list.filter((e) => e.category === category);
    }
    if (sort === "clicks") {
      list = [...list].sort(
        (a, b) => b.clicks - a.clicks || parseFloat(b.amount_uzs) - parseFloat(a.amount_uzs),
      );
    }
    return list;
  }, [entries, query, category, sort]);

  const prospectivePosition = prospectivePositionOf(data, form.amount_uzs);
  const topPrice = useCountUp(entries[0] ? parseFloat(entries[0].amount_uzs) : null);
  const totalPool = data?.total_earned_uzs;
  const totalAnimated = useCountUp(totalPool !== undefined ? parseFloat(totalPool) : null);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingHeader />

      {/* ── Hero — grid texture + mesh glow, same as landing ──────────────── */}
      <section className="relative overflow-hidden border-b border-border-subtle">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-70" aria-hidden="true" />
        <div className="absolute inset-0 bg-hero-glow" aria-hidden="true" />

        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-14">
          {/* Live badge — landing badge pattern */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 rounded-pill border border-border bg-background/70 px-3 py-1 font-mono text-xs text-muted-foreground backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse-dot" />
              <span>{t("crack_it.activity_live")}</span>
              {typeof data?.count === "number" && (
                <>
                  <span aria-hidden>·</span>
                  <span>
                    {t("crack_it.activity_submitted", { count: formatCount(data.count, lang) })}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Heading */}
          <h1 className="mt-8 text-center font-mono text-4xl tracking-tight text-foreground sm:text-5xl">
            {t("crack_it.heading")}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-center text-base text-muted-foreground">
            {t("crack_it.subheading")}
          </p>

          {/* TOP 1 price — Stat treatment */}
          {entries[0] && (
            <div className="my-16 text-center">
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t("crack_it.hero_top1")}
              </div>
              <div className="mt-2 font-mono leading-none tracking-tighter text-accent">
                <span className="text-5xl font-bold sm:text-6xl">
                  {formatUZSParts(topPrice).value}
                </span>
                {formatUZSParts(topPrice).unit && (
                  <span className="ml-2 text-xl font-medium text-muted-foreground">
                    {formatUZSParts(topPrice).unit}
                  </span>
                )}
              </div>
              {totalPool !== undefined && (
                <div className="mt-3 font-mono text-sm text-muted-foreground">
                  {formatUZSCompact(totalAnimated)} · {t("crack_it.hero_total_suffix")}
                </div>
              )}
            </div>
          )}

          {/* ── Domain submission ─────────────────────────────────────────── */}
          <div ref={submitRef} className="mx-auto w-full max-w-xl">
            {verifyState === "verifying" && (
              <div
                className="mb-6 flex items-center justify-center gap-2 text-sm text-muted-foreground"
                role="status"
                aria-live="polite"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("crack_it.verifying")}
              </div>
            )}
            {verifyState === "paid" && (
              <div
                className="mb-6 flex items-center justify-center gap-2 rounded-md border border-border-subtle bg-surface px-4 py-3 text-sm text-foreground"
                role="status"
                aria-live="polite"
              >
                <CheckCircle className="h-4 w-4 text-accent" />
                {t("crack_it.verified")}
              </div>
            )}
            {verifyState === "failed" && (
              <div className="mb-6 space-y-3 text-center">
                <div
                  className="flex items-center justify-center gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  <XCircle className="h-4 w-4" />
                  {t("crack_it.payment_failed")}
                </div>
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  disabled={retrying}
                  className={`${CI_PRIMARY} mx-auto disabled:opacity-50`}
                >
                  {retrying && <Loader2 className="h-4 w-4" />}
                  {t("crack_it.retry_payment")}
                </button>
              </div>
            )}
            {verifyState === "error" && (
              <div
                className="mb-6 flex items-center justify-center gap-2 rounded-md border border-border-subtle bg-surface px-4 py-3 text-sm text-muted-foreground"
                role="alert"
              >
                <AlertCircle className="h-4 w-4" />
                {t("crack_it.verify_error")}
              </div>
            )}

            {phase === "domain" && (
              <form onSubmit={handleDomainSubmit} noValidate>
                <label
                  htmlFor="ci-domain"
                  className="mb-2 block text-left text-sm text-muted-foreground"
                >
                  {t("crack_it.domain_label")}
                </label>
                <div className="flex gap-3">
                  <input
                    id="ci-domain"
                    ref={domainInputRef}
                    type="text"
                    inputMode="url"
                    autoComplete="url"
                    placeholder={t("crack_it.domain_placeholder")}
                    value={form.domain}
                    onChange={(e) => setField("domain", e.target.value)}
                    className={`${CI_FIELD} min-w-0 flex-1 ${errors.domain ? "!border-destructive" : ""}`}
                    autoFocus
                  />
                  <button type="submit" className={`${CI_PRIMARY} shrink-0`}>
                    {t("crack_it.go")}
                  </button>
                </div>
                {errors.domain && (
                  <p className="mt-2 text-left text-sm text-destructive" role="alert">
                    {errors.domain}
                  </p>
                )}
              </form>
            )}

            {phase !== "domain" && (
              <form onSubmit={handleDetailsSubmit} noValidate>
                <div className="space-y-4 rounded-md border border-border-subtle bg-background p-6">
                  {/* Domain (locked) */}
                  <div>
                    <label
                      htmlFor="ci-domain-ro"
                      className="mb-2 block text-sm text-muted-foreground"
                    >
                      {t("crack_it.domain_label")}
                    </label>
                    <input
                      id="ci-domain-ro"
                      type="text"
                      value={form.domain}
                      readOnly
                      className={`${CI_FIELD} w-full opacity-60`}
                    />
                  </div>

                  {/* Brand name */}
                  <div>
                    <label htmlFor="ci-brand" className="mb-2 block text-sm text-muted-foreground">
                      {t("crack_it.brand_label")}
                    </label>
                    <input
                      id="ci-brand"
                      type="text"
                      placeholder={t("crack_it.brand_placeholder")}
                      value={form.brand_name}
                      onChange={(e) => setField("brand_name", e.target.value)}
                      className={`${CI_FIELD} w-full ${errors.brand_name ? "!border-destructive" : ""}`}
                      autoFocus
                    />
                    {errors.brand_name && (
                      <p className="mt-2 text-sm text-destructive" role="alert">
                        {errors.brand_name}
                      </p>
                    )}
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="ci-desc" className="mb-2 block text-sm text-muted-foreground">
                      {t("crack_it.desc_label")}
                    </label>
                    <input
                      id="ci-desc"
                      type="text"
                      maxLength={280}
                      placeholder={t("crack_it.desc_placeholder")}
                      value={form.description}
                      onChange={(e) => setField("description", e.target.value)}
                      className={`${CI_FIELD} w-full ${errors.description ? "!border-destructive" : ""}`}
                    />
                    {errors.description && (
                      <p className="mt-2 text-sm text-destructive" role="alert">
                        {errors.description}
                      </p>
                    )}
                  </div>

                  {/* Category */}
                  <div>
                    <label htmlFor="ci-cat" className="mb-2 block text-sm text-muted-foreground">
                      {t("crack_it.cat_label")}
                    </label>
                    <select
                      id="ci-cat"
                      value={form.category}
                      onChange={(e) => setField("category", e.target.value)}
                      className={`${CI_FIELD} w-full`}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c.slug} value={c.slug}>
                          {t(c.key)}
                        </option>
                      ))}
                    </select>
                    {errors.category && (
                      <p className="mt-2 text-sm text-destructive" role="alert">
                        {errors.category}
                      </p>
                    )}
                  </div>

                  {/* Logo URL */}
                  <div>
                    <label htmlFor="ci-logo" className="mb-2 block text-sm text-muted-foreground">
                      {t("crack_it.logo_label")}
                    </label>
                    <input
                      id="ci-logo"
                      type="url"
                      inputMode="url"
                      autoComplete="url"
                      placeholder={t("crack_it.logo_placeholder")}
                      value={form.logo_url}
                      onChange={(e) => setField("logo_url", e.target.value)}
                      className={`${CI_FIELD} w-full`}
                    />
                  </div>

                  {/* Amount + position preview */}
                  <div>
                    <label htmlFor="ci-amount" className="mb-2 block text-sm text-muted-foreground">
                      {t("crack_it.amount_label")}
                    </label>
                    <div className="relative">
                      <input
                        id="ci-amount"
                        type="text"
                        inputMode="numeric"
                        placeholder={t("crack_it.amount_placeholder")}
                        value={form.amount_uzs}
                        onChange={(e) =>
                          setField("amount_uzs", e.target.value.replace(/[^0-9]/g, ""))
                        }
                        className={`${CI_FIELD} w-full !pr-16 ${errors.amount_uzs ? "!border-destructive" : ""}`}
                      />
                      <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs text-muted-foreground">
                        UZS
                      </span>
                    </div>
                    {errors.amount_uzs && (
                      <p className="mt-2 text-sm text-destructive" role="alert">
                        {errors.amount_uzs}
                      </p>
                    )}
                    {prospectivePosition && !errors.amount_uzs && (
                      <p className="mt-2 font-mono text-sm text-accent">
                        {t("crack_it.position_preview", { pos: prospectivePosition })}
                      </p>
                    )}
                  </div>

                  {/* Server error */}
                  {serverError && (
                    <p className="text-sm text-destructive" role="alert">
                      {serverError}
                    </p>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setPhase("domain");
                        setForm(EMPTY_FORM);
                        setErrors({});
                        setServerError("");
                      }}
                      className={CI_GHOST}
                    >
                      {t("crack_it.back")}
                    </button>
                    <button
                      type="submit"
                      disabled={phase === "submitting"}
                      className={`${CI_PRIMARY} flex-1 disabled:opacity-50`}
                    >
                      {phase === "submitting" ? (
                        <>
                          <Loader2 className="h-4 w-4" />
                          {t("crack_it.processing")}
                        </>
                      ) : (
                        t("crack_it.pay")
                      )}
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6">
        {/* ── Discovery toolbar ─────────────────────────────────────────────── */}
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              placeholder={t("crack_it.search_placeholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("crack_it.search_placeholder")}
              className={CI_SEARCH}
            />
          </div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label={t("crack_it.filter_all_categories")}
            className={`${CI_SELECT} w-full sm:w-60`}
          >
            <option value="all">{t("crack_it.filter_all_categories")}</option>
            {CATEGORIES.map((c) => (
              <option key={c.slug} value={c.slug}>
                {t(c.key)}
              </option>
            ))}
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            aria-label={t("crack_it.sort_top_stake")}
            className={`${CI_SELECT} w-full sm:w-48`}
          >
            <option value="stake">{t("crack_it.sort_top_stake")}</option>
            <option value="clicks">{t("crack_it.sort_most_clicks")}</option>
          </select>
        </div>

        {/* ── Category tabs ─────────────────────────────────────────────────── */}
        <div
          className="mt-3 flex flex-wrap gap-2"
          role="tablist"
          aria-label={t("crack_it.leaderboard_label")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={category === "all"}
            onClick={() => setCategory("all")}
            className={category === "all" ? CI_TAB_ACTIVE : CI_TAB_INACTIVE}
          >
            {t("crack_it.cat_all")}
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.slug}
              type="button"
              role="tab"
              aria-selected={category === c.slug}
              onClick={() => setCategory(c.slug)}
              className={category === c.slug ? CI_TAB_ACTIVE : CI_TAB_INACTIVE}
            >
              {t(c.key)}
            </button>
          ))}
        </div>

        {/* ── Leaderboard ───────────────────────────────────────────────────── */}
        <section className="mt-10" aria-label={t("crack_it.leaderboard_label")}>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="font-mono text-2xl tracking-tight text-foreground">
              {t("crack_it.leaderboard_title")}
            </h2>
            <p className="text-sm text-muted-foreground">{t("crack_it.lb_subtitle")}</p>
          </div>

          {loading && (
            <div className="mt-10 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && entries.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">{t("crack_it.empty")}</p>
          )}
          {!loading && entries.length > 0 && filtered.length === 0 && (
            <p className="mt-6 text-sm text-muted-foreground">{t("common.no_results")}</p>
          )}

          {!loading && filtered.length > 0 && (
            <>
              <div className="mt-6 space-y-3">
                {filtered.slice(0, 3).map((entry, i) => (
                  <div
                    key={entry.id}
                    style={{ animation: `fade-in-up 300ms ease-out ${i * 40}ms both` }}
                  >
                    <LeaderboardRow
                      entry={entry}
                      delta={rankDeltas[entry.id]}
                      metaLine={metaLine(entry, false)}
                      aboveAmount={
                        entries.find((e) => e.position === (entry.position ?? 0) - 1)?.amount_uzs ??
                        null
                      }
                      stakeOpen={stakeOpenId === entry.id}
                      onToggleStake={() =>
                        setStakeOpenId((id) => (id === entry.id ? null : entry.id))
                      }
                      onSubmitStake={handleSubmitStake}
                      data={data!}
                      t={t}
                    />
                  </div>
                ))}
              </div>

              {/* TOP 3 separator */}
              {filtered.length > 3 && (
                <div className="my-6 flex items-center gap-4" aria-hidden>
                  <div className="h-px flex-1 bg-border-subtle" />
                  <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                    {t("crack_it.separator_top3")}
                  </span>
                  <div className="h-px flex-1 bg-border-subtle" />
                </div>
              )}

              {/* Ranks #4+ */}
              {filtered.length > 3 && (
                <ol className="space-y-3">
                  {filtered.slice(3).map((entry, i) => (
                    <li
                      key={entry.id}
                      style={{ animation: `fade-in-up 300ms ease-out ${(i + 3) * 40}ms both` }}
                    >
                      <LeaderboardRow
                        entry={entry}
                        delta={rankDeltas[entry.id]}
                        metaLine={metaLine(entry)}
                        aboveAmount={
                          entries.find((e) => e.position === (entry.position ?? 0) - 1)
                            ?.amount_uzs ?? null
                        }
                        stakeOpen={stakeOpenId === entry.id}
                        onToggleStake={() =>
                          setStakeOpenId((id) => (id === entry.id ? null : entry.id))
                        }
                        onSubmitStake={handleSubmitStake}
                        data={data!}
                        t={t}
                      />
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}
        </section>

        {/* ── Total collected — Stat pattern ────────────────────────────────── */}
        {!loading && totalPool !== undefined && data!.count > 0 && (
          <div className="mt-12 border-t border-border-subtle pt-6">
            <div className="flex items-end justify-between gap-6">
              <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {t("crack_it.total_earned")}
              </div>
              <div className="text-right">
                <div className="font-mono text-2xl tracking-tight text-foreground">
                  {formatUZSParts(totalAnimated).value}{" "}
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatUZSParts(totalAnimated).unit}
                  </span>
                </div>
                <div className="mt-0.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  UZS · {data!.count}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <MarketingFooter />
    </div>
  );
}

/* ── Landing-matched control classes (single source: index.tsx pills) ─────── */
/* Primary pill  = landing "Boshqaruv paneliga o'tish"                         */
/* Ghost pill    = landing "Loyihalarni ko'rish"                               */
/* Field         = base tokens, 4px radius                                     */

const CI_PRIMARY =
  "group inline-flex h-11 items-center justify-center gap-2 rounded-pill bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)] transition-all hover:-translate-y-px hover:shadow-[0_0_20px_color-mix(in_oklab,var(--accent-lime)_30%,transparent)] active:translate-y-0 active:scale-[0.98]";
const CI_GHOST =
  "inline-flex h-11 items-center justify-center gap-2 rounded-pill border border-border bg-background px-5 text-sm font-medium text-foreground transition-all hover:bg-secondary active:scale-[0.98]";
const CI_INPUT_BASE =
  "h-11 rounded-md border border-border-subtle bg-background text-sm text-foreground transition-colors focus:border-accent focus:outline-none";
const CI_FIELD = `${CI_INPUT_BASE} w-full px-3 placeholder:text-muted-foreground`;
const CI_SEARCH = `${CI_INPUT_BASE} w-full pl-9 pr-3 placeholder:text-muted-foreground`;
/* Selects get fixed desktop widths — long option labels otherwise blow up the row */
const CI_SELECT = `${CI_INPUT_BASE} shrink-0 px-3 pr-8`;
const CI_TAB_ACTIVE =
  "inline-flex h-9 items-center whitespace-nowrap rounded-pill border border-transparent bg-accent px-4 text-sm font-medium text-[color:var(--accent-lime-ink)] transition-colors";
const CI_TAB_INACTIVE =
  "inline-flex h-9 items-center whitespace-nowrap rounded-pill border border-border bg-background px-4 text-sm text-muted-foreground transition-colors hover:border-border hover:text-foreground";

/* ── ONE leaderboard row grid for every position, no exceptions ───────────── */
/* 48px rank | 48px logo | 1fr identity | auto price | auto CTA               */
/* The whole row is a single clickable <a> opening the brand domain in a new  */
/* tab; every interactive control inside stops propagation so navigation and  */
/* the click-counter only fire for genuine outbound visits.                   */

type TFunc = (key: string, opts?: Record<string, unknown>) => string;

const STAKE_STEP = 10_000;

function LeaderboardRow({
  entry,
  delta,
  metaLine,
  aboveAmount,
  stakeOpen,
  onToggleStake,
  onSubmitStake,
  data,
  t,
}: {
  entry: LeaderboardEntry;
  delta?: number;
  metaLine: string;
  aboveAmount: string | null;
  stakeOpen: boolean;
  onToggleStake: () => void;
  onSubmitStake: (entry: LeaderboardEntry, total: number) => void;
  data: LeaderboardData;
  t: TFunc;
}) {
  const [added, setAdded] = useState(0);
  const price = useCountUp(parseFloat(entry.amount_uzs));
  const animatedAdded = useCountUp(added, 180);
  const rank = entry.position ?? 0;
  const initials = entry.domain.split(".")[0]?.slice(0, 2).toUpperCase() ?? "?";

  const entryAmount = parseFloat(entry.amount_uzs) || 0;
  const total = entryAmount + added;
  const newRank = prospectivePositionOf(data, String(total)) ?? rank;
  const above = aboveAmount !== null ? parseFloat(aboveAmount) : null;
  const isTopThree = rank <= 3;
  // Whole steps (rounded up) needed to overtake the row above
  const deltaNeeded =
    above !== null
      ? Math.max(STAKE_STEP, Math.ceil((above - entryAmount) / STAKE_STEP) * STAKE_STEP)
      : null;

  const stop = (e: React.SyntheticEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const wrapped = rank <= 3;
  const anchorCls = wrapped
    ? "group grid min-h-[88px] w-full grid-cols-[48px_48px_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-md bg-background px-6 py-5 transition-colors duration-150 hover:bg-surface"
    : "group grid min-h-[88px] w-full grid-cols-[48px_48px_minmax(0,1fr)_auto_auto] items-center gap-4 rounded-md border border-border-subtle bg-background px-6 py-5 transition-all duration-150 hover:-translate-y-px hover:border-border hover:bg-surface hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]";

  const row = (
    <a
      href={`https://${entry.domain}`}
      target="_blank"
      rel="noopener noreferrer"
      className={anchorCls}
    >
      {/* Col 1 — rank (mono number, accent on hover — step-number treatment) */}
      <div className="flex flex-col items-start gap-1">
        <span className="font-mono text-2xl leading-none tracking-tight text-muted-foreground transition-colors group-hover:text-accent">
          #{rank}
        </span>
        {delta != null && delta !== 0 && (
          <span
            className={`text-[10px] ${delta > 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}
          >
            {delta > 0 ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Col 2 — logo */}
      {entry.logo_url ? (
        <img
          src={entry.logo_url}
          alt=""
          width={40}
          height={40}
          loading="lazy"
          className="h-10 w-10 shrink-0 rounded-sm border border-border-subtle bg-surface object-contain"
        />
      ) : (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-border-subtle bg-surface font-mono text-[10px] text-muted-foreground"
          aria-hidden
        >
          {initials}
        </div>
      )}

      {/* Col 3 — identity */}
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span className="truncate text-base font-semibold text-foreground">
            {entry.brand_name}
          </span>
          <ExternalLink className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
          <span className="hidden truncate font-mono text-xs text-muted-foreground lg:inline">
            {entry.domain}
          </span>
        </div>
        {entry.description && (
          <p className="mt-0.5 truncate text-sm text-muted-foreground">{entry.description}</p>
        )}
        <p className="mt-1 truncate text-xs tabular-nums text-muted-foreground" title={metaLine}>
          {metaLine}
        </p>
      </div>

      {/* Col 4 — price */}
      <span
        className={`whitespace-nowrap font-mono ${isTopThree ? "text-accent" : "text-foreground"}`}
      >
        <span className="text-lg font-semibold tracking-tight tabular-nums">
          {formatUZSParts(price).value}
        </span>
        {formatUZSParts(price).unit && (
          <span className="ml-1 text-xs font-medium text-muted-foreground">
            {formatUZSParts(price).unit}
          </span>
        )}
      </span>

      {/* Col 5 — CTA (must never trigger the row's navigation) */}
      <button
        type="button"
        onClick={(e) => {
          stop(e);
          onToggleStake();
        }}
        className={`${CI_GHOST} !h-9 !px-4 !text-xs`}
      >
        {t("crack_it.outbid")}
      </button>

      {/* Inline stake widget — spans all columns when open */}
      {stakeOpen && (
        <div
          className="col-span-full mt-2 flex flex-wrap items-center gap-4 border-t border-border-subtle pt-4"
          onClick={stop}
        >
          <div className="flex min-w-[200px] flex-col gap-1 text-sm">
            <span className="text-muted-foreground">
              {t("crack_it.stake_current")}:{" "}
              <span className="font-mono font-semibold text-foreground">
                {formatUZSCompact(entryAmount)}
              </span>
            </span>
            {deltaNeeded !== null ? (
              <span className="text-xs text-muted-foreground">
                {t("crack_it.stake_add", {
                  amount: formatCount(deltaNeeded, i18n.language),
                  pos: Math.max(rank - 1, 1),
                })}
              </span>
            ) : (
              <span className="text-xs text-muted-foreground">{t("crack_it.stake_top_hint")}</span>
            )}
            <span className="font-mono text-sm font-semibold text-accent">
              {t("crack_it.stake_new_rank", { pos: newRank })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              aria-label="-"
              disabled={added <= 0}
              onClick={(e) => {
                stop(e);
                setAdded((a) => Math.max(0, a - STAKE_STEP));
              }}
              className={`${CI_GHOST} !h-10 !w-10 !p-0 disabled:opacity-40 disabled:pointer-events-none`}
            >
              −
            </button>
            <span className="min-w-[128px] text-center font-mono text-lg font-bold tabular-nums text-foreground">
              {formatCount(animatedAdded, i18n.language)}
            </span>
            <button
              type="button"
              aria-label="+"
              onClick={(e) => {
                stop(e);
                setAdded((a) => a + STAKE_STEP);
              }}
              className={`${CI_GHOST} !h-10 !w-10 !p-0`}
            >
              +
            </button>
          </div>

          <button
            type="button"
            onClick={(e) => {
              stop(e);
              onSubmitStake(entry, total);
            }}
            className={`${CI_PRIMARY} !h-10`}
          >
            {t("crack_it.outbid")}
          </button>
        </div>
      )}
    </a>
  );

  // Top 3 — BorderGlow wrapper: lime pointer-tracking edge glow + intro sweep on #1
  if (wrapped) {
    return (
      <BorderGlow
        className="w-full transition-all duration-150 hover:-translate-y-px hover:shadow-[0_4px_20px_rgba(0,0,0,0.35)]"
        edgeSensitivity={45}
        glowColor="95 85 72"
        backgroundColor="var(--surface)"
        borderRadius={4}
        glowRadius={24}
        glowIntensity={0.9}
        colors={["#d9f99d", "#a3e635", "#65a30d"]}
        fillOpacity={0.15}
        animated={rank === 1}
      >
        {row}
      </BorderGlow>
    );
  }

  return row;
}
