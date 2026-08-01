import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Plus, Package, Eye, Download, Pencil, ExternalLink } from "lucide-react";
import { dashboardApi, dashboardKeys } from "@/lib/api/endpoints/dashboard";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUZS } from "@/lib/format";
import type { DashboardListing } from "@/lib/api/types";

export const Route = createFileRoute("/_authenticated/dashboard/listings/")({
  head: () => ({
    meta: [
      { title: "My listings — Cooplink" },
      { name: "description", content: "Manage your Cooplink listings." },
    ],
  }),
  component: MyListingsPage,
});

function MyListingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: listings, isLoading, error } = useQuery({
    queryKey: dashboardKeys.listings(),
    queryFn: () => dashboardApi.myListings(),
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("listings.section")}
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">
            {t("listings.heading")}
          </h1>
        </div>
        <button
          onClick={() => navigate({ to: "/dashboard/add-project" })}
          className="inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          <Plus className="h-3.5 w-3.5" />
          {t("listings.new_btn")}
        </button>
      </div>

      {isLoading && (
        <div className="mt-6 space-y-3">
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
          <Skeleton className="h-16 w-full rounded-md" />
        </div>
      )}

      {error && (
        <div className="mt-6 rounded-md border border-destructive/30 bg-destructive/5 p-4 font-mono text-sm text-destructive">
          {t("listings.error")}
        </div>
      )}

      {!isLoading && !error && listings && listings.length === 0 && (
        <div className="mt-6 flex flex-col items-center justify-center rounded-md border border-border-subtle bg-background py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
            <Package className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="mt-4 font-mono text-sm font-semibold text-foreground">
            {t("listings.empty_title")}
          </h3>
          <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
            {t("listings.empty_desc")}
          </p>
          <button
            onClick={() => navigate({ to: "/dashboard/add-project" })}
            className="mt-5 inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("listings.create_btn")}
          </button>
        </div>
      )}

      {!isLoading && !error && listings && listings.length > 0 && (
        <div className="mt-6 overflow-hidden rounded-md border border-border-subtle bg-background">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-5 py-3 font-normal">{t("listings.table.title")}</th>
                  <th className="px-5 py-3 font-normal">{t("listings.table.slug")}</th>
                  <th className="px-5 py-3 font-normal">{t("listings.table.status")}</th>
                  <th className="px-5 py-3 text-right font-normal">{t("listings.table.price")}</th>
                  <th className="px-5 py-3 text-center font-normal">{t("listings.table.views")}</th>
                  <th className="px-5 py-3 text-center font-normal">{t("listings.table.downloads")}</th>
                  <th className="px-5 py-3 text-right font-normal">{t("listings.table.sales")}</th>
                  <th className="px-5 py-3 text-right font-normal">{t("listings.table.revenue")}</th>
                  <th className="px-5 py-3 text-center font-normal">{t("listings.table.actions")}</th>
                </tr>
              </thead>
              <tbody>
                {listings.map((listing) => (
                  <ListingRow key={listing.id} listing={listing} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function ListingRow({ listing }: { listing: DashboardListing }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <tr className="border-b border-border-subtle last:border-0 transition-colors hover:bg-secondary/50">
      <td className="px-5 py-3">
        <Link
          to="/projects/$id"
          params={{ id: listing.slug }}
          className="font-medium text-foreground underline-offset-2 hover:underline"
        >
          {listing.title}
        </Link>
      </td>
      <td className="px-5 py-3 text-muted-foreground">/{listing.slug}</td>
      <td className="px-5 py-3">
        <StatusBadge status={listing.status} />
      </td>
      <td className="px-5 py-3 text-right text-foreground">
        {formatUZS(listing.price)}
      </td>
      <td className="px-5 py-3 text-center">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Eye className="h-3 w-3" />
          {listing.viewCount}
        </span>
      </td>
      <td className="px-5 py-3 text-center">
        <span className="inline-flex items-center gap-1 text-muted-foreground">
          <Download className="h-3 w-3" />
          {listing.downloadCount}
        </span>
      </td>
      <td className="px-5 py-3 text-right text-foreground">{listing.salesCount}</td>
      <td className="px-5 py-3 text-right text-foreground">{formatUZS(listing.revenue)}</td>
      <td className="px-5 py-3 text-center">
        <div className="inline-flex items-center gap-1">
          <button
            onClick={() => navigate({ to: "/projects/$id", params: { id: listing.slug } })}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={t("listings.view")}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => navigate({ to: "/dashboard/listings/$id/edit", params: { id: String(listing.id) } })}
            className="inline-flex h-7 w-7 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground"
            title={t("listings.edit")}
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>
      </td>
    </tr>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { dot: string; cls: string }> = {
    published: { dot: "bg-emerald-500", cls: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600" },
    draft: { dot: "bg-muted-foreground", cls: "border-border-subtle bg-secondary text-muted-foreground" },
    pending_review: { dot: "bg-amber-500", cls: "border-amber-500/30 bg-amber-500/10 text-amber-600" },
    rejected: { dot: "bg-red-500", cls: "border-red-500/30 bg-red-500/10 text-red-600" },
    suspended: { dot: "bg-red-500", cls: "border-red-500/30 bg-red-500/10 text-red-600" },
    removed: { dot: "bg-muted-foreground", cls: "border-border-subtle bg-secondary text-muted-foreground line-through" },
  };
  const c = config[status] ?? config.draft;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium ${c.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
      {status.replace(/_/g, " ")}
    </span>
  );
}
