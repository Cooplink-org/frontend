# Cooplink Frontend — Full Rebuild Plan

Total rebuild. Nothing carried over. Vercel/Linear/GitHub-adjacent visual language. Ready to wire to your API docs the moment you drop them.

## 1. Design System (foundation — built first, everything else consumes it)

Rewrite `src/styles.css` with a deliberate, named token scale — not arbitrary gray-100/200/300 picks.

- **Palette (light + dark)**
  - `--bg` `#FAFAFA` / `#0A0A0A`
  - `--surface` (subtle raised) via 1px border + bg shift, never shadow
  - Ink scale: `--ink-1` (#171717) … `--ink-5` (muted) — deliberate steps
  - Border scale: `--border-subtle`, `--border`, `--border-strong`
  - **Single accent**: one color used ONLY for primary CTA, active state, links, data highlight. Default proposal: a precise electric blue (`oklch(0.62 0.19 250)`). Tell me if you want a different accent.
- **Typography**
  - Sans: **Geist** (body, UI labels)
  - Mono: **Geist Mono** (headings, prices, repo names, usernames, numbers, table data)
  - Loaded via `<link>` in `__root.tsx` head, referenced via `--font-sans` / `--font-mono` theme tokens.
- **Geometry**
  - Default radius: `4px` (sharp)
  - Pill radius: `999px` — reserved for marketing/hero CTAs only
- **Depth**: 1px borders + bg shifts. Shadows only for dropdown/modal/popover.
- **Motion**: 120–200ms fades/slides, `ease-out`. No bounce, no spring on UI chrome. Framer Motion reserved for page transitions + hero reveal.
- **Grid/dot texture utility**: `.bg-grid` + `.bg-dots` — hero/marketing only, forbidden behind tables/forms.
- **Hero mesh glow**: one soft radial gradient utility, hero only.
- Theme all shadcn primitives to these tokens (button, input, dialog, table, tabs, dropdown, toast, checkbox, select, skeleton, badge, card, sheet, tooltip, avatar).

## 2. API Client Layer (built now, ready for your docs)

Since real endpoints/shapes are unknown, I'll build a typed, swappable client:

- `src/lib/api/client.ts` — fetch wrapper: base URL from env, auth header injection, JSON handling, typed errors (`ApiError` with status + code + message), pagination helper.
- `src/lib/api/types.ts` — placeholder types (`Listing`, `Project`, `User`, `Sale`, `Payout`, `Report`, etc.) clearly marked `// TODO: replace from API docs`.
- `src/lib/api/endpoints/` — one file per domain (`listings.ts`, `projects.ts`, `auth.ts`, `payouts.ts`, `admin.ts`, `reviews.ts`). Every function returns a typed promise; **no fake data returned** — they throw `NotImplementedError` until wired.
- TanStack Query wrappers with proper `queryKey` factories per domain.
- When you attach the API docs I do a single pass: replace types, fill endpoint bodies, remove `NotImplementedError`. UI does not change.

## 3. Data-State Primitives (non-negotiable, built once, reused everywhere)

- `<QueryBoundary>` — wraps `useQuery`, renders `loading` / `error` / `empty` / `data` slots.
- `<Skeleton>` variants: text, card, table row, chart.
- `<EmptyState>` — monochrome, icon + heading + subcopy + optional action. No illustrations.
- `<ErrorState>` — restrained, retry action, error code in mono.
- Chart component (Recharts, themed) with explicit **0-point** and **1-point** handling: 0 → empty state, 1 → single dot + baseline, ≥2 → line/area. Unit-tested.

## 4. Routes (TanStack Router, file-based)

**Public (marketing)**

- `/` — landing (hero w/ mesh glow + grid, live activity strip, features, how-it-works, footer)
- `/pricing`, `/about`, `/terms`, `/privacy` — minimal shells with proper `head()` metadata

**Auth**

- `/auth/sign-in`, `/auth/sign-up`, `/auth/callback` (GitHub OAuth handoff — final shape from your docs)

**App (gated by `_authenticated`)**

- `/onboarding` — blocking full-screen (legal name, phone, avatar, terms). Redirects everywhere else until complete.
- `/browse` — marketplace grid + filter sidebar (category, tags, price range, sort, search)
- `/projects/$id` — description, tech stack, price, seller card, screenshots, reviews, Q&A, report, purchase CTA
- `/dashboard` — seller summary stats (mono numerals), earnings chart, listings table, recent sales
- `/dashboard/listings` + `/dashboard/listings/new` (multi-step: connect repo → price/desc/tags → submit)
- `/dashboard/payouts` — balance, pending breakdown, withdrawal flow
- `/settings` — account, security, connected GitHub, notifications
- `/library` — purchased projects (buyer side)

**Admin (`_authenticated/_admin`, role-gated)**

- `/admin` — dashboard, dense mono tables
- `/admin/reports` — report queue
- `/admin/users` — ban/unban
- `/admin/projects` — delete/restore
- `/admin/audit-log` — full log

Every leaf route: own `head()` with distinct title/description/og. Sitemap + robots updated.

## 5. Shared App Chrome

- `<AppShell>` — collapsible sidebar nav (shadcn sidebar, themed), top bar with search + user menu + notifications, breadcrumbs
- `<MarketingHeader>` / `<MarketingFooter>` — separate from app chrome
- `<AdminShell>` — denser variant, no marketing warmth

## 6. Motion (Framer Motion, restrained)

- Hero: single staggered fade-up on load
- Route transitions: 150ms opacity crossfade via `AnimatePresence`
- List items on filter change: 100ms fade, no layout bounce
- Respect `prefers-reduced-motion` globally

## 7. Responsive

- Mobile-first everywhere. Admin tables: horizontal scroll on <lg, stacked card fallback on <sm.
- Sidebar collapses to sheet on mobile.

## 8. Build Order (single continuous pass, no stopping)

1. Design tokens + fonts + shadcn re-theme
2. API client + query wrappers + data-state primitives
3. Marketing header/footer + landing page
4. Auth routes (UI only, wired to placeholder client)
5. App shell + onboarding gate
6. Browse + project detail
7. Seller dashboard + earnings chart (with 0/1/many handling)
8. Listings create flow + payouts
9. Admin shell + moderation routes
10. Sitemap, robots, `head()` metadata sweep

## Assumptions I'm making (flag if wrong)

- **scolor**: precise electric blue. Say the word for a different one (e.g. Vercel-white on black, GitHub green, or a custom hex).
- **Fonts**: Geist + Geist Mono via `@fontsource-variable`.
- **Auth**: primarily GitHub OAuth (fits developer audience); email/password as fallback surface exists until your docs say otherwise.
- **Charts**: Recharts, themed monochrome + accent.
- **Cloud backend**: NOT enabled. You said you'll provide API docs — I'll wire to your external API, not to Lovable Cloud. Say if you actually want Cloud instead.

## What I will NOT do until you confirm or send docs

- Invent endpoint paths, request/response shapes, or mock data returned as if real
- Enable Lovable Cloud / Supabase (unless you say to)
- Ship any placeholder-filled UI as "done" — every screen renders real skeleton/empty/error until wired

Reply "go" (or with tweaks — accent color, fonts, Cloud yes/no) and I build the whole thing in one pass.

&nbsp;

comment:

**1. Reconsider the "electric blue" accent — it's ironically the most common AI-dev-tool default.**  
Every Linear-inspired/Vercel-inspired AI-generated dashboard defaults to blue or indigo. And it actually contradicts the research: real Vercel has *no* brand-blue at all — "the ink IS the brand," and their only color is a soft gradient reserved for the hero. Two better options:

- **True Vercel restraint**: near-zero accent — the "accent" is just a slightly darker/lighter ink shade used on hover/active states, color shows up almost nowhere. Most distinctive, hardest to pull off generically.
- **A less-expected hue**: warm amber, deep rust, or acid green instead of blue — still one accent, used just as sparingly, but doesn't read as "yet another blue SaaS tool."  
Tell it which way to go — don't let it default to blue by omission.

**2. Explicitly ban two classic hero-slop patterns it didn't rule out:**

- Fake browser-window mockup screenshots with placeholder UI in the hero (the single most recognizable "AI built this" tell)
- A "trusted by" logo strip with invented company logos  
Add a line forbidding both.

**3. Pin the shadcn style variant explicitly** — shadcn ships "default" and "new-york" styles with different visual character; if you don't name one, it picks arbitrarily.

**4. Dark mode has tokens but no toggle** — you defined `--bg`/`--ink` for both light and dark but there's no `<ThemeToggle>` component or system-preference detection mentioned. Either add one or explicitly say light-only for v1.

**5. Confirm lucide-react as the single icon set explicitly** — it's implied but not stated as a rule, and "consistent icon set" gets violated easily if left ambiguous.

**6. Add one copy/voice line** — "no generic SaaS buzzwords (Supercharge, Unlock, Elevate, Seamless), no em-dash-heavy AI-prose cadence, plain confident developer-register copy" — you established this tone for Cooplink earlier in this project; worth restating so the landing page copy doesn't drift generic even if the visuals don't.

**7. One consistency note, not a flaw** — worth adding a line that the `*authenticated`/*`admin` route guards here are a **UX convenience only**; the real security boundary is server-side once the API is wired (same principle from your backend work — a frontend gate alone isn't enough). Cheap to state now, avoids someone assuming the frontend guard is sufficient later.