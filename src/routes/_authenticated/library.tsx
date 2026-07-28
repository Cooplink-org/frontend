import { createFileRoute } from "@tanstack/react-router";
import { EmptyState } from "@/components/data-state/QueryBoundary";

export const Route = createFileRoute("/_authenticated/library")({
  head: () => ({
    meta: [
      { title: "Library — Cooplink" },
      { name: "description", content: "Your purchased projects." },
      { property: "og:title", content: "Library — Cooplink" },
      { property: "og:description", content: "Your purchased projects." },
    ],
  }),
  component: () => (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">library</div>
      <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">Your purchases</h1>
      <div className="mt-6">
        <EmptyState
          title="No purchases yet"
          description="Projects you buy will appear here with links to the repository and license info."
        />
      </div>
    </div>
  ),
});
