import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  useNavigate,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "@/components/ui/sonner";
import ClickSpark from "@/components/ClickSpark";
import { setAccessToken, setRefreshToken } from "@/lib/api/client";
import { handleAuthHash } from "@/lib/auth-hash";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

import i18n from "@/i18n/i18n";
import { useTranslation } from "react-i18next";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md">
        <div className="font-mono text-xs text-muted-foreground">404 / not_found</div>
        <h1 className="mt-3 font-mono text-3xl tracking-tight text-foreground">{t("error.page_not_found")}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.not_found_desc")}
        </p>
        <div className="mt-6 flex gap-2">
          <Link
            to="/"
            className="inline-flex h-9 items-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("common.go_home")}
          </Link>
          <Link
            to="/browse"
            className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("common.browse_projects")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md">
        <div className="font-mono text-xs text-destructive">error / boundary</div>
        <h1 className="mt-3 font-mono text-2xl tracking-tight text-foreground">
          {t("error.page_didnt_load")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("error.boundary_desc")}
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            {t("common.retry")}
          </button>
          <a
            href="/"
            className="inline-flex h-9 items-center rounded-sm border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            {t("common.go_home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: i18n.t("brand.og_title") },
      {
        name: "description",
        content: i18n.t("brand.meta_desc"),
      },
      { name: "author", content: "Cooplink" },
      { property: "og:title", content: i18n.t("brand.og_title") },
      {
        property: "og:description",
        content: i18n.t("brand.og_desc"),
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState(i18n.language);
  useEffect(() => {
    setLang(i18n.language);
    const handle = (lng: string) => setLang(lng);
    i18n.on("languageChanged", handle);
    return () => {
      i18n.off("languageChanged", handle);
    };
  }, []);
  return (
    <html lang={lang} suppressHydrationWarning>
      <head>
        <HeadContent />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("cooplink_theme");if(!t)t=window.matchMedia("(prefers-color-scheme:dark)").matches?"dark":"light";if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { t } = useTranslation();
  const { queryClient } = Route.useRouteContext();
  const navigate = useNavigate();
  const [authHashHandled, setAuthHashHandled] = useState(false);

  useEffect(() => {
    document.documentElement.lang = i18n.language;
    const handleLanguageChanged = (lng: string) => {
      document.documentElement.lang = lng;
    };
    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  useEffect(() => {
    const result = handleAuthHash(window.location.hash);
    if (result) {
      if (result.access) {
        setAccessToken(result.access);
        if (result.refresh) setRefreshToken(result.refresh);
        window.location.hash = "";
        // Invalidate cached user data so the layout refetches with the new tokens.
        // Without this, the layout serves stale data (e.g. isSeller: false) from
        // a previous session, blocking seller features after OAuth redirect.
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
        queryClient.invalidateQueries({ queryKey: ["github-repos"] });
        navigate({ to: "/dashboard/add-project", replace: true });
        return;
      }
      if (result.error) {
        window.location.hash = "";
        window.location.href = `/auth/sign-in?error=${encodeURIComponent(result.error)}`;
        return;
      }
    }
    setAuthHashHandled(true);
  }, [navigate]);

  if (!authHashHandled) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono text-sm text-muted-foreground" suppressHydrationWarning>
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ClickSpark
        sparkColor="#a3e635"
        sparkSize={10}
        sparkRadius={25}
        sparkCount={8}
        duration={450}
      >
        <Outlet />
        <Toaster />
      </ClickSpark>
    </QueryClientProvider>
  );
}
