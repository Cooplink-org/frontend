import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { listingsApi } from "@/lib/api/endpoints/listings";

export const Route = createFileRoute("/_authenticated/dashboard/listings/new")({
  head: () => ({
    meta: [
      { title: "New listing — Cooplink" },
      { name: "description", content: "Create a new Cooplink listing." },
      { property: "og:title", content: "New listing — Cooplink" },
      { property: "og:description", content: "Create a new Cooplink listing." },
    ],
  }),
  component: NewListingPage,
});

function NewListingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [repoName, setRepoName] = useState("");
  const [title, setTitle] = useState("");
  const [tagline, setTagline] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [tags, setTags] = useState("");
  const [tech, setTech] = useState("");
  const [category, setCategory] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    setSubmitting(true);
    try {
      await listingsApi.create({
        repoName,
        title,
        tagline,
        description,
        priceCents: Math.max(0, Math.round(Number(price) * 100)),
        currency: "USD",
        categories: category ? [category] : [],
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        techStack: tech.split(",").map((t) => t.trim()).filter(Boolean),
      });
      toast.success("Submitted for review");
      navigate({ to: "/dashboard/listings" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create listing");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        new listing
      </div>
      <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">
        Create a listing
      </h1>

      <ol className="mt-6 flex items-center gap-2 font-mono text-xs">
        {[1, 2, 3].map((n) => (
          <li
            key={n}
            className={`flex items-center gap-2 rounded-sm px-2 py-1 ${
              step === n ? "bg-secondary text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className={step >= n ? "text-accent" : ""}>0{n}</span>
            {["Connect repo", "Details", "Review"][n - 1]}
          </li>
        ))}
      </ol>

      <div className="mt-6 rounded-md border border-border-subtle bg-background p-6">
        {step === 1 && (
          <div className="space-y-4">
            <Field label="GitHub repository (owner/repo)" required>
              <input
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                placeholder="octocat/hello-world"
                className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
              />
            </Field>
            <p className="text-xs text-muted-foreground">
              You must own or have admin access to this repo. Cooplink will request the minimum
              scopes required to grant buyer access on purchase.
            </p>
            <div className="flex justify-end">
              <button
                onClick={() => setStep(2)}
                disabled={!repoName}
                className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Field label="Title" required>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
              />
            </Field>
            <Field label="Tagline" required>
              <input
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                maxLength={140}
                className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
              />
            </Field>
            <Field label="Description (markdown)">
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="w-full rounded-sm border border-border bg-background p-3 font-mono text-sm outline-none focus:border-foreground"
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Price (USD)" required>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value.replace(/[^\d.]/g, ""))}
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </Field>
              <Field label="Category">
                <input
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="SaaS starter"
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </Field>
              <Field label="Tags (comma-separated)">
                <input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="auth, stripe, nextjs"
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </Field>
              <Field label="Tech stack (comma-separated)">
                <input
                  value={tech}
                  onChange={(e) => setTech(e.target.value)}
                  placeholder="TypeScript, Postgres"
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm outline-none focus:border-foreground"
                />
              </Field>
            </div>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(1)}
                className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm text-foreground"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                disabled={!title || !tagline || !price}
                className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="space-y-2 rounded-sm border border-border-subtle bg-surface p-4 font-mono text-xs">
              <Row k="repo" v={repoName} />
              <Row k="title" v={title} />
              <Row k="tagline" v={tagline} />
              <Row k="price" v={`$${price} USD`} />
              <Row k="category" v={category || "—"} />
              <Row k="tags" v={tags || "—"} />
              <Row k="stack" v={tech || "—"} />
            </div>
            <p className="text-xs text-muted-foreground">
              Submitting sends this to review. You'll get an email when it's approved or if
              anything needs changing.
            </p>
            <div className="flex justify-between">
              <button
                onClick={() => setStep(2)}
                className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm text-foreground"
              >
                Back
              </button>
              <button
                onClick={submit}
                disabled={submitting}
                className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {submitting ? "…" : "Submit for review"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block font-mono text-xs text-muted-foreground">
        {label}
        {required && <span className="ml-1 text-destructive">*</span>}
      </label>
      {children}
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex gap-3">
      <div className="w-20 text-muted-foreground">{k}</div>
      <div className="flex-1 text-foreground">{v}</div>
    </div>
  );
}
