# Booking & email setup

The site's server (`server/`) reads your Google Calendar, creates booked calls with a Google Meet link, and emails you every booking and inquiry. Until the keys below are set it runs in **demo mode**: working hours show as free, bookings aren't created, and emails are printed in the server log.

Total time: about 20 minutes, once.

## 1. Google Calendar (≈ 10 min)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project, e.g. "Portfolio booking".
2. **APIs & Services → Library** → search "Google Calendar API" → **Enable**.
3. **APIs & Services → OAuth consent screen**
   - User type: **External** → app name "Portfolio booking", your email as support and developer contact.
   - Scopes: skip (the script asks for them).
   - Test users: add your Google address.
   - Then **Publish app → In production.** In "Testing" mode Google expires the connection after 7 days. Unverified is fine – it's only ever your own account; you'll click through one "unverified app" warning when connecting.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID** → type **Desktop app** → create. Copy the **Client ID** and **Client secret**.
5. In the project folder, copy `.env.example` to `.env` and fill in `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`.
6. Run:

   ```bash
   npm run google:auth
   ```

   A Google sign-in opens. Pick your account, allow calendar access (it asks to **see when you're busy** and **create events** – it can't read your event details). The terminal prints `GOOGLE_REFRESH_TOKEN=…` – paste it into `.env`.

**Other calendars blocking time:** if you have a work calendar, share it with this Google account (free/busy is enough) and list it in `GOOGLE_BUSY_CALENDAR_IDS`, comma-separated (`primary,you@work.com`).

## 2. Email (≈ 5 min)

1. Sign up at [resend.com](https://resend.com) **with the email you want notifications at**.
2. **API Keys → Create** (sending access) → put it in `RESEND_API_KEY`.

That's enough to get every booking and inquiry by email. The sender `onboarding@resend.dev` can only deliver to your own Resend login address.

**Optional – confirmations to visitors:** add your domain in Resend (**Domains**, a few DNS records), then set `MAIL_FROM="Karel Fyrbach <hello@yourdomain.com>"`. Visitors who send a message without booking then get a short "Got your message" email. (People who book always get Google's calendar invite.)

## 3. Try it locally

```bash
npm run dev:server   # API on :8787 (reads .env)
npm run dev          # site on :5173, /api is proxied to the server
```

Open `/start` or `/book`, book a test call with another email address you own, and check: the event is in your calendar with a Meet link, the guest got Google's invite, and you got the "New call" email.

`/api/health` shows `"calendar": true, "mail": true` when both are connected.

## 4. Going live

Booking is parked for now: the `/book` and `/start` routes are commented out in `src/App.tsx`, and there's no `start` script, so Railway serves the static build as before. To switch it on:

1. In `src/App.tsx`, restore the two routes (`<Route path="/book" …>` and `<Route path="/start" …>`).
2. In `package.json` → `scripts`, add `"start": "node --env-file-if-exists=.env server/index.ts"`.
3. Railway → your service → **Variables** → add every line from `.env` (not `PORT` – Railway sets it).
4. Deploy. Railway now builds the site (`npm run build`) and starts the server (`npm start`), which serves both the site and the API. Node ≥ 22.18 is required (set in `package.json`).
5. Open `https://your-domain/api/health` to confirm both integrations show `true`.

## Changing the rules

Working hours, call length, buffer, notice and how far ahead people can book are variables too (`DAY_START_HOUR`, `CALL_MINUTES`, `BUFFER_MINUTES`, … – see `.env.example`). Change them in Railway and redeploy; no code change needed. Times are in `HOST_TIMEZONE`.

## What happens on a booking

1. The visitor picks a slot → the server re-checks it against your calendar right then (two people can't take the same slot).
2. It creates the event in your calendar with a Meet link and invites the visitor – Google emails them the invite.
3. You get an email with the time (yours and theirs), their details, the project answers and the Meet link. Replying goes straight to them.
