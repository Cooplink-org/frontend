export type ID = string | number;
export type ISODate = string;

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface User {
  id: ID;
  username: string;
  email: string;
  githubId: string | null;
  githubUsername: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isSeller: boolean;
  telegramChatId: string | null;
  fullLegalName: string | null;
  phoneNumber: string | null;
  phoneVerified: boolean;
  phoneVerifiedAt: ISODate | null;
  isOnboarded: boolean;
  role: "user" | "admin";
  createdAt: ISODate;
}

export type ProjectStatus = "draft" | "pending_review" | "published" | "rejected" | "removed";

export interface SellerProfile {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
}

export interface Listing {
  id: ID;
  slug: string;
  title: string;
  description: string;
  price: string;
  sellerProfile: SellerProfile | null;
  categoryName: string | null;
  tags: string[];
  techStack: string[];
  coverImage: string | null;
  screenshots: string[];
  demoUrl: string | null;
  featured: boolean;
  viewCount: number;
  averageRating: number | null;
  ratingCount: number;
  createdAt: ISODate;
}

export interface Project extends Listing {
  description: string;
  longDescription: string | null;
  sellerUsername: string | null;
  githubRepoFullName: string | null;
  githubDefaultBranch: string | null;
  bannerImage: string | null;
  accentColor: string | null;
  highlights: string[];
  licenseType: string | null;
  version: number;
  updatedAt: ISODate;
}

export interface Review {
  id: ID;
  projectId: ID;
  author: Pick<User, "id" | "username" | "avatarUrl">;
  rating: number;
  body: string;
  createdAt: ISODate;
}

export interface QAThread {
  id: ID;
  projectId: ID;
  author: Pick<User, "id" | "username" | "avatarUrl">;
  question: string;
  answer: string | null;
  createdAt: ISODate;
  answeredAt: ISODate | null;
}

export interface DashboardSale {
  id: ID;
  buyerUsername: string;
  projectTitle: string;
  projectSlug: string;
  priceAtPurchase: string;
  platformFeeAmount: string;
  sellerEarningAmount: string;
  status: string;
  createdAt: ISODate;
  paidAt: ISODate | null;
}

export interface DashboardListing {
  id: ID;
  title: string;
  slug: string;
  price: string;
  status: ProjectStatus;
  viewCount: number;
  downloadCount: number;
  salesCount: number;
  revenue: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface DashboardSummary {
  lifetimeRevenue: string;
  availableBalance: string;
  pendingBalance: string;
  nextUnlockDate: ISODate | null;
  totalSales: number;
  totalPublishedListings: number;
  totalDownloads: number;
}

export interface EarningsPoint {
  date: ISODate;
  earnings: string;
}

export interface PayoutEntry {
  id: ID;
  amount: string;
  destinationCardLast4: string | null;
  status: string;
  adminNote: string | null;
  requestedAt: ISODate;
  processedAt: ISODate | null;
}

export interface PendingBalanceItem {
  amount: string;
  unlocksAt: ISODate;
}

export interface PayoutsMine {
  availableBalance: string;
  pendingBalance: PendingBalanceItem[];
  payouts: PayoutEntry[];
}

export interface PayoutRequestInput {
  amount: string;
  cardNumber: string;
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
  action: string;
  target: string;
  createdAt: ISODate;
  meta: Record<string, unknown> | null;
}

export interface BrowseFilters {
  q?: string;
  category?: string;
  tags?: string;
  techStack?: string;
  licenseType?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  ordering?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderResponse {
  id: ID;
  status: string;
  price: string;
  redirectUrl: string;
}

export interface Purchase {
  id: ID;
  projectId: ID;
  title: string;
  slug: string;
  description: string;
  price: string;
  coverImage: string | null;
  techStack: string[];
  licenseType: string | null;
  version: number | null;
  paidAt: ISODate;
}

export interface NotificationItem {
  id: ID;
  type: string;
  title: string;
  body: string;
  link: string;
  isRead: boolean;
  createdAt: ISODate;
}
