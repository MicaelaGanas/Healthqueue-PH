# Setting up Supabase for HealthQueue PH

This guide walks you through creating a Supabase project and connecting the HealthQueue PH app to it.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**.
3. Choose your organization, set a **Project name** (e.g. `healthqueue-ph`), set a **Database password** (save it somewhere safe), and pick a **Region**.
4. Click **Create new project** and wait for the project to be ready.

## 2. Get your API keys and URL

1. In the Supabase Dashboard, open your project.
2. Go to **Settings** → **API** (or **Project Settings** → **API**).
3. Copy:
   - **Project URL** → use as `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → use as `SUPABASE_SERVICE_ROLE_KEY` (keep this secret; only used on the server)

## 3. Configure environment variables

1. In the project root, copy the example env file:
   ```bash
   cp .env.example .env.local
   ```
2. Open `.env.local` and set:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```
   Use the values from step 2.

## 4. Run the database schema

1. In Supabase Dashboard, go to **SQL Editor**.
2. Click **New query**.
3. Open the file `supabase/migrations/20260212000000_initial_schema.sql` in this repo and copy its full contents.
4. Paste into the SQL Editor and click **Run** (or press Ctrl+Enter).
5. Run the second migration **`supabase/migrations/20260212100000_auth_and_roles.sql`** the same way (adds `auth_user_id` to `admin_users` for linking to Supabase Auth).

This creates the tables:

- **queue_rows** – queue entries (nurse/doctor dashboards)
- **booked_queue** – booked appointments (public booking flow)
- **admin_users** – staff users (admin dashboard)
- **alerts** – alerts (nurse dashboard)

and enables Row Level Security (RLS) with permissive policies so the app can read/write via the API.

## 5. (Optional) Use Supabase CLI for migrations

If you use the [Supabase CLI](https://supabase.com/docs/guides/cli):

```bash
npx supabase login
npx supabase link --project-ref your-project-ref
npx supabase db push
```

Or run the SQL file manually as in step 4.

## 6. Wire the frontend to the API

The app currently uses **localStorage** for queue, booked list, admin users, and alerts. To use Supabase instead:

- **Option A – Use the new API routes:**  
  The Next.js API routes under `app/api/` already use Supabase when env is set. You can switch the frontend to call these routes instead of localStorage (e.g. `fetch('/api/queue-rows')`, `fetch('/api/booked')`, etc.) and keep the same UI.

- **Option B – Keep localStorage as fallback:**  
  Leave the existing storage helpers; when you’re ready, replace their implementation with `fetch()` to the same API routes so that with Supabase configured, data is stored in the database.

### API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET    | `/api/queue-rows` | List all queue rows |
| PUT    | `/api/queue-rows` | Upsert queue rows (body: array of queue row objects) |
| PATCH  | `/api/queue-rows/status` | Update one row’s status (body: `{ ticket, status }`) |
| GET    | `/api/booked` | List booked appointments |
| POST   | `/api/booked` | Create/upsert booked appointment |
| DELETE | `/api/booked/ref?referenceNo=XXX` | Delete booked by reference |
| GET    | `/api/admin/users` | List admin users |
| POST   | `/api/admin/users` | Create admin user |
| PATCH  | `/api/admin/users/[id]` | Update admin user |
| GET    | `/api/queue/status/[number]` | Get queue status by ticket (for public queue lookup) |
| GET    | `/api/alerts` | List alerts |

All JSON request/response use **camelCase** (e.g. `patientName`, `referenceNo`). The database uses **snake_case** (e.g. `patient_name`, `reference_no`); the API maps between them.

## 7. Authentication and roles

Staff sign in with **email + password** (Supabase Auth). Their **role** comes from the **admin_users** table (matched by email).

- **First-time setup:** Create at least one staff user in both places:
  1. **Supabase Dashboard** → **Authentication** → **Users** → **Add user** → enter email and password.
  2. **admin_users table:** Add a row with the **same email**, and set `role` (`admin`, `nurse`, `doctor`, or `receptionist`), `name`, `employee_id`, `status = 'active'`. You can do this via the app (Admin dashboard → Users → Add user) **after** the first admin has an auth account, or run a one-off SQL insert in the SQL Editor, for example:
     ```sql
     insert into public.admin_users (name, email, role, status, employee_id)
     values ('Admin User', 'your@email.com', 'admin', 'active', 'EMP-001');
     ```
- After that, staff go to **Staff Login**, enter that email and password; the app looks up their role from **admin_users** and redirects to the correct dashboard (nurse/doctor/admin). Dashboards are protected: if the user is not signed in or their role doesn’t match, they are redirected to the login page.

## 8. Email (patient signup, password reset)

Supabase’s default email is limited to about **2 emails per hour** and is for testing only. For real use (patient signup confirmations, password reset), configure **custom SMTP** with a free provider.

See **[docs/EMAIL_SMTP_SETUP.md](EMAIL_SMTP_SETUP.md)** for:

- **Resend** (free: 100/day, 3,000/month) – recommended
- **Brevo** (free: 300/day)
- Other options (SendGrid, Postmark, etc.) and step-by-step Supabase SMTP setup

No code changes are required; you only set SMTP in **Supabase Dashboard** → **Authentication** → **SMTP Settings**.

## 9. Restart the dev server

After changing `.env.local`, restart the Next.js dev server:

```bash
npm run dev
```

If `NEXT_PUBLIC_SUPABASE_URL` and a Supabase key are set, the API routes will use the database. If they’re missing, those routes return `503 Database not configured`.

## Troubleshooting

- **503 "Database not configured"** – Check that `NEXT_PUBLIC_SUPABASE_URL` and at least one of `NEXT_PUBLIC_SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY` are set in `.env.local` and that you restarted the dev server.
- **Table does not exist** – Run the SQL in `supabase/migrations/20260212000000_initial_schema.sql` in the Supabase SQL Editor.
- **RLS policy errors** – The migration adds permissive policies. If you tighten RLS later, ensure your API uses a role that satisfies the new policies (e.g. service role or an authenticated user role).
