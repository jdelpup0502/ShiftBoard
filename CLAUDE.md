@AGENTS.md

## Project: ShiftBoard

Restaurant scheduling platform. Next.js 16 App Router + Prisma 7 + SQLite. Deployed on Railway with a persistent SQLite volume at `/data`.

### Key constraints

- **Prisma 7 requires a driver adapter** — always use `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3`. Never construct `PrismaClient` without it.
- **After any schema change**: run `npx prisma migrate dev --name <name>` then `npx prisma generate`, then clear `.next/` and restart the dev server to avoid Turbopack serving stale compiled chunks.
- **iron-session cookies** can only be written in Server Actions or Route Handlers — never in Server Components. `requireUser()` in `src/lib/auth.ts` just redirects on failure; it does not call `session.destroy()`.
- **Dark mode** uses Tailwind v4 class strategy (`@variant dark` in `globals.css`). The `.dark` class is toggled on `<html>` by `ThemeToggle`. The root `<html>` has `suppressHydrationWarning` to prevent mismatch from the inline anti-flash script.
- **Dark-mode CSS variables must use `html.dark`, never `:where(.dark)`** — `:where()` has zero specificity, so `:root` always wins the cascade and the dark tokens silently fail to apply. The design-token block at the top of `globals.css` follows this pattern.
- **Timezone**: Railway runs UTC. Never use `new Date()` server-side for user-visible date comparisons (today/tomorrow labels, day highlighting). Use client components for those — see `ClientDate.tsx`, `NextShiftCard.tsx`, `ScheduleHeader.tsx`.
- **No public signup** — accounts are created by managers/admins only via `/manage/employees`.
- **Time-input parsing** lives in `src/app/(app)/schedule/scheduleCellUtils.ts` (`parseTimeInput`, `PRESETS`) and is shared by `ScheduleCell.tsx` (desktop) and `MobileSchedule.tsx` (mobile). Hours 1–11 with no AM/PM suffix are assumed PM.

### Mobile / responsive

- **Mobile-first**, with `md:` (≥768px) overrides for desktop. Default sizes assume a phone (~360–430px wide).
- **Navigation split by breakpoint**: `src/components/Nav.tsx` is `hidden md:block`; `src/components/MobileTabBar.tsx` is `md:hidden` and renders a fixed bottom tab bar + slide-up "More" sheet. Both are mounted in `src/app/(app)/layout.tsx`.
- **Schedule has two render paths**: weekly table (`hidden md:block`) and `MobileSchedule.tsx` day-at-a-time view (`md:hidden`). Keep them in sync when changing shift shape/props.
- **Manager tables** (`/manage/availability`, `/manage/audit`, `/manage/staffing`) similarly render a card list below `md` and a table at `md+`.
- **Always use `text-base md:text-sm` on text inputs** — `text-sm` (<16px) triggers iOS Safari focus-zoom.
- **Don't gate critical actions on `:hover`** — touch devices can't trigger it. Schedule cell delete buttons are visible by default on mobile; only fade-in on hover at `md+`.
- The `<main>` in `(app)/layout.tsx` includes `pb-24 md:pb-8` to clear the bottom tab bar.
- Viewport meta (`device-width, initial-scale=1, viewport-fit=cover`) is exported from `src/app/layout.tsx` so `env(safe-area-inset-bottom)` works on iOS.
- **`<body>` carries `bg-paper text-ink`** so iOS rubber-band overscroll matches the app shell instead of flashing white. `bg-paper` resolves to the design-token surface color (off-white in light, deep cool ink in dark). Don't remove it without setting an equivalent on `<html>`.

### Design system

- **Tokens live in `src/app/globals.css`** as CSS custom properties under `:root` (light) and `html.dark` (dark), then bound to Tailwind utilities via `@theme inline`. The surface ramp is `paper` → `surface` → `elevated` → `sunken`. The text ramp is `ink` → `ink-soft` → `ink-muted` → `ink-faint`. Lines come from `line` and `line-soft`. The brand accent is `accent` (warm ember, hue ~38) with `accent-soft`, `accent-edge`, `accent-fg`, and `accent-hover` variants. Use `bg-surface`, `text-ink`, `border-line`, `bg-accent`, etc. — not hardcoded gray-X colors.
- **Indigo is remapped to ember** via `@theme inline` overrides of `--color-indigo-50` through `--color-indigo-950`. Existing `bg-indigo-600`, `text-indigo-700`, `hover:bg-indigo-50`, etc. all pick up the ember palette automatically. If you write new code, prefer the `accent` tokens directly; the indigo remap is a back-compat shim.
- **Violet is remapped to plum/wine** (hue ~350) for training shifts, so it harmonizes with the warm accent instead of fighting it.
- **Fonts** load from `next/font/google` in `src/app/layout.tsx` and bind to `--font-fraunces` (display), `--font-geist-sans` (body), `--font-geist-mono` (numerals). The `@theme inline` block exposes them as `--font-display`, `--font-sans`, `--font-mono`. Apply via the `.display` utility (page h1s — Fraunces, weight 500, tight tracking) or `.wordmark` (brand mark — Fraunces, weight 600). Both use `opsz` / `SOFT` variation axes; do not switch them back to italic.
- **Tabular numerals are the rule for any time, count, date, or ID** (schedule cells, dashboard stats, audit timestamps, the "Week of" label, etc.) — use the `.tnum` utility plus `font-mono` where the value benefits from a typewriter feel.
- **Role indicator pattern:** prefer the colored leading dot + small text label (`bg-sky-500` etc.) over pill badges. Where a tag is still useful (dashboard list, marketplace, employee row), use the compact uppercase tracked tag (`text-[10px] font-semibold uppercase tracking-[0.14em] px-1.5 py-0.5 rounded-sm bg-{role}-50 text-{role}-700 dark:bg-{role}-950/50 dark:text-{role}-300`). Don't reintroduce large `rounded-full` pill badges.
- **Schedule shift chips** are intentionally pale: `bg-{role}-50/60 border-{role}-100 text-{role}-800` in light, `dark:bg-{role}-950/35 dark:border-{role}-900/60 dark:text-{role}-200` in dark. Dark-mode opacity is intentionally higher than light because a 20% tint on a dark surface reads as nothing. The "you" chip uses `bg-surface border-accent-edge`; "offered" uses orange-50/60; "training" uses violet-50/60. Keep `ScheduleCell.tsx` and `MobileSchedule.tsx` in sync.
- **Today indicator:** ember underline (`bg-accent` strip at the top of the desktop column, bottom of the mobile day chip). Today's column body gets `bg-accent-soft`. Don't switch back to a dot marker.
- **Surfaces over shadows.** Cards use `border border-line` (and sometimes `bg-surface`) instead of `shadow-sm`/`shadow-md`. The only legitimate shadow uses are modals (`shadow-[0_24px_48px_-12px_oklch(0_0_0/0.25)]`) and the mobile More-sheet.

