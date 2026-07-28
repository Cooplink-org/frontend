import { NotImplementedError } from "../client";
import type { AuditLogEntry, Listing, Report, User } from "../types";

export const adminApi = {
  async reports(_status: "open" | "actioned" | "dismissed" = "open"): Promise<Report[]> {
    throw new NotImplementedError("GET /admin/reports");
  },
  async resolveReport(_id: string, _action: "dismiss" | "action"): Promise<void> {
    throw new NotImplementedError("POST /admin/reports/:id/resolve");
  },
  async users(_q?: string): Promise<User[]> {
    throw new NotImplementedError("GET /admin/users");
  },
  async setUserBanned(_id: string, _banned: boolean): Promise<void> {
    throw new NotImplementedError("POST /admin/users/:id/ban");
  },
  async projects(_status?: string): Promise<Listing[]> {
    throw new NotImplementedError("GET /admin/projects");
  },
  async setProjectRemoved(_id: string, _removed: boolean): Promise<void> {
    throw new NotImplementedError("POST /admin/projects/:id/remove");
  },
  async auditLog(_limit = 100): Promise<AuditLogEntry[]> {
    throw new NotImplementedError("GET /admin/audit");
  },
};

export const adminKeys = {
  reports: (status: string) => ["admin", "reports", status] as const,
  users: (q?: string) => ["admin", "users", q ?? ""] as const,
  projects: (status?: string) => ["admin", "projects", status ?? ""] as const,
  audit: () => ["admin", "audit"] as const,
};
