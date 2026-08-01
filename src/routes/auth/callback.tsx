import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { getAccessToken } from "@/lib/api/client";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/auth/callback")({
  head: () => ({
    meta: [{ title: i18n.t("auth.redirecting") }],
  }),
  component: AuthCallbackPage,
});

function AuthCallbackPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  useEffect(() => {
    // The root route (__root.tsx) handles the OAuth hash fragment on page load.
    // This route only fires if someone navigates directly to /auth/callback.
    // If tokens are already set, go to dashboard; otherwise sign-in.
    if (getAccessToken()) {
      navigate({ to: "/dashboard", replace: true });
    } else {
      navigate({ to: "/auth/sign-in", replace: true });
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="font-mono text-sm text-muted-foreground">{t("auth.completing_signin")}</div>
    </div>
  );
}
