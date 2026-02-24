# Free email (SMTP) for Supabase Auth

Supabase’s built-in email is **limited to about 2 emails per hour** and is only for testing. For patient signup, password reset, and staff invites you should use **custom SMTP** with a free provider.

## 1. Turn on custom SMTP in Supabase

1. Open your project in [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **Authentication** → **Email Templates** (or **Settings** → **Auth**).
3. Open **SMTP Settings** (or **Custom SMTP**).
4. Enable **Custom SMTP** and enter the values from your provider (see below).

Optional: under **Authentication** → **Rate Limits** you can raise the hourly limit (e.g. 30) so it’s not stricter than your provider.

---

## 2. Free SMTP providers that work with Supabase

Supabase works with any SMTP-compatible service. These have usable **free tiers** and are easy to set up.

### Option A: Resend (recommended)

- **Free:** 100 emails/day, 3,000/month.
- **No credit card** for signup.
- **Docs:** [Resend + Supabase SMTP](https://resend.com/docs/send-with-supabase-smtp)

#### Resend step-by-step

**1. Create a Resend account**

- Go to [resend.com](https://resend.com) and sign up (email or Google).

**2. Choose your sender email**

- **Quick test (no domain):** Resend gives you a sandbox. You can send **only to the email address you used to sign up**. Use:
  - Sender: `onboarding@resend.dev` (Resend’s sandbox domain).
- **Real use (your domain):** In Resend go to [Domains](https://resend.com/domains) → **Add Domain** → enter your domain (e.g. `yourclinic.com`). Add the DNS records they show (MX, TXT for DKIM). After it’s verified, use e.g. `noreply@yourclinic.com` as sender.

**3. Get your API key (this is the SMTP “password”)**

- In Resend: left sidebar **API Keys** → **Create API Key**.
- Name it e.g. `Supabase Auth`, click **Add**.
- **Copy the key** (starts with `re_`). You won’t see it again; if you lose it, create a new key.

**4. Open Supabase SMTP settings**

- Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project.
- Left sidebar: **Authentication** → **Email** (or **Providers**).
- Find **SMTP Settings** (or **Custom SMTP**) and open it.
- Enable **Custom SMTP** / turn on the SMTP option.

**5. Fill in the form with Resend’s values**

Paste these exactly (only change Sender and Password):

| Field          | What to enter |
|----------------|---------------|
| **Sender email** | `onboarding@resend.dev` (sandbox) or `noreply@yourdomain.com` (after domain verify) |
| **Sender name**  | `HealthQueue PH` (or your clinic name) |
| **Host**         | `smtp.resend.com` |
| **Port**         | `465` (or `587` if 465 fails) |
| **Username**     | `resend` (literally the word “resend”) |
| **Password**     | Your Resend API key (the `re_...` key you copied) |

- **Save** (or **Update**).

**6. Optional: raise Supabase’s email rate limit**

- In Supabase: **Authentication** → **Rate Limits**.
- Find “Email” / “SMTP” and set e.g. **30** emails per hour (or higher) so Supabase doesn’t throttle before Resend’s 100/day.

**7. Test**

- Trigger a patient signup or “Forgot password” from your app. The email should be sent by Resend (check Resend **Logs** to see delivery). If you use the sandbox, the recipient must be your Resend account email.

#### Troubleshooting: "Error sending confirmation email"

If Supabase shows this, check:

1. **Username** is exactly **resend** (one word, lowercase). Not your app name or email.
2. **Password** is your Resend API key: Resend → API Keys → Create API Key → copy the `re_...` key → paste into Supabase Password (no spaces). Re-paste and Save if unsure.
3. **Check Supabase Logs:** Dashboard → **Logs** → **Auth** (or **Project Logs**). Trigger signup again and look for the SMTP error (e.g. "Authentication failed", "connection refused")—that’s the real cause.
4. **Try port 587:** If you used port 465, switch to **587** in SMTP settings and Save, then test again (Resend supports both).
5. **Sandbox:** with `onboarding@resend.dev`, only the email you used to sign up for Resend can receive. Test signup with that same email.
6. **Resend → Logs:** see if the send appears and the error (e.g. "Invalid API key", "Recipient not allowed").
7. **Host** = `smtp.resend.com`; **Port** = `465` or `587`.

---

### Option B: Brevo (formerly Sendinblue)

- **Free:** 300 emails/day.
- **No credit card** for the free plan.
- **Docs:** [Brevo SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP)

**Steps:**

1. Sign up at [brevo.com](https://www.brevo.com).
2. **SMTP & API** → **SMTP**: note Server, Port, and create an **SMTP key** (password).
3. In Supabase **SMTP Settings** use:

   | Field        | Value                    |
   |-------------|--------------------------|
   | Sender email| e.g. `noreply@yourdomain.com` (must be allowed in Brevo) |
   | Sender name | e.g. `HealthQueue PH`     |
   | Host        | `smtp-relay.brevo.com`    |
   | Port        | `587` (TLS)               |
   | Username    | Your Brevo account email |
   | Password    | Your **SMTP key** from Brevo |

4. Save.

---

### Option C: Other providers

These also work with Supabase custom SMTP; check their current free tiers and SMTP docs:

- **SendGrid** – [Twilio SendGrid SMTP](https://www.twilio.com/docs/sendgrid/for-developers/sending-email/getting-started-smtp) (free tier available).
- **Postmark** – [Postmark SMTP](https://postmarkapp.com/developer/user-guide/send-email-with-smtp) (free tier for trial).
- **ZeptoMail** – [ZeptoMail SMTP](https://www.zoho.com/zeptomail/help/smtp-home.html).
- **AWS SES** – Very cheap after free tier; requires AWS account and more setup.

---

## 3. What gets sent through SMTP

Once custom SMTP is set, Supabase Auth uses it for:

- **Patient signup** – confirmation link or OTP (e.g. `/pages/auth/callback`).
- **Password reset** – reset link.
- **Staff invites** – when an admin adds a user and Supabase sends an invite (if you use that flow).

Your app does **not** need code changes; only the SMTP settings in the Supabase project.

---

## 4. If you hit “Email rate limit” in the app

The patient signup page already shows a friendlier message when Supabase returns a rate-limit error. After you switch to a free provider above and configure SMTP:

1. Emails are no longer limited to 2/hour.
2. You can optionally increase **Auth** → **Rate Limits** in Supabase so the limit matches your provider (e.g. 30/hour or higher).

---

## 5. Quick reference: where to set SMTP in Supabase

- **Dashboard:** **Authentication** → **SMTP Settings** (or **Providers** / **Email** depending on UI).
- **From address:** Use a verified sender (e.g. Resend’s sandbox or your domain in Resend/Brevo) so messages don’t land in spam.

For full details and security tips (DKIM, custom domain, etc.), see [Supabase: Send emails with custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp).
