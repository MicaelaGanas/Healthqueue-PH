This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Backend and database (Supabase)

To use a real database instead of localStorage:

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local` and set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and (optionally) `SUPABASE_SERVICE_ROLE_KEY`.
3. Run the SQL in `supabase/migrations/20260212000000_initial_schema.sql` in the Supabase SQL Editor.

See **[docs/SETUP_SUPABASE.md](docs/SETUP_SUPABASE.md)** for step-by-step instructions and API endpoint reference.

## Booking vs Walk-in (record sync)

- **Book appointment (online)** — Patient fills department, date, time, and contact info (name, phone, email). The flow stores a schedule request (e.g. in sessionStorage for now). When a backend exists, this can create an appointment tied to the patient's account and show in the nurse dashboard. Patients are told to use the same phone/email when they visit so the visit can be matched to their request.
- **Walk-in (nurse dashboard)** — For patients without an appointment. The nurse registers name, age, sex, symptoms, and can optionally add phone, email, and booking reference (e.g. APT-2026-0131-001). Those fields allow linking the walk-in to an existing online booking or patient record.
- **Syncing records** — Matching uses the same phone and/or email, or the booking reference from the confirmation page. No extra "count" field is required; the booking reference or contact info is enough to sync.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
