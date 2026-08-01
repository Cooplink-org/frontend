import { request } from "../client";
import type { Paginated } from "../client";
import type { NotificationItem } from "../types";

export const notificationsApi = {
  async list(page = 1, pageSize = 20): Promise<Paginated<NotificationItem>> {
    const raw = await request<Record<string, unknown>>("/telegram/", {
      query: { page, page_size: pageSize },
    });
    return {
      count: raw.count as number,
      next: (raw.next as string | null) ?? null,
      previous: (raw.previous as string | null) ?? null,
      results: ((raw.results as Record<string, unknown>[]) ?? []).map(normalizeNotification),
    };
  },

  async markRead(id: NotificationItem["id"]): Promise<void> {
    await request<Record<string, unknown>>(`/telegram/${id}/read/`, { method: "POST" });
  },

  async markAllRead(): Promise<void> {
    await request<Record<string, unknown>>("/telegram/read/", { method: "POST" });
  },

  async unreadCount(): Promise<number> {
    const raw = await request<Record<string, unknown>>("/telegram/unread-count/");
    return (raw.count as number) ?? 0;
  },
};

export const notificationKeys = {
  list: (page: number) => ["notifications", "list", page] as const,
  unreadCount: () => ["notifications", "unread-count"] as const,
};

function normalizeNotification(raw: Record<string, unknown>): NotificationItem {
  return {
    id: raw.id as NotificationItem["id"],
    type: raw.type as string,
    title: raw.title as string,
    body: (raw.body as string) ?? "",
    link: (raw.link as string) ?? "",
    isRead: raw.is_read as boolean,
    createdAt: raw.created_at as string,
  };
}