### Auth & roles

- Two roles: `MANAGER` and `EMPLOYEE`. `requireManager()` in `src/lib/auth.ts` allows access if `role === "MANAGER"` OR `isAdmin === true`.
- `isAdmin` is a boolean on the User model. Admins keep `role = EMPLOYEE` for scheduling purposes but get full manager access (manage pages).
- **Admin-only routes** use `requireAdmin()` (also in `src/lib/auth.ts`) — currently `/manage/audit`. Nav and MobileTabBar both hide the Audit Log link unless `user.isAdmin`.
- The seed always sets `isAdmin = true` for `SEED_ADMIN_EMAIL` on every deploy — idempotent.
- Last-manager guard: cannot demote or delete the last MANAGER. Self-delete is blocked. Self-role-change is allowed as long as it doesn't leave zero managers.
- Password change destroys the session and redirects to `/login`.

### Restaurant rules baked into the app

- Closed Mondays — the schedule week runs **Tuesday through Sunday**. `startOfWeek(new Date(), { weekStartsOn: 2 })` gives the week's Tuesday. The staffing requirements grid also excludes Monday.
- All times stored as `"HH:mm"` 24-hour strings; displayed via `formatTime()` in `src/lib/time.ts`.
- **Availability is collected for next week**, not the current week. Both `/availability` and `/manage/availability` compute `weekStart = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7)` (Monday-start). The `upsertAvailability` action's fallback matches. Page headers read "Next week — [date]".
- Managers/admins visiting `/availability` are redirected to `/manage/availability`. Admins with EMPLOYEE role can still set their own availability.

### Security

- Rate limiting: `src/lib/rate-limit.ts` (in-memory sliding window). Login counts only **failed** attempts (20/hr per IP+email); correct password always succeeds. Password change: 5/hr per user. Create employee: 20/hr per manager.
- Zod v4 validation on all server actions (`src/lib/validation.ts`). Note: Zod v4 uses `error.issues` not `error.errors`; enum error customization uses `{ error: () => 'msg' }`.
- bcrypt cost 12 (`BCRYPT_COST` in `src/lib/validation.ts`, re-exported from `src/lib/auth.ts`).
- Password minimum: 12 characters (no complexity requirement).
- CSP nonce generated per-request in `src/proxy.ts` (Next.js 16 proxy); forwarded via `x-nonce` header; read in `layout.tsx` via `await headers()`.
- CSP includes `'unsafe-eval'` in `script-src` only when `NODE_ENV !== "production"` — React dev mode needs it for stack-trace reconstruction. Production CSP stays strict.
- Security headers set in `src/proxy.ts`: CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (production only).
- Audit log: manager/admin actions are written to the `AuditLog` model via `src/lib/audit.ts`. Viewable at `/manage/audit` (admin-only). The log is **rolling** — `writeAuditLog` prunes anything older than the 100th-newest row after each insert (`MAX_AUDIT_ROWS = 100`).
- Startup env-var checks in `src/instrumentation.ts`.

### Running the app

```bash
npx prisma migrate dev   # apply any pending migrations
npx prisma generate      # regenerate client after schema changes
npx prisma db seed       # seed admin account (reads SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD from .env)
npm run dev
```

### Where things live

| Concern | Location |
|---|---|
| DB client singleton | `src/lib/db.ts` |
| Session config | `src/lib/session.ts` |
| Auth guards | `src/lib/auth.ts` |
| Rate limiting | `src/lib/rate-limit.ts` |
| Zod schemas + BCRYPT_COST | `src/lib/validation.ts` |
| Audit log writer | `src/lib/audit.ts` |
| Shift claim eligibility | `src/lib/eligibility.ts` |
| Time formatting | `src/lib/time.ts` |
| CSP nonce + security headers | `src/proxy.ts` |
| Startup checks | `src/instrumentation.ts` |
| All mutations | `src/app/actions/` |
| Schedule grid | `src/app/(app)/schedule/` |
| Shift marketplace | `src/app/(app)/marketplace/` |
| Availability (employee) | `src/app/(app)/availability/` |
| Manager tools | `src/app/(app)/manage/` |
| Client-side date components | `ClientDate.tsx`, `NextShiftCard.tsx`, `ScheduleHeader.tsx` |
| Design tokens + Tailwind theme bindings | `src/app/globals.css` |
| Font loading (Fraunces, Geist, Geist Mono) | `src/app/layout.tsx` |
