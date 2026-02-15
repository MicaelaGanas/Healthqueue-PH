# Security overview

## SQL injection — **not at risk**

The app **does not build raw SQL**. All database access goes through the **Supabase JavaScript client** (e.g. `.from('queue_rows').select()`, `.eq('ticket', value)`). Supabase/PostgREST use **parameterized queries**, so user input is never concatenated into SQL. You are not exposed to classic SQL injection from the app code.

## XSS (cross-site scripting) — **low risk**

- The UI is built with **React**, which escapes text by default.
- There is no use of `dangerouslySetInnerHTML` or raw `innerHTML` in the codebase.
- Still avoid rendering unsanitized HTML from user input; prefer text or sanitized markup.

## API authorization — **protected**

Sensitive API routes now **require a valid staff session** and the right role:

- **Queue, booked (read), alerts:** require staff login (nurse, doctor, admin, receptionist). Request must include `Authorization: Bearer <access_token>` (Supabase session token).
- **Admin users (GET/POST/PATCH):** require **admin** role only.
- **Public:** `POST /api/booked` (booking form) and `GET /api/queue/status/[number]` (queue lookup) stay **unauthenticated** by design.

If the frontend calls these APIs (e.g. when switching from localStorage to Supabase), it must send the Supabase session `access_token` in the `Authorization` header; otherwise the API returns **401 Unauthorized** or **403 Forbidden**.

## Secrets

- **SUPABASE_SERVICE_ROLE_KEY** is used only in server-side API routes (`.env.local`), never exposed to the browser.
- **NEXT_PUBLIC_SUPABASE_ANON_KEY** is public by design; access to data is controlled by RLS and by our API auth checks.

## Recommendations

1. **HTTPS:** Use HTTPS in production so tokens and data are not sent in clear text.
2. **Rate limiting:** Add rate limiting (e.g. at a reverse proxy or in Next.js middleware) for login and public endpoints to reduce brute-force and abuse.
3. **Input validation:** Validate and sanitize request bodies (e.g. length, format) before writing to the database.
4. **RLS:** You can tighten Supabase RLS policies later so that even the anon key cannot access rows the user is not allowed to see.
