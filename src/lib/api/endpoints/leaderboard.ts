import { request } from "../client";

export interface LeaderboardEntry {
  id: number;
  domain: string;
  brand_name: string;
  description: string;
  logo_url: string;
  amount_uzs: string;
  status: string;
  category?: "tech" | "trade" | "media" | "edu" | "ai";
  likes: number;
  clicks: number;
  position?: number;
  created_at: string;
}

interface LeaderboardSettings {
  enabled: boolean;
  min_amount_uzs: string;
}

export interface LeaderboardData {
  settings: LeaderboardSettings;
  entries: LeaderboardEntry[];
  total_earned_uzs: string;
  started_at: string | null;
  count: number;
}

export interface CreateEntryResponse {
  entry: LeaderboardEntry;
  position: number;
}

export interface PayResponse {
  entry_id: number;
  payid: string;
  redirect_url: string;
}

export interface VerifyResponse {
  status: string;
  entry?: LeaderboardEntry;
}

export const leaderboardApi = {
  async get(): Promise<LeaderboardData> {
    return request<LeaderboardData>("/leaderboard/", { auth: false });
  },

  async createEntry(body: {
    domain: string;
    brand_name: string;
    description?: string;
    logo_url?: string;
    amount_uzs: string;
    category?: string;
  }): Promise<CreateEntryResponse> {
    return request<CreateEntryResponse>("/leaderboard/entries/", {
      method: "POST",
      body,
      auth: false,
    });
  },

  async payEntry(entryId: number): Promise<PayResponse> {
    return request<PayResponse>(`/leaderboard/entries/${entryId}/pay/`, {
      method: "POST",
      auth: false,
    });
  },

  async verify(data: { order_id?: string; entry_id?: number }): Promise<VerifyResponse> {
    return request<VerifyResponse>("/leaderboard/verify/", {
      method: "POST",
      body: data,
      auth: false,
    });
  },

  async recordClick(entryId: number): Promise<{ clicks: number }> {
    return request<{ clicks: number }>(`/leaderboard/entries/${entryId}/click/`, {
      method: "POST",
      auth: false,
    });
  },
};
