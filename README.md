# ShiftBoard

A restaurant scheduling platform built with Next.js, Prisma, and SQLite. Handles weekly scheduling, shift swaps, employee availability, and staffing management.

## Features

- **Weekly schedule** — visual grid (Tue–Sun, closed Mondays) with per-role staffing counts
- **Shift marketplace** — employees offer up shifts; any eligible coworker can claim them instantly
- **Availability** — employees submit weekly availability; managers see a full staff overview
- **Manager tools** — staffing requirements, employee management, inline shift assignment
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

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` and set a strong `SESSION_PASSWORD` (min 32 characters):

```
DATABASE_URL="file:./dev.db"
SESSION_PASSWORD="your_random_string_at_least_32_characters"
```

### 3. Set up the database

```bash
npx prisma migrate dev
npx prisma db seed
```

This creates the database and seeds a manager account:

| Field    | Value               |
|----------|---------------------|
| Email    | `admin@example.com` |
| Password | `password`          |

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/
    (auth)/          # Login and signup pages
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
    actions/         # Server Actions (auth, shifts, employees, etc.)
  components/        # Nav, ThemeToggle
  lib/               # db, session, auth, eligibility, time utils
prisma/
  schema.prisma
  seed.ts
  migrations/
```

## Job Titles

`SERVER` · `HOST` · `BUSSER` · `BARTENDER`
