import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints/auth";
import { Check } from "lucide-react";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: "Complete your account — Cooplink" },
      { name: "description", content: "Finish setting up your Cooplink account." },
      { property: "og:title", content: "Complete your account — Cooplink" },
      { property: "og:description", content: "Finish setting up your Cooplink account." },
    ],
  }),
  component: OnboardingPage,
});

function OnboardingPage() {
  const navigate = useNavigate();
  const [legalName, setLegalName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      toast.error("You must accept the terms to continue.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.completeOnboarding({
        legalName,
        phone,
        avatarUrl: avatarUrl || undefined,
        acceptedTermsVersion: "1.0",
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not complete onboarding");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background px-4">
      <div className="w-full max-w-lg">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          onboarding · required
        </div>
        <h1 className="mt-3 font-mono text-3xl tracking-tight text-foreground">
          A few details before you continue.
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          We're required to collect this to process payouts and handle any disputes. Nothing is
          shown publicly.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-md border border-border-subtle bg-surface p-6">
          <Field label="Legal name" required>
            <input
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
              placeholder="First Last"
            />
          </Field>
          <Field label="Phone" required>
            <input
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
              placeholder="+1 555 000 0000"
            />
          </Field>
          <Field label="Avatar URL (optional)">
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              type="url"
              className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
              placeholder="https://…"
            />
          </Field>

          <label className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-sm border-border accent-[color:var(--accent-lime)]"
            />
            <span className="text-sm text-foreground">
              I accept the{" "}
              <a href="/terms" className="text-foreground underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="/privacy" className="text-foreground underline">
                Privacy Policy
              </a>
              .
            </span>
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "…" : (<><Check className="h-4 w-4" /> Continue</>)}
            </button>
          </div>
        </form>
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
