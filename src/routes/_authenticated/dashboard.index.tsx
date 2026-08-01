import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Package,
  ShoppingCart,
  Banknote,
  Wallet,
  TrendingUp,
  Eye,
  Download,
  Calendar,
  Plus,
  ArrowRight,
  Zap,
} from "lucide-react";
import { dashboardApi, dashboardKeys } from "@/lib/api/endpoints/dashboard";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { EarningsChart } from "@/components/data-state/EarningsChart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUZS, formatRelative } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: i18n.t("dashboard.title") },
      { name: "description", content: i18n.t("dashboard.meta_desc") },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { t } = useTranslation();
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const summary = useQuery({ queryKey: dashboardKeys.summary(), queryFn: () => dashboardApi.summary() });
  const earnings = useQuery({ queryKey: dashboardKeys.earnings(range), queryFn: () => dashboardApi.earnings(range) });
  const listings = useQuery({ queryKey: dashboardKeys.listings(), queryFn: () => dashboardApi.myListings() });
  const sales = useQuery({ queryKey: dashboardKeys.sales(), queryFn: () => dashboardApi.recentSales(10) });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("dashboard.section")}</div>
            <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">{t("dashboard.overview")}</h1>
          </div>
        <Link
          to="/dashboard/listings/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-accent px-3.5 text-sm font-semibold text-[color:var(--accent-lime-ink)] transition-colors hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" /> {t("listings.new_btn")}
        </Link>
      </div>

      {/* Stat cards */}
      <QueryBoundary
        query={summary}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
          </div>
        }
      >
        {(s) => (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Package} label={t("dashboard.published")} value={String(s.totalPublishedListings)} hint={t("dashboard.listings_live")} />
            <Stat icon={ShoppingCart} label={t("dashboard.total_sales")} value={String(s.totalSales)} hint={t("dashboard.all_time")} />
            <Stat icon={TrendingUp} label={t("dashboard.revenue")} value={formatUZS(s.lifetimeRevenue)} hint={t("dashboard.lifetime_earnings")} />
            <Stat icon={Wallet} label={t("dashboard.available")} value={formatUZS(s.availableBalance)} hint={t("dashboard.ready_to_withdraw")} accent />
          </div>
        )}
      </QueryBoundary>

      {/* Secondary stats */}
      <QueryBoundary query={summary} loading={<Skeleton className="h-16 w-full" />}>
        {(s) => (
          <div className="grid gap-3 sm:grid-cols-3">
            <MiniStat icon={Eye} label={t("dashboard.views")} value={String(s.totalDownloads ?? 0)} />
            <MiniStat icon={Calendar} label={t("dashboard.next_unlock")} value={s.nextUnlockDate ? formatRelative(s.nextUnlockDate) : t("common.dash")} />
            <MiniStat icon={Download} label={t("dashboard.downloads")} value={String(s.totalDownloads ?? 0)} />
          </div>
        )}
      </QueryBoundary>

      {/* Earnings chart */}
      <section className="rounded-md border border-border-subtle bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 font-mono text-xs uppercase tracking-wider text-muted-foreground">
              <TrendingUp className="h-3 w-3" />
              {t("dashboard.earnings")}
            </div>
            <div className="mt-1 font-mono text-sm text-foreground">{t("dashboard.revenue_over_time")}</div>
          </div>
          <div className="flex gap-0.5 rounded-sm border border-border-subtle p-0.5">
            {(["7d", "30d", "90d", "all"] as const).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-sm px-2 py-0.5 font-mono text-xs transition-colors ${
                  range === r ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <QueryBoundary query={earnings} loading={<Skeleton className="h-64 w-full" />}>
          {(pts) => (
            <EarningsChart data={pts.map((p) => ({ date: p.date, amount: parseFloat(p.earnings) }))} />
          )}
        </QueryBoundary>
      </section>

      {/* Listings + Sales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="overflow-hidden rounded-md border border-border-subtle bg-background">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-sm text-foreground">
              <Package className="h-3.5 w-3.5 text-muted-foreground" />
              {t("dashboard.your_listings")}
            </div>
            <Link to="/dashboard/listings" className="flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-foreground">
              {t("common.view_all")} <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <QueryBoundary
            query={listings}
            loading={<div className="p-5"><Skeleton className="h-24 w-full" /></div>}
            isEmpty={(d) => d.length === 0}
            empty={<div className="p-6"><EmptyState title={t("dashboard.no_listings")} description={t("dashboard.no_listings_desc")} /></div>}
          >
            {(items) => (
              <div className="divide-y divide-border-subtle">
                {items.slice(0, 5).map((l) => (
                  <div key={l.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{l.title}</div>
                      <div className="mt-0.5 flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
                        <span>/{l.slug}</span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase ${
                          l.status === "published" ? "bg-emerald-500/10 text-emerald-500" :
                          l.status === "pending_review" ? "bg-amber-500/10 text-amber-500" :
                          "bg-secondary text-muted-foreground"
                        }`}>
                          {l.status}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4 font-mono text-sm text-foreground">{formatUZS(l.price)}</div>
                  </div>
                ))}
              </div>
            )}
          </QueryBoundary>
        </section>

        <section className="overflow-hidden rounded-md border border-border-subtle bg-background">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <div className="flex items-center gap-2 font-mono text-sm text-foreground">
              <ShoppingCart className="h-3.5 w-3.5 text-muted-foreground" />
              {t("dashboard.recent_sales")}
            </div>
          </div>
          <QueryBoundary
            query={sales}
            loading={<div className="p-5"><Skeleton className="h-24 w-full" /></div>}
            isEmpty={(d) => d.length === 0}
            empty={<div className="p-6"><EmptyState title={t("dashboard.no_sales")} description={t("dashboard.no_sales_desc")} /></div>}
          >
            {(items) => (
              <div className="divide-y divide-border-subtle">
                {items.map((s) => (
                  <div key={s.id} className="flex items-center justify-between px-5 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-foreground">{s.projectTitle}</div>
                      <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">
                        @{s.buyerUsername} · {formatRelative(s.createdAt)}
                      </div>
                    </div>
                    <div className="ml-4 flex items-center gap-1.5">
                      <Zap className="h-3 w-3 text-muted-foreground" />
                      <span className="font-mono text-sm text-foreground">{formatUZS(s.priceAtPurchase)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </QueryBoundary>
        </section>
      </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value, hint, accent }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; hint?: string; accent?: boolean }) {
  return (
    <div className={`rounded-md border p-4 ${accent ? "border-accent/30 bg-accent/[0.03]" : "border-border-subtle bg-background"}`}>
      <div className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-2 font-mono text-2xl tracking-tight text-foreground">{value}</div>
      {hint && <div className="mt-1 font-mono text-[10px] text-muted-foreground">{hint}</div>}
    </div>
  );
}

function MiniStat({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 rounded-md border border-border-subtle bg-background px-4 py-2.5">
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <div className="truncate font-mono text-[10px] text-muted-foreground">{label}</div>
        <div className="truncate font-mono text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}
