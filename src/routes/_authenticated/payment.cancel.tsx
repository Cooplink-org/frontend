import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { XCircle } from "lucide-react";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/payment/cancel")({
  head: () => ({
    meta: [{ title: i18n.t("payment.cancel_title") }],
  }),
  component: PaymentCancelPage,
});

function PaymentCancelPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative flex min-h-[70vh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-md text-center space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <XCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div>
            <h2 className="font-mono text-xl text-foreground">{t("payment.cancel_heading")}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {t("payment.cancel_desc")}
            </p>
          </div>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => navigate({ to: "/browse" })}
              className="inline-flex h-10 items-center rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface"
            >
              {t("payment.back_to_browse")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
