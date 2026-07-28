import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { dashboardApi, dashboardKeys } from "@/lib/api/endpoints/dashboard";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { EarningsChart } from "@/components/data-state/EarningsChart";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Dashboard — Cooplink" },
      { name: "description", content: "Your seller dashboard on Cooplink." },
      { property: "og:title", content: "Dashboard — Cooplink" },
      { property: "og:description", content: "Your seller dashboard on Cooplink." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const [range, setRange] = useState<"7d" | "30d" | "90d" | "all">("30d");
  const summary = useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.summary(),
  });
  const earnings = useQuery({
    queryKey: dashboardKeys.earnings(range),
    queryFn: () => dashboardApi.earnings(range),
  });
  const listings = useQuery({
    queryKey: dashboardKeys.listings(),
    queryFn: () => dashboardApi.myListings(),
  });
  const sales = useQuery({
    queryKey: dashboardKeys.sales(),
    queryFn: () => dashboardApi.recentSales(10),
  });

  return (
    <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            dashboard
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Overview</h1>
        </div>
        <Link
          to="/dashboard/listings/new"
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          New listing <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      {/* Stats */}
      <QueryBoundary
        query={summary}
        loading={
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        }
      >
        {(s) => (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Stat label="active_listings" value={String(s.activeListings)} />
            <Stat label="total_sales" value={String(s.totalSalesCount)} />
            <Stat label="total_revenue" value={formatMoney(s.totalRevenueCents, s.currency)} />
            <Stat label="payout_balance" value={formatMoney(s.payoutBalanceCents, s.currency)} accent />
          </div>
        )}
      </QueryBoundary>

      {/* Chart */}
      <section className="rounded-md border border-border-subtle bg-background p-5">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              earnings
            </div>
            <div className="mt-1 font-mono text-sm text-foreground">Revenue over time</div>
          </div>
          <div className="flex gap-1 rounded-sm border border-border-subtle p-0.5">
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
          {(pts) => <EarningsChart data={pts} />}
        </QueryBoundary>
      </section>

      {/* Two-col: listings + recent sales */}
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-md border border-border-subtle bg-background">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <div className="font-mono text-sm text-foreground">Your listings</div>
            <Link
              to="/dashboard/listings"
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              view all →
            </Link>
          </div>
          <QueryBoundary
            query={listings}
            loading={<div className="p-5"><Skeleton className="h-24 w-full" /></div>}
            isEmpty={(d) => d.length === 0}
            empty={
              <div className="p-5">
                <EmptyState
                  title="No listings yet"
                  description="Create your first listing to start selling."
                />
              </div>
            }
          >
            {(items) => (
              <table className="w-full font-mono text-xs">
                <tbody>
                  {items.slice(0, 5).map((l) => (
                    <tr key={l.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-5 py-3">
                        <div className="text-foreground">{l.title}</div>
                        <div className="text-muted-foreground">{l.repoName}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatMoney(l.priceCents, l.currency)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">{l.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </QueryBoundary>
        </section>

        <section className="rounded-md border border-border-subtle bg-background">
          <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
            <div className="font-mono text-sm text-foreground">Recent sales</div>
          </div>
          <QueryBoundary
            query={sales}
            loading={<div className="p-5"><Skeleton className="h-24 w-full" /></div>}
            isEmpty={(d) => d.length === 0}
            empty={
              <div className="p-5">
                <EmptyState title="No sales yet" description="Sales will appear here as they close." />
              </div>
            }
          >
            {(items) => (
              <table className="w-full font-mono text-xs">
                <tbody>
                  {items.map((s) => (
                    <tr key={s.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-5 py-3">
                        <div className="text-foreground">{s.projectTitle}</div>
                        <div className="text-muted-foreground">{s.buyerUsername}</div>
                      </td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatMoney(s.amountCents, s.currency)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {formatRelative(s.createdAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </QueryBoundary>
        </section>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-md border p-4 ${
        accent ? "border-accent/40 bg-accent/5" : "border-border-subtle bg-background"
      }`}
    >
      <div className="font-mono text-xs text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-2xl tracking-tight text-foreground">{value}</div>
    </div>
  );
}
