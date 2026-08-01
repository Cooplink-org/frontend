import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { authApi } from "@/lib/api/endpoints/auth";
import type { PhoneLinkResponse } from "@/lib/api/endpoints/auth";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSeparator,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Check, Upload, X, ExternalLink, Phone, ShieldCheck, Clock } from "lucide-react";
import i18n from "@/i18n/i18n";

export const Route = createFileRoute("/_authenticated/onboarding")({
  head: () => ({
    meta: [
      { title: i18n.t("onboarding.title") },
      { name: "description", content: i18n.t("onboarding.meta_desc") },
      { property: "og:title", content: i18n.t("onboarding.title") },
      { property: "og:description", content: i18n.t("onboarding.meta_desc") },
    ],
  }),
  component: OnboardingPage,
});

type PhoneStep = "idle" | "linking" | "waiting_code" | "verified";

function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [legalName, setLegalName] = useState("");
  const [verifiedPhone, setVerifiedPhone] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Phone verification state
  const [phoneStep, setPhoneStep] = useState<PhoneStep>("idle");
  const [linkData, setLinkData] = useState<PhoneLinkResponse | null>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

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

  async function fileToDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Countdown timer
  useEffect(() => {
    if (countdown === null || countdown <= 0) return;
    const timer = setInterval(() => {
      setCountdown((c) => (c !== null && c > 0 ? c - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const handleStartTelegramVerify = useCallback(async () => {
    setPhoneError(null);
    try {
      const data = await authApi.phoneLink();
      setLinkData(data);
      setPhoneStep("linking");
      const expiresMs = new Date(data.expires_at).getTime() - Date.now();
      if (expiresMs > 0) setCountdown(Math.floor(expiresMs / 1000));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("settings.toast.link_failed"));
      setPhoneError(err instanceof Error ? err.message : t("settings.toast.link_failed"));
    }
  }, []);

  const handleContinueToCode = useCallback(() => {
    setPhoneStep("waiting_code");
  }, []);

  const handleVerifyCode = useCallback(async () => {
    if (code.length !== 6) {
      setPhoneError(t("settings.toast.enter_code"));
      return;
    }
    setPhoneError(null);
    setVerifying(true);
    try {
      const result = await authApi.phoneVerify(code);
      if (result.phone_verified && result.phone_number) {
        setVerifiedPhone(result.phone_number);
        setPhoneStep("verified");
        toast.success(t("settings.toast.phone_verified"));
      }
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : t("settings.toast.verification_failed"));
    } finally {
      setVerifying(false);
    }
  }, [code]);

  const handleResendCode = useCallback(async () => {
    setPhoneError(null);
    try {
      const data = await authApi.phoneLink();
      setLinkData(data);
      setPhoneStep("waiting_code");
      const expiresMs = new Date(data.expires_at).getTime() - Date.now();
      if (expiresMs > 0) setCountdown(Math.floor(expiresMs / 1000));
    } catch (err) {
      setPhoneError(err instanceof Error ? err.message : t("settings.toast.new_link_failed"));
    }
  }, []);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!accepted) {
      toast.error(t("onboarding.toast.accept_terms"));
      return;
    }
    if (!verifiedPhone) {
      toast.error(t("onboarding.toast.verify_phone"));
      return;
    }

    setSubmitting(true);
    try {
      let avatarUrl: string | undefined;
      if (avatarFile) {
        avatarUrl = await fileToDataUrl(avatarFile);
      }
      await authApi.completeOnboarding({
        fullLegalName: legalName,
        phoneNumber: verifiedPhone,
        avatarUrl,
        termsAccepted: accepted,
      });
      await queryClient.invalidateQueries({ queryKey: ["auth", "me"] });
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("onboarding.toast.failed"));
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = accepted && legalName && phoneStep === "verified";

  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-background px-4 py-8">
      <div className="w-full max-w-lg">
        <div className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
          {t("onboarding.section")}
        </div>
        <h1 className="mt-3 font-mono text-3xl tracking-tight text-foreground">
          {t("onboarding.heading")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("onboarding.desc")}
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4 rounded-md border border-border-subtle bg-surface p-6">
          <Field label={t("onboarding.legal_name")} required>
            <input
              required
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              className="h-10 w-full rounded-sm border border-border bg-background px-3 font-mono text-sm text-foreground outline-none focus:border-foreground"
              placeholder={t("onboarding.name_placeholder")}
            />
          </Field>

          {/* Phone verification via Telegram */}
          <div>
            <label className="mb-1.5 block font-mono text-xs text-muted-foreground">
              {t("onboarding.phone")} <span className="ml-1 text-destructive">*</span>
            </label>
            <TelegramPhoneVerify
              phoneStep={phoneStep}
              linkData={linkData}
              code={code}
              setCode={setCode}
              verifying={verifying}
              phoneError={phoneError}
              countdown={countdown}
              verifiedPhone={verifiedPhone}
              onStartVerify={handleStartTelegramVerify}
              onContinueToCode={handleContinueToCode}
              onVerifyCode={handleVerifyCode}
              onResendCode={handleResendCode}
              formatTime={formatTime}
            />
          </div>

          <Field label={t("onboarding.profile_photo")}>
            <div className="flex items-center gap-3">
              {avatarPreview ? (
                <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full border border-border-subtle">
                  <img src={avatarPreview} alt="Avatar preview" className="h-full w-full object-cover" />
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
                  {avatarPreview ? t("onboarding.change_photo") : t("onboarding.upload_photo")}
                </button>
                {avatarPreview && (
                  <button
                    type="button"
                    onClick={() => { setAvatarFile(null); setAvatarPreview(null); }}
                    className="inline-flex h-8 items-center rounded-sm border border-border px-2 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                <span className="font-mono text-[10px] text-muted-foreground">{t("onboarding.file_hint")}</span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          </Field>

          <label className="flex items-start gap-2 pt-2">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(e) => setAccepted(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded-sm border-border accent-[color:var(--accent-lime)]"
            />
            <span className="text-sm text-foreground">
              {t("onboarding.accept_terms_before")}{" "}
              <a href="/terms" className="text-foreground underline">
                {t("onboarding.terms_link")}
              </a>{" "}
              {t("onboarding.accept_terms_and")}{" "}
              <a href="/privacy" className="text-foreground underline">
                {t("onboarding.privacy_link")}
              </a>
              {t("onboarding.accept_terms_after")}
            </span>
          </label>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting || !canSubmit}
              className="inline-flex h-10 items-center gap-2 rounded-sm bg-primary px-4 text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              {submitting ? "…" : (<><Check className="h-4 w-4" /> {t("onboarding.continue")}</>)}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TelegramPhoneVerify({
  phoneStep,
  linkData,
  code,
  setCode,
  verifying,
  phoneError,
  countdown,
  verifiedPhone,
  onStartVerify,
  onContinueToCode,
  onVerifyCode,
  onResendCode,
  formatTime,
}: {
  phoneStep: PhoneStep;
  linkData: PhoneLinkResponse | null;
  code: string;
  setCode: (v: string) => void;
  verifying: boolean;
  phoneError: string | null;
  countdown: number | null;
  verifiedPhone: string | null;
  onStartVerify: () => void;
  onContinueToCode: () => void;
  onVerifyCode: () => void;
  onResendCode: () => void;
  formatTime: (s: number) => string;
}) {
  const { t } = useTranslation();
  if (phoneStep === "verified" && verifiedPhone) {
    return (
      <div className="flex items-center gap-3 rounded-sm border border-green-500/30 bg-green-500/5 p-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/10">
          <ShieldCheck className="h-4 w-4 text-green-600" />
        </div>
        <div className="flex-1 font-mono text-sm text-foreground">{verifiedPhone}</div>
        <Check className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  if (phoneStep === "idle") {
    return (
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">
          {t("onboarding.verify_desc")}
        </p>
        {phoneError && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
            {phoneError}
          </div>
        )}
        <button
          type="button"
          onClick={onStartVerify}
          className="inline-flex h-9 items-center gap-2 rounded-sm border border-border bg-background px-4 font-mono text-xs text-foreground hover:bg-secondary"
        >
          <Phone className="h-4 w-4" />
          {t("onboarding.verify_button")}
        </button>
      </div>
    );
  }

  if (phoneStep === "linking" && linkData) {
    return (
      <div className="space-y-3 rounded-sm border border-border-subtle bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-500/10">
            <ExternalLink className="h-4 w-4 text-blue-600" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs font-medium text-foreground">{t("onboarding.step1_title")}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {t("onboarding.step1_desc")}
            </div>
          </div>
        </div>
        {countdown !== null && countdown > 0 && (
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t("onboarding.link_expires", { time: formatTime(countdown) })}
          </div>
        )}
        {phoneError && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
            {phoneError}
          </div>
        )}
        <div className="flex items-center gap-2">
          <a
            href={linkData.deep_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-2 rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground hover:opacity-90"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            {t("onboarding.open_telegram")}
          </a>
          <button
            type="button"
            onClick={onContinueToCode}
            className="inline-flex h-8 items-center rounded-sm border border-border px-3 text-xs text-foreground hover:bg-secondary"
          >
            {t("onboarding.shared_number")}
          </button>
        </div>
      </div>
    );
  }

  if (phoneStep === "waiting_code") {
    return (
      <div className="space-y-3 rounded-sm border border-border-subtle bg-background p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/10">
            <ShieldCheck className="h-4 w-4 text-amber-600" />
          </div>
          <div className="flex-1">
            <div className="font-mono text-xs font-medium text-foreground">{t("onboarding.step2_title")}</div>
            <div className="mt-1 text-[11px] text-muted-foreground">
              {t("onboarding.step2_desc")}
            </div>
          </div>
        </div>
        {countdown !== null && countdown > 0 && (
          <div className="flex items-center gap-2 font-mono text-[10px] text-muted-foreground">
            <Clock className="h-3 w-3" />
            {t("onboarding.code_expires", { time: formatTime(countdown) })}
          </div>
        )}
        {phoneError && (
          <div className="rounded-sm border border-destructive/30 bg-destructive/5 px-3 py-2 font-mono text-xs text-destructive">
            {phoneError}
          </div>
        )}
        <InputOTP maxLength={6} value={code} onChange={setCode}>
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
            type="button"
            onClick={onVerifyCode}
            disabled={verifying || code.length !== 6}
            className="inline-flex h-8 items-center gap-2 rounded-sm bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50"
          >
            {verifying ? t("onboarding.verifying") : t("onboarding.verify_code")}
          </button>
          <button
            type="button"
            onClick={onResendCode}
            className="inline-flex h-8 items-center rounded-sm border border-border px-3 text-xs text-foreground hover:bg-secondary"
          >
            {t("onboarding.resend")}
          </button>
        </div>
      </div>
    );
  }

  return null;
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
