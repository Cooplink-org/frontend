import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/projects")({
  head: () => ({
    meta: [
      { title: "Projects — Admin — Cooplink" },
      { name: "description", content: "Project moderation." },
      { property: "og:title", content: "Projects — Admin — Cooplink" },
      { property: "og:description", content: "Project moderation." },
    ],
  }),
  component: () => {
    const query = useQuery({ queryKey: adminKeys.projects(), queryFn: () => adminApi.projects() });
    return (
      <QueryBoundary
        query={query}
        loading={<Skeleton className="h-40 w-full" />}
        isEmpty={(d) => d.length === 0}
        empty={<EmptyState title="No projects" />}
      >
        {(items) => (
          <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
            <table className="w-full min-w-[720px] font-mono text-xs">
              <thead>
                <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-2 font-normal">title</th>
                  <th className="px-4 py-2 font-normal">seller</th>
                  <th className="px-4 py-2 font-normal">status</th>
                  <th className="px-4 py-2 text-right font-normal">price</th>
                  <th className="px-4 py-2 text-right font-normal">action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((p) => (
                  <tr key={p.id} className="border-b border-border-subtle last:border-0">
                    <td className="px-4 py-2 text-foreground">{p.title}</td>
                    <td className="px-4 py-2 text-muted-foreground">@{p.seller.username}</td>
                    <td className="px-4 py-2 text-muted-foreground">{p.status}</td>
                    <td className="px-4 py-2 text-right text-foreground">
                      {formatMoney(p.priceCents, p.currency)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={async () => {
                          try {
                            await adminApi.setProjectRemoved(p.id, p.status !== "removed");
                            toast.success("Updated");
                          } catch (e) {
                            toast.error(e instanceof Error ? e.message : "Failed");
                          }
                        }}
                        className="rounded-sm border border-border px-2 py-0.5 text-muted-foreground hover:text-foreground"
                      >
                        {p.status === "removed" ? "restore" : "remove"}
                      </button>
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
