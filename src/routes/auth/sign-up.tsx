import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints/auth";
import { setAuthToken } from "@/lib/api/client";
import { AuthShell } from "./sign-in";

export const Route = createFileRoute("/auth/sign-up")({
  head: () => ({
    meta: [
      { title: "Create your account — Cooplink" },
      { name: "description", content: "Create your Cooplink account to buy or sell source code." },
      { property: "og:title", content: "Create your account — Cooplink" },
      { property: "og:description", content: "Create your Cooplink account." },
    ],
  }),
  component: SignUpPage,
});

function SignUpPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { token } = await authApi.signUp({ email, password, username });
      setAuthToken(token);
      navigate({ to: "/onboarding" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthShell
      mode="sign-up"
      onSubmit={onSubmit}
      submitting={submitting}
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      username={username}
      setUsername={setUsername}
    />
  );
}
