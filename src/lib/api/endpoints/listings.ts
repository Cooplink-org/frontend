import { NotImplementedError, type Paginated } from "../client";
import type { BrowseFilters, Listing, Project, Review, QAThread } from "../types";

export const listingsApi = {
  async browse(_filters: BrowseFilters = {}): Promise<Paginated<Listing>> {
    throw new NotImplementedError("GET /listings");
  },
  async get(_slugOrId: string): Promise<Project> {
    throw new NotImplementedError("GET /listings/:id");
  },
  async reviews(_projectId: string): Promise<Review[]> {
    throw new NotImplementedError("GET /listings/:id/reviews");
  },
  async qa(_projectId: string): Promise<QAThread[]> {
    throw new NotImplementedError("GET /listings/:id/qa");
  },
  async report(_input: { projectId: string; reason: string; body?: string }): Promise<void> {
    throw new NotImplementedError("POST /listings/:id/report");
  },
  async purchase(_projectId: string): Promise<{ checkoutUrl: string }> {
    throw new NotImplementedError("POST /listings/:id/purchase");
  },
  async create(_input: {
    repoName: string;
    title: string;
    tagline: string;
    description: string;
    priceCents: number;
    currency: string;
    categories: string[];
    tags: string[];
    techStack: string[];
  }): Promise<Listing> {
    throw new NotImplementedError("POST /listings");
  },
};

/** Repo of typed query keys. Change here → invalidations stay consistent. */
export const listingKeys = {
  all: () => ["listings"] as const,
  browse: (filters: BrowseFilters) => ["listings", "browse", filters] as const,
  detail: (id: string) => ["listings", "detail", id] as const,
  reviews: (id: string) => ["listings", id, "reviews"] as const,
  qa: (id: string) => ["listings", id, "qa"] as const,
};
