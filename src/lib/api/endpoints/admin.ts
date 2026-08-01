import { request } from "../client";
import type { Report, AuditLogEntry } from "../types";

export const adminApi = {
  async reports(statusFilter: "open" | "actioned" | "dismissed" = "open"): Promise<Report[]> {
    const raw = await request<Record<string, unknown>[]>("/moderation/admin/reports/", {
      query: { status: statusFilter },
    });
    return raw.map(normalizeReport);
  },
  async resolveReport(id: string, action: "dismiss" | "action"): Promise<void> {
    await request(`/moderation/admin/reports/${id}/`, {
      method: "PATCH",
      body: { status: action === "dismiss" ? "dismissed" : "actioned" },
    });
  },
  async users(q?: string): Promise<Record<string, unknown>[]> {
    const raw = await request<Record<string, unknown>[]>("/moderation/admin/users/", {
      query: q ? { q } : undefined,
    });
    return raw.map(normalizeAdminUser);
  },
  async setUserBanned(id: string, banned: boolean): Promise<void> {
    const endpoint = banned ? "ban" : "unban";
    await request(`/moderation/admin/users/${id}/${endpoint}/`, {
      method: "POST",
    });
  },
  async projects(statusFilter?: string): Promise<Record<string, unknown>[]> {
    const raw = await request<Record<string, unknown>[]>("/moderation/admin/projects/", {
      query: statusFilter ? { status: statusFilter } : undefined,
    });
    return raw.map(normalizeAdminProject);
  },
  async setProjectRemoved(id: string, removed: boolean): Promise<void> {
    const endpoint = removed ? "delete" : "restore";
    await request(`/moderation/admin/projects/${id}/${endpoint}/`, {
      method: "POST",
    });
  },
  async auditLog(limit = 100): Promise<AuditLogEntry[]> {
    const raw = await request<Record<string, unknown>[]>("/moderation/admin/log/", {
      query: { limit },
    });
    return raw.map(normalizeAuditEntry);
  },
};

export const adminKeys = {
  reports: (status: string) => ["admin", "reports", status] as const,
  users: (q?: string) => ["admin", "users", q ?? ""] as const,
  projects: (status?: string) => ["admin", "projects", status ?? ""] as const,
  audit: () => ["admin", "audit"] as const,
};

function normalizeReport(raw: Record<string, unknown>): Report {
  const targetRaw = raw.target as Record<string, unknown> | null;
  const reporterRaw = raw.reporter as Record<string, unknown> | null;
  return {
    id: raw.id as Report["id"],
    target: {
      type: (targetRaw?.type as Report["target"]["type"]) ?? "project",
      id: (targetRaw?.id ?? raw.target_id) as string,
      label: (targetRaw?.label ?? raw.target_label ?? "") as string,
    },
    reporter: {
      id: (reporterRaw?.id ?? raw.reporter_id) as string,
      username: (reporterRaw?.username ?? raw.reporter_username) as string,
    },
    reason: raw.reason as string,
    body: (raw.body as string | null) ?? null,
    status: (raw.status as Report["status"]) ?? "open",
    createdAt: raw.created_at as string,
  };
}

function normalizeAdminUser(raw: Record<string, unknown>): Record<string, unknown> {
  return {
    id: raw.id,
    username: raw.username,
    role: raw.is_staff === true ? "admin" : "user",
    createdAt: raw.created_at ?? raw.date_joined,
    isBanned: raw.is_banned ?? raw.is_active === false,
  };
}

function normalizeAdminProject(raw: Record<string, unknown>): Record<string, unknown> {
  const sellerRaw = raw.seller_profile as Record<string, unknown> | null;
  return {
    id: raw.id,
    title: raw.title,
    slug: raw.slug,
    seller: sellerRaw ? { username: sellerRaw.username } : { username: raw.seller_username ?? "—" },
    status: raw.status,
    price: raw.price,
  };
}

function normalizeAuditEntry(raw: Record<string, unknown>): AuditLogEntry {
  const actorRaw = raw.actor as Record<string, unknown> | null;
  return {
    id: raw.id as AuditLogEntry["id"],
    actor: {
      id: (actorRaw?.id ?? raw.actor_id) as string,
      username: (actorRaw?.username ?? raw.actor_username) as string,
    },
    action: raw.action as string,
    target: raw.target as string,
    createdAt: raw.created_at as string,
    meta: (raw.meta as Record<string, unknown> | null) ?? null,
  };
}
