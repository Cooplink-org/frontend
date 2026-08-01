import { request } from "../client";
import type { User } from "../types";

export interface PhoneLinkResponse {
  deep_link: string;
  expires_at: string;
  token: string;
}

export interface PhoneVerifyResponse {
  detail: string;
  phone_number?: string;
  phone_verified?: boolean;
}

export interface PhoneStatusResponse {
  phone_number: string;
  phone_verified: boolean;
  phone_verified_at: string | null;
  has_active_code: boolean;
  code_expires_at: string | null;
}

export const authApi = {
  async me(): Promise<User> {
    const raw = await request<Record<string, unknown>>("/auth/me/");
    return normalizeUser(raw);
  },

  async getGitHubLoginUrl(): Promise<string> {
    const data = await request<{ authorization_url: string }>("/auth/github/login/", {
      auth: false,
    });
    return data.authorization_url;
  },

  async connectRepos(): Promise<string> {
    const data = await request<{ authorization_url: string }>("/auth/github/connect-repos/");
    return data.authorization_url;
  },

  async signOut(): Promise<void> {
    try {
      await request("/auth/sign-out/", { method: "POST" });
    } catch {
      // Backend may not have a sign-out endpoint; clear tokens locally regardless.
    }
  },

  async completeOnboarding(input: {
    fullLegalName: string;
    phoneNumber: string;
    avatarUrl?: string;
    termsAccepted: boolean;
  }): Promise<User> {
    const raw = await request<Record<string, unknown>>("/auth/onboarding/", {
      method: "POST",
      body: {
        full_legal_name: input.fullLegalName,
        phone_number: input.phoneNumber,
        avatar_url: input.avatarUrl ?? null,
        terms_accepted: input.termsAccepted,
      },
    });
    return normalizeUser(raw);
  },

  async updateProfile(input: { bio?: string; avatarUrl?: string; telegramChatId?: string }): Promise<User> {
    const raw = await request<Record<string, unknown>>("/auth/me/", {
      method: "PATCH",
      body: {
        bio: input.bio,
        avatar_url: input.avatarUrl,
        telegram_chat_id: input.telegramChatId,
      },
    });
    return normalizeUser(raw);
  },

  async phoneLink(): Promise<PhoneLinkResponse> {
    return request<PhoneLinkResponse>("/auth/phone/link/", { method: "POST" });
  },

  async phoneVerify(code: string): Promise<PhoneVerifyResponse> {
    return request<PhoneVerifyResponse>("/auth/phone/verify/", {
      method: "POST",
      body: { code },
    });
  },

  async phoneStatus(): Promise<PhoneStatusResponse> {
    return request<PhoneStatusResponse>("/auth/phone/status/");
  },
};

function normalizeUser(raw: Record<string, unknown>): User {
  return {
    id: raw.id as User["id"],
    username: raw.username as string,
    email: raw.email as string,
    githubId: (raw.github_id as string | null) ?? null,
    githubUsername: (raw.github_username as string | null) ?? null,
    avatarUrl: (raw.avatar_url as string | null) ?? null,
    bio: (raw.bio as string | null) ?? null,
    isSeller: raw.is_seller === true,
    telegramChatId: (raw.telegram_chat_id as string | null) ?? null,
    fullLegalName: (raw.full_legal_name as string | null) ?? null,
    phoneNumber: (raw.phone_number as string | null) ?? null,
    phoneVerified: raw.phone_verified === true,
    phoneVerifiedAt: (raw.phone_verified_at as string | null) ?? null,
    isOnboarded: raw.is_onboarded === true,
    role: (raw.role as User["role"]) ?? (raw.is_staff === true ? "admin" : "user"),
    createdAt: raw.created_at as string,
  };
}
