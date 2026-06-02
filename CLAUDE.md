@AGENTS.md

## Project: ShiftBoard

Restaurant scheduling platform. Next.js 16 App Router + Prisma 7 + SQLite.

### Key constraints

- **Prisma 7 requires a driver adapter** — always use `PrismaBetterSqlite3` from `@prisma/adapter-better-sqlite3`. Never construct `PrismaClient` without it.
- **After any schema change**: run `npx prisma migrate dev` then `npx prisma generate`, then clear `.next/` and restart the dev server to avoid Turbopack serving stale compiled chunks.
- **iron-session cookies** can only be written in Server Actions or Route Handlers — never in Server Components. `requireUser()` in `src/lib/auth.ts` just redirects on failure; it does not call `session.destroy()`.
- **Dark mode** uses Tailwind v4 class strategy (`@variant dark` in `globals.css`). The `.dark` class is toggled on `<html>` by `ThemeToggle`. The root `<html>` has `suppressHydrationWarning` to prevent mismatch from the inline anti-flash script.

### Restaurant rules baked into the app

- Closed Mondays — Monday is filtered out of the schedule grid and staffing requirements.
- All times stored as `"HH:mm"` 24-hour strings; displayed via `formatTime()` in `src/lib/time.ts`.
- Time input parsing lives in `ScheduleCell.tsx` (`parseTimeInput`): hours 1–11 with no AM/PM suffix are assumed PM.

### Running the app

```bash
npx prisma migrate dev   # apply any pending migrations
npx prisma generate      # regenerate client after schema changes
npx prisma db seed       # seed manager account (admin@example.com / password)
npm run dev
```

### Where things live

| Concern | Location |
|---|---|
| DB client singleton | `src/lib/db.ts` |
| Session config | `src/lib/session.ts` |
| Auth guards | `src/lib/auth.ts` |
| Shift claim eligibility | `src/lib/eligibility.ts` |
| Time formatting | `src/lib/time.ts` |
| All mutations | `src/app/actions/` |
| Schedule grid | `src/app/(app)/schedule/` |
| Shift marketplace | `src/app/(app)/marketplace/` |
| Availability | `src/app/(app)/availability/` |
| Manager tools | `src/app/(app)/manage/` |
