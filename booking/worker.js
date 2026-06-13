/**
 * MBR Air Conditioning & Refrigeration — Booking backend (Cloudflare Worker + D1)
 * ---------------------------------------------------------------------------
 * A tiny self-hosted "Calendly" for the website's Schedule-a-Visit widget.
 * Stores bookings in a Cloudflare D1 (SQLite) database, prevents double-booking
 * via a UNIQUE constraint, and (optionally) emails confirmations via Resend.
 *
 * Endpoints (all JSON):
 *   GET  /availability?date=YYYY-MM-DD   → { taken: [windowIndex, ...] }
 *   POST /book   { date, window, name, phone, email, address, service, notes }
 *                                        → { ok: true }  | 409 if window taken
 *   GET  /bookings?key=ADMIN_KEY         → { bookings: [...] }   (simple admin view)
 *
 * See booking/README.md for one-time setup (create D1, apply schema, deploy).
 *
 * Bindings / vars:
 *   DB              D1 database binding (set in wrangler.toml)
 *   ALLOWED_ORIGIN  e.g. https://mbracfl.com  (defaults to "*")
 *   ADMIN_KEY       secret — protects GET /bookings
 *   RESEND_API_KEY  secret — optional, enables email confirmations
 *   MAIL_FROM       e.g. "MBR AC <booking@mbracfl.com>"  (must be a Resend-verified domain)
 *   MAIL_TO         where booking notifications go, e.g. info@mbracfl.com
 *
 * Next phase — QuickBooks: on a successful /book, also create/update the customer
 * (and optionally a draft Estimate) via the QuickBooks Online API. That needs an
 * Intuit Developer app + OAuth tokens; see README.md → "QuickBooks (next phase)".
 */

const WINDOWS = [
  "7:00–9:00 AM",
  "9:00–11:00 AM",
  "11:00 AM–1:00 PM",
  "1:00–3:00 PM",
  "3:00–5:00 PM",
  "5:00–7:00 PM",
];

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}

function clean(v, max) {
  return String(v == null ? "" : v).trim().slice(0, max);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(env.ALLOWED_ORIGIN || "*");
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors });
    if (!env.DB) return json({ error: "Database not configured" }, 500, cors);

    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, "");

    // ── availability ──
    if (request.method === "GET" && path.endsWith("/availability")) {
      const date = url.searchParams.get("date") || "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "Invalid date" }, 400, cors);
      const { results } = await env.DB.prepare(
        "SELECT slot_window FROM bookings WHERE slot_date = ?"
      ).bind(date).all();
      const taken = (results || []).map((r) => r.slot_window);
      return json({ taken }, 200, cors);
    }

    // ── admin list ──
    if (request.method === "GET" && path.endsWith("/bookings")) {
      if (!env.ADMIN_KEY || url.searchParams.get("key") !== env.ADMIN_KEY) {
        return json({ error: "Unauthorized" }, 401, cors);
      }
      const { results } = await env.DB.prepare(
        "SELECT * FROM bookings WHERE slot_date >= date('now','-1 day') ORDER BY slot_date, slot_window"
      ).all();
      return json({ bookings: results || [] }, 200, cors);
    }

    // ── create booking ──
    if (request.method === "POST" && path.endsWith("/book")) {
      let b;
      try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400, cors); }

      const date = String(b.date || "");
      const win = Number(b.window);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !(win >= 0 && win <= 5)) {
        return json({ error: "Please choose a valid day and arrival window." }, 400, cors);
      }
      const rec = {
        name: clean(b.name, 120),
        phone: clean(b.phone, 40),
        email: clean(b.email, 160),
        address: clean(b.address, 240),
        service: clean(b.service, 80),
        notes: clean(b.notes, 1000),
      };
      if (!rec.name || !rec.phone || !rec.email || !rec.address) {
        return json({ error: "Please fill in your name, phone, email, and address." }, 400, cors);
      }

      try {
        await env.DB.prepare(
          "INSERT INTO bookings (slot_date, slot_window, name, phone, email, address, service, notes, created_at) VALUES (?,?,?,?,?,?,?,?,?)"
        ).bind(date, win, rec.name, rec.phone, rec.email, rec.address, rec.service, rec.notes, new Date().toISOString()).run();
      } catch (e) {
        // UNIQUE(slot_date, slot_window) violation → already taken
        return json({ error: "That window is no longer available." }, 409, cors);
      }

      // Email confirmations are best-effort — never fail the booking on them.
      try { await sendEmails(env, { date, win, ...rec }); } catch (e) { console.error("email", e); }

      return json({ ok: true }, 200, cors);
    }

    return json({ error: "Not found" }, 404, cors);
  },
};

async function sendEmails(env, b) {
  if (!env.RESEND_API_KEY || !env.MAIL_FROM) return;
  const windowLabel = WINDOWS[b.win] || ("Window " + b.win);
  const when = `${b.date}, ${windowLabel}`;

  const send = (to, subject, text) =>
    fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ from: env.MAIL_FROM, to, subject, text }),
    });

  // Notify the business
  if (env.MAIL_TO) {
    await send(
      env.MAIL_TO,
      `New booking — ${when}`,
      [
        `New visit booked through the website:`,
        ``,
        `When:     ${when}`,
        `Name:     ${b.name}`,
        `Phone:    ${b.phone}`,
        `Email:    ${b.email}`,
        `Address:  ${b.address}`,
        `Service:  ${b.service}`,
        `Notes:    ${b.notes || "(none)"}`,
      ].join("\n")
    );
  }

  // Confirm to the customer
  if (b.email) {
    await send(
      b.email,
      `Your MBR appointment — ${when}`,
      [
        `Hi ${b.name},`,
        ``,
        `Thanks for booking with MBR Air Conditioning & Refrigeration. Here are your details:`,
        ``,
        `When:     ${when}`,
        `Service:  ${b.service}`,
        `Address:  ${b.address}`,
        ``,
        `We'll text you to confirm. Need to change anything or have an emergency? Call (239) 440-9425.`,
        ``,
        `— MBR Air Conditioning & Refrigeration FL Corp`,
      ].join("\n")
    );
  }
}
