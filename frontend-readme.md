# Cooplink — Frontend

Next.js 14 marketplace platform for buying and selling source code snapshots.

**Stack:** Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Framer Motion, Radix UI.  
**Backend:** Django + DRF — see the main project README.

---

## Quick Start

```bash
cd frontend
npm install
npm run dev        # → http://localhost:3000
```

**Environment** (`.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

**Scripts:**

| Command | Description |
| :--- | :--- |
| `npm run dev` | Start dev server with HMR |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint check |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |

---

## Project Structure

```
src/
├── app/                      # Next.js App Router pages
│   ├── layout.tsx            # Root layout: Navbar + AuthProvider + Footer
│   ├── page.tsx              # Landing page (async server component)
│   ├── marketplace/page.tsx  # /marketplace — catalog + filters
│   ├── listings/[slug]/page.tsx  # /listings/:slug — product detail + checkout
│   ├── dashboard/page.tsx    # /dashboard — seller dashboard
│   └── docs/page.tsx         # /docs — API reference
├── components/
│   ├── layout/               # Navbar, Footer
│   ├── ui/                   # Modal, Emoji, DiffHunk, CodeBlock
│   ├── landing/              # TerminalHero, LiveStats, FeaturedSnapshots
│   ├── marketplace/          # ListingCard, FilterSidebar
│   ├── dashboard/            # EarningsChart, PayoutModal, CreateListingModal
│   └── docs/                 # AuthFlowDiagram, CodeSampleViewer, EndpointTable
├── context/
│   ├── AuthContext.tsx        # GitHub OAuth + JWT management
│   └── ListingContext.tsx     # Marketplace filter state
├── lib/
│   ├── api.ts                # API client with auto-refresh + all endpoint functions
│   ├── utils.ts              # cn(), formatUZS(), formatDate(), etc.
│   └── useSafeAsync.ts       # Safe async effect hook
└── types/
    └── index.ts              # All TypeScript interfaces
```

---

## Auth System

Authentication is managed by `AuthContext` which wraps the entire app.

### Token Flow

1. **Login**: `useAuth().loginWithGitHub()` → redirects to GitHub OAuth
2. **Callback**: Backend redirects to `FRONTEND_URL/#auth/callback&access=<JWT>&refresh=<JWT>`
3. **Parse**: `AuthProvider` reads the hash fragment on mount, stores tokens in `localStorage`
4. **Auto-refresh**: The API client (`lib/api.ts`) automatically refreshes expired tokens on 401
5. **Logout**: Clears `localStorage` tokens and user state

### Token Storage (localStorage)

| Key | Description |
| :--- | :--- |
| `cooplink_access_token` | Short-lived JWT (60 min) |
| `cooplink_refresh_token` | Long-lived JWT (7 days) |

### Hook

```tsx
const { user, isAuthenticated, isLoading, loginWithGitHub, connectRepos, logout } = useAuth();
```

---

## API Client

All API calls go through `src/lib/api.ts`. It provides:

- **Auto token refresh**: On 401, attempts refresh with the stored refresh token, then retries the original request
- **Normalization**: Raw API data is normalized into frontend types (parses decimal strings, extracts nested objects)

```tsx
import { api } from "@/lib/api";

const projects = await api.getListings({ category: "web-apps", ordering: "-price" });
const me = await api.getCurrentUser();
const order = await api.createOrder(projectId);
```

### Available Methods

See the [API Endpoints](#-api-endpoints) section below for the full list.

---

## Pages

| Route | File | Description |
| :--- | :--- | :--- |
| `/` | `app/page.tsx` | Landing page with interactive terminal hero, live stats, featured projects |
| `/marketplace` | `app/marketplace/page.tsx` | Public catalog with search, filter sidebar, paginated grid |
| `/listings/[slug]` | `app/listings/[slug]/page.tsx` | Project detail, description, tech stack, MirPay checkout modal |
| `/dashboard` | `app/dashboard/page.tsx` | Seller dashboard: summary cards, earnings chart, sales/listings tables, payouts |
| `/docs` | `app/docs/page.tsx` | API reference with interactive code samples |

---

## Theming

The app uses a dark theme by default (`<html className="dark">`). Custom Tailwind design tokens are defined in `globals.css`:

- `cooplink-bg`, `cooplink-surface`, `cooplink-text`, `cooplink-muted`, `cooplink-border`
- Dynamic accent colors via CSS custom properties (`--listing-accent`, `--listing-accent-glow`)

---

## API Endpoints

The following section documents every backend API endpoint used by the frontend.

### 📦 Marketplace (Public)

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/listings/` | Public | Paginated catalog of published projects. |
| `GET` | `/api/listings/<slug>/` | Public | Full public details for a project. |
| `GET` | `/api/listings/categories/` | Public | List of categories for filtering. |

#### Query Parameters for `/api/listings/`

- `q`: Search title or description (keyword).
- `category`: Category slug (e.g., `web-apps`).
- `tags`: Comma-separated tags (filters project matching ALL tags).
- `tech_stack`: Comma-separated tech (e.g., `python,postgres`).
- `license_type`: One of `mit`, `apache2`, `gpl3`, `proprietary`, `other`.
- `min_price` / `max_price`: Price range in UZS.
- `featured`: `1` to show only editor's picks.
- `ordering`: `-created_at` (default), `created_at`, `price`, `-price`, `view_count`, `-view_count`. Editor's picks are always pinned to the top regardless of sort.
- `page`, `page_size`: Pagination. Default page_size is 20, max is 100.

#### Public Project Response Shape (`GET /api/listings/`, `GET /api/listings/<slug>/`)

```json
{
  "id": 1,
  "title": "FastAPI Async Microservice Boilerplate",
  "slug": "fastapi-microservice-boilerplate",
  "description": "## Overview\n\nA battle-tested...",
  "price": "180000.00",
  "tags": ["boilerplate", "microservice"],
  "cover_image": null,
  "screenshots": [],
  "demo_url": null,
  "tech_stack": ["Python", "FastAPI", "PostgreSQL"],
  "category_name": "APIs & Backends",
  "seller_profile": {
    "username": "alexandra-chen",
    "avatar_url": "https://...",
    "bio": "Backend Systems Architect."
  },
  "featured": true,
  "view_count": 1420,
  "created_at": "2024-03-10T14:30:00Z"
}
```

> [!NOTE]
> The public listing endpoint does **not** expose: `banner_image`, `accent_color`, `highlights`, `license_type`, `latest_snapshot`, `sales_count`, `download_count`, `github_repo_full_name`, `github_default_branch`, or a full `seller` User object. These fields are only available via the authenticated **Seller Tools** endpoints or when creating a draft.

#### Category Response Shape (`GET /api/listings/categories/`)

```json
{"id": 1, "name": "Web Apps", "slug": "web-apps"}
```

---

### 🛠️ Seller Tools (Authorized — Bearer Token)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/listings/my-repos/` | List authenticated seller's GitHub repositories. |
| `GET` | `/api/listings/projects/` | List seller's own projects (all statuses). |
| `POST` | `/api/listings/projects/` | Create a new project draft. |
| `GET` | `/api/listings/projects/<id>/` | Retrieve a single project. |
| `PATCH` | `/api/listings/projects/<id>/` | Edit draft or rejected project. |
| `DELETE` | `/api/listings/projects/<id>/` | Delete draft or rejected project. Returns 204. |
| `POST` | `/api/listings/projects/<id>/submit/` | Submit for approval. Payload: `{"accept_terms": true}`. |

> [!NOTE]
> Seller endpoints require BOTH `is_seller=True` AND a stored GitHub token (set via the connect-repos OAuth flow). Returns 403 if missing.

#### Project Response Shape (Seller Tools)

```json
{
  "id": 1,
  "seller": 201,
  "seller_username": "alexandra-chen",
  "category": 3,
  "category_name": "APIs & Backends",
  "title": "FastAPI Async Microservice Boilerplate",
  "slug": "fastapi-microservice-boilerplate",
  "description": "## Overview\n\n...",
  "github_repo_full_name": "alexandra-chen/fastapi-async-core",
  "github_default_branch": "main",
  "price": "180000.00",
  "tags": ["boilerplate"],
  "cover_image": null,
  "banner_image": null,
  "accent_color": "#38bdf8",
  "highlights": ["Production-ready async SQLAlchemy v2"],
  "featured": false,
  "screenshots": [],
  "demo_url": null,
  "tech_stack": ["Python", "FastAPI"],
  "license_type": "mit",
  "status": "draft",
  "version": 1,
  "view_count": 0,
  "created_at": "2024-03-10T14:30:00Z",
  "updated_at": "2024-03-10T14:30:00Z"
}
```

#### GitHub Repo Response Shape (`GET /api/listings/my-repos/`)

```json
{
  "name": "fastapi-async-core",
  "full_name": "alexandra-chen/fastapi-async-core",
  "description": "A microservice skeleton...",
  "default_branch": "main",
  "private": false,
  "updated_at": "2024-07-12T09:15:00Z",
  "size": 4404
}
```

---

### 💰 Orders & Payouts (Authorized)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/orders/` | Initiate purchase. Payload: `{"project_id": <id>}`. |
| `GET` | `/api/orders/<id>/download/` | Fetch source ZIP archive for a paid project. |
| `GET` | `/api/payouts/mine/` | Returns balance info and payout history. |
| `POST` | `/api/payouts/request/` | Submit withdrawal request. Payload: `{"amount": <UZS>, "card_number": <str>}`. |

#### Order Create Response (`POST /api/orders/`)

```json
{
  "id": 9001,
  "status": "pending_payment",
  "price": "250000.00",
  "redirect_url": "https://mirpay.uz/checkout?payid=..."
}
```

#### Download Endpoint (`GET /api/orders/<id>/download/`)
- Only accessible by the buyer of a `paid` order.
- Returns a streaming `.zip` file attachment.
- Increments the project's `download_count`.

#### Payouts Mine Response (`GET /api/payouts/mine/`)

```json
{
  "available_balance": "9250000.00",
  "pending_balance": [
    {"amount": "2500000.00", "unlocks_at": "2026-08-01T14:22:00Z"}
  ],
  "payouts": [
    {
      "id": 1,
      "amount": "500000.00",
      "destination_card_last4": "1234",
      "status": "processed",
      "admin_note": null,
      "requested_at": "2026-07-01T10:00:00Z",
      "processed_at": "2026-07-02T10:00:00Z"
    }
  ]
}
```

**Balance Logic:**
- `available_balance`: Sum of sale earnings older than 7 days, minus refunds and payouts.
- `pending_balance`: List of `{amount, unlocks_at}` for sales within the last 7 days.

---

### 📊 Seller Dashboard (Authorized)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/dashboard/summary/` | Totals: revenue, sales, downloads, next unlock date. |
| `GET` | `/api/dashboard/sales/` | Paginated list of items sold to others. |
| `GET` | `/api/dashboard/listings/` | Paginated list of your listings with per-listing stats. |
| `GET` | `/api/dashboard/earnings-timeseries/` | Data for charts. Query param: `range=30d` (default, max 365d). |

#### Dashboard Summary Response (`GET /api/dashboard/summary/`)

```json
{
  "lifetime_revenue": "14750000.00",
  "available_balance": "9250000.00",
  "pending_balance": "5500000.00",
  "next_unlock_date": "2026-08-01T14:22:00Z",
  "total_sales": 68,
  "total_published_listings": 4,
  "total_downloads": 142
}
```

> [!NOTE]
> `pending_balance` here is a **decimal total**, not a list. For the per-item breakdown with unlock dates, use `GET /api/payouts/mine/`.

#### Dashboard Sales Response (`GET /api/dashboard/sales/`)

```json
{
  "count": 68,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 9001,
      "buyer_username": "farrux_code",
      "project_title": "Telegram Subscription Bot",
      "project_slug": "telegram-subscription-bot",
      "price_at_purchase": "250000.00",
      "platform_fee_amount": "25000.00",
      "seller_earning_amount": "225000.00",
      "status": "paid",
      "created_at": "2026-07-20T14:22:00Z",
      "paid_at": "2026-07-20T14:23:15Z"
    }
  ]
}
```

> [!NOTE]
> Dashboard sales returns flat objects with `buyer_username` (string), not nested `buyer: User` objects. Paginated with default page_size=20.

#### Dashboard Listings Response (`GET /api/dashboard/listings/`)

```json
{
  "count": 4,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "title": "FastAPI Async Microservice Boilerplate",
      "slug": "fastapi-microservice-boilerplate",
      "price": "180000.00",
      "status": "published",
      "view_count": 1420,
      "download_count": 42,
      "sales_count": 15,
      "revenue": "2700000.00",
      "created_at": "2024-03-10T14:30:00Z",
      "updated_at": "2024-07-12T09:15:00Z"
    }
  ]
}
```

> [!NOTE]
> Dashboard listings return flat objects with aggregated stats (sales_count, revenue), NOT full Project objects with tags/tech_stack etc. Paginated with default page_size=20.

#### Earnings Timeseries Response (`GET /api/dashboard/earnings-timeseries/`)

```json
[
  {"date": "2026-06-25", "earnings": "670000.00"},
  {"date": "2026-06-28", "earnings": "420000.00"}
]
```

> [!NOTE]
> The timeseries returns `{date, earnings}` only. There is no `sales` count in this response. Dates are grouped by day (TruncDate).

---

## 4. User Profile

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/auth/me/` | Bearer Token | Return the authenticated user's profile. |
| `PATCH` | `/api/auth/me/` | Bearer Token | Update `bio` and/or `avatar_url`. |

#### User Response Shape

```json
{
  "id": 101,
  "username": "azizbek_dev",
  "email": "azizbek@example.com",
  "github_id": "8472910",
  "github_username": "azizbek_dev",
  "avatar_url": "https://avatars.githubusercontent.com/u/8472910?v=4",
  "bio": "Full-stack developer.",
  "is_seller": true,
  "telegram_chat_id": "@azizbek_dev",
  "created_at": "2024-01-15T10:00:00Z"
}
```

---

## 5. Error Format

All errors return a standard JSON object:

```json
{"detail": "Error message describing what went wrong"}
```

For validation errors, the response may use DRF's default format with field-level errors:

```json
{"field_name": ["Error message"]}
```

---

## 6. Development Resources

- **API Tester**: Open the root `/` of the backend in your browser to access the **Dev Playground** with a built-in "API Tester".
- **Token Lifetime**: Access tokens expire after 60 minutes. Refresh tokens expire after 7 days.
- **Refresh Token Rotation**: `ROTATE_REFRESH_TOKENS` is enabled — each refresh request returns a new refresh token along with a new access token.
- **Backend URL**: Set `NEXT_PUBLIC_API_URL` in `.env.local` to point to your backend (default: `http://localhost:8000/api`).
- **TypeScript**: Run `npm run typecheck` before pushing — the backend types are manually mirrored in `src/types/index.ts`; keep them in sync when the API changes.
- **Components**: New UI primitives go in `components/ui/`, page-specific components go in the corresponding subdirectory under `components/`.
- **API functions**: Add new endpoint functions to `src/lib/api.ts` following the existing pattern (`request<T>()` + normalization).
