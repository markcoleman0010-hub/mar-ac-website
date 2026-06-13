# MBR AC — Booking backend (self-hosted "Calendly")

This folder is the **optional** real backend for the website's *Schedule a Visit*
widget. It runs on **Cloudflare Workers + D1** (a small SQLite database) and gives you:

- real stored availability,
- **double-booking prevention** (one customer per arrival window per day),
- automatic email confirmations to you and the customer,
- a simple admin list of upcoming bookings.

## Do you even need this yet?

**Probably not on day one.** The booking widget already works in **$0 demo mode**
with no backend: a customer picks a day + arrival window, and it emails you a
confirmed *request* (you confirm the slot). That's enough to test whether people
will book online at all. Watch Google Analytics for `select_slot` and
`generate_lead` (method = `booking`) events. **Once you see real demand,** deploy
this backend to make it fully automatic.

---

## What you need

1. A **Cloudflare account** (free): https://dash.cloudflare.com/sign-up
2. **Node.js** installed: https://nodejs.org
3. *(optional, for email)* A **Resend account + API key**: https://resend.com — and
   a verified sending domain (e.g. `mbracfl.com`).

---

## Deploy it (about 15 minutes)

Run everything **in this `booking/` folder**.

```bash
# 1. Log in
npx wrangler login

# 2. Create the D1 database
npx wrangler d1 create mbr-bookings
#    → copy the database_id it prints into wrangler.toml (replace PASTE_YOUR_D1_DATABASE_ID_HERE)

# 3. Create the table
npx wrangler d1 execute mbr-bookings --file=./schema.sql --remote

# 4. Set secrets
npx wrangler secret put ADMIN_KEY          # any long random string (protects the admin list)
npx wrangler secret put RESEND_API_KEY     # OPTIONAL — only if you want email confirmations

# 5. (optional) set MAIL_FROM in wrangler.toml to a Resend-verified address, e.g.
#    MAIL_FROM = "MBR AC <booking@mbracfl.com>"

# 6. Deploy
npx wrangler deploy
```

Wrangler prints your Worker URL, e.g. `https://mbr-ac-booking.<sub>.workers.dev`.

---

## Connect it to the website

In `index.html`, find the config near the top and paste your Worker URL:

```js
window.MBR_BOOKING_ENDPOINT = "https://mbr-ac-booking.your-subdomain.workers.dev";
```

Commit and push. The scheduler now uses real availability and confirmations.
Until you set this, it stays in the $0 demo mode.

---

## See your bookings

Open **`admin.html`** from your live site — e.g. `https://mbracfl.com/admin.html`.
Enter your Worker URL and `ADMIN_KEY` once (saved in your browser only) and it shows
upcoming bookings grouped by day, with click-to-call phone links. The page is
`noindex` and loads nothing without the correct key.

> **CORS note:** open `admin.html` from the **same domain** set in the Worker's
> `ALLOWED_ORIGIN` (e.g. your live `mbracfl.com`). Opening it from a different
> origin (or `file://`) will be blocked by the browser. While testing, you can
> temporarily set `ALLOWED_ORIGIN = "*"` in `wrangler.toml` and redeploy.

The raw JSON is also available at `/bookings?key=YOUR_ADMIN_KEY` if you prefer.

---

## Business hours / windows

Arrival windows are defined in **both** the website (`index.html`, the `WINDOWS`
array in the booking script) **and** `worker.js` — keep them in sync if you change
them. Sundays are closed (handled in the website's day picker). Default windows:
7–9, 9–11, 11–1, 1–3, 3–5, 5–7.

---

## QuickBooks (next phase)

QuickBooks Online has **no appointment object**, so the integration is: on each
successful booking, create/update the **Customer** (and optionally a draft
**Estimate**) in QuickBooks via the QBO API. To wire this up you'll need to:

1. Create an app in the **Intuit Developer** portal (https://developer.intuit.com)
   and get OAuth 2.0 client credentials.
2. Connect your QuickBooks company (one-time OAuth consent) and store the refresh
   token as a Worker secret.
3. In `worker.js`, after the successful `INSERT`, call the QBO API to upsert the
   customer. (Intuit requires production approval before going live.)

This is intentionally left for phase 2 — tell me when you're ready and I'll add it.

## Cost & safety

- Cloudflare Workers + D1 free tiers comfortably cover a local HVAC site.
- `ALLOWED_ORIGIN` locks the API to your domain. `ADMIN_KEY` protects the booking list.
- No secrets live in this repo — only in Cloudflare's secret store.
