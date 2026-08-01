import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { request } from "@/lib/api/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { authApi } from "@/lib/api/endpoints/auth";
import type { Category } from "@/lib/api/types";
import i18n from "@/i18n/i18n";
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Github,
  FileText,
  Palette,
  Image,
  DollarSign,
  Rocket,
  Plus,
  X,
  Search,
  Lock,
  Globe,
  Check,
} from "lucide-react";

interface GitHubRepo {
  full_name: string;
  name: string;
  description: string;
  private: boolean;
  html_url: string;
  language: string;
  updated_at: string;
  topics: string[];
}

export const Route = createFileRoute("/_authenticated/dashboard/add-project")({
  head: () => ({
    meta: [{ title: i18n.t("add_project.title") }],
  }),
  component: AddProjectPage,
});

function AddProjectPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [repoName, setRepoName] = useState("");
  const [repoSearch, setRepoSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [longDescription, setLongDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<number | "">("" as const);
  const [tags, setTags] = useState("");
  const [techStack, setTechStack] = useState("");
  const [licenseType, setLicenseType] = useState("proprietary");
  const [demoUrl, setDemoUrl] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [bannerImage, setBannerImage] = useState("");
  const [accentColor, setAccentColor] = useState("#3fd68c");
  const [highlights, setHighlights] = useState<string[]>([""]);
  const [screenshots, setScreenshots] = useState<string[]>([""]);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [connectingRepos, setConnectingRepos] = useState(false);
  const queryClient = useQueryClient();

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const resp = await fetch("/api/listings/categories/");
      if (!resp.ok) return [];
      return resp.json() as Promise<Category[]>;
    },
  });

  // Fetch GitHub repos
  const { data: repos, isLoading: reposLoading, refetch: refetchRepos } = useQuery({
    queryKey: ["github-repos"],
    queryFn: async () => {
      return request<GitHubRepo[]>("/auth/github/repos/");
    },
    retry: false,
  });

  // Filter repos by search
  const filteredRepos = useMemo(() => {
    if (!repos) return [];
    const q = repoSearch.toLowerCase();
    return repos.filter(
      (r) =>
        r.full_name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.language.toLowerCase().includes(q)
    );
  }, [repos, repoSearch]);

  function selectRepo(repo: GitHubRepo) {
    setRepoName(repo.full_name);
    if (!title) setTitle(repo.name.replace(/[-_]/g, " "));
    if (!description && repo.description) setDescription(repo.description);
    if (!techStack && repo.language) setTechStack(repo.language);
    if (tags === "" && repo.topics.length > 0) setTags(repo.topics.join(", "));
  }

  async function handleConnectRepos() {
    setConnectingRepos(true);
    try {
      const url = await authApi.connectRepos();
      window.location.href = url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("add_project.toast.github_failed");
      toast.error(msg);
      setConnectingRepos(false);
    }
  }

  const addHighlight = () => setHighlights([...highlights, ""]);
  const removeHighlight = (i: number) => setHighlights(highlights.filter((_, idx) => idx !== i));
  const updateHighlight = (i: number, v: string) => {
    const next = [...highlights];
    next[i] = v;
    setHighlights(next);
  };

  const addScreenshot = () => setScreenshots([...screenshots, ""]);
  const removeScreenshot = (i: number) => setScreenshots(screenshots.filter((_, idx) => idx !== i));
  const updateScreenshot = (i: number, v: string) => {
    const next = [...screenshots];
    next[i] = v;
    setScreenshots(next);
  };

  const canNext = useCallback(() => {
    if (step === 1) return repoName.trim() && title.trim() && description.trim();
    if (step === 2) return price.trim() && Number(price) >= 1;
    return true;
  }, [step, repoName, title, description, price]);

  const handleSubmit = useCallback(async () => {
    if (!acceptTerms) {
      toast.error(t("add_project.toast.accept_terms"));
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      const body: Record<string, unknown> = {
        github_repo_full_name: repoName.trim(),
        title: title.trim(),
        description: description.trim(),
        price: price.trim(),
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        tech_stack: techStack.split(",").map((t) => t.trim()).filter(Boolean),
        license_type: licenseType,
        highlights: highlights.filter((h) => h.trim()),
        screenshots: screenshots.filter((s) => s.trim()),
        accent_color: accentColor,
      };

      if (category) body.category = category;
      if (longDescription.trim()) body.long_description = longDescription.trim();
      if (demoUrl.trim()) body.demo_url = demoUrl.trim();
      if (coverImage.trim()) body.cover_image = coverImage.trim();
      if (bannerImage.trim()) body.banner_image = bannerImage.trim();

      const created = await request<{ id: number; slug: string }>(
        "/listings/projects/",
        { method: "POST", body }
      );

      await request(`/listings/projects/${created.id}/submit/`, {
        method: "POST",
        body: { accept_terms: true },
      });

      toast.success(t("add_project.toast.submitted"));
      navigate({ to: "/dashboard/listings" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("add_project.toast.failed");
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }, [
    acceptTerms, repoName, title, description, longDescription, price, category,
    tags, techStack, licenseType, demoUrl, coverImage, bannerImage, accentColor,
    highlights, screenshots, navigate,
  ]);

  const steps = [
    { num: 1, label: t("add_project.step.basics"), icon: Github },
    { num: 2, label: t("add_project.step.pricing"), icon: DollarSign },
    { num: 3, label: t("add_project.step.media"), icon: Image },
    { num: 4, label: t("add_project.step.review"), icon: Rocket },
  ];

  const [direction, setDirection] = useState(1);

  function goToStep(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
    setError("");
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <motion.button
        onClick={() => navigate({ to: "/dashboard/listings" })}
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <ArrowLeft className="h-4 w-4" /> {t("add_project.back")}
      </motion.button>

      <motion.h1
        className="mb-2 font-mono text-2xl font-bold"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {t("add_project.heading")}
      </motion.h1>

      {/* Step indicator */}
      <div className="mb-6 flex items-center gap-2 font-mono text-xs">
        {steps.map((s, i) => (
          <motion.div
            key={s.num}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex items-center gap-1.5 rounded px-2.5 py-1 transition-colors duration-200 ${
              step === s.num
                ? "bg-primary text-primary-foreground"
                : step > s.num
                  ? "bg-accent/20 text-foreground"
                  : "bg-surface text-muted-foreground"
            }`}
          >
            <s.icon className="h-3 w-3" />
            {s.label}
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 overflow-hidden"
          >
            <div className="rounded border border-red-300 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="rounded-md border border-border-subtle bg-background p-6 overflow-hidden">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
        {/* Step 1: Basics */}
        {step === 1 && (
          <div className="space-y-4">
            {/* Repo picker */}
            <div>
              <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
                <Github className="h-3.5 w-3.5" />
                {t("add_project.select_repo")} <span className="text-red-500">*</span>
              </label>

              {/* Search bar */}
              <div className="relative mb-2">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={repoSearch}
                  onChange={(e) => setRepoSearch(e.target.value)}
                  placeholder={t("add_project.search_repos")}
                  className="w-full rounded border border-gray-300 py-2 pl-9 pr-3 text-sm outline-none focus:border-foreground"
                />
              </div>

              {/* Selected repo badge */}
              {repoName && (
                <div className="mb-2 flex items-center gap-2 rounded border border-green-300 bg-green-50 px-3 py-2 text-sm">
                  <Check className="h-4 w-4 text-green-600" />
                  <span className="font-medium">{repoName}</span>
                  <button
                    type="button"
                    onClick={() => setRepoName("")}
                    className="ml-auto text-muted-foreground hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Repo list */}
              <div className="max-h-56 overflow-y-auto rounded border border-border-subtle">
                {reposLoading && (
                  <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> {t("add_project.loading_repos")}
                  </div>
                )}
                {!reposLoading && repos && filteredRepos.length === 0 && (
                  <div className="p-4 text-sm text-muted-foreground">
                    {repoSearch ? t("add_project.no_search_match") : t("add_project.no_repos")}
                  </div>
                )}
                {!reposLoading && filteredRepos.map((repo) => (
                  <button
                    key={repo.full_name}
                    type="button"
                    onClick={() => selectRepo(repo)}
                    className={`flex w-full items-start gap-3 border-b border-border-subtle px-3 py-2.5 text-left text-sm transition-colors last:border-0 hover:bg-secondary/50 ${
                      repoName === repo.full_name ? "bg-green-50" : ""
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium truncate">{repo.full_name}</span>
                        {repo.private ? (
                          <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                        ) : (
                          <Globe className="h-3 w-3 shrink-0 text-muted-foreground" />
                        )}
                      </div>
                      {repo.description && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{repo.description}</p>
                      )}
                      <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground">
                        {repo.language && <span className="rounded bg-surface px-1.5 py-0.5">{repo.language}</span>}
                      </div>
                    </div>
                    {repoName === repo.full_name && (
                      <Check className="mt-1 h-4 w-4 shrink-0 text-green-600" />
                    )}
                  </button>
                ))}
              </div>

              {/* Manual entry fallback */}
              <details className="mt-2">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {t("add_project.manual_repo")}
                </summary>
                <input
                  type="text"
                  value={repoName}
                  onChange={(e) => setRepoName(e.target.value)}
                  placeholder={t("add_project.manual_placeholder")}
                  className="mt-2 w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-foreground"
                />
              </details>

              {!repos && !reposLoading && (
                <div className="mt-3 flex items-center gap-3 rounded-md border border-amber-200 bg-amber-50 p-3">
                  <Github className="h-5 w-5 shrink-0 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-amber-800">
                      {t("add_project.connect_heading")}
                    </p>
                    <p className="text-xs text-amber-600">
                      {t("add_project.connect_desc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleConnectRepos}
                    disabled={connectingRepos}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-sm bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-opacity hover:opacity-90 disabled:opacity-50"
                  >
                    {connectingRepos ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Github className="h-3.5 w-3.5" />
                    )}
                    {connectingRepos ? t("add_project.connecting") : t("add_project.connect_github")}
                  </button>
                </div>
              )}
            </div>

            <Field label={t("add_project.title_field")} required>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("add_project.title_placeholder")}
                className={inputCls}
              />
            </Field>

            <Field label={t("add_project.short_desc")} required>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("add_project.short_desc_placeholder")}
                rows={3}
                className={inputCls}
              />
            </Field>

            <Field label={t("add_project.full_desc")} icon={FileText}>
              <textarea
                value={longDescription}
                onChange={(e) => setLongDescription(e.target.value)}
                placeholder={t("add_project.full_desc_placeholder")}
                rows={6}
                className={inputCls}
              />
              <Hint>{t("add_project.markdown_hint")}</Hint>
              <details className="mt-1">
                <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
                  {t("add_project.markdown_guide")}
                </summary>
                <div className="mt-2 space-y-1 rounded-sm border border-border-subtle bg-surface p-3 font-mono text-[11px] text-muted-foreground">
                  <div><span className="text-foreground"># Heading</span> — {t("add_project.md.heading")}</div>
                  <div><span className="text-foreground">**bold**</span> — {t("add_project.md.bold")}</div>
                  <div><span className="text-foreground">*italic*</span> — {t("add_project.md.italic")}</div>
                  <div><span className="text-foreground">`code`</span> — {t("add_project.md.code")}</div>
                  <div><span className="text-foreground">```</span> — {t("add_project.md.code_block")}</div>
                  <div><span className="text-foreground">[text](url)</span> — {t("add_project.md.link")}</div>
                  <div><span className="text-foreground">![alt](url)</span> — {t("add_project.md.image")}</div>
                  <div><span className="text-foreground">- item</span> — {t("add_project.md.bullet")}</div>
                  <div><span className="text-foreground">1. item</span> — {t("add_project.md.numbered")}</div>
                  <div><span className="text-foreground">&gt; quote</span> — {t("add_project.md.quote")}</div>
                  <div><span className="text-foreground">---</span> — {t("add_project.md.hr")}</div>
                </div>
              </details>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("edit_listing.category")}>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value ? Number(e.target.value) : "")}
                  className={inputCls}
                >
                  <option value="">{t("category.select")}</option>
                  {categories?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </Field>

              <Field label={t("edit_listing.license")}>
                <select
                  value={licenseType}
                  onChange={(e) => setLicenseType(e.target.value)}
                  className={inputCls}
                >
                  {[{ value: "proprietary", label: t("license.proprietary") }, { value: "mit", label: t("license.mit") }, { value: "apache2", label: t("license.apache2") }, { value: "gpl3", label: t("license.gpl3") }, { value: "other", label: t("license.other") }].map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("edit_listing.tags")}>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder={t("new_listing.tags_placeholder")}
                  className={inputCls}
                />
                <Hint>{t("new_listing.tags_hint")}</Hint>
              </Field>

              <Field label={t("edit_listing.tech_stack")}>
                <input
                  type="text"
                  value={techStack}
                  onChange={(e) => setTechStack(e.target.value)}
                  placeholder={t("new_listing.tech_placeholder")}
                  className={inputCls}
                />
                <Hint>{t("new_listing.tags_hint")}</Hint>
              </Field>
            </div>

            <Field label={t("edit_listing.demo_url")}>
              <input
                type="url"
                value={demoUrl}
                onChange={(e) => setDemoUrl(e.target.value)}
                placeholder="https://demo.example.com"
                className={inputCls}
              />
            </Field>
          </div>
        )}

        {/* Step 2: Pricing */}
        {step === 2 && (
          <div className="space-y-4">
            <Field label={t("add_project.price")} required icon={DollarSign}>
              <input
                type="text"
                value={price}
                onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                placeholder={t("add_project.price_placeholder")}
                autoFocus
                className={inputCls}
              />
              <Hint>{t("add_project.price_hint")}</Hint>
            </Field>

            <div className="rounded border border-border-subtle bg-surface p-4">
              <h3 className="mb-2 font-mono text-sm font-semibold">{t("add_project.highlights")}</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {t("add_project.highlights_desc")}
              </p>
              <div className="space-y-2">
                {highlights.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={h}
                      onChange={(e) => updateHighlight(i, e.target.value)}
                      placeholder={t("add_project.highlight_placeholder", { i: i + 1 })}
                      className={inputCls}
                    />
                    {highlights.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeHighlight(i)}
                        className="shrink-0 rounded px-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addHighlight}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> {t("add_project.add_highlight")}
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Media */}
        {step === 3 && (
          <div className="space-y-4">
            <Field label={t("add_project.cover_image")} icon={Image}>
              <input
                type="url"
                value={coverImage}
                onChange={(e) => setCoverImage(e.target.value)}
                placeholder={t("add_project.cover_placeholder")}
                className={inputCls}
              />
              <Hint>{t("add_project.cover_hint")}</Hint>
            </Field>

            <Field label={t("add_project.banner_image")} icon={Palette}>
              <input
                type="url"
                value={bannerImage}
                onChange={(e) => setBannerImage(e.target.value)}
                placeholder={t("add_project.banner_placeholder")}
                className={inputCls}
              />
              <Hint>{t("add_project.banner_hint")}</Hint>
            </Field>

            <Field label={t("add_project.accent_color")}>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-10 w-14 cursor-pointer rounded border border-border"
                />
                <input
                  type="text"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className={inputCls + " w-32"}
                />
              </div>
              <Hint>{t("add_project.accent_hint")}</Hint>
            </Field>

            <div className="rounded border border-border-subtle bg-surface p-4">
              <h3 className="mb-2 font-mono text-sm font-semibold">{t("add_project.screenshots")}</h3>
              <p className="mb-3 text-xs text-muted-foreground">
                {t("add_project.screenshots_desc")}
              </p>
              <div className="space-y-2">
                {screenshots.map((s, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="url"
                      value={s}
                      onChange={(e) => updateScreenshot(i, e.target.value)}
                      placeholder={t("add_project.screenshot_placeholder", { i: i + 1 })}
                      className={inputCls}
                    />
                    {screenshots.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeScreenshot(i)}
                        className="shrink-0 rounded px-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addScreenshot}
                className="mt-2 inline-flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Plus className="h-3 w-3" /> {t("add_project.add_screenshot")}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="rounded border border-border-subtle bg-surface p-4">
              <h3 className="mb-3 font-mono text-sm font-semibold">{t("add_project.review_section")}</h3>
              <div className="space-y-2 font-mono text-xs">
                <ReviewRow label={t("add_project.review.repo")} value={repoName} />
                <ReviewRow label={t("add_project.review.title")} value={title} />
                <ReviewRow label={t("add_project.review.price")} value={`${Number(price).toLocaleString()} UZS`} />
                <ReviewRow label={t("add_project.review.license")} value={t("license." + licenseType)} />
                <ReviewRow label={t("add_project.review.category")} value={categories?.find((c) => c.id === category)?.name ?? "None"} />
                <ReviewRow label={t("add_project.review.tags")} value={tags || t("payouts.none")} />
                <ReviewRow label={t("add_project.review.tech")} value={techStack || t("payouts.none")} />
                <ReviewRow label={t("add_project.review.highlights")} value={highlights.filter((h) => h.trim()).length.toString()} />
                <ReviewRow label={t("add_project.review.screenshots")} value={screenshots.filter((s) => s.trim()).length.toString()} />
                {demoUrl && <ReviewRow label={t("add_project.review.demo_url")} value={demoUrl} />}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded border border-border-subtle bg-background p-4">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span className="text-sm">
                {t("add_project.terms")}
              </span>
            </label>
          </div>
        )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="mt-6 flex justify-between">
          {step > 1 ? (
            <motion.button
              onClick={() => goToStep(step - 1)}
              className="inline-flex h-9 items-center gap-2 rounded border border-border px-4 text-sm font-medium text-foreground hover:bg-surface"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <ArrowLeft className="h-4 w-4" /> {t("common.back")}
            </motion.button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <motion.button
              onClick={() => canNext() && goToStep(step + 1)}
              disabled={!canNext()}
              className="inline-flex h-9 items-center gap-2 rounded bg-primary px-5 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
              whileHover={{ scale: canNext() ? 1.02 : 1 }}
              whileTap={{ scale: canNext() ? 0.98 : 1 }}
            >
              {t("common.next")} <ArrowRight className="h-4 w-4" />
            </motion.button>
          ) : (
            <motion.button
              onClick={handleSubmit}
              disabled={submitting || !acceptTerms}
              className="inline-flex h-9 items-center gap-2 rounded bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              whileHover={{ scale: acceptTerms && !submitting ? 1.02 : 1 }}
              whileTap={{ scale: acceptTerms && !submitting ? 0.98 : 1 }}
            >
              {submitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {t("common.submitting")}</>
              ) : (
                <><Rocket className="h-4 w-4" /> {t("add_project.submit")}</>
              )}
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded border border-gray-300 px-3 py-2 text-sm outline-none focus:border-foreground";

function Field({
  label,
  required,
  icon: Icon,
  children,
}: {
  label: string;
  required?: boolean;
  icon?: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-1.5 text-sm font-medium">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-1 text-xs text-gray-500">{children}</p>;
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-4">
      <span className="w-24 shrink-0 text-muted-foreground">{label}</span>
      <span className="break-all text-foreground">{value}</span>
    </div>
  );
}
