import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { toast } from "sonner";
import { request } from "@/lib/api/client";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@/lib/api/types";
import {
  AlertCircle,
  Github,
  ArrowRight,
  ArrowLeft,
  Tag,
  Code2,
  FileText,
  DollarSign,
  Rocket,
  Loader2,
  Sparkles,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard/listings/new")({
  head: () => ({
    meta: [
      { title: i18n.t("new_listing.title") },
      { name: "description", content: i18n.t("new_listing.meta_desc") },
    ],
  }),
  component: NewListingPage,
});

function NewListingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [repoName, setRepoName] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  const [tech, setTech] = useState("");
  const [category, setCategory] = useState<number | "">("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const resp = await fetch("/api/listings/categories/");
      if (!resp.ok) return [];
      return resp.json() as Promise<Category[]>;
    },
  });

  async function handleSubmit() {
    if (!acceptTerms) {
      toast.error("You must accept the terms to submit.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const body: Record<string, unknown> = {
        github_repo_full_name: repoName,
        title,
        description: description || "",
        price,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        tech_stack: tech.split(",").map((t) => t.trim()).filter(Boolean),
      };
      if (category) body.category = category;
      const created = await request<{ id: number; slug: string }>("/listings/projects/", {
        method: "POST",
        body,
      });
      await request(`/listings/projects/${created.id}/submit/`, {
        method: "POST",
        body: { accept_terms: true },
      });
      toast.success("Listing submitted for review!");
      navigate({ to: "/dashboard/listings" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to create listing";
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-2xl px-4 py-8 sm:px-6">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("new_listing.section")}
        </div>
        <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">
          {t("new_listing.heading")}
        </h1>

        {/* Step indicator */}
        <div className="mt-6 flex items-center gap-2 font-mono text-xs">
          {[
            { num: 1, label: t("new_listing.step.repo") },
            { num: 2, label: t("new_listing.step.details") },
            { num: 3, label: t("new_listing.step.review") },
          ].map((s) => (
            <div
              key={s.num}
              className={`flex items-center gap-2 rounded-sm px-3 py-1.5 transition-colors ${
                step === s.num
                  ? "bg-primary text-primary-foreground"
                  : step > s.num
                    ? "bg-accent/20 text-foreground"
                    : "bg-surface text-muted-foreground"
              }`}
            >
              <span className="font-bold">0{s.num}</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Error banner */}
        {error && (
          <div className="mt-4 flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 px-4 py-3">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div>
              <span className="font-mono text-xs font-medium text-destructive">{error}</span>
              {error.toLowerCase().includes("seller") && (
                <p className="mt-1 font-mono text-[10px] text-muted-foreground">
                  {t("new_listing.connect_hint")}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Form card */}
        <div className="mt-6 rounded-md border border-border-subtle bg-background p-6">

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                  <Github className="h-4 w-4" />
                  {t("new_listing.github_repo")} <span className="text-destructive">*</span>
                </label>
                <input
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && repoName && setStep(2)}
                  placeholder={t("new_listing.repo_placeholder")}
                  autoFocus
                  className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                />
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("new_listing.repo_hint")}
                </p>
              </div>
              <div className="flex justify-end">
                <button
                  onClick={() => repoName && setStep(2)}
                  disabled={!repoName}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                  <Sparkles className="h-4 w-4" />
                  {t("new_listing.title_field")} <span className="text-destructive">*</span>
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={t("new_listing.title_placeholder")}
                  autoFocus
                  className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                  <FileText className="h-4 w-4" />
                  {t("new_listing.description")}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder={t("new_listing.desc_placeholder")}
                  className="w-full rounded-md border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                  <Tag className="h-4 w-4" />
                  {t("new_listing.category")}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : "")}
                  className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                >
                  <option value="">{t("new_listing.select_category")}</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                    <DollarSign className="h-4 w-4" />
                    {t("new_listing.price")} <span className="text-destructive">*</span>
                  </label>
                  <input
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                    placeholder={t("new_listing.price_placeholder")}
                    className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                    <Tag className="h-4 w-4" />
                    {t("new_listing.tags")}
                  </label>
                  <input
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder={t("new_listing.tags_placeholder")}
                    className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground">{t("new_listing.tags_hint")}</p>
                </div>
              </div>
              <div>
                <label className="mb-2 flex items-center gap-2 font-mono text-sm font-medium text-foreground">
                  <Code2 className="h-4 w-4" />
                  {t("new_listing.tech_stack")}
                </label>
                <input
                  value={tech}
                  onChange={(e) => setTech(e.target.value)}
                  placeholder={t("new_listing.tech_placeholder")}
                  className="h-11 w-full rounded-md border border-border bg-background px-4 font-mono text-sm text-foreground outline-none focus:border-foreground"
                />
              </div>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(1)} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface">
                  <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                </button>
                <button
                  onClick={() => title && price && setStep(3)}
                  disabled={!title || !price}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >
                  {t("common.continue")} <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <div className="space-y-3 rounded-md border border-border-subtle bg-surface p-5">
                <h3 className="flex items-center gap-2 font-mono text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4" /> {t("new_listing.review_section")}
                </h3>
                <div className="space-y-2 font-mono text-xs">
                  <ReviewRow label={t("new_listing.review.repo")} value={repoName} />
                  <ReviewRow label={t("new_listing.review.title")} value={title} />
                  <ReviewRow label={t("new_listing.review.price")} value={`${Number(price).toLocaleString()} UZS`} />
                  <ReviewRow label={t("new_listing.review.category")} value={categories?.find((c) => c.id === category)?.name ?? "None"} />
                  <ReviewRow label={t("new_listing.review.tags")} value={tags || "None"} />
                  <ReviewRow label={t("new_listing.review.tech")} value={tech || "None"} />
                </div>
              </div>
              <label className="flex items-start gap-3 rounded-md border border-border-subtle bg-background p-4">
                <input
                  type="checkbox"
                  checked={acceptTerms}
                  onChange={(e) => setAcceptTerms(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded-sm border-border accent-[color:var(--accent-lime)]"
                />
                <span className="text-sm text-foreground">
                  {t("new_listing.terms")}
                </span>
              </label>
              <div className="flex justify-between pt-2">
                <button onClick={() => setStep(2)} className="inline-flex h-10 items-center gap-2 rounded-md border border-border px-5 text-sm font-medium text-foreground hover:bg-surface">
                  <ArrowLeft className="h-4 w-4" /> {t("common.back")}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !acceptTerms}
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
                >
                  {submitting ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.submitting")}</>
                  ) : (
                    <><Rocket className="h-4 w-4" /> {t("new_listing.submit")}</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{value}</span>
    </div>
  );
}
