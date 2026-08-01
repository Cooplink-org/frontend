import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import { listingsApi } from "@/lib/api/endpoints/listings";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/payment/success")({
  head: () => ({
    meta: [{ title: i18n.t("payment.success_title") }],
  }),
  component: PaymentSuccessPage,
});

function PaymentSuccessPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<"verifying" | "paid" | "failed" | "error">("verifying");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const payid = params.get("payid") || params.get("PayId") || params.get("payment_id") || "";

    if (!payid) {
      setState("error");
      setMessage(t("payment.no_payid"));
      return;
    }

    listingsApi
      .verifyPayment(payid)
      .then((result) => {
        if (result.status === "paid") {
          setState("paid");
          setMessage(t("payment.confirmed"));
        } else if (result.status === "failed") {
          setState("failed");
          setMessage(t("payment.failed_msg"));
        } else {
          setState("error");
          setMessage(t("payment.unexpected", { status: result.status }));
        }
      })
      .catch(() => {
        setState("error");
        setMessage(t("payment.verify_failed"));
      });
  }, []);

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center space-y-6">

          {state === "verifying" && (
            <div className="space-y-4">
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-muted-foreground" />
              <h2 className="font-mono text-xl text-foreground">{t("payment.verifying")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("payment.verifying_desc")}
              </p>
            </div>
          )}

          {state === "paid" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                <CheckCircle className="h-8 w-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.success_heading")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
              <button
                onClick={() => navigate({ to: "/library" })}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("payment.go_to_library")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {state === "failed" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                <XCircle className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.failed_heading")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              </div>
              <button
                onClick={() => navigate({ to: "/browse" })}
                className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface"
              >
                {t("payment.back_to_browse")}
              </button>
            </div>
          )}

          {state === "error" && (
            <div className="space-y-6">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10">
                <XCircle className="h-8 w-8 text-amber-500" />
              </div>
              <div>
                <h2 className="font-mono text-xl text-foreground">{t("payment.error_heading")}</h2>
                <p className="mt-2 text-sm text-muted-foreground">{message}</p>
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
