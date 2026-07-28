import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { adminApi, adminKeys } from "@/lib/api/endpoints/admin";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/admin/users")({
  head: () => ({
    meta: [
      { title: "Users — Admin — Cooplink" },
      { name: "description", content: "User moderation." },
      { property: "og:title", content: "Users — Admin — Cooplink" },
      { property: "og:description", content: "User moderation." },
    ],
  }),
  component: () => {
    const [q, setQ] = useState("");
    const query = useQuery({ queryKey: adminKeys.users(q), queryFn: () => adminApi.users(q) });
    return (
      <div className="space-y-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search users…"
          className="h-8 w-full max-w-sm rounded-sm border border-border-subtle bg-background px-2 font-mono text-xs outline-none focus:border-border"
        />
        <QueryBoundary
          query={query}
          loading={<Skeleton className="h-40 w-full" />}
          isEmpty={(d) => d.length === 0}
          empty={<EmptyState title="No users match" />}
        >
          {(users) => (
            <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
              <table className="w-full min-w-[640px] font-mono text-xs">
                <thead>
                  <tr className="border-b border-border-subtle text-left text-[10px] uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-2 font-normal">user</th>
                    <th className="px-4 py-2 font-normal">role</th>
                    <th className="px-4 py-2 font-normal">joined</th>
                    <th className="px-4 py-2 text-right font-normal">action</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-border-subtle last:border-0">
                      <td className="px-4 py-2 text-foreground">@{u.username}</td>
                      <td className="px-4 py-2 text-muted-foreground">{u.role}</td>
                      <td className="px-4 py-2 text-muted-foreground">{formatDate(u.createdAt)}</td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={async () => {
                            try {
                              await adminApi.setUserBanned(u.id, true);
                              toast.success("Banned");
                            } catch (e) {
                              toast.error(e instanceof Error ? e.message : "Failed");
                            }
                          }}
                          className="rounded-sm border border-destructive/40 px-2 py-0.5 text-destructive"
                        >
                          ban
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
  },
});
