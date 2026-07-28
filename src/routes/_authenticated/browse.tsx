import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Filter, SlidersHorizontal, Star } from "lucide-react";
import { listingsApi, listingKeys } from "@/lib/api/endpoints/listings";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";
import type { BrowseFilters, Listing } from "@/lib/api/types";

export const Route = createFileRoute("/_authenticated/browse")({
  head: () => ({
    meta: [
      { title: "Browse projects — Cooplink" },
      { name: "description", content: "Buy source code from developers." },
      { property: "og:title", content: "Browse projects — Cooplink" },
      { property: "og:description", content: "Buy source code from developers." },
    ],
  }),
  component: BrowsePage,
});

const CATEGORIES = ["SaaS starter", "API", "Component", "Automation", "DevOps", "AI/ML"];
const SORT: { value: BrowseFilters["sort"]; label: string }[] = [
  { value: "recent", label: "Recent" },
  { value: "popular", label: "Popular" },
  { value: "top_rated", label: "Top rated" },
  { value: "price_asc", label: "Price ↑" },
  { value: "price_desc", label: "Price ↓" },
];

function BrowsePage() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [sort, setSort] = useState<BrowseFilters["sort"]>("recent");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const filters: BrowseFilters = useMemo(
    () => ({
      q: q || undefined,
      categories: category ? [category] : undefined,
      sort,
      minPrice: minPrice ? Number(minPrice) * 100 : undefined,
      maxPrice: maxPrice ? Number(maxPrice) * 100 : undefined,
    }),
    [q, category, sort, minPrice, maxPrice],
  );

  const query = useQuery({
    queryKey: listingKeys.browse(filters),
    queryFn: () => listingsApi.browse(filters),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            marketplace
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Browse projects</h1>
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-3.5 w-3.5 text-muted-foreground" />
          <select
            value={sort ?? "recent"}
            onChange={(e) => setSort(e.target.value as BrowseFilters["sort"])}
            className="h-8 rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs text-foreground outline-none"
          >
            {SORT.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-6">
          <div>
            <div className="mb-2 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              <Filter className="h-3 w-3" />
              search
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="repo, tag, tech…"
              className="h-8 w-full rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs text-foreground outline-none focus:border-border"
            />
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              category
            </div>
            <div className="space-y-1">
              <button
                onClick={() => setCategory(null)}
                className={`block w-full rounded-sm px-2 py-1 text-left text-xs transition-colors ${
                  !category ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
                }`}
              >
                All
              </button>
              {CATEGORIES.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`block w-full rounded-sm px-2 py-1 text-left text-xs transition-colors ${
                    category === c
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              price (usd)
            </div>
            <div className="flex gap-2">
              <input
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="min"
                className="h-8 w-full rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs outline-none focus:border-border"
              />
              <input
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value.replace(/[^\d]/g, ""))}
                placeholder="max"
                className="h-8 w-full rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs outline-none focus:border-border"
              />
            </div>
          </div>
        </aside>

        <div>
          <QueryBoundary
            query={query}
            loading={<ListingGridSkeleton />}
            isEmpty={(d) => d.items.length === 0}
            empty={
              <EmptyState
                title="No projects match these filters"
                description="Try clearing filters or widening your price range."
              />
            }
          >
            {(data) => (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {data.items.map((l) => (
                  <ListingCard key={l.id} listing={l} />
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
  return (
    <Link
      to="/projects/$id"
      params={{ id: listing.slug ?? listing.id }}
      className="group flex flex-col gap-3 rounded-md border border-border-subtle bg-background p-4 transition-colors hover:border-border"
    >
      <div className="aspect-[16/9] rounded-sm bg-surface" />
      <div>
        <div className="font-mono text-xs text-muted-foreground">{listing.repoName}</div>
        <div className="mt-1 font-mono text-sm text-foreground group-hover:underline">
          {listing.title}
        </div>
        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{listing.tagline}</p>
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border-subtle pt-3">
        <div className="font-mono text-sm text-foreground">
          {formatMoney(listing.priceCents, listing.currency)}
        </div>
        <div className="flex items-center gap-1 font-mono text-xs text-muted-foreground">
          <Star className="h-3 w-3" />
          {listing.ratingAverage?.toFixed(1) ?? "—"}
          <span className="text-muted-foreground/50">({listing.ratingCount})</span>
        </div>
      </div>
    </Link>
  );
}

function ListingGridSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-md border border-border-subtle bg-background p-4">
          <Skeleton className="aspect-[16/9] w-full rounded-sm" />
          <Skeleton className="mt-3 h-3 w-24" />
          <Skeleton className="mt-2 h-4 w-3/4" />
          <Skeleton className="mt-2 h-3 w-full" />
          <div className="mt-3 flex justify-between border-t border-border-subtle pt-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-10" />
          </div>
        </div>
      ))}
    </div>
  );
}

// unused import guard
void useNavigate;
