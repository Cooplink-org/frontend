import { request, type Paginated } from "../client";
import type { BrowseFilters, Listing, Project, Purchase, Review, QAThread } from "../types";

export const listingsApi = {
  async browse(filters: BrowseFilters = {}): Promise<Paginated<Listing>> {
    const raw = await request<Record<string, unknown>>("/listings/", {
      query: {
        q: filters.q,
        category: filters.category,
        tags: filters.tags,
        tech_stack: filters.techStack,
        license_type: filters.licenseType,
        min_price: filters.minPrice,
        max_price: filters.maxPrice,
        featured: filters.featured ? "1" : undefined,
        ordering: filters.ordering,
        page: filters.page,
        page_size: filters.pageSize,
      },
      auth: false,
    });
    const paginated = raw as unknown as { count: number; next: string | null; previous: string | null; results: Record<string, unknown>[] };
    return {
      count: paginated.count,
      next: paginated.next,
      previous: paginated.previous,
      results: paginated.results.map(normalizeListing),
    };
  },
  async get(slugOrId: string): Promise<Project> {
    const raw = await request<Record<string, unknown>>(`/listings/${slugOrId}/`, { auth: false });
    return normalizeProject(raw);
  },
  async reviews(projectId: string): Promise<Review[]> {
    try {
      const raw = await request<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(`/listings/${projectId}/ratings/`, { auth: false });
      const items = Array.isArray(raw) ? raw : (raw?.results || []);
      return items.map(normalizeReview);
    } catch {
      return [];
    }
  },
  async submitReview(projectId: string, rating: number, body: string): Promise<void> {
    await request(`/listings/${projectId}/ratings/`, {
      method: "POST",
      body: { rating, score: rating, body, review_text: body },
    });
  },
  async qa(projectId: string): Promise<QAThread[]> {
    try {
      const raw = await request<Record<string, unknown>[] | { results: Record<string, unknown>[] }>(`/listings/${projectId}/qa/`, { auth: false });
      const items = Array.isArray(raw) ? raw : (raw?.results || []);
      return items.map(normalizeQAThread);
    } catch {
      return [];
    }
  },
  async askQuestion(projectId: string, question: string): Promise<void> {
    await request(`/listings/${projectId}/qa/`, {
      method: "POST",
      body: { question },
    });
  },
  async answerQuestion(projectId: string, qaId: string | number, answer: string): Promise<void> {
    await request(`/listings/${projectId}/qa/${qaId}/answer/`, {
      method: "POST",
      body: { answer },
    });
  },
  async report(input: { projectId: string; reason: string; body?: string }): Promise<void> {
    const reasonMap: Record<string, string> = {
      infringement: "copyright",
      malicious: "malicious_code",
    };
    const normalizedReason = reasonMap[input.reason] || input.reason;
    await request("/moderation/reports/", {
      method: "POST",
      body: { project: input.projectId, reason: normalizedReason, detail: input.body },
    });
  },
  async purchase(
    projectId: string | number,
    provider?: string,
  ): Promise<{ orderId: number; checkoutUrl: string; payid: string; provider: string }> {
    const raw = await request<Record<string, unknown>>("/orders/", {
      method: "POST",
      body: { project_id: projectId, ...(provider ? { payment_provider: provider } : {}) },
    });
    return {
      orderId: raw.id as number,
      checkoutUrl: (raw.redirect_url as string) || "",
      payid: (raw.payid as string) || "",
      provider: (raw.provider as string) || "",
    };
  },
  async orderStatus(orderId: number): Promise<{ id: number; status: string; projectSlug: string }> {
    const raw = await request<Record<string, unknown>>(`/orders/${orderId}/status/`);
    return {
      id: raw.id as number,
      status: raw.status as string,
      projectSlug: (raw.project_slug as string) || "",
    };
  },
  async verifyPayment(payid: string): Promise<{ status: string; orderId?: number }> {
    return request("/payments/verify/", {
      method: "POST",
      body: { payid },
    });
  },
  async paymentProviders(): Promise<{ provider: string; displayName: string; isDefault: boolean }[]> {
    const raw = await request<{ providers: { provider: string; display_name: string; is_default: boolean }[] }>(
      "/payments/providers/",
      { auth: false },
    );
    return (raw.providers ?? []).map((p) => ({
      provider: p.provider,
      displayName: p.display_name,
      isDefault: p.is_default,
    }));
  },
  async myPurchases(): Promise<Purchase[]> {
    const raw = await request<Record<string, unknown>[]>("/orders/my-purchases/");
    return raw.map((r) => ({
      id: r.id as Purchase["id"],
      projectId: r.project_id as Purchase["projectId"],
      title: r.title as string,
      slug: r.slug as string,
      description: r.description as string,
      price: r.price as string,
      coverImage: (r.cover_image as string) ?? null,
      techStack: (r.tech_stack as string[]) ?? [],
      licenseType: (r.license_type as string | null) ?? null,
      version: (r.version as number | null) ?? null,
      paidAt: r.paid_at as string,
    }));
  },
  async create(input: {
    repoName: string;
    title: string;
    description: string;
    price: string;
    tags: string[];
    techStack: string[];
  }): Promise<{ id: number; slug: string }> {
    const raw = await request<Record<string, unknown>>("/listings/projects/", {
      method: "POST",
      body: {
        github_repo_full_name: input.repoName,
        title: input.title,
        description: input.description,
        price: input.price,
        tags: input.tags,
        tech_stack: input.techStack,
      },
    });
    return { id: raw.id as number, slug: raw.slug as string };
  },
  async submitForReview(projectId: number): Promise<void> {
    await request(`/listings/projects/${projectId}/submit/`, { method: "POST" });
  },
};

