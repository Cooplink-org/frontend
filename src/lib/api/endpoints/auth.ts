import { NotImplementedError, request } from "../client";
import type { User } from "../types";

// Replace paths and shapes from API docs.
export const authApi = {
  async me(): Promise<User> {
    // return request<User>("/auth/me");
    throw new NotImplementedError("GET /auth/me");
  },
  async signIn(_input: { email: string; password: string }): Promise<{ token: string; user: User }> {
    throw new NotImplementedError("POST /auth/sign-in");
  },
  async signUp(_input: { email: string; password: string; username: string }): Promise<{ token: string; user: User }> {
    throw new NotImplementedError("POST /auth/sign-up");
  },
  async signOut(): Promise<void> {
    throw new NotImplementedError("POST /auth/sign-out");
  },
  githubAuthUrl(): string {
    // The API doc's OAuth entry point will replace this.
    return `${(import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "/api"}/auth/github`;
  },
  async completeOnboarding(_input: {
    legalName: string;
    phone: string;
    avatarUrl?: string;
    acceptedTermsVersion: string;
  }): Promise<User> {
    // suppress unused-warning while stubbed
    void request;
    throw new NotImplementedError("POST /auth/onboarding");
  },
};
