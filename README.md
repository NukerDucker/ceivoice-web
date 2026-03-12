# CeiVoice Web — Frontend

Next.js frontend for CeiVoice, a voice-of-the-employee ticket management platform. Provides role-based dashboards for users, assignees, and admins to submit, track, and manage tickets.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4 |
| UI Components | Radix UI, shadcn/ui |
| Auth | Supabase SSR |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Markdown | @uiw/react-md-editor |
| Package Manager | pnpm |

---

## Project Structure

```
app/
├── (auth)/             # Auth pages (no layout chrome)
│   ├── login/
│   ├── register/
│   ├── onboarding/
│   ├── forget-password/
│   ├── reset-password/
│   └── enter-otp/
├── (roles)/            # Role-gated pages (with sidebar layout)
│   ├── admin/          # Admin dashboard
│   │   ├── dashboard/
│   │   ├── tickets/
│   │   ├── review-ticket/
│   │   ├── draft/
│   │   ├── report/
│   │   ├── user-management/
│   │   ├── notification/
│   │   ├── profile/
│   │   └── settings/
│   ├── assignee/       # Assignee dashboard
│   └── user/           # End-user dashboard
│       ├── my-request/
│       ├── tickets/
│       ├── notification/
│       └── profile/
├── api/                # Next.js API routes (server-side)
├── track/              # Public ticket tracking page
├── request-submitted/  # Post-submission confirmation
├── layout.tsx          # Root layout
└── globals.css         # Global styles
components/             # Reusable UI components
services/
└── auth.ts             # Client-side auth helpers
lib/                    # Utility functions
types/                  # TypeScript type definitions
```

---

## Pages Overview

| Route | Role | Description |
|-------|------|-------------|
| `/login` | Public | Email/password and Google OAuth login |
| `/register` | Public | New user registration |
| `/onboarding` | Public | First-time setup after sign-up |
| `/track` | Public | Track a ticket by ID without login |
| `/user/my-request` | User | Submit a new request |
| `/user/tickets` | User | View own ticket history |
| `/assignee/...` | Assignee | Manage assigned tickets |
| `/admin/dashboard` | Admin | Overview statistics |
| `/admin/tickets` | Admin | All tickets management |
| `/admin/review-ticket` | Admin | Review and approve/reject |
| `/admin/draft` | Admin | Draft ticket management |
| `/admin/report` | Admin | Analytics and reporting |
| `/admin/user-management` | Admin | Manage users and roles |

---

## Local Development

### Prerequisites

- Node.js 20+
- pnpm
- A running instance of [ceivoice-api](https://github.com/your-org/ceivoice-api) (or the backend Docker container)
- A [Supabase](https://supabase.com) project

### Setup

```bash
# 1. Install dependencies
pnpm install

# 2. Copy environment file and fill in values
cp .env.example .env.local

# 3. Start dev server (port 3000)
pnpm dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL (e.g. `http://localhost:5000/api`) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon public key |

> `NEXT_PUBLIC_*` variables are embedded at build time and exposed to the browser. Never put secrets here.

---

## Production Build

```bash
pnpm run build   # Build Next.js app (outputs standalone build)
pnpm start       # Start production server on port 3000
```

---

## Docker

### Build and run standalone

```bash
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key \
  -t ceivoice-web .

docker run -p 3000:3000 ceivoice-web
```

### Run with docker compose (combined deployment)

```bash
# Clone both repos side by side, then from the parent directory:
docker compose up --build
```

> **Note:** `NEXT_PUBLIC_*` vars must be passed as build arguments — they are baked into the build and cannot be changed at runtime.

---

## Auth Flow

1. User signs in via **Google OAuth** or email/password through Supabase
2. Supabase issues a JWT (access token + refresh token)
3. Tokens are stored and managed by `@supabase/ssr`
4. All API calls to the backend include `Authorization: Bearer <access_token>`
5. Role-based routing is enforced by layout-level auth checks in `(roles)/`