export const listingKeys = {
  all: () => ["listings"] as const,
  browse: (filters: BrowseFilters) => ["listings", "browse", filters] as const,
  detail: (id: string) => ["listings", "detail", id] as const,
  reviews: (id: string) => ["listings", id, "reviews"] as const,
  qa: (id: string) => ["listings", id, "qa"] as const,
};

function normalizeListing(raw: Record<string, unknown>): Listing {
  const sp = raw.seller_profile as Record<string, unknown> | null;
  return {
    id: raw.id as Listing["id"],
    slug: raw.slug as string,
    title: raw.title as string,
    description: (raw.description as string) ?? "",
    price: (raw.price as string) ?? "0",
    sellerProfile: sp ? { username: sp.username as string, avatarUrl: (sp.avatar_url as string | null) ?? null, bio: (sp.bio as string | null) ?? null } : null,
    categoryName: (raw.category_name as string | null) ?? null,
    tags: (raw.tags as string[]) ?? [],
    techStack: (raw.tech_stack as string[]) ?? [],
    coverImage: (raw.cover_image as string | null) ?? null,
    screenshots: (raw.screenshots as string[]) ?? [],
    demoUrl: (raw.demo_url as string | null) ?? null,
    featured: raw.featured === true,
    viewCount: (raw.view_count as number) ?? 0,
    averageRating: (raw.average_rating as number | null) ?? null,
    ratingCount: (raw.rating_count as number) ?? 0,
    createdAt: raw.created_at as string,
  };
}

function normalizeProject(raw: Record<string, unknown>): Project {
  const listing = normalizeListing(raw);
  return {
    ...listing,
    description: (raw.description as string) ?? "",
    longDescription: (raw.long_description as string | null) ?? null,
    sellerUsername: (raw.seller_username as string) ?? null,
    githubRepoFullName: (raw.github_repo_full_name as string) ?? null,
    githubDefaultBranch: (raw.github_default_branch as string) ?? null,
    bannerImage: (raw.banner_image as string | null) ?? null,
    accentColor: (raw.accent_color as string | null) ?? null,
    highlights: (raw.highlights as string[]) ?? [],
    licenseType: (raw.license_type as string | null) ?? null,
    version: (raw.version as number) ?? 1,
    updatedAt: (raw.updated_at as string) ?? listing.createdAt,
  };
}

function normalizeReview(raw: Record<string, unknown>): Review {
  // Handle both nested author format (old) and flat comment format (new)
  const author = (raw.author as Record<string, unknown>) ?? {
    id: raw.user ?? raw.user_id,
    username: raw.username,
    avatarUrl: raw.avatar_url ?? null,
  };
  return {
    id: raw.id as Review["id"],
    projectId: (raw.project_id ?? raw.project) as string,
    author: {
      id: (author.id ?? raw.user) as string,
      username: (author.username ?? raw.username) as string,
      avatarUrl: ((author.avatarUrl ?? author.avatar_url ?? raw.avatar_url) as string | null) ?? null,
    },
    rating: (raw.rating ?? raw.score ?? 0) as number,
    body: (raw.body ?? raw.review_text ?? "") as string,
    createdAt: (raw.created_at ?? raw.createdAt ?? "") as string,
  };
}

function normalizeQAThread(raw: Record<string, unknown>): QAThread {
  const author = raw.author as Record<string, unknown> ?? {};
  return {
    id: raw.id as QAThread["id"],
    projectId: (raw.project_id ?? raw.project) as string,
    author: {
      id: author.id as string,
      username: author.username as string,
      avatarUrl: (author.avatar_url as string | null) ?? null,
    },
    question: raw.question as string,
    answer: (raw.answer as string | null) ?? null,
    createdAt: raw.created_at as string,
    answeredAt: (raw.answered_at as string | null) ?? null,
  };
}