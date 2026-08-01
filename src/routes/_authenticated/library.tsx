import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Download, BookOpen, Loader2, ArrowRight } from "lucide-react";
import { listingsApi } from "@/lib/api/endpoints/listings";
import type { Purchase } from "@/lib/api/types";
import { formatUZS } from "@/lib/format";
import { getAccessToken } from "@/lib/api/client";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: i18n.t("library.title") },
      { name: "description", content: i18n.t("library.meta_desc") },
      { property: "og:title", content: i18n.t("library.title") },
      { property: "og:description", content: i18n.t("library.meta_desc") },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    listingsApi
      .myPurchases()
      .then(setPurchases)
      .catch(() => setError(t("library.toast.load_failed")))
      .finally(() => setLoading(false));
  }, []);

  async function handleDownload(orderId: number | string, slug: string, version: number | null) {
    try {
      const token = getAccessToken();
      const res = await fetch(`/api/orders/${orderId}/download/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "Download failed");
        throw new Error(text);
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${slug}${version ? `-v${version}` : ""}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("library.toast.download_failed"));
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("library.section")}</div>
        <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">{t("library.heading")}</h1>

        <div className="mt-6">
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {!loading && !error && purchases.length === 0 && (
            <div className="flex flex-col items-center py-20 text-center">
              <BookOpen className="h-10 w-10 text-muted-foreground/50" />
              <h3 className="mt-4 font-mono text-lg text-foreground">{t("library.empty_title")}</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("library.empty_desc")}
              </p>
              <button
                onClick={() => navigate({ to: "/browse" })}
                className="mt-6 inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90"
              >
                {t("common.browse_projects")} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {!loading && !error && purchases.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {purchases.map((p) => (
                <div
                  key={p.id}
                  className="group rounded-md border border-border-subtle bg-background p-5 transition-colors hover:border-border"
                >
                  {p.coverImage && (
                    <img
                      src={p.coverImage}
                      alt={p.title}
                      className="mb-4 h-36 w-full rounded-sm object-cover"
                    />
                  )}
                  <h3 className="truncate font-mono text-base text-foreground">{p.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{p.description}</p>

                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.techStack.slice(0, 3).map((t) => (
                      <span
                        key={t}
                        className="rounded-sm bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                      >
                        {t}
                      </span>
                    ))}
                    {p.techStack.length > 3 && (
                      <span className="rounded-sm bg-surface px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
                        +{p.techStack.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-border-subtle pt-3">
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatUZS(p.price)}
                    </span>
                    <button
                      onClick={() => handleDownload(p.id, p.slug, p.version)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-sm bg-accent px-3 text-xs font-medium text-[color:var(--accent-lime-ink)] hover:opacity-90"
                    >
                      <Download className="h-3.5 w-3.5" />
                      {t("library.download")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
