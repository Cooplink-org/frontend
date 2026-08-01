import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Github } from "lucide-react";
import { authApi } from "@/lib/api/endpoints/auth";
import { toast } from "sonner";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: i18n.t("auth.sign_in_title") },
      { name: "description", content: i18n.t("auth.sign_in_desc") },
      { property: "og:title", content: i18n.t("auth.sign_in_title") },
      { property: "og:description", content: i18n.t("auth.sign_in_desc") },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const err = params.get("error");
    if (err) {
      setError(err);
    }
  }, []);

  async function handleGitHubLogin() {
    setLoading(true);
    setError(null);
    try {
      const authorizationUrl = await authApi.getGitHubLoginUrl();
      window.location.href = authorizationUrl;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("auth.github_login_failed"));
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border-subtle bg-surface md:block">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-70" aria-hidden />
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm bg-foreground" aria-hidden />
            <span className="font-mono text-sm text-foreground">{t("brand.name")}</span>
          </Link>
          <blockquote className="max-w-sm">
            <p className="font-mono text-lg leading-snug text-foreground">
              {t("auth.quote")}
            </p>
            <footer className="mt-3 font-mono text-xs text-muted-foreground">
              {t("auth.quote_attr")}
            </footer>
          </blockquote>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {t("nav.sign_in")}
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">
            {t("auth.welcome")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t("auth.welcome_desc")}
          </p>

          {error && (
            <div className="mt-4 rounded-sm border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleGitHubLogin}
            disabled={loading}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-50"
          >
            <Github className="h-4 w-4" />
            {loading ? t("auth.redirecting") : t("auth.continue_with_github")}
          </button>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {t("auth.first_time")}{" "}
            <button
              onClick={handleGitHubLogin}
              className="text-foreground underline-offset-4 hover:underline"
            >
              {t("auth.sign_up_with_github")}
            </button>
            {" "}{t("auth.auto_account")}
          </p>
        </div>
      </main>
    </div>
  );
}
