import { request } from "../client";
import type { PayoutsMine, PayoutEntry } from "../types";

export const payoutsApi = {
  async summary(): Promise<PayoutsMine> {
    const raw = await request<Record<string, unknown>>("/payouts/mine/");
    const pendingRaw = (raw.pending_balance as Record<string, unknown>[]) ?? [];
    const payoutsRaw = (raw.payouts as Record<string, unknown>[]) ?? [];
    return {
      availableBalance: raw.available_balance as string,
      pendingBalance: pendingRaw.map((p) => ({
        amount: p.amount as string,
        unlocksAt: p.unlocks_at as string,
      })),
      payouts: payoutsRaw.map(normalizePayoutEntry),
    };
  },
  async history(): Promise<PayoutEntry[]> {
    const mine = await this.summary();
    return mine.payouts;
  },
  async request(amount: string, cardNumber: string): Promise<PayoutEntry> {
    const raw = await request<Record<string, unknown>>("/payouts/request/", {
      method: "POST",
      body: {
        amount,
        card_number: cardNumber,
      },
    });
    return normalizePayoutEntry(raw);
  },
};

export const payoutKeys = {
  summary: () => ["payouts", "summary"] as const,
  history: () => ["payouts", "history"] as const,
};

function normalizePayoutEntry(raw: Record<string, unknown>): PayoutEntry {
  return {
    id: raw.id as PayoutEntry["id"],
    amount: raw.amount as string,
    destinationCardLast4: (raw.destination_card_last4 as string | null) ?? null,
    status: raw.status as string,
    adminNote: (raw.admin_note as string | null) ?? null,
    requestedAt: raw.requested_at as string,
    processedAt: (raw.processed_at as string | null) ?? null,
  };
}