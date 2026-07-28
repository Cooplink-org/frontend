import { NotImplementedError } from "../client";
import type { Payout, PayoutSummary } from "../types";

export const payoutsApi = {
  async summary(): Promise<PayoutSummary> {
    throw new NotImplementedError("GET /payouts/summary");
  },
  async history(): Promise<Payout[]> {
    throw new NotImplementedError("GET /payouts");
  },
  async request(_amountCents: number): Promise<Payout> {
    throw new NotImplementedError("POST /payouts");
  },
};

export const payoutKeys = {
  summary: () => ["payouts", "summary"] as const,
  history: () => ["payouts", "history"] as const,
};
