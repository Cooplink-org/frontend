import { request } from "../client";
import type { DashboardSummary, EarningsPoint, DashboardSale, DashboardListing } from "../types";

export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    const raw = await request<Record<string, unknown>>("/dashboard/summary/");
    return {
      lifetimeRevenue: raw.lifetime_revenue as string,
      availableBalance: raw.available_balance as string,
      pendingBalance: raw.pending_balance as string,
      nextUnlockDate: (raw.next_unlock_date as string | null) ?? null,
      totalSales: (raw.total_sales as number) ?? 0,
      totalPublishedListings: (raw.total_published_listings as number) ?? 0,
      totalDownloads: (raw.total_downloads as number) ?? 0,
    };
  },
  async earnings(range: "7d" | "30d" | "90d" | "all" = "30d"): Promise<EarningsPoint[]> {
    const raw = await request<Record<string, unknown>[]>("/dashboard/earnings-timeseries/", {
      query: { range: range === "all" ? "365d" : range },
    });
    return raw.map((p) => ({
      date: p.date as string,
      earnings: p.earnings as string,
    }));
  },
  async myListings(): Promise<DashboardListing[]> {
    const raw = await request<PaginatedResponse>("/dashboard/listings/");
    return (raw.results ?? []).map(normalizeDashboardListing);
  },
  async recentSales(_limit = 10): Promise<DashboardSale[]> {
    const raw = await request<PaginatedResponse>("/dashboard/sales/");
    const results = (raw.results ?? []) as Record<string, unknown>[];
    return results.slice(0, _limit).map(normalizeDashboardSale);
  },
};

export const dashboardKeys = {
  summary: () => ["dashboard", "summary"] as const,
  earnings: (range: string) => ["dashboard", "earnings", range] as const,
  listings: () => ["dashboard", "listings"] as const,
  sales: () => ["dashboard", "sales"] as const,
};

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Record<string, unknown>[];
}

function normalizeDashboardListing(raw: Record<string, unknown>): DashboardListing {
  return {
    id: raw.id as DashboardListing["id"],
    title: raw.title as string,
    slug: raw.slug as string,
    price: raw.price as string,
    status: raw.status as DashboardListing["status"],
    viewCount: (raw.view_count as number) ?? 0,
    downloadCount: (raw.download_count as number) ?? 0,
    salesCount: (raw.sales_count as number) ?? 0,
    revenue: raw.revenue as string,
    createdAt: raw.created_at as string,
    updatedAt: raw.updated_at as string,
  };
}

function normalizeDashboardSale(raw: Record<string, unknown>): DashboardSale {
  return {
    id: raw.id as DashboardSale["id"],
    buyerUsername: raw.buyer_username as string,
    projectTitle: raw.project_title as string,
    projectSlug: raw.project_slug as string,
    priceAtPurchase: raw.price_at_purchase as string,
    platformFeeAmount: raw.platform_fee_amount as string,
    sellerEarningAmount: raw.seller_earning_amount as string,
    status: raw.status as string,
    createdAt: raw.created_at as string,
    paidAt: (raw.paid_at as string | null) ?? null,
  };
}