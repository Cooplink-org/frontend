import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import i18n from "@/i18n/i18n";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints/auth";
import type { PhoneLinkResponse, PhoneStatusResponse } from "@/lib/api/endpoints/auth";
import { QueryBoundary } from "@/components/data-state/QueryBoundary";
import { Skeleton } from "@/components/ui/skeleton";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Upload, X, Check, ExternalLink, Phone, ShieldCheck, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: i18n.t("settings.title") },
      { name: "description", content: i18n.t("settings.meta_desc") },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const queryClient = useQueryClient();
  const me = useQuery({ queryKey: ["auth", "me"], queryFn: () => authApi.me() });
  const [bio, setBio] = useState("");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [telegram, setTelegram] = useState("");
  const [saving, setSaving] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { t } = useTranslation();

  const user = me.data;

  if (user && !initialized) {
    setBio(user.bio ?? "");
    setAvatarPreview(user.avatarUrl ?? null);
    setTelegram(user.telegramChatId ?? "");
    setInitialized(true);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error(t("settings.toast.select_image"));
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error(t("settings.toast.image_size"));
      return;
    }
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function saveProfile() {
    setSaving(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(avatarFile);
        });
      }
      await authApi.updateProfile({ bio: bio || undefined, avatarUrl, telegramChatId: telegram || undefined });
      toast.success(t("settings.toast.profile_updated"));
      queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toast.update_failed"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
      <div className="pointer-events-none absolute inset-0 bg-grid opacity-30" aria-hidden />
      <div className="relative">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">{t("settings.section")}</div>
        <h1 className="mt-2 font-mono text-3xl tracking-tight text-foreground">{t("settings.heading")}</h1>
      </div>

      <div className="relative mt-6 space-y-4">
        <Section title={t("settings.profile")}>
          <QueryBoundary
            query={me}
            loading={<div className="p-4"><Skeleton className="h-32 w-full" /></div>}
          >
            {(u) => (
              <>
                <FieldRow label={t("settings.username")} value={u.username} />
                <FieldRow label={t("settings.email")} value={u.email} />
                <div className="px-5 py-3">
                  <label className="mb-1.5 block font-mono text-xs text-muted-foreground">{t("settings.bio")}</label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={3}
                    className="w-full rounded-sm border border-border bg-background p-2 font-mono text-sm text-foreground outline-none focus:border-foreground"
                  />
                </div>
                <div className="px-5 py-3">
                  <label className="mb-1.5 block font-mono text-xs text-muted-foreground">{t("settings.photo")}</label>
                  <div className="flex items-center gap-3">
                    {avatarPreview ? (
                      <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-subtle">
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      </div>
                    ) : (
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-border-subtle bg-surface">
                        <Upload className="h-4 w-4 text-muted-foreground" />
                      </div>
                    )}
                    <div className="flex flex-1 items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex h-8 items-center rounded-sm border border-border bg-background px-3 font-mono text-xs text-foreground hover:bg-secondary"
                      >
                        {avatarFile ? t("settings.change_photo") : t("settings.upload_photo")}
                      </button>
                      {avatarFile && (
                        <button
                          type="button"
                          onClick={() => { setAvatarFile(null); setAvatarPreview(u.avatarUrl ?? null); }}
                          className="inline-flex h-8 items-center rounded-sm border border-border px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                      <span className="font-mono text-[10px] text-muted-foreground">{t("settings.photo_hint")}</span>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                </div>
                <div className="px-5 py-3">
                  <label className="mb-1.5 block font-mono text-xs text-muted-foreground">{t("settings.telegram")}</label>
                  <input
                    value={telegram}
                    onChange={(e) => setTelegram(e.target.value)}
                    className="h-9 w-full rounded-sm border border-border bg-background px-2 font-mono text-sm text-foreground outline-none focus:border-foreground"
                    placeholder={t("settings.telegram_placeholder")}
                  />
                </div>
                <div className="flex justify-end px-5 py-3">
                  <button
                    onClick={saveProfile}
                    disabled={saving}
                    className="inline-flex h-9 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50"
                  >
                    {saving ? t("common.saving") : t("common.save")}
                  </button>
                </div>
              </>
            )}
          </QueryBoundary>
        </Section>

        <Section title={t("settings.phone_verification")}>
          <QueryBoundary
            query={me}
            loading={<div className="p-4"><Skeleton className="h-32 w-full" /></div>}
          >
            {(u) => <PhoneVerificationSection phoneVerified={u.phoneVerified} phoneNumber={u.phoneNumber} />}
          </QueryBoundary>
        </Section>

        <Section title={t("settings.connected_accounts")}>
          <FieldRow label={t("settings.github")} value={user?.githubUsername ? `@${user.githubUsername}` : t("settings.not_connected")} />
        </Section>
      </div>
    </div>
  );
}

type VerifyStep = "idle" | "linking" | "waiting_code" | "verified";

