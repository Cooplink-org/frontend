import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Reports — Admin — Cooplink" },
      { name: "description", content: "Moderation report queue." },
      { property: "og:title", content: "Reports — Admin — Cooplink" },
      { property: "og:description", content: "Moderation report queue." },
    ],
  }),
  component: () => {
    const q = useQuery({ queryKey: adminKeys.reports("open"), queryFn: () => adminApi.reports("open") });
    return (
      <QueryBoundary
        query={q}
        loading={<Skeleton className="h-40 w-full" />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No open reports" description="The queue is clear." />}
      >
        {(items) => (
          <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
            <table className="w-full min-w-[720px] font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-normal">target</th>
                  <th className="px-4 py-2 font-normal">reason</th>
                  <th className="px-4 py-2 font-normal">reporter</th>
                  <th className="px-4 py-2 font-normal">when</th>
                  <th className="px-4 py-2 text-right font-normal">action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-2 text-foreground">
                      {r.target.type}: {r.target.label}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{r.reason}</td>
                    <td className="px-4 py-2 text-muted-foreground">@{r.reporter.username}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatRelative(r.createdAt)}</td>
                    <td className="px-4 py-2 text-right">
                      <div className="inline-flex gap-1">
                        <button
                          onClick={async () => {
                            try {
                              await adminApi.resolveReport(r.id, "dismiss");
                              toast.success("Dismissed");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            }
                          }}
                          className="rounded-sm border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground"
                        >
                          dismiss
                        </button>
                        <button
                          onClick={async () => {
                            try {
                              await adminApi.resolveReport(r.id, "action");
                              toast.success("Actioned");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            }
                          }}
                          className="rounded-sm bg-destructive px-2 py-0.5 text-destructive-foreground"
                        >
                          action
                        </button>
                      </div>
                    </td>
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
