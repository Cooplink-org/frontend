import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Search, SlidersHorizontal, Tag, Star, Eye } from "lucide-react";
import { listingsApi, listingKeys } from "@/lib/api/endpoints/listings";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUZS } from "@/lib/format";
import type { BrowseFilters, Listing } from "@/lib/api/types";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({
    meta: [
      { title: i18n.t("browse.title") },
      { name: "description", content: i18n.t("browse.meta_desc") },
      { property: "og:title", content: i18n.t("browse.title") },
      { property: "og:description", content: i18n.t("browse.meta_desc") },
    ],
  }),
  component: BrowsePage,
});

function BrowsePage() {
  const { t } = useTranslation();
  const SORT_OPTIONS = [
    { value: "-created_at", label: t("browse.sort.recent") },
    { value: "-view_count", label: t("browse.sort.popular") },
    { value: "price", label: t("browse.sort.price_asc") },
    { value: "-price", label: t("browse.sort.price_desc") },
  ];
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("-created_at");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const filters: BrowseFilters = useMemo(
    () => ({
      q: q || undefined,
      ordering: sort,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
    }),
    [q, sort, minPrice, maxPrice],
  );

  const query = useQuery({
    queryKey: listingKeys.browse(filters),
    queryFn: () => listingsApi.browse(filters),
  });

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t("browse.section")}
            </div>
            <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">{t("browse.heading")}</h1>
          </div>
          <div className="font-mono text-xs text-muted-foreground">
            {t("browse.count", { count: query.data?.count ?? "—" })}
          </div>
        </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("browse.search_placeholder")}
            className="h-10 w-full rounded-sm border border-border-subtle bg-background pl-10 pr-3 font-mono text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-border"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters((v) => !v)}
            className={`inline-flex h-10 items-center gap-1.5 rounded-sm border px-3 font-mono text-xs transition-colors ${showFilters ? "border-border bg-secondary text-foreground" : "border-border-subtle text-muted-foreground hover:text-foreground"}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            {t("browse.filters")}
          </button>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="h-10 rounded-sm border border-border-subtle bg-background px-3 font-mono text-xs text-foreground outline-none"
          >
            {SORT_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {showFilters && (
        <div className="mt-3 flex flex-wrap items-end gap-3 rounded-md border border-border-subtle bg-surface p-4">
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("browse.min_price")}</label>
            <input
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
              className="h-8 w-32 rounded-sm border border-border bg-background px-2 font-mono text-xs outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{t("browse.max_price")}</label>
            <input
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="∞"
              className="h-8 w-32 rounded-sm border border-border bg-background px-2 font-mono text-xs outline-none"
            />
          </div>
          {(minPrice || maxPrice) && (
            <button
              onClick={() => { setMinPrice(""); setMaxPrice(""); }}
              className="font-mono text-xs text-muted-foreground hover:text-foreground"
            >
              {t("common.clear")}
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <QueryBoundary
          query={query}
          loading={
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-52 w-full" />
              ))}
            </div>
          }
          isEmpty={(d) => d.results.length === 0}
          empty={<EmptyState title={t("browse.empty_title")} description={t("browse.empty_desc")} />}
        >
          {(data) => (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.results.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </QueryBoundary>
      </div>
      </div>
    </div>
  );
}

function ListingCard({ listing }: { listing: Listing }) {
  const { t } = useTranslation();
  return (
    <Link
      to="/projects/$id"
      params={{ id: listing.slug }}
      className="group flex flex-col rounded-md border border-border-subtle bg-background p-4 transition-colors hover:border-border"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate font-mono text-sm text-foreground group-hover:underline">
            {listing.title}
          </div>
          {listing.categoryName && (
            <div className="mt-0.5 font-mono text-[10px] text-muted-foreground">{listing.categoryName}</div>
          )}
        </div>
        {listing.featured && (
          <Star className="h-3.5 w-3.5 shrink-0 fill-accent text-accent" />
        )}
      </div>

      <p className="mt-2 line-clamp-2 flex-1 text-xs text-muted-foreground">
        {listing.description || t("common.no_description")}
      </p>

      {listing.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {listing.tags.slice(0, 3).map((t) => (
            <span key={t} className="inline-flex items-center gap-0.5 rounded-sm border border-border-subtle bg-surface px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              <Tag className="h-2.5 w-2.5" />
              {t}
            </span>
          ))}
          {listing.tags.length > 3 && (
            <span className="font-mono text-[10px] text-muted-foreground">+{listing.tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between border-t border-border-subtle pt-3">
        <div className="font-mono text-sm text-foreground">
          {formatUZS(listing.price)}
        </div>
        <div className="flex items-center gap-3 font-mono text-[10px] text-muted-foreground">
          <span className="flex items-center gap-0.5">
            <Eye className="h-3 w-3" /> {listing.viewCount}
          </span>
          {listing.averageRating != null && (
            <span className="flex items-center gap-0.5">
              <Star className="h-3 w-3" /> {listing.averageRating.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