function PhoneVerificationSection({ phoneVerified, phoneNumber }: { phoneVerified: boolean; phoneNumber: string | null }) {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<VerifyStep>(phoneVerified ? "verified" : "idle");
  const [linkData, setLinkData] = useState<PhoneLinkResponse | null>(null);
  const [statusData, setStatusData] = useState<PhoneStatusResponse | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);
  const { t } = useTranslation();

  // Check existing status on mount
  useEffect(() => {
    authApi.phoneStatus().then((s) => {
      setStatusData(s);
      if (s.phone_verified) {
        setStep("verified");
      } else if (s.has_active_code) {
        setStep("waiting_code");
        if (s.code_expires_at) {
          const expiresMs = new Date(s.code_expires_at).getTime() - Date.now();
          if (expiresMs > 0) setCountdown(Math.floor(expiresMs / 1000));
        }
      }
    }).catch(() => {
      // Ignore — user may not have started verification yet
    });
  }, []);

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c !== null && c > 0 ? c - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleStartVerification = useCallback(async () => {
    setError(null);
    try {
      const data = await authApi.phoneLink();
      setLinkData(data);
      setStep("linking");
      // Set countdown from the expiry time
      const expiresMs = new Date(data.expires_at).getTime() - Date.now();
      if (expiresMs > 0) setCountdown(Math.floor(expiresMs / 1000));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toast.link_failed"));
      setError(err instanceof Error ? err.message : t("settings.toast.link_failed"));
    }
  }, []);

  const handleContinueToCode = useCallback(() => {
    setStep("waiting_code");
  }, []);

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setError(t("settings.toast.enter_code"));
      return;
    }
    setError(null);
    setVerifying(true);
    try {
      const result = await authApi.phoneVerify(code);
      if (result.phone_verified) {
        setStep("verified");
        toast.success(t("settings.toast.phone_verified"));
        queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t("settings.toast.verification_failed"));
    } finally {
      setVerifying(false);
    }
  }, [code, queryClient]);

  const handleResendCode = useCallback(async () => {
    setError(null);
    try {
      const data = await authApi.phoneLink();
      setLinkData(data);
      setStep("waiting_code");
      const expiresMs = new Date(data.expires_at).getTime() - Date.now();
      if (expiresMs > 0) setCountdown(Math.floor(expiresMs / 1000));
      toast.success(t("settings.toast.new_link"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toast.new_link_failed"));
      setError(err instanceof Error ? err.message : t("settings.toast.new_link_failed"));
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  if (step === "verified" || phoneVerified) {
    return (
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-green-500/10">
            <ShieldCheck className="h-5 w-5 text-green-600" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-sm text-foreground">{t("settings.phone_verified")}</div>
            <div className="font-mono text-xs text-muted-foreground">
              {phoneNumber ?? t("settings.verified_via_telegram")}
            </div>
          </div>
          <Check className="h-5 w-5 text-green-600" />
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-4 space-y-4">
      {step === "idle" && (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Phone className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-mono text-sm text-foreground">{t("settings.verify_heading_idle")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("settings.verify_desc_idle")}
              </div>
            </div>
          </div>
          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
          <button
            onClick={handleStartVerification}
            className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <Phone className="h-4 w-4" />
            {t("settings.verify_btn")}
          </button>
        </>
      )}

      {step === "linking" && linkData && (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
              <ExternalLink className="h-4 w-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <div className="font-mono text-sm text-foreground">{t("settings.step1_heading")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("settings.step1_desc")}
              </div>
            </div>
          </div>
          {countdown !== null && countdown > 0 && (
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t("telegram.link_expires", { time: formatTime(countdown) })}
            </div>
          )}
          {countdown === 0 && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {t("telegram.link_expired")}
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
          <div className="flex items-center gap-2">
            <a
              href={linkData.deep_link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              <ExternalLink className="h-4 w-4" />
              {t("settings.open_telegram")}
            </a>
            <button
              onClick={handleContinueToCode}
              className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm text-foreground hover:bg-secondary"
            >
              {t("settings.shared_number")}
            </button>
          </div>
        </>
      )}

      {step === "waiting_code" && (
        <>
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
              <ShieldCheck className="h-4 w-4 text-amber-600" />
            </div>
            <div className="flex-1">
              <div className="font-mono text-sm text-foreground">{t("settings.step2_heading")}</div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("settings.step2_desc")}
              </div>
            </div>
          </div>
          {countdown !== null && countdown > 0 && (
            <div className="flex items-center gap-2 font-mono text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {t("telegram.code_expires", { time: formatTime(countdown) })}
            </div>
          )}
          {countdown === 0 && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {t("telegram.code_expired")}
            </div>
          )}
          {error && (
            <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
              {error}
            </div>
          )}
          <div className="space-y-3">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(v) => setCode(v)}
              onComplete={() => {
                if (code.length === 6) handleVerifyCode();
              }}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            <div className="flex items-center gap-2">
              <button
                onClick={handleVerifyCode}
                disabled={verifying || code.length !== 6}
                className="inline-flex h-9 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
              >
                {verifying ? t("settings.verifying") : t("settings.verify_code")}
              </button>
              <button
                onClick={handleResendCode}
                className="inline-flex h-9 items-center rounded-sm border border-border px-3 text-sm text-foreground hover:bg-secondary"
              >
                {t("settings.resend_code")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-md border border-border-subtle bg-background">
      <div className="border-b border-border-subtle px-5 py-2.5 font-mono text-sm text-foreground">
        {title}
      </div>
      <div className="divide-y divide-border-subtle">{children}</div>
    </div>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between px-5 py-3">
      <div className="font-mono text-xs text-muted-foreground">{label}</div>
      <div className="font-mono text-sm text-foreground">{value}</div>
    </div>
  );
}
