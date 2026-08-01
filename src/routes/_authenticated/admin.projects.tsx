import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatUZS } from "@/lib/format";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({
    meta: [
      { title: i18n.t("admin.projects") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { name: "description", content: i18n.t("admin.projects") + " — " + i18n.t("admin.title") },
      { property: "og:title", content: i18n.t("admin.projects") + " — " + i18n.t("admin.title") + " — Cooplink" },
      { property: "og:description", content: i18n.t("admin.projects") + " — " + i18n.t("admin.title") },
    ],
  }),
  component: AdminProjectsPage,
});

function AdminProjectsPage() {
  const { t } = useTranslation();
  const query = useQuery({ queryKey: adminKeys.projects(), queryFn: () => adminApi.projects() });
  return (
    <QueryBoundary
      query={query}
      loading={<Skeleton className="h-40 w-full" />}
      isEmpty={(d) => d.length === 0}
      empty={<EmptyState title={t("admin.no_projects")} />}
    >
      {(items) => (
        <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
          <table className="w-full min-w-[720px] font-mono text-xs">
            <thead>
              <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-2 font-normal">{t("admin.table.title")}</th>
                <th className="px-4 py-2 font-normal">{t("admin.table.seller")}</th>
                <th className="px-4 py-2 font-normal">{t("admin.table.status")}</th>
                <th className="px-4 py-2 text-right font-normal">{t("admin.table.price")}</th>
                <th className="px-4 py-2 text-right font-normal">{t("admin.action")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((p) => {
                const seller = (p as Record<string, unknown>).seller as Record<string, unknown> | undefined;
                const price = (p as Record<string, unknown>).price as string | undefined;
                return (
                  <tr key={String(p.id)} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-2 text-foreground">{p.title as string}</td>
                    <td className="px-4 py-2 text-muted-foreground">
                      @{(seller?.username as string) ?? "—"}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{p.status as string}</td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {formatUZS(price)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={async () => {
                          try {
                            const removed = p.status === "removed";
                            await adminApi.setProjectRemoved(String(p.id), !removed);
                            toast.success(removed ? t("admin.toast.restored") : t("admin.toast.removed"));
                            query.refetch();
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : t("admin.toast.failed"));
                          }
                        }}
                        className="rounded-sm border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground"
                      >
                        {p.status === "removed" ? t("admin.restore") : t("admin.remove")}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </QueryBoundary>
  );
}