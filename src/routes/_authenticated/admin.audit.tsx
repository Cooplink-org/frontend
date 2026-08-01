import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: i18n.t("admin.audit_log") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { name: "description", content: i18n.t("admin.audit_log") },
      { property: "og:title", content: i18n.t("admin.audit_log") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { property: "og:description", content: i18n.t("admin.audit_log") },
    ],
  }),
  component: AdminAuditPage,
});

function AdminAuditPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: adminKeys.audit(), queryFn: () => adminApi.auditLog(200) });
  return (
    <QueryBoundary
      query={query}
      loading={<Skeleton className="h-40 w-full" />}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState title={t("admin.no_audit")} />}
    >
      {(items) => (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
          <table className="w-full min-w-[640px] font-mono text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-normal">{t("admin.when")}</th>
                <th className="px-4 py-2 font-normal">{t("admin.actor")}</th>
                <th className="px-4 py-2 font-normal">{t("admin.action")}</th>
                <th className="px-4 py-2 font-normal">{t("admin.target")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((e) => (
                <tr key={String(e.id)} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-2 text-muted-foreground">{formatRelative(e.createdAt)}</td>
                  <td className="px-4 py-2 text-foreground">@{e.actor.username}</td>
                  <td className="px-4 py-2 text-foreground">{e.action}</td>
                  <td className="px-4 py-2 text-muted-foreground">{e.target}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </QueryBoundary>
  );
}