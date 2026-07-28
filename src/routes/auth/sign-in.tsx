import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Github } from "lucide-react";
import { authApi } from "@/lib/api/endpoints/auth";
import { setAuthToken } from "@/lib/api/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth/sign-in")({
  head: () => ({
    meta: [
      { title: "Sign in — Cooplink" },
      { name: "description", content: "Sign in to your Cooplink account." },
      { property: "og:title", content: "Sign in — Cooplink" },
      { property: "og:description", content: "Sign in to your Cooplink account." },
    ],
  }),
  component: SignInPage,
});

function SignInPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await authApi.signIn({ email, password });
      setAuthToken(token);
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return <AuthShell mode="sign-in" onSubmit={onSubmit} submitting={submitting} email={email} setEmail={setEmail} password={password} setPassword={setPassword} />;
}

export function AuthShell({
  mode,
  onSubmit,
  submitting,
  email,
  setEmail,
  password,
  setPassword,
  username,
  setUsername,
}: {
  mode: "sign-in" | "sign-up";
  onSubmit: (e: React.FormEvent) => void;
  submitting: boolean;
  email: string;
  setEmail: (v: string) => void;
  password: string;
  setPassword: (v: string) => void;
  username?: string;
  setUsername?: (v: string) => void;
}) {
  const isSignUp = mode === "sign-up";
  return (
    <div className="grid min-h-screen bg-background md:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-border-subtle bg-surface md:block">
        <div className="absolute inset-0 bg-grid mask-fade-edges opacity-70" aria-hidden />
        <div className="absolute inset-0 bg-hero-glow" aria-hidden />
        <div className="relative flex h-full flex-col justify-between p-10">
          <Link to="/" className="flex items-center gap-2">
            <div className="h-5 w-5 rounded-sm bg-foreground" aria-hidden />
            <span className="font-mono text-sm text-foreground">cooplink</span>
          </Link>
          <blockquote className="max-w-sm">
            <p className="font-mono text-lg leading-snug text-foreground">
              "The GitHub-native marketplace I've been waiting for."
            </p>
            <footer className="mt-3 font-mono text-xs text-muted-foreground">
              — a developer, somewhere
            </footer>
          </blockquote>
        </div>
      </aside>

      <main className="flex items-center justify-center px-4 py-16 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
            {isSignUp ? "create account" : "sign in"}
          </div>
          <h1 className="mt-2 font-mono text-2xl tracking-tight text-foreground">
            {isSignUp ? "Get a Cooplink account" : "Welcome back"}
          </h1>

          <a
            href={authApi.githubAuthUrl()}
            className="mt-6 inline-flex h-10 w-full items-center justify-center gap-2 rounded-sm border border-border bg-background text-sm font-medium text-foreground transition-colors hover:bg-secondary"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </a>

          <div className="my-6 flex items-center gap-3 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            <div className="h-px flex-1 bg-border-subtle" />
            or
            <div className="h-px flex-1 bg-border-subtle" />
          </div>

          <form onSubmit={onSubmit} className="space-y-3">
            {isSignUp && setUsername && (
              <Field label="Username" htmlFor="username">
                <input
                  id="username"
                  value={username ?? ""}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
                  placeholder="octocat"
                />
              </Field>
            )}
            <Field label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
                placeholder="you@example.com"
              />
            </Field>
            <Field label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
                placeholder="••••••••"
              />
            </Field>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-10 w-full items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "…" : isSignUp ? "Create account" : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <Link to="/auth/sign-in" className="text-foreground underline-offset-4 hover:underline">
                  Sign in
                </Link>
              </>
            ) : (
              <>
                No account?{" "}
                <Link to="/auth/sign-up" className="text-foreground underline-offset-4 hover:underline">
                  Create one
                </Link>
              </>
            )}
          </p>
        </div>
      </main>
    </div>
  );
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block font-mono text-xs text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
