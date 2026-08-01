import { Link, useRouterState } from "@tanstack/react-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
import { getAccessToken } from "@/lib/api/client";

const NAV = [
  { to: "/browse", label: "Browse" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
];

export function MarketingHeader() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isLoggedIn = typeof window !== "undefined" && !!getAccessToken();
  const { i18n } = useTranslation();
  const lang = i18n.language?.startsWith("uz") ? "uz" : i18n.language?.startsWith("ru") ? "ru" : "en";
  const LANGS = [
    { code: "en" as const, label: "EN" },
    { code: "ru" as const, label: "RU" },
    { code: "uz" as const, label: "UZ" },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border-subtle bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-2">
            <div
              className="h-5 w-5 rounded-sm bg-foreground"
              style={{
                maskImage:
                  "conic-gradient(from 45deg at 50% 50%, black 0 25%, transparent 25% 50%, black 50% 75%, transparent 75% 100%)",
                WebkitMaskImage:
                  "conic-gradient(from 45deg at 50% 50%, black 0 25%, transparent 25% 50%, black 50% 75%, transparent 75% 100%)",
              }}
              aria-hidden
            />
            <span className="font-mono text-sm font-medium tracking-tight text-foreground">
              cooplink
            </span>
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            {NAV.map((n) => {
              const active = pathname.startsWith(n.to);
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  className={`text-sm transition-colors ${
                    active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {n.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-0.5 rounded-sm border border-border-subtle p-0.5">
            {LANGS.map((l) => (
              <button
                key={l.code}
                onClick={() => i18n.changeLanguage(l.code)}
                className={`rounded-sm px-1.5 py-0.5 font-mono text-[11px] transition-colors ${
                  lang === l.code
                    ? "bg-foreground text-background"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <Link
              to="/dashboard"
              className="inline-flex h-8 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
            >
              Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/auth/sign-in"
                className="inline-flex h-8 items-center rounded-sm px-3 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                Sign in
              </Link>
              <Link
                to="/auth/sign-in"
                className="inline-flex h-8 items-center rounded-sm bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:opacity-90"
              >
                Get started
              </Link>
            </>
          )}
        </div>
        </div>

        <button
          className="inline-flex h-8 w-8 items-center justify-center rounded-sm border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border-subtle md:hidden">
          <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3 sm:px-6">
            {NAV.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                onClick={() => setOpen(false)}
                className="rounded-sm px-2 py-1.5 text-sm text-foreground hover:bg-secondary"
              >
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-2 border-t border-border-subtle pt-3">
              {isLoggedIn ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="inline-flex h-8 flex-1 items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground"
                >
                  Dashboard
                </Link>
              ) : (
                <>
                  <Link
                    to="/auth/sign-in"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-sm border border-border text-sm"
                  >
                    Sign in
                  </Link>
                  <Link
                    to="/auth/sign-in"
                    onClick={() => setOpen(false)}
                    className="inline-flex h-8 flex-1 items-center justify-center rounded-sm bg-primary text-sm font-medium text-primary-foreground"
                  >
                    Get started
                  </Link>
                </>
              )}
            </div>
            <div className="mt-3 flex items-center justify-center gap-0.5 rounded-sm border border-border-subtle p-0.5">
              {LANGS.map((l) => (
                <button
                  key={l.code}
                  onClick={() => { i18n.changeLanguage(l.code); setOpen(false); }}
                  className={`rounded-sm px-2 py-0.5 font-mono text-[11px] transition-colors ${
                    lang === l.code
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
