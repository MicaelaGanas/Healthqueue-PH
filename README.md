# HealthQueue PH

**Hospital queue and appointment management for the Philippines.**

HealthQueue PH is a full-stack web application that helps hospitals and clinics manage patient flow: online booking, walk-in registration, queue display, staff dashboards (nurse, doctor, admin), and role-based access—all in one place.

---

## What This Project Is About

- **Patients** can book appointments online (department, date, time, contact info) and check their queue status by ticket/reference number.
- **Nurses / receptionists** use a staff dashboard to register walk-ins, record vitals and triage, manage the queue by specialty and doctor, handle today’s appointments, and view alerts.
- **Doctors** use a consultation dashboard to see their queue and update patient status (e.g. start consult, complete).
- **Admins** manage staff users (add, edit, deactivate), view reports (queue stats, completed consultations, bookings), and browse records.

The app supports both **booked** and **walk-in** flows; queue and bookings stay in sync so staff see a single view of who is waiting and who has been seen.

---

## Features

| Area | Features |
|------|----------|
| **Public** | Book appointment (step 1–3), queue status lookup by ticket/reference |
| **Staff login** | Email/password (Supabase Auth), role-based redirect (nurse, doctor, admin) |
| **Nurse dashboard** | Registration (walk-in + IoT gadget assignment), Vitals & Triage, Queue Management, Laboratory Admin, Appointments, Alerts, Settings |
| **Doctor dashboard** | Consultation queue (filter by doctor), Laboratory (review/release results), Start consult / Complete |
| **Laboratory dashboard** | Dedicated lab view: Specimens (search, filter, status workflow), Settings; shared data with nurse/doctor lab tabs |
| **Admin dashboard** | User management (CRUD, activate/deactivate), Reports (date range, export), Records (consultations + bookings), Settings |

---

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org) 16 (App Router)
- **UI:** React 19, Tailwind CSS
- **Backend / DB:** [Supabase](https://supabase.com) (PostgreSQL, Auth, API via Next.js API routes)
- **Language:** TypeScript

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or yarn / pnpm)

### Install and run

```bash
git clone <repo-url>
cd Healthqueue-PH
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Without a backend, the app uses **localStorage** and **demo mode** (e.g. staff login with role dropdown only).

### Environment variables

Copy the example env and add your Supabase keys when you want to use the database and real auth:

```bash
cp .env.example .env.local
```

Edit `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL  
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Publishable (anon) key  
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, keep secret)

See **[docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)** for full setup: creating a Supabase project, running migrations, and creating the first admin user.

---

## Project Structure (high level)

```
app/
  api/              # Next.js API routes (queue, booked, admin users, auth, alerts)
  components/       # Shared (Navbar, Footer, AuthGuard, etc.)
  lib/              # Supabase client, storage helpers, API auth, types
  pages/            # Routes: landing, book, queue, employee-login, nurse/doctor/admin/laboratory dashboards
supabase/
  migrations/       # SQL schema (tables, RLS policies, auth link)
docs/
  SETUP_SUPABASE.md # Backend and auth setup
  SECURITY.md       # Security overview (SQL injection, API auth, etc.)
```

---

## Backend and Database

The app can run with **localStorage only** (no backend). To use a real database and authentication:

1. Create a [Supabase](https://supabase.com) project.
2. Run the SQL in `supabase/migrations/` in the Supabase SQL Editor (in order).
3. Configure `.env.local` with your Supabase URL and keys.
4. Create an auth user in Supabase and a matching row in `admin_users` (same email, role, etc.) so staff can sign in.

Full steps, API endpoint list, and auth/roles setup: **[docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)**.

---

## Security

- **SQL injection:** Avoided by using the Supabase client (parameterized queries).
- **API authorization:** Sensitive routes require a valid staff session and the correct role (Bearer token from Supabase Auth).
- **Secrets:** Service role key is server-only (`.env.local`, not committed).

More detail: **[docs/SECURITY.md](docs/SECURITY.md)**.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## Documentation

- **[docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)** — Supabase setup, migrations, API reference, authentication and roles  
- **[docs/SECURITY.md](docs/SECURITY.md)** — Security overview and recommendations  

---

## License

Private / as specified in the repository.
