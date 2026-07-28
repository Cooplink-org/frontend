import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { dashboardApi, dashboardKeys } from "@/lib/api/endpoints/dashboard";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/listings")({
  head: () => ({
    meta: [
      { title: "My listings — Cooplink" },
      { name: "description", content: "Manage your Cooplink listings." },
      { property: "og:title", content: "My listings — Cooplink" },
      { property: "og:description", content: "Manage your Cooplink listings." },
    ],
  }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const listings = useQuery({
    queryKey: dashboardKeys.listings(),
    queryFn: () => dashboardApi.myListings(),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            my listings
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Your projects</h1>
        </div>
        <Link
          to="/dashboard/listings/new"
          className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground"
        >
          New listing
        </Link>
      </div>

      <div className="mt-6 overflow-hidden rounded-md border border-border-subtle bg-background">
        <QueryBoundary
          query={listings}
          loading={<div className="p-5"><Skeleton className="h-40 w-full" /></div>}
          isEmpty={(d) => d.length === 0}
          empty={
            <div className="p-8">
              <EmptyState
                title="No listings yet"
                description="Connect a GitHub repo to create your first listing."
                action={
                  <Link
                    to="/dashboard/listings/new"
                    className="inline-flex h-8 items-center rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground"
                  >
                    Create listing
                  </Link>
                }
              />
            </div>
          }
        >
          {(items) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2 font-normal">title</th>
                    <th className="px-5 py-2 font-normal">repo</th>
                    <th className="px-5 py-2 font-normal">status</th>
                    <th className="px-5 py-2 text-right font-normal">price</th>
                    <th className="px-5 py-2 text-right font-normal">rating</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((l) => (
                    <tr key={l.id} className="border-b border-border-subtle last:border-0 hover:bg-secondary">
                      <td className="px-5 py-3 text-foreground">{l.title}</td>
                      <td className="px-5 py-3 text-muted-foreground">{l.repoName}</td>
                      <td className="px-5 py-3">
                        <StatusBadge status={l.status} />
                      </td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatMoney(l.priceCents, l.currency)}
                      </td>
                      <td className="px-5 py-3 text-right text-muted-foreground">
                        {l.ratingAverage?.toFixed(1) ?? "—"} ({l.ratingCount})
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    published: "text-foreground border-accent/50 bg-accent/10",
    draft: "text-muted-foreground border-border-subtle bg-surface",
    pending_review: "text-foreground border-warn/50 bg-warn/10",
    rejected: "text-destructive border-destructive/50 bg-destructive/10",
    removed: "text-muted-foreground border-border-subtle bg-surface line-through",
  };
  return (
    <span className={`rounded-sm border px-1.5 py-0.5 font-mono text-[10px] ${map[status] ?? ""}`}>
      {status}
    </span>
  );
}
