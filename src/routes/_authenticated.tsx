import { Link, Outlet, createFileRoute, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Compass,
  LayoutDashboard,
  LibraryBig,
  ListPlus,
  LogOut,
  Search,
  Settings as SettingsIcon,
  ShieldAlert,
  Wallet,
} from "lucide-react";
import { authApi } from "@/lib/api/endpoints/auth";
import { setAuthToken } from "@/lib/api/client";
import type { User } from "@/lib/api/types";

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
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
    retry: false,
    staleTime: 60_000,
  });

  // We render the shell regardless so protected pages can show their own
  // loading/error states. Real gate logic (redirect when 401) happens once
  // the API is wired.
  return <AppShell user={meQuery.data ?? null} />;
}

const NAV = [
  { to: "/browse", label: "Browse", icon: Compass },
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/dashboard/listings", label: "My listings", icon: ListPlus },
  { to: "/dashboard/payouts", label: "Payouts", icon: Wallet },
  { to: "/library", label: "Library", icon: LibraryBig },
  { to: "/settings", label: "Settings", icon: SettingsIcon },
];

function AppShell({ user }: { user: User | null }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isAdmin = user?.role === "admin";

  return (
    <div className="min-h-screen bg-background">
      <div className="grid min-h-screen grid-cols-[220px_1fr] max-lg:grid-cols-1">
        {/* Sidebar */}
        <aside className="hidden border-r border-border-subtle bg-background lg:flex lg:flex-col">
          <div className="flex h-14 items-center border-b border-border-subtle px-4">
            <Link to="/" className="flex items-center gap-2">
              <div className="h-4 w-4 rounded-sm bg-foreground" aria-hidden />
              <span className="font-mono text-sm text-foreground">cooplink</span>
            </Link>
          </div>

          <nav className="flex-1 space-y-0.5 p-3">
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
                  admin
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
                  Moderation
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
                  {user?.role ?? "signed out"}
                </div>
              </div>
              <button
                onClick={() => {
                  setAuthToken(null);
                  window.location.href = "/";
                }}
                className="rounded-sm p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"
                aria-label="Sign out"
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
                  placeholder="Search projects, sellers, tags…"
                  className="h-8 w-full rounded-sm border border-border-subtle bg-surface pl-8 pr-2 font-mono text-xs text-foreground outline-none placeholder:text-muted-foreground focus:border-border"
                />
              </div>
            </div>
            <button
              className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border-subtle text-muted-foreground hover:bg-secondary hover:text-foreground"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </header>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
