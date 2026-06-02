# ShiftBoard

A restaurant scheduling platform built with Next.js, Prisma, and SQLite. Handles weekly scheduling, shift swaps, employee availability, and staffing management.

## Features

- **Weekly schedule** — visual grid (Tue–Sun, closed Mondays) with per-role staffing counts
- **Shift marketplace** — employees offer up shifts; any eligible coworker can claim them instantly
- **Availability** — employees submit weekly availability; managers see a full staff overview
- **Manager tools** — staffing requirements, employee management, inline shift assignment, audit log
- **Training shifts** — trainee shadows a regular employee; excluded from staffing counts
- **Dark mode** — toggle in the nav, persisted in localStorage
- **Account management** — employees can update their name, email, and password

## Stack

- [Next.js 16](https://nextjs.org) (App Router, Server Actions, TypeScript)
- [Prisma 7](https://prisma.io) with SQLite via `better-sqlite3`
- [Tailwind CSS v4](https://tailwindcss.com)
- [iron-session](https://github.com/vvo/iron-session) for cookie-based auth
- `bcryptjs` for password hashing
- `date-fns` for date math
- `zod` for server-side input validation

## Getting Started (local dev)

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
DATABASE_URL="file:./dev.db"
SESSION_PASSWORD="your_random_string_at_least_32_characters"
SEED_ADMIN_EMAIL="admin@example.com"
SEED_ADMIN_PASSWORD="strong-password-12chars-with-number1"
```

Generate a strong session password:

```bash
openssl rand -base64 48
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma db seed
```

The seed is idempotent — it skips creation if any user already exists.

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and sign in with your `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.

> **Note:** New employee accounts are created by managers via **Manage → Employees → Add Employee**. There is no public sign-up page.

---

## Deploying to Railway

### Prerequisites

- A [Railway](https://railway.app) account
- Your repo pushed to GitHub

### 1. Create the Railway service

1. New Project → Deploy from GitHub repo → select this repo.
2. Railway will auto-detect Node.js and run `npm run build` → `npm start`.

### 2. Attach a persistent volume

1. In Railway service settings → **Volumes** → **Add Volume**.
2. Mount path: `/data` (or any absolute path).
3. Size: 1 GB is plenty for a single restaurant.

### 3. Set environment variables

In Railway service settings → **Variables**, add:

| Variable | Value |
|---|---|
| `DATABASE_URL` | `file:/data/prod.db` ← must match volume mount |
| `SESSION_PASSWORD` | output of `openssl rand -base64 48` |
| `SEED_ADMIN_EMAIL` | your admin email |
| `SEED_ADMIN_PASSWORD` | a strong password (≥12 chars, include a number) |

### 4. Set the deploy/start command

In Railway service settings → **Deploy** → **Start Command**:

```
npx prisma migrate deploy && npx prisma db seed && npm start
```

- `migrate deploy` is safe and idempotent — only applies new migrations.
- `db seed` is idempotent — skips if any user already exists.
- After the first deploy, `db seed` will always be a no-op.

### 5. Deploy

Push to your main branch. Railway will build and deploy automatically.

### 6. First-time setup

1. Log in at your Railway URL with `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD`.
2. **Immediately change your password** via Account → Change Password.
3. Add employees via Manage → Employees → Add Employee.

---

## Updating the schema

After any `prisma/schema.prisma` change:

```bash
npx prisma migrate dev --name <migration-name>   # local only
npx prisma generate
```

The `migrate deploy` in the Railway start command automatically applies new migrations on the next deploy. **Never run `prisma migrate dev` against production.**

---

## Backups

SQLite is a local file — Railway volumes are not automatically backed up. Set up [Litestream](https://litestream.io) to stream WAL changes to S3/R2 for continuous backup (~$0.50/mo for a small DB). This is highly recommended before storing live data.

---

## Project Structure

```
src/
  app/
    (auth)/          # Login page
    (app)/           # Authenticated app shell
      dashboard/     # Employee dashboard
      schedule/      # Weekly schedule grid
      marketplace/   # Shift claim board
      availability/  # Employee availability form
      account/       # Profile and password settings
      manage/
        staffing/    # Staffing requirements grid
        employees/   # Employee management
        availability/# Staff availability overview
        audit/       # Manager action audit log
    actions/         # Server Actions (auth, shifts, employees, etc.)
  components/        # Nav, ThemeToggle
  lib/               # db, session, auth, eligibility, validation, rate-limit, audit
prisma/
  schema.prisma
  seed.ts
  migrations/
```

## Job Titles

`SERVER` · `HOST` · `BUSSER` · `BARTENDER`
