import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: i18n.t("admin.users") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { name: "description", content: i18n.t("admin.users") + " — " + i18n.t("admin.title") },
      { property: "og:title", content: i18n.t("admin.users") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { property: "og:description", content: i18n.t("admin.users") + " — " + i18n.t("admin.title") },
    ],
  }),
  component: AdminUsersPage,
});

function AdminUsersPage() {
  const { t } = useTranslation();
  const [q, setQ] = useState("");
  const query = useQuery({ queryKey: adminKeys.users(q), queryFn: () => adminApi.users(q) });
  return (
    <div className="space-y-3">
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={t("search.placeholder")}
        className="h-8 w-full max-w-sm rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs outline-none focus:border-border"
      />
      <QueryBoundary
        query={query}
        loading={<Skeleton className="h-40 w-full" />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title={t("admin.no_users")} />}
      >
        {(users) => (
          <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
            <table className="w-full min-w-[640px] font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-normal">{t("admin.table.user")}</th>
                  <th className="px-4 py-2 font-normal">{t("admin.table.role")}</th>
                  <th className="px-4 py-2 font-normal">{t("admin.table.joined")}</th>
                  <th className="px-4 py-2 text-right font-normal">{t("admin.action")}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={String(u.id)} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-2 text-foreground">@{u.username as string}</td>
                    <td className="px-4 py-2 text-muted-foreground">{u.role as string}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatDate(u.createdAt as string)}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const isBanned = (u as Record<string, unknown>).isBanned === true;
                            await adminApi.setUserBanned(String(u.id), !isBanned);
                            toast.success(isBanned ? t("admin.toast.unbanned") : t("admin.toast.banned"));
                            query.refetch();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : t("admin.toast.failed"));
                          }
                        }}
                        className={`rounded-sm border px-2 py-0.5 ${(u as Record<string, unknown>).isBanned === true ? "border-success/40 text-success" : "border-destructive/40 text-destructive"}`}
                      >
                        {(u as Record<string, unknown>).isBanned === true ? t("admin.unban") : t("admin.ban")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </QueryBoundary>
    </div>
  );
}