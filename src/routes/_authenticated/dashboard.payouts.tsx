import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { payoutsApi, payoutKeys } from "@/lib/api/endpoints/payouts";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUZS, formatDate } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/dashboard/payouts")({
  head: () => ({
    meta: [
      { title: i18n.t("payouts.title") },
      { name: "description", content: i18n.t("payouts.meta_desc") },
      { property: "og:title", content: i18n.t("payouts.title") },
      { property: "og:description", content: i18n.t("payouts.meta_desc") },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const { t } = useTranslation();
  const summary = useQuery({ queryKey: payoutKeys.summary(), queryFn: () => payoutsApi.summary() });
  const [amount, setAmount] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestWithdrawal() {
    setSubmitting(true);
    try {
      await payoutsApi.request(amount, cardNumber);
      toast.success(t("payouts.toast.requested"));
      setAmount("");
      setCardNumber("");
      summary.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("payouts.toast.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("payouts.section")}</div>
          <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">{t("payouts.heading")}</h1>
        </div>

      <QueryBoundary
        query={summary}
        loading={<Skeleton className="h-40 w-full" />}
      >
        {(s) => (
          <>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-accent/40 bg-accent/5 p-5">
                <div className="font-mono text-xs text-muted-foreground">{t("payouts.available")}</div>
                <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                  {formatUZS(s.availableBalance)}
                </div>
                <div className="mt-3 flex flex-col gap-2">
                  <input
                    value={amount}
                    onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder={t("payouts.amount_placeholder")}
                    className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-sm outline-none"
                  />
                  {amount && parseFloat(amount) > 0 && (
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {t("payouts.fee_note", { fee: s.withdrawalFeePercent })}
                      <span className="text-foreground">
                        {" "}
                        {formatUZS((parseFloat(amount) * (1 - parseFloat(s.withdrawalFeePercent) / 100)).toFixed(2))}
                      </span>
                    </div>
                  )}
                  <input
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder={t("payouts.card_placeholder")}
                    className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-sm outline-none"
                  />
                  <button
                    onClick={requestWithdrawal}
                    disabled={submitting || !amount || !cardNumber || parseFloat(amount) <= 0 || parseFloat(amount) > parseFloat(s.availableBalance)}
                    className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {t("payouts.withdraw")}
                  </button>
                </div>
              </div>
              <div className="rounded-md border border-border-subtle bg-background p-5">
                <div className="font-mono text-xs text-muted-foreground">{t("payouts.pending")}</div>
                <div className="mt-1 space-y-1">
                  {s.pendingBalance.length === 0 ? (
                    <div className="font-mono text-xs text-muted-foreground">{t("payouts.none")}</div>
                  ) : (
                    s.pendingBalance.map((pb, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="font-mono text-sm text-foreground">
                          {formatUZS(pb.amount)}
                        </span>
                        <span className="font-mono text-[10px] text-muted-foreground">
                          {t("payouts.unlocks", { date: formatDate(pb.unlocksAt, "short") })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">{t("payouts.escrow_hint")}</div>
              </div>
              <div className="rounded-md border border-border-subtle bg-background p-5">
                <div className="font-mono text-xs text-muted-foreground">{t("payouts.lifetime")}</div>
                <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                  {formatUZS(
                    s.payouts.reduce((sum, p) => sum + parseFloat(p.amount), 0),
                  )}
                </div>
                <div className="mt-1 text-xs text-muted-foreground">{t("payouts.total_paid")}</div>
              </div>
            </div>

            <section className="overflow-hidden rounded-md border border-border-subtle bg-background">
              <div className="border-b border-border-subtle px-5 py-3 font-mono text-sm text-foreground">
                {t("payouts.history")}
              </div>
              {s.payouts.length === 0 ? (
                <div className="p-6"><EmptyState title={t("payouts.no_history")} /></div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] font-mono text-xs">
                    <thead>
                      <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                        <th className="px-5 py-2 font-normal">{t("payouts.table.requested")}</th>
                        <th className="px-5 py-2 font-normal">{t("payouts.table.status")}</th>
                        <th className="px-5 py-2 font-normal">{t("payouts.table.card")}</th>
                        <th className="px-5 py-2 text-right font-normal">{t("payouts.table.amount")}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {s.payouts.map((p) => (
                        <tr key={p.id} className="border-b border-border-subtle last:border-0">
                          <td className="px-5 py-3 text-foreground">{formatDate(p.requestedAt)}</td>
                          <td className="px-5 py-3 text-muted-foreground">{p.status}</td>
                          <td className="px-5 py-3 text-muted-foreground">
                            {p.destinationCardLast4 ? `****${p.destinationCardLast4}` : "—"}
                          </td>
                          <td className="px-5 py-3 text-right text-foreground">
                            {formatUZS(p.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </QueryBoundary>
      </div>
    </div>
  );
}
