/**
 * Placeholder domain types. Replace 1:1 from API docs.
 * Every field is annotated with intent so the UI wiring is obvious.
 */

export type ID = string;
export type ISODate = string;

export interface User {
  id: ID;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
  githubLogin: string | null;
  createdAt: ISODate;
  role: "user" | "admin";
  onboardingComplete: boolean;
  legalName?: string | null;
  phone?: string | null;
}

export type ProjectStatus = "draft" | "pending_review" | "published" | "rejected" | "removed";

export interface Listing {
  id: ID;
  slug: string;
  title: string;
  tagline: string;
  priceCents: number;
  currency: string; // e.g. "USD"
  seller: Pick<User, "id" | "username" | "displayName" | "avatarUrl" | "githubLogin">;
  categories: string[];
  tags: string[];
  techStack: string[];
  repoName: string;                // owner/repo
  screenshotUrls: string[];
  demoUrl: string | null;
  status: ProjectStatus;
  ratingAverage: number | null;    // 0..5, null if no reviews
  ratingCount: number;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Project extends Listing {
  description: string;             // markdown
  readmeExcerpt: string | null;
  filesCount: number | null;
  linesOfCode: number | null;
  licenseAfterPurchase: string;    // e.g. "commercial single-seat"
}

export interface Review {
  id: ID;
  projectId: ID;
  author: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  rating: number; // 1..5
  body: string;
  createdAt: ISODate;
}

export interface QAThread {
  id: ID;
  projectId: ID;
  author: Pick<User, "id" | "username" | "displayName" | "avatarUrl">;
  question: string;
  answer: string | null;
  createdAt: ISODate;
  answeredAt: ISODate | null;
}

export interface Sale {
  id: ID;
  projectId: ID;
  projectTitle: string;
  buyerUsername: string;
  amountCents: number;
  currency: string;
  createdAt: ISODate;
}

export interface EarningsPoint {
  date: ISODate; // day
  amountCents: number;
}

export interface Payout {
  id: ID;
  amountCents: number;
  currency: string;
  status: "pending" | "processing" | "paid" | "failed";
  requestedAt: ISODate;
  paidAt: ISODate | null;
  method: string; // e.g. "stripe_connect"
}

export interface PayoutSummary {
  availableCents: number;
  pendingCents: number;
  lifetimeCents: number;
  currency: string;
}

export interface Report {
  id: ID;
  target: { type: "project" | "user" | "review"; id: ID; label: string };
  reporter: Pick<User, "id" | "username">;
  reason: string;
  body: string | null;
  status: "open" | "actioned" | "dismissed";
  createdAt: ISODate;
}

export interface AuditLogEntry {
  id: ID;
  actor: Pick<User, "id" | "username">;
  action: string;      // e.g. "project.remove"
  target: string;      // e.g. "project:abc123"
  createdAt: ISODate;
  meta: Record<string, unknown> | null;
}

export interface BrowseFilters {
  q?: string;
  categories?: string[];
  tags?: string[];
  minPrice?: number;
  maxPrice?: number;
  sort?: "recent" | "popular" | "price_asc" | "price_desc" | "top_rated";
  page?: number;
  pageSize?: number;
}
