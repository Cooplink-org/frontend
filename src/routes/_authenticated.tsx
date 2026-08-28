import { Link, Outlet, createFileRoute, useRouterState, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { notificationsApi, notificationKeys } from "@/lib/api/endpoints/notifications";
import {
  Bell,
  Compass,
  LayoutDashboard,
  LibraryBig,
  ListPlus,
  LogOut,
  Moon,
  Plus,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Sun,
  Wallet,
} from "lucide-react";
import { authApi } from "@/lib/api/endpoints/auth";
import { clearTokens, getAccessToken, getRefreshToken, refreshTokens } from "@/lib/api/client";
import type { User } from "@/lib/api/types";
import { useEffect, useState, useCallback } from "react";

type Theme = "light" | "dark";

function useTheme() {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const stored = localStorage.getItem("cooplink_theme") as Theme | null;
    if (stored) return stored;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem("cooplink_theme", theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { theme, toggleTheme };
}

/**
 * NOTE: This route guard is a UX convenience only.
 * The real security boundary is server-side once the API is wired — a frontend
 * gate alone is never sufficient. Every protected endpoint must independently
 * verify the caller.
 */
export const Route = createFileRoute("/_authenticated")({
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [silentRefreshDone, setSilentRefreshDone] = useState(false);

  // Silent refresh: if no access token but a refresh token exists, try to refresh
  useEffect(() => {
    if (getAccessToken()) {
      setSilentRefreshDone(true);
      return;
    }
    if (!getRefreshToken()) {
      setSilentRefreshDone(true);
      return;
    }
    refreshTokens().finally(() => setSilentRefreshDone(true));
  }, []);

  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 60_000,
    enabled: silentRefreshDone,
  });

  // Redirect to sign-in if the user is not authenticated (me query failed with 401)
  useEffect(() => {
    if (silentRefreshDone && meQuery.isError && !getAccessToken()) {
      navigate({ to: "/auth/sign-in", replace: true });
    }
  }, [silentRefreshDone, meQuery.isError, navigate]);

  // Redirect to onboarding if the user hasn't completed it yet
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (meQuery.data && !meQuery.data.isOnboarded && !pathname.startsWith("/onboarding")) {
      navigate({ to: "/onboarding", replace: true });
    }
  }, [meQuery.data, pathname, navigate]);

  // Show loading while silent refresh is in progress
  if (!silentRefreshDone) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="font-mono text-sm text-muted-foreground" suppressHydrationWarning>
          {t("common.loading")}
        </div>
      </div>
    );
  }

  return <AppShell user={meQuery.data ?? null} pathname={pathname} />;
}

function useNavItems(t: (key: string) => string) {
  return [
    { to: "/dashboard", label: t("nav.dashboard"), icon: LayoutDashboard },
    { to: "/browse", label: t("nav.browse"), icon: Compass },
    { to: "/dashboard/listings", label: t("nav.my_listings"), icon: ListPlus },
    { to: "/dashboard/payouts", label: t("nav.payouts"), icon: Wallet },
    { to: "/library", label: t("nav.library"), icon: LibraryBig },
    { to: "/settings", label: t("nav.settings"), icon: SettingsIcon },
  ];
}

function AppShell({ user, pathname }: { user: User | null; pathname: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isAdmin = user?.role === "admin";
  const { theme, toggleTheme } = useTheme();
  const NAV = useNavItems(t);
  const unreadQuery = useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () => notificationsApi.unreadCount(),
    refetchInterval: 30_000,
  });
  const unread = unreadQuery.data ?? 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-[220px_1fr] max-lg:grid-cols-1">
        {/* Sidebar */}
        <aside className="hidden border-r border-border-subtle bg-background lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-border-subtle px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-foreground" aria-hidden />
              <span className="font-mono text-sm text-foreground">{t("brand.name")}</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5 p-3">
            <button
              onClick={() => navigate({ to: "/dashboard/add-project" })}
              className="mb-3 flex w-full items-center gap-2 rounded-sm bg-primary px-2.5 py-2 text-sm font-medium text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              {t("nav.new_listing")}
            </button>
            {NAV.map((n) => {
              const active =
                n.to === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <n.icon className="h-4 w-4" strokeWidth={1.75} />
                  {n.label}
                </Link>
              );
            })}

            {isAdmin && (
              <>
                <div className="mt-6 px-2.5 pb-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t("sidebar.admin")}
                </div>
                <Link
                  to="/admin"
                  className={`flex items-center gap-2.5 rounded-sm px-2.5 py-1.5 text-sm transition-colors ${
                    pathname.startsWith("/admin")
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`}
                >
                  <ShieldAlert className="h-4 w-4" strokeWidth={1.75} />
                  {t("admin.title")}
                </Link>
              </>
            )}
          </nav>

          <div className="border-t border-border-subtle p-3">
            <div className="flex items-center gap-2 rounded-sm px-2 py-1.5">
              <div className="h-6 w-6 rounded-full border border-border-subtle bg-surface" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-mono text-xs text-foreground">
                  {user?.username ?? "@you"}
                </div>
                <div className="truncate text-[10px] text-muted-foreground">
                  {user?.role ?? t("sidebar.signed_out")}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={t("sidebar.switch_theme", { theme: theme === "dark" ? "light" : "dark" })}
              >
                {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => {
                  clearTokens();
                  window.location.href = "/";
                }}
                className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label={t("nav.sign_out")}
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          {/* Top bar */}
          <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border-subtle bg-background/90 px-4 backdrop-blur sm:px-6">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative w-full max-w-md">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                <input
                  placeholder={t("search.placeholder")}
                  className="h-8 w-full rounded-sm border border-border-subtle bg-surface pl-8 pr-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-border"
                />
              </div>
            </div>
            <button
              onClick={() => navigate({ to: "/notifications" })}
              className="relative inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-subtle text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label={t("notifications.aria")}
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-mono text-[9px] leading-none text-primary-foreground">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
          </header>

          <main key={pathname} className="min-w-0 flex-1 animate-fade-in-up">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
