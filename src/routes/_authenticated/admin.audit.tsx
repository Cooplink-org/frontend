import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/audit")({
  head: () => ({
    meta: [
      { title: "Audit log — Admin — Cooplink" },
      { name: "description", content: "Moderation audit log." },
      { property: "og:title", content: "Audit log — Admin — Cooplink" },
      { property: "og:description", content: "Moderation audit log." },
    ],
  }),
  component: () => {
    const query = useQuery({ queryKey: adminKeys.audit(), queryFn: () => adminApi.auditLog(200) });
    return (
      <QueryBoundary
        query={query}
        loading={<Skeleton className="h-40 w-full" />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No audit entries yet" />}
      >
        {(items) => (
          <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
            <table className="w-full min-w-[640px] font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-normal">when</th>
                  <th className="px-4 py-2 font-normal">actor</th>
                  <th className="px-4 py-2 font-normal">action</th>
                  <th className="px-4 py-2 font-normal">target</th>
                </tr>
              </thead>
              <tbody>
                {items.map((e) => (
                  <tr key={e.id} className="border-b border-border-subtle last:border-0">
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
  },
});
