import { createFileRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import { FileWarning, ScrollText, Trash2, Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
});

const ADMIN_NAV = [
  { to: "/admin", label: "Reports", icon: FileWarning, exact: true },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/projects", label: "Projects", icon: Trash2 },
  { to: "/admin/audit", label: "Audit log", icon: ScrollText },
];

function AdminLayout() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
        <div className="rounded-sm bg-destructive/10 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-destructive">
          staff
        </div>
        <div className="font-mono text-sm text-foreground">Moderation console</div>
      </div>
      <nav className="mt-4 flex flex-wrap gap-1">
        {ADMIN_NAV.map((n) => {
          const active = n.exact ? pathname === n.to : pathname.startsWith(n.to);
          return (
            <Link
              key={n.to}
              to={n.to}
              className={`inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 font-mono text-xs transition-colors ${
                active ? "bg-secondary text-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <n.icon className="h-3.5 w-3.5" strokeWidth={1.75} />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-6">
        <Outlet />
      </div>
    </div>
  );
}
