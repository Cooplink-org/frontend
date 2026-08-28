import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { motion } from "framer-motion";
import { Flag, Github, Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { authApi } from "@/lib/api/endpoints/auth";
import { listingsApi, listingKeys } from "@/lib/api/endpoints/listings";
import { request } from "@/lib/api/client";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { formatUZS, formatRelative } from "@/lib/format";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: i18n.t("project.title", { id: params.id }) },
      { name: "description", content: i18n.t("project.meta_desc") },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { t } = useTranslation();
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const meQuery = useQuery({
    queryKey: ["auth", "me"],
    queryFn: () => authApi.me(),
  });
  const me = meQuery.data;
  const providersQuery = useQuery({
    queryKey: ["payments", "providers"],
    queryFn: () => listingsApi.paymentProviders(),
  });
  const projectQuery = useQuery({
    queryKey: listingKeys.detail(id),
    queryFn: () => listingsApi.get(id),
  });
  const reviewsQuery = useQuery({
    queryKey: listingKeys.reviews(id),
    queryFn: () => listingsApi.reviews(id),
  });
  const qaQuery = useQuery({
    queryKey: listingKeys.qa(id),
    queryFn: () => listingsApi.qa(id),
  });

  const [reportOpen, setReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const [reportBody, setReportBody] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);

  const providers = providersQuery.data ?? [];
  const [provider, setProvider] = useState<string>(providers[0]?.provider ?? "");

  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewBody, setReviewBody] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [showQaForm, setShowQaForm] = useState(false);
  const [qaQuestion, setQaQuestion] = useState("");
  const [submittingQa, setSubmittingQa] = useState(false);

  const [answeringQaId, setAnsweringQaId] = useState<string | number | null>(null);
  const [qaAnswerText, setQaAnswerText] = useState("");
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  async function submitReport() {
    if (!reportReason || !projectQuery.data) return;
    setSubmittingReport(true);
    try {
      await listingsApi.report({
        projectId: String(projectQuery.data.id),
        reason: reportReason,
        body: reportBody || undefined,
      });
      toast.success(t("project.toast.report_submitted"));
      setReportOpen(false);
      setReportReason("");
      setReportBody("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("project.toast.report_failed"));
    } finally {
      setSubmittingReport(false);
    }
  }

  async function submitReview() {
    if (!reviewBody) return;
    setSubmittingReview(true);
    try {
      await listingsApi.submitReview(id, reviewRating, reviewBody);
      toast.success(t("project.toast.review_submitted"));
      setReviewBody("");
      setReviewRating(5);
      setShowReviewForm(false);
      queryClient.invalidateQueries({ queryKey: listingKeys.reviews(id) });
      queryClient.invalidateQueries({ queryKey: listingKeys.detail(id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("project.toast.review_failed"));
    } finally {
      setSubmittingReview(false);
    }
  }

  async function submitQuestion() {
    if (!qaQuestion) return;
    setSubmittingQa(true);
    try {
      await listingsApi.askQuestion(id, qaQuestion);
      toast.success(t("project.toast.question_submitted"));
      setQaQuestion("");
      setShowQaForm(false);
      queryClient.invalidateQueries({ queryKey: listingKeys.qa(id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("project.toast.question_failed"));
    } finally {
      setSubmittingQa(false);
    }
  }

  async function submitAnswer(qaId: string | number) {
    if (!qaAnswerText) return;
    setSubmittingAnswer(true);
    try {
      await listingsApi.answerQuestion(id, qaId, qaAnswerText);
      toast.success(t("project.toast.answer_submitted"));
      setAnsweringQaId(null);
      setQaAnswerText("");
      queryClient.invalidateQueries({ queryKey: listingKeys.qa(id) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("project.toast.answer_failed"));
    } finally {
      setSubmittingAnswer(false);
    }
  }

  return (
    <div
      className="relative"
      style={{
        "--project-accent": projectQuery.data?.accentColor || "#3fd68c",
      } as React.CSSProperties}
    >
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <QueryBoundary query={projectQuery} loading={<DetailSkeleton />}>
        {(project) => {
          const isSeller = Boolean(
            me && (me.username === project.sellerUsername || me.username === project.sellerProfile?.username)
          );
          return (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-8">
              <header>
                {project.githubRepoFullName && (
                  <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                    <Github className="h-3 w-3" />
                    {project.githubRepoFullName}
                  </div>
                )}
                <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">
                  {project.title}
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{project.description}</p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {project.techStack.map((t) => (
                    <span
                      key={t}
                      className="rounded-sm border border-border-subtle bg-surface px-2 py-0.5 font-mono text-xs text-foreground"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </header>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {(project.screenshots.length > 0
                  ? project.screenshots
                  : [null, null, null]
                ).map((s, i) => (
                  <div
                    key={i}
                    className="aspect-[4/3] rounded-sm border border-border-subtle bg-surface"
                    style={s ? { backgroundImage: `url(${s})`, backgroundSize: "cover" } : undefined}
                  />
                ))}
              </div>

              <section>
                <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  {t("project.description")}
                </h2>
                <div className="prose prose-sm mt-3 max-w-none text-foreground/90">
                  {project.longDescription ? (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer" className="text-accent underline">
                            {children}
                          </a>
                        ),
                        code: ({ className, children, ...props }) => {
                          const isInline = !className;
                          if (isInline) {
                            return (
                              <code className="rounded-sm bg-surface px-1 py-0.5 font-mono text-xs text-foreground" {...props}>
                                {children}
                              </code>
                            );
                          }
                          return (
                            <pre className="overflow-x-auto rounded-sm border border-border-subtle bg-surface p-3 font-mono text-xs">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          );
                        },
                        ul: ({ children }) => <ul className="list-disc pl-5">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-5">{children}</ol>,
                        h1: ({ children }) => <h1 className="mb-2 font-mono text-xl font-bold text-foreground">{children}</h1>,
                        h2: ({ children }) => <h2 className="mb-2 font-mono text-lg font-bold text-foreground">{children}</h2>,
                        h3: ({ children }) => <h3 className="mb-2 font-mono text-base font-bold text-foreground">{children}</h3>,
                        p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                        blockquote: ({ children }) => (
                          <blockquote className="border-l-2 border-accent pl-4 italic text-muted-foreground">
                            {children}
                          </blockquote>
                        ),
                        hr: () => <hr className="my-4 border-border-subtle" />,
                        table: ({ children }) => (
                          <div className="overflow-x-auto">
                            <table className="w-full border-collapse text-sm">{children}</table>
                          </div>
                        ),
                        th: ({ children }) => <th className="border border-border-subtle bg-surface px-3 py-2 text-left font-mono text-xs">{children}</th>,
                        td: ({ children }) => <td className="border border-border-subtle px-3 py-2">{children}</td>,
                        img: ({ src, alt }) => (
                          <img src={src} alt={alt || ""} className="max-w-full rounded-sm" />
                        ),
                      }}
                    >
                      {project.longDescription}
                    </ReactMarkdown>
                  ) : (
                    <div className="whitespace-pre-wrap">{project.description || t("project.no_description")}</div>
                  )}
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    {t("project.reviews")}
                  </h2>
                  <button
                    onClick={() => setShowReviewForm((prev) => !prev)}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("project.write_review")}
                    </button>
                </div>
                <div className="mt-3 space-y-3">
                  {showReviewForm && (
                    <div className="rounded-md border border-border-subtle bg-background p-4">
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <button key={i} onClick={() => setReviewRating(i + 1)}>
                              <Star
                                className="h-4 w-4"
                                fill={i < reviewRating ? "currentColor" : "none"}
                                strokeWidth={1.5}
                              />
                            </button>
                          ))}
                        </div>
                        <span className="font-mono text-[10px] text-muted-foreground">{reviewRating}/5</span>
                      </div>
                      <textarea
                        value={reviewBody}
                        onChange={(e) => setReviewBody(e.target.value)}
                        placeholder={t("project.review_placeholder")}
                        rows={3}
                        className="mt-2 w-full rounded-sm border border-border-subtle bg-surface p-2 font-mono text-xs text-foreground outline-none focus:border-border"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setShowReviewForm(false)}
                          className="rounded-sm border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={submitReview}
                          disabled={submittingReview || !reviewBody}
                          className="rounded-sm bg-primary px-2 py-1 font-mono text-xs text-primary-foreground disabled:opacity-50"
                        >
                          {submittingReview ? "…" : t("common.submit")}
                        </button>
                      </div>
                    </div>
                  )}
                  <QueryBoundary
                    query={reviewsQuery}
                    loading={<Skeleton className="h-24 w-full" />}
                    isEmpty={(d) => d.length === 0}
                    empty={<EmptyState title={t("project.no_reviews")} description={t("project.no_reviews_desc")} />}
                  >
                    {(reviews) => (
                      <ul className="space-y-3">
                        {reviews.map((r) => (
                          <li key={r.id} className="rounded-md border border-border-subtle bg-background p-4">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-xs text-foreground">
                                {r.author.username}
                              </div>
                              <div className="flex items-center gap-0.5">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className="h-3 w-3"
                                    fill={i < r.rating ? "currentColor" : "none"}
                                    strokeWidth={1.5}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="mt-2 text-sm text-foreground">{r.body}</p>
                            <div className="mt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                              {formatRelative(r.createdAt)}
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </QueryBoundary>
                </div>
              </section>

              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                    {t("project.qa")}
                  </h2>
                  <button
                    onClick={() => setShowQaForm((prev) => !prev)}
                    className="font-mono text-xs text-muted-foreground hover:text-foreground"
                  >
                    {t("project.ask_question")}
                    </button>
                </div>
                <div className="mt-3 space-y-3">
                  {showQaForm && (
                    <div className="rounded-md border border-border-subtle bg-background p-4">
                      <textarea
                        value={qaQuestion}
                        onChange={(e) => setQaQuestion(e.target.value)}
                        placeholder={t("project.qa_placeholder")}
                        rows={3}
                        className="w-full rounded-sm border border-border-subtle bg-surface p-2 font-mono text-xs text-foreground outline-none focus:border-border"
                      />
                      <div className="mt-2 flex justify-end gap-2">
                        <button
                          onClick={() => setShowQaForm(false)}
                          className="rounded-sm border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
                        >
                          {t("common.cancel")}
                        </button>
                        <button
                          onClick={submitQuestion}
                          disabled={submittingQa || !qaQuestion}
                          className="rounded-sm bg-primary px-2 py-1 font-mono text-xs text-primary-foreground disabled:opacity-50"
                        >
                          {submittingQa ? "…" : t("common.submit")}
                        </button>
                      </div>
                    </div>
                  )}
                  <QueryBoundary
                    query={qaQuery}
                    loading={<Skeleton className="h-24 w-full" />}
                    isEmpty={(d) => d.length === 0}
                    empty={<EmptyState title={t("project.no_questions")} description={t("project.no_questions_desc")} />}
                  >
                    {(threads) => (
                      <ul className="space-y-3">
                        {threads.map((t) => (
                          <li key={t.id} className="rounded-md border border-border-subtle bg-background p-4">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-xs text-muted-foreground">
                                {i18n.t("project.qa_meta", { author: t.author.username, time: formatRelative(t.createdAt) })}
                              </div>
                              {isSeller && (
                                <button
                                  onClick={() => {
                                    setAnsweringQaId(t.id);
                                    setQaAnswerText(t.answer || "");
                                  }}
                                  className="font-mono text-xs text-primary hover:underline"
                                >
                                  {t.answer ? i18n.t("project.edit_answer") : i18n.t("project.reply")}
                                </button>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-foreground">{t.question}</p>
                            {t.answer && (
                              <div className="mt-3 rounded-sm bg-surface p-3">
                                <div className="font-mono text-xs text-muted-foreground">
                                  {i18n.t("project.answer_meta", { time: formatRelative(t.answeredAt) })}
                                </div>
                                <p className="mt-1 text-sm text-foreground">{t.answer}</p>
                              </div>
                            )}
                            {answeringQaId === t.id && (
                              <div className="mt-3 rounded-md border border-border bg-surface p-3">
                                <div className="font-mono text-xs text-muted-foreground mb-1">{i18n.t("project.reply_label")}</div>
                                <textarea
                                  value={qaAnswerText}
                                  onChange={(e) => setQaAnswerText(e.target.value)}
                                  placeholder={i18n.t("project.reply_placeholder")}
                                  rows={3}
                                  className="w-full rounded-sm border border-border-subtle bg-background p-2 font-mono text-xs text-foreground outline-none focus:border-border"
                                />
                                <div className="mt-2 flex justify-end gap-2">
                                  <button
                                    onClick={() => setAnsweringQaId(null)}
                                    className="rounded-sm border border-border px-2 py-1 font-mono text-xs text-muted-foreground"
                                  >
                                    {i18n.t("common.cancel")}
                                  </button>
                                  <button
                                    onClick={() => submitAnswer(t.id)}
                                    disabled={submittingAnswer || !qaAnswerText}
                                    className="rounded-sm bg-primary px-2 py-1 font-mono text-xs text-primary-foreground disabled:opacity-50"
                                  >
                                    {submittingAnswer ? "…" : i18n.t("project.submit_answer")}
                                  </button>
                                </div>
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    )}
                  </QueryBoundary>
                </div>
              </section>
            </div>

            <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
              <div className="rounded-md border border-border-subtle bg-background p-5">
                <div className="font-mono text-xs text-muted-foreground">{t("project.price")}</div>
                <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                  {formatUZS(project.price)}
                </div>
                <motion.button
                  onClick={async () => {
                    try {
                      const { orderId, checkoutUrl, payid } = await listingsApi.purchase(project.id, provider);
                      navigate({
                        to: "/payment/$orderId",
                        params: { orderId: String(orderId) },
                        search: { checkout_url: checkoutUrl, payid },
                      });
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : t("project.toast.purchase_failed"));
                    }
                  }}
                  disabled={providers.length === 0}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground disabled:opacity-50"
                >
                  {t("project.buy")}
                </motion.button>
                {providers.length > 1 && (
                  <div className="mt-3 space-y-1.5">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                      {t("project.pay_with")}
                    </div>
                    {providers.map((p) => (
                      <label
                        key={p.provider}
                        className="flex cursor-pointer items-center gap-2 rounded-sm border border-border-subtle px-3 py-2 font-mono text-xs"
                      >
                        <input
                          type="radio"
                          name="payment_provider"
                          checked={provider === p.provider}
                          onChange={() => setProvider(p.provider)}
                          className="accent-primary"
                        />
                        <span className="text-foreground">{p.displayName}</span>
                        {p.isDefault && (
                          <span className="ml-auto text-[10px] text-muted-foreground">
                            {t("project.default_provider")}
                          </span>
                        )}
                      </label>
                    ))}
                  </div>
                )}
                <p className="mt-3 text-xs text-muted-foreground">
                  {t("project.buy_desc", { license: project.licenseType ? ` · ${project.licenseType}` : "" })}
                </p>
              </div>

              {project.sellerProfile && (
                <div className="rounded-md border border-border-subtle bg-background p-5">
                  <div className="font-mono text-xs text-muted-foreground">{t("project.seller")}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full border border-border-subtle bg-surface" />
                    <div>
                      <div className="font-mono text-sm text-foreground">
                        {project.sellerProfile.username}
                      </div>
                      {project.sellerProfile.bio && (
                        <div className="font-mono text-xs text-muted-foreground">
                          {project.sellerProfile.bio}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setReportOpen(true)}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-3 w-3" /> {t("project.report")}
              </button>
            </aside>
          </div>
        );
        }}
      </QueryBoundary>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("project.report_title")}</DialogTitle>
            <DialogDescription>
              {t("project.report_desc")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block font-mono text-xs text-muted-foreground">{t("project.report_reason")}</label>
              <select
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-sm outline-none"
              >
                <option value="">{t("project.report_select")}</option>
                <option value="copyright">{t("project.report.option.copyright")}</option>
                <option value="malicious_code">{t("project.report.option.malicious")}</option>
                <option value="misleading">{t("project.report.option.misleading")}</option>
                <option value="duplicate">{t("project.report.option.duplicate")}</option>
                <option value="spam">{t("project.report.option.spam")}</option>
                <option value="fraud">{t("project.report.option.fraud")}</option>
                <option value="other">{t("project.report.option.other")}</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block font-mono text-xs text-muted-foreground">{t("project.report_details")}</label>
              <textarea
                value={reportBody}
                onChange={(e) => setReportBody(e.target.value)}
                rows={4}
                className="w-full rounded-sm border border-border bg-background p-2 font-mono text-sm outline-none focus:border-foreground"
                placeholder={t("project.report_details_placeholder")}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setReportOpen(false)}
                className="rounded-sm border border-border px-3 py-1.5 font-mono text-xs text-foreground"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={submitReport}
                disabled={submittingReport || !reportReason}
                className="rounded-sm bg-destructive px-3 py-1.5 font-mono text-xs text-destructive-foreground disabled:opacity-50"
              >
                {submittingReport ? "…" : t("project.submit_report")}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div>
          <Skeleton className="h-3 w-40" />
          <Skeleton className="mt-2 h-8 w-2/3" />
          <Skeleton className="mt-2 h-4 w-full" />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full" />
          ))}
        </div>
        <Skeleton className="h-24 w-full" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    </div>
  );
}