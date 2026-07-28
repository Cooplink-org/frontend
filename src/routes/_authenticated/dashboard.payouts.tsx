import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { payoutsApi, payoutKeys } from "@/lib/api/endpoints/payouts";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard/payouts")({
  head: () => ({
    meta: [
      { title: "Payouts — Cooplink" },
      { name: "description", content: "Manage your Cooplink payouts." },
      { property: "og:title", content: "Payouts — Cooplink" },
      { property: "og:description", content: "Manage your Cooplink payouts." },
    ],
  }),
  component: PayoutsPage,
});

function PayoutsPage() {
  const summary = useQuery({ queryKey: payoutKeys.summary(), queryFn: () => payoutsApi.summary() });
  const history = useQuery({ queryKey: payoutKeys.history(), queryFn: () => payoutsApi.history() });
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function requestWithdrawal() {
    setSubmitting(true);
    try {
      await payoutsApi.request(Math.round(Number(amount) * 100));
      toast.success("Withdrawal requested");
      setAmount("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
      <div>
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">payouts</div>
        <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Balance & withdrawals</h1>
      </div>

      <QueryBoundary
        query={summary}
        loading={<Skeleton className="h-32 w-full" />}
      >
        {(s) => (
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-md border border-accent/40 bg-accent/5 p-5">
              <div className="font-mono text-xs text-muted-foreground">available</div>
              <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                {formatMoney(s.availableCents, s.currency)}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
                  placeholder="Amount"
                  className="h-9 flex-1 rounded-sm border border-border bg-background px-2 font-mono text-sm outline-none"
                />
                <button
                  onClick={requestWithdrawal}
                  disabled={submitting || !amount}
                  className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  Withdraw
                </button>
              </div>
            </div>
            <div className="rounded-md border border-border-subtle bg-background p-5">
              <div className="font-mono text-xs text-muted-foreground">pending</div>
              <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                {formatMoney(s.pendingCents, s.currency)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Sales in escrow window</div>
            </div>
            <div className="rounded-md border border-border-subtle bg-background p-5">
              <div className="font-mono text-xs text-muted-foreground">lifetime</div>
              <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                {formatMoney(s.lifetimeCents, s.currency)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">Total paid out</div>
            </div>
          </div>
        )}
      </QueryBoundary>

      <section className="overflow-hidden rounded-md border border-border-subtle bg-background">
        <div className="border-b border-border-subtle px-5 py-3 font-mono text-sm text-foreground">
          Payout history
        </div>
        <QueryBoundary
          query={history}
          loading={<div className="p-5"><Skeleton className="h-24 w-full" /></div>}
          isEmpty={(d) => d.length === 0}
          empty={<div className="p-6"><EmptyState title="No payouts yet" /></div>}
        >
          {(items) => (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-5 py-2 font-normal">requested</th>
                    <th className="px-5 py-2 font-normal">status</th>
                    <th className="px-5 py-2 font-normal">method</th>
                    <th className="px-5 py-2 text-right font-normal">amount</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((p) => (
                    <tr key={p.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-5 py-3 text-foreground">{formatDate(p.requestedAt)}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.status}</td>
                      <td className="px-5 py-3 text-muted-foreground">{p.method}</td>
                      <td className="px-5 py-3 text-right text-foreground">
                        {formatMoney(p.amountCents, p.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </QueryBoundary>
      </section>
    </div>
  );
}
