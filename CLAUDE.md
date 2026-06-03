@AGENTS.md

## Project: ShiftBoard

Restaurant scheduling platform. Next.js 16 App Router + Prisma 7 + SQLite. Deployed on Railway with a persistent SQLite volume at `/data`.

### Key constraints

- **Prisma 7 requires a driver adapter** — always use `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3`. Never construct `PrismaClient` without it.
- **After any schema change**: run `npx prisma migrate dev --name <name>` then `npx prisma generate`, then clear `.next/` and restart the dev server to avoid Turbopack serving stale compiled chunks.
- **iron-session cookies** can only be written in Server Actions or Route Handlers — never in Server Components. `requireUser()` in `src/lib/auth.ts` just redirects on failure; it does not call `session.destroy()`.
- **Dark mode** uses Tailwind v4 class strategy (`@variant dark` in `globals.css`). The `.dark` class is toggled on `<html>` by `ThemeToggle`. The root `<html>` has `suppressHydrationWarning` to prevent mismatch from the inline anti-flash script.
- **Timezone**: Railway runs UTC. Never use `new Date()` server-side for user-visible date comparisons (today/tomorrow labels, day highlighting). Use client components for those — see `ClientDate.tsx`, `NextShiftCard.tsx`, `ScheduleHeader.tsx`.
- **No public signup** — accounts are created by managers/admins only via `/manage/employees`.

### Auth & roles

- Two roles: `MANAGER` and `EMPLOYEE`. `requireManager()` in `src/lib/auth.ts` allows access if `role === "MANAGER"` OR `isAdmin === true`.
- `isAdmin` is a boolean on the User model. Admins keep `role = EMPLOYEE` for scheduling purposes but get full manager access (nav links, manage pages, audit log).
- The seed always sets `isAdmin = true` for `SEED_ADMIN_EMAIL` on every deploy — idempotent.
- Last-manager guard: cannot demote or delete the last MANAGER. Self-delete is blocked. Self-role-change is allowed as long as it doesn't leave zero managers.
- Password change destroys the session and redirects to `/login`.

### Restaurant rules baked into the app

- Closed Mondays — the schedule week runs **Tuesday through Sunday**. `startOfWeek(new Date(), { weekStartsOn: 2 })` gives the week's Tuesday. The staffing requirements grid also excludes Monday.
- All times stored as `"HH:mm"` 24-hour strings; displayed via `formatTime()` in `src/lib/time.ts`.
- Time input parsing lives in `ScheduleCell.tsx` (`parseTimeInput`): hours 1–11 with no AM/PM suffix are assumed PM.
- Managers/admins visiting `/availability` are redirected to `/manage/availability`. Admins with EMPLOYEE role can still set their own availability.

### Security

- Rate limiting: `src/lib/rate-limit.ts` (in-memory sliding window). Login counts only **failed** attempts (20/hr per IP+email); correct password always succeeds. Password change: 5/hr per user. Create employee: 20/hr per manager.
- Zod v4 validation on all server actions (`src/lib/validation.ts`). Note: Zod v4 uses `error.issues` not `error.errors`; enum error customization uses `{ error: () => 'msg' }`.
- bcrypt cost 12 (`BCRYPT_COST` in `src/lib/validation.ts`, re-exported from `src/lib/auth.ts`).
- Password minimum: 12 characters (no complexity requirement).
- CSP nonce generated per-request in `src/proxy.ts` (Next.js 16 proxy); forwarded via `x-nonce` header; read in `layout.tsx` via `await headers()`.
- Security headers set in `src/proxy.ts`: CSP, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, HSTS (production only).
- Audit log: manager/admin actions are written to the `AuditLog` model via `src/lib/audit.ts`. Viewable at `/manage/audit`.
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
