import { NotImplementedError } from "../client";
import type { EarningsPoint, Listing, Sale } from "../types";

export const dashboardApi = {
  async summary(): Promise<{
    activeListings: number;
    totalSalesCount: number;
    totalRevenueCents: number;
    payoutBalanceCents: number;
    currency: string;
  }> {
    throw new NotImplementedError("GET /dashboard/summary");
  },
  async earnings(_range: "7d" | "30d" | "90d" | "all" = "30d"): Promise<EarningsPoint[]> {
    throw new NotImplementedError("GET /dashboard/earnings");
  },
  async myListings(): Promise<Listing[]> {
    throw new NotImplementedError("GET /dashboard/listings");
  },
  async recentSales(_limit = 10): Promise<Sale[]> {
    throw new NotImplementedError("GET /dashboard/sales");
  },
};

export const dashboardKeys = {
  summary: () => ["dashboard", "summary"] as const,
  earnings: (range: string) => ["dashboard", "earnings", range] as const,
  listings: () => ["dashboard", "listings"] as const,
  sales: () => ["dashboard", "sales"] as const,
};
