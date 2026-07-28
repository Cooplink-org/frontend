import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Flag, Github, Star } from "lucide-react";
import { listingsApi, listingKeys } from "@/lib/api/endpoints/listings";
import { QueryBoundary, EmptyState } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import { formatMoney, formatRelative } from "@/lib/format";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `Project ${params.id} — Cooplink` },
      { name: "description", content: "Project detail on Cooplink." },
      { property: "og:title", content: `Project ${params.id} — Cooplink` },
      { property: "og:description", content: "Project detail on Cooplink." },
    ],
  }),
  component: ProjectDetailPage,
});

function ProjectDetailPage() {
  const { id } = Route.useParams();
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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <QueryBoundary query={projectQuery} loading={<DetailSkeleton />}>
        {(project) => (
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div className="min-w-0 space-y-8">
              <header>
                <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
                  <Github className="h-3 w-3" />
                  {project.repoName}
                </div>
                <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">
                  {project.title}
                </h1>
                <p className="mt-2 max-w-2xl text-muted-foreground">{project.tagline}</p>

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
                {(project.screenshotUrls.length > 0
                  ? project.screenshotUrls
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
                  Description
                </h2>
                <div className="prose prose-sm mt-3 max-w-none whitespace-pre-wrap text-foreground/90">
                  {project.description || "No description provided."}
                </div>
              </section>

              <section>
                <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Reviews
                </h2>
                <div className="mt-3">
                  <QueryBoundary
                    query={reviewsQuery}
                    loading={<Skeleton className="h-24 w-full" />}
                    isEmpty={(d) => d.length === 0}
                    empty={<EmptyState title="No reviews yet" />}
                  >
                    {(reviews) => (
                      <ul className="space-y-3">
                        {reviews.map((r) => (
                          <li key={r.id} className="rounded-md border border-border-subtle bg-background p-4">
                            <div className="flex items-center justify-between">
                              <div className="font-mono text-xs text-foreground">
                                {r.author.displayName ?? r.author.username}
                              </div>
                              <div className="flex items-center gap-0.5 text-accent-foreground">
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
                <h2 className="font-mono text-sm uppercase tracking-wider text-muted-foreground">
                  Questions & Answers
                </h2>
                <div className="mt-3">
                  <QueryBoundary
                    query={qaQuery}
                    loading={<Skeleton className="h-24 w-full" />}
                    isEmpty={(d) => d.length === 0}
                    empty={<EmptyState title="No questions yet" />}
                  >
                    {(threads) => (
                      <ul className="space-y-3">
                        {threads.map((t) => (
                          <li key={t.id} className="rounded-md border border-border-subtle bg-background p-4">
                            <div className="font-mono text-xs text-muted-foreground">
                              Q · {t.author.username} · {formatRelative(t.createdAt)}
                            </div>
                            <p className="mt-1 text-sm text-foreground">{t.question}</p>
                            {t.answer && (
                              <div className="mt-3 rounded-sm bg-surface p-3">
                                <div className="font-mono text-xs text-muted-foreground">
                                  A · seller · {formatRelative(t.answeredAt)}
                                </div>
                                <p className="mt-1 text-sm text-foreground">{t.answer}</p>
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
                <div className="font-mono text-xs text-muted-foreground">price</div>
                <div className="mt-1 font-mono text-3xl tracking-tight text-foreground">
                  {formatMoney(project.priceCents, project.currency)}
                </div>
                <button
                  onClick={async () => {
                    try {
                      const { checkoutUrl } = await listingsApi.purchase(project.id);
                      window.location.href = checkoutUrl;
                    } catch (err) {
                      toast.error(err instanceof Error ? err.message : "Purchase failed");
                    }
                  }}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground"
                >
                  Buy source code
                </button>
                <p className="mt-3 text-xs text-muted-foreground">
                  Instant repo access on payment · {project.licenseAfterPurchase}
                </p>
              </div>

              <div className="rounded-md border border-border-subtle bg-background p-5">
                <div className="font-mono text-xs text-muted-foreground">seller</div>
                <div className="mt-2 flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full border border-border-subtle bg-surface" />
                  <div>
                    <div className="font-mono text-sm text-foreground">
                      {project.seller.displayName ?? project.seller.username}
                    </div>
                    {project.seller.githubLogin && (
                      <div className="font-mono text-xs text-muted-foreground">
                        @{project.seller.githubLogin}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={async () => {
                  try {
                    await listingsApi.report({ projectId: project.id, reason: "other" });
                    toast.success("Report submitted");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "Report failed");
                  }
                }}
                className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground hover:text-destructive"
              >
                <Flag className="h-3 w-3" /> Report this listing
              </button>
            </aside>
          </div>
        )}
      </QueryBoundary>
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
