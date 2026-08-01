import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { BellRing, CheckCheck } from "lucide-react";
import { notificationsApi, notificationKeys } from "@/lib/api/endpoints/notifications";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelative } from "@/lib/format";
import type { NotificationItem } from "@/lib/api/types";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: i18n.t("notifications.title") },
      { name: "description", content: i18n.t("notifications.meta_desc") },
      { property: "og:title", content: i18n.t("notifications.title") },
      { property: "og:description", content: i18n.t("notifications.meta_desc") },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: notificationKeys.list(1),
    queryFn: () => notificationsApi.list(1, 50),
  });

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(1) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: NotificationItem["id"]) => notificationsApi.markRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.list(1) });
      queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount() });
    },
  });

  async function handleClick(id: NotificationItem["id"], link: string) {
    markReadMutation.mutate(id);
    if (link) navigate({ to: link });
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              {t("notifications.section")}
            </div>
            <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">
              {t("notifications.heading")}
            </h1>
          </div>
          <button
            onClick={() => markAllMutation.mutate()}
            disabled={markAllMutation.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-sm border border-border-subtle bg-background px-3 font-mono text-xs text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          >
            <CheckCheck className="h-3.5 w-3.5" strokeWidth={1.75} />
            {t("notifications.mark_all_read")}
          </button>
        </div>

        <div className="mt-6">
          <QueryBoundary
            query={listQuery}
            loading={
              <div className="space-y-3">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            }
            isEmpty={(d) => d.results.length === 0}
            empty={
              <EmptyState
                icon={<BellRing className="h-4 w-4" strokeWidth={1.75} />}
                title={t("placeholder.no_notifications")}
              />
            }
          >
            {(data) => (
              <div className="space-y-3">
                {data.results.map((n) => (
                  <button
                    key={String(n.id)}
                    onClick={() => handleClick(n.id, n.link)}
                    className={`w-full rounded-md border p-4 text-left transition-colors ${
                      n.isRead ? "border-border-subtle bg-background" : "border-border bg-surface"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          {!n.isRead && (
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          )}
                          <span className="truncate font-mono text-sm text-foreground">
                            {n.title}
                          </span>
                        </div>
                        {n.body && <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>}
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {formatRelative(n.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </QueryBoundary>
        </div>
      </div>
    </div>
  );
}
