import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, Loader2, ExternalLink, ArrowRight, XCircle } from "lucide-react";
import { listingsApi } from "@/lib/api/endpoints/listings";
import { formatUZS } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/payment/$orderId")({
  head: (ctx) => ({
    meta: [{ title: i18n.t("payment.page_title") }],
  }),
  component: PaymentPage,
});

function PaymentPage() {
  const { t } = useTranslation();
  const { orderId } = Route.useParams();
  const navigate = useNavigate();
  const id = Number(orderId);

  const [status, setStatus] = useState<"redirecting" | "waiting" | "paid" | "failed" | "expired">("redirecting");
  const [checkoutUrl, setCheckoutUrl] = useState("");
  const [payid, setPayid] = useState("");
  const [pollCount, setPollCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Get checkout URL & payid from search params (passed from the project page)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get("checkout_url") || "";
    const pid = params.get("payid") || "";
    setCheckoutUrl(url);
    setPayid(pid);

    if (url) {
      // Open MirPay in a new tab
      window.open(url, "_blank", "noopener,noreferrer");
      setStatus("waiting");
    } else {
      setStatus("waiting");
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Poll for order status every 5 seconds
  // After 30s (6 attempts), also verify directly with MirPay as fallback
  useEffect(() => {
    if (status === "paid" || status === "failed" || status === "expired") return;
    if (pollCount > 360) {
      setStatus("expired");
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const result = await listingsApi.orderStatus(id);
        setPollCount((c) => c + 1);

        if (result.status === "paid") {
          setStatus("paid");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }
        if (result.status === "failed") {
          setStatus("failed");
          if (intervalRef.current) clearInterval(intervalRef.current);
          return;
        }

        // Fallback: if the webhook hasn't confirmed within ~50s, verify the
        // payment directly with MirPay and keep re-checking each poll. This
        // covers cases where MirPay's webhook never arrives (dev, or the
        // webhook URL isn't registered in the kassa dashboard).
        if (payid && pollCount >= 10) {
          const verifyResult = await listingsApi.verifyPayment(payid);
          if (verifyResult.status === "paid") {
            setStatus("paid");
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
          // Only stop polling on confirmed DB-level failure
          if (verifyResult.status === "failed") {
            setStatus("failed");
            if (intervalRef.current) clearInterval(intervalRef.current);
          }
        }
      } catch {
        // Network error — keep polling
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [id, status, pollCount, payid]);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center">

          {status === "redirecting" && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <h2 className="font-mono text-xl text-foreground">{t("payment.preparing")}</h2>
            </div>
          )}

          {status === "waiting" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-dashed border-border animate-[spin_8s_linear_infinite]">
                <Loader2 className="h-8 w-8 animate-spin text-accent" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.waiting")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("payment.waiting_desc")}
                </p>
              </div>

              {checkoutUrl && (
                <a
                  href={checkoutUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-[color:var(--accent-lime-ink)] hover:opacity-90"
                >
                  <ExternalLink className="h-4 w-4" />
                  {t("payment.open_page")}
                </a>
              )}

              <div className="font-mono text-xs text-muted-foreground">
                {t("payment.checking", { n: pollCount + 1 })}
              </div>
            </div>
          )}

          {status === "paid" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.confirmed_heading")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("payment.confirmed_desc")}
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/library" })}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("payment.go_to_library")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {status === "failed" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.failed_heading_page")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("payment.failed_desc_page")}
                </p>
              </div>
              <button
                onClick={() => navigate({ to: "/browse" })}
                className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface"
              >
                {t("payment.back_to_browse")}
              </button>
            </div>
          )}

          {status === "expired" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <Loader2 className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.timed_out")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {t("payment.timed_out_desc")}
                </p>
              </div>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigate({ to: "/library" })}
                  className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface"
                >
                  {t("payment.check_library")}
                </button>
                <button
                  onClick={() => navigate({ to: "/browse" })}
                  className="inline-flex h-10 items-center rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
                >
                  {t("common.browse_projects")}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
