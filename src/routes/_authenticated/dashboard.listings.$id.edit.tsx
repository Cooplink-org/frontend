import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { request } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/api/types";
import i18n from "@/i18n/i18n";
import {
  ArrowLeft,
  Loader2,
  Save,
  Tag,
  Code2,
  FileText,
  DollarSign,
  Sparkles,
  Upload,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/listings/$id/edit")({
  head: () => ({
    meta: [{ title: i18n.t("edit_listing.title") }],
  }),
  component: EditListingPage,
});

function EditListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = Route.useParams();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<number | "">("");
  const [tags, setTags] = useState("");
  const [techStack, setTechStack] = useState("");
  const [licenseType, setLicenseType] = useState("proprietary");
  const [demoUrl, setDemoUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [newVersioning, setNewVersioning] = useState(false);
  const [error, setError] = useState("");

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const resp = await fetch("/api/listings/categories/");
      if (!resp.ok) return [];
      return resp.json() as Promise<Category[]>;
    },
  });

  const { data: project, isLoading } = useQuery({
    queryKey: ["project", id],
    queryFn: async () => {
      const raw = await request<Record<string, unknown>>(`/listings/projects/${id}/`);
      return raw;
    },
  });

  useEffect(() => {
    if (!project) return;
    setTitle((project.title as string) ?? "");
    setDescription((project.description as string) ?? "");
    setPrice((project.price as string) ?? "");
    setCategory((project.category as number) ?? "");
    setTags(((project.tags as string[]) ?? []).join(", "));
    setTechStack(((project.tech_stack as string[]) ?? []).join(", "));
    setLicenseType((project.license_type as string) ?? "proprietary");
    setDemoUrl((project.demo_url as string) ?? "");
  }, [project]);

  async function handleSave() {
    if (!title.trim() || !price.trim()) {
      toast.error(t("edit_listing.toast.required"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      const body: Record<string, unknown> = {
        title: title.trim(),
        description: description.trim(),
        price: price.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        tech_stack: techStack.split(",").map((t) => t.trim()).filter(Boolean),
        license_type: licenseType,
      };
      if (category) body.category = category;
      if (demoUrl.trim()) body.demo_url = demoUrl.trim();

      await request(`/listings/projects/${id}/`, {
        method: "PATCH",
        body,
      });
      toast.success(t("edit_listing.toast.updated"));
      navigate({ to: "/dashboard/listings" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("edit_listing.toast.failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleNewVersion() {
    setNewVersioning(true);
    try {
      await request(`/listings/projects/${id}/new-version/`, { method: "POST" });
      toast.success(t("edit_listing.toast.new_version"));
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("edit_listing.toast.new_version_failed");
      toast.error(msg);
    } finally {
      setNewVersioning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
        <p className="mt-3 font-mono text-sm text-muted-foreground">{t("edit_listing.loading")}</p>
      </div>
    );
  }

  const status = project?.status as string | undefined;
  const isPublished = status === "published";

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <button
        onClick={() => navigate({ to: "/dashboard/listings" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> {t("edit_listing.back")}
      </button>

      <h1 className="mb-2 font-mono text-2xl font-bold">{t("edit_listing.heading")}</h1>

      {status && (
        <div className="mb-4 rounded-md border border-border-subtle bg-muted/30 p-3 text-sm text-muted-foreground">
          {t("edit_listing.status", { status: status.replace(/_/g, " ") })}
          {isPublished && project?.version != null && (
            <span> &middot; v{String(project.version)}</span>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-5 rounded-md border border-border-subtle bg-background p-6">
        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <Sparkles className="h-4 w-4" />
            {t("edit_listing.title_field")} <span className="text-destructive">*</span>
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <FileText className="h-4 w-4" />
            {t("edit_listing.description")}
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <Tag className="h-4 w-4" />
            {t("edit_listing.category")}
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : "")}
            className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          >
            <option value="">{t("edit_listing.select_category")}</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
              <DollarSign className="h-4 w-4" />
              {t("edit_listing.price")} <span className="text-destructive">*</span>
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
              className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
            />
          </div>
          <div>
            <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
              <Tag className="h-4 w-4" />
              {t("edit_listing.tags")}
            </label>
            <input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder={t("new_listing.tags_placeholder")}
              className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
            />
            <p className="mt-1 text-[10px] text-muted-foreground">{t("edit_listing.tags_hint")}</p>
          </div>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <Code2 className="h-4 w-4" />
            {t("edit_listing.tech_stack")}
          </label>
          <input
            value={techStack}
            onChange={(e) => setTechStack(e.target.value)}
            placeholder={t("new_listing.tech_placeholder")}
            className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          />
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            <Code2 className="h-4 w-4" />
            {t("edit_listing.license")}
          </label>
          <select
            value={licenseType}
            onChange={(e) => setLicenseType(e.target.value)}
            className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          >
            {[{ value: "proprietary", label: t("license.proprietary") }, { value: "mit", label: t("license.mit") }, { value: "apache2", label: t("license.apache2") }, { value: "gpl3", label: t("license.gpl3") }, { value: "other", label: t("license.other") }].map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
            {t("edit_listing.demo_url")}
          </label>
          <input
            value={demoUrl}
            onChange={(e) => setDemoUrl(e.target.value)}
            placeholder="https://demo.example.com"
            className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground disabled:opacity-50"
          />
        </div>

        <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:justify-end">
          {isPublished && (
            <button
              onClick={handleNewVersion}
              disabled={newVersioning}
              className="inline-flex h-10 items-center gap-2 rounded-md border border-border bg-background px-6 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"
            >
              {newVersioning ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("edit_listing.creating")}</>
              ) : (
                <><Upload className="h-4 w-4" /> {t("edit_listing.new_version")}</>
              )}
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
          >
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {t("edit_listing.saving")}</>
            ) : (
              <><Save className="h-4 w-4" /> {t("edit_listing.save")}</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
