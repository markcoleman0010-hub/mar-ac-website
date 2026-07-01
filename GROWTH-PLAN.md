# MBR Air Conditioning — Growth Plan: Turning the Website Into a Lead Machine

> **Audience:** Owner + Fable (executing agent, starting tomorrow).
> **Author's lens:** written as if by an operator who has scaled several Florida HVAC shops from owner-truck to multi-crew.
> **Core thesis:** *The machine is already built. The ignition is off.* Most of the money here is not in new features — it's in turning on measurement, activating dormant tools, and feeding the funnel. This plan is ordered so the cheapest, highest-ROI moves come first.

---

## 0. The one-paragraph summary

MBR's site is well ahead of the typical local-HVAC website: it has schema markup, a self-hosted booking system, an AI chat widget, an admin dashboard, sticky click-to-call, financing/offers/reviews sections, and conversion tracking *already wired into the code*. But three switches are off — Google Analytics has no ID (`MBR_GA4_ID = ""`), the chat endpoint is blank, and booking runs in `$0 demo mode`. That means **we are flying blind and leaving the two best conversion tools idle.** Fix measurement first (you can't grow what you can't see), then activate the dormant tools, then drive traffic. In HVAC, the website is only ~⅓ of the lead engine — Google Business Profile + reviews + Local Services Ads are the other ⅔, and they're not in this repo. This plan covers both.

---

## 1. Where you are — grounded audit

### What's already strong (don't rebuild these)
- **`HVACBusiness` JSON-LD schema** with service catalog, area served, hours, price range. Good SEO foundation.
- **Conversion instrumentation exists**: `window.mbrTrack(name, params)` helper is wired across the page — it fires GA4 events the moment an ID is set.
- **Self-hosted booking** (Cloudflare Worker + D1, in `/booking`) — a real scheduler with double-booking prevention, currently in demo/email mode.
- **AI chat widget** (`/chatbot`) — currently in graceful "call us instead" fallback because the endpoint is blank.
- **Admin dashboard** (`admin.html`) for viewing bookings.
- **Mobile-first conversion furniture**: sticky call bar, click-to-call (`tel:` ×7), financing mentions, offers, reviews, guarantee/warranty copy, FAQ.

### The switches that are OFF (this is where the money is)
| Switch | Current state | Impact of leaving it off |
|---|---|---|
| **`MBR_GA4_ID`** | `""` (blank) | Zero visibility into traffic, sources, or conversions. Can't calculate cost-per-lead or optimize anything. **P0.** |
| **`MBR_CHAT_ENDPOINT`** | `""` (blank) | AI chat is dead weight; after-hours & researching visitors bounce instead of converting. |
| **`MBR_BOOKING_ENDPOINT`** | `""` ($0 demo mode) | No real-time availability, no auto-confirmation — friction on the highest-intent action on the site. |

### SEO / discoverability gaps
- **No `sitemap.xml`** and **no `robots.txt`** — slows indexing and gives Google no crawl map.
- **No `<link rel="canonical">`** — risk of duplicate-URL dilution (root vs. index.html vs. www).
- **Single-page site** — one page can only rank for so many terms. HVAC money keywords are *service × city* combinations ("AC repair Cape Coral", "emergency AC Naples"). Today there's no page to rank for each.
- **`og:image` is the logo**, not a compelling social preview — weak share/click appeal.

### Business-model gaps visible from the site
- **No named maintenance/membership plan** on MBR. (D PEC already has a $450/yr plan defined — MBR should have its own. Memberships are the single biggest LTV and recurring-revenue lever in HVAC.)
- **Reviews appear static** — no live Google review count / rating pulling in social proof, and no visible "leave a review" funnel to build review velocity (the #1 local-ranking driver).
- **Financing is mentioned but not productized** — no "as low as $X/mo" on replacement CTAs, where financing lifts close rate and average ticket most.

---

## 2. The lead-machine model (the math that runs the business)

Everything below optimizes one equation. Print this on the wall:

```
Revenue = Traffic × Booking-Rate × Show-Rate × Close-Rate × Avg-Ticket × Repeat-Factor
```

The website directly owns **Booking-Rate** and heavily influences **Traffic** and **Close-Rate** (via trust/social proof). Operations owns Show/Close. Memberships own Repeat-Factor.

**Benchmarks to target (well-run SW-FL residential shop):**
- Website visitor → booked lead: **3–6%** (a well-optimized HVAC site hits the top of this).
- **Speed-to-lead: contact within 5 minutes.** This is the highest-leverage operational number in the whole plan — response inside 5 min vs. 30 min can 5–8× the odds of ever reaching the lead. The site's job is to capture the phone number *fast*; the follow-up SLA is where deals are won or lost.
- Booked → showed → closed on a repair call: **60–75%** close for diagnostic visits already at the home.
- Replacement close rate with financing offered: materially higher than cash-only.
- Membership attach on maintenance visits: **20–40%** with a scripted offer.

**You cannot manage any of these numbers until GA4 + a lead log exist. That's why measurement is P0.**

---

## 3. Priority stack (do them in this order)

### P0 — Turn the lights on (measurement). *Owner action, minutes, $0.*
1. Create a **Google Analytics 4** property → paste the `G-XXXXXXXXXX` ID into `window.MBR_GA4_ID` in `index.html`. Every `mbrTrack()` call starts reporting instantly.
2. Mark **`generate_lead`** (form submit), **`click_to_call`** (tel: taps), and **booking-confirmed** as **key events/conversions** in GA4.
3. Stand up **Google Search Console**, submit the sitemap (created in P2), and watch impressions/queries.

> Without P0, every dollar spent on P2 traffic is unmeasurable. Do this first.

### P1 — Activate the dormant conversion tools + close funnel leaks
1. **Activate booking**: deploy the `/booking` Worker, set `MBR_BOOKING_ENDPOINT`. Real availability + instant confirmation removes friction on the highest-intent action.
2. **Activate chat**: deploy `/chatbot`, set `MBR_CHAT_ENDPOINT`. Capture after-hours and researching visitors; make its first job to **get the phone number and the emergency-vs-maintenance intent**, not to chit-chat.
3. **Speed-to-lead automation**: every form/booking/chat lead should text-and-email the owner instantly and drop into one place (already partly true via FormSubmit + admin). Add an SMS notification so the 5-minute SLA is physically possible.
4. **Sticky mobile call bar + emergency CTA**: confirm it's always visible on mobile (>60% of HVAC traffic is mobile, often someone whose AC just died). Emergency traffic should reach a human in one tap.
5. **Review velocity engine**: after a completed job, send a one-tap Google review link (SMS). Live-pull the star rating/count onto the site. This compounds — reviews drive both conversion *and* Google Map Pack ranking.

### P2 — Traffic (only after P0 so it's measurable)
1. **Google Business Profile (GBP)** — the single biggest local HVAC lead source, and it's *not in this repo*. Fully fill it out, load photos, post weekly, respond to every review. This often out-produces the website itself.
2. **Local Services Ads (Google Guaranteed)** — pay-per-lead, badge builds trust, strong for HVAC. Start small, measure cost-per-booked-job via P0.
3. **Service-area landing pages** — break the single page into `service × city` pages (e.g. `/ac-repair-cape-coral`) so each can rank. This is the biggest organic-SEO unlock and the largest build item — hand it to Fable.
4. **`sitemap.xml` + `robots.txt` + canonical tags** — cheap, unblocks indexing. Do alongside the new pages.
5. **Seasonal campaigns** — pre-summer "beat-the-heat tune-up" push (Mar–May) and shoulder-season maintenance-plan push. Florida cools year-round but demand and emergency calls spike with heat.

### P3 — LTV & recurring revenue (the enterprise-value multiplier)
1. **Launch an MBR membership plan** (model it on D PEC's $450/yr two-visit plan): priority scheduling, two tune-ups, filters, minor repairs included, discounts on repairs. Memberships = predictable revenue, higher retention, and a warm base to sell replacements into. **This is what makes the company sellable.**
2. **Financing productization** — put "as low as $X/mo" on replacement CTAs and in chat. Lifts close rate and average ticket on the biggest tickets.
3. **Reactivation** — email/SMS the customer list at tune-up season. Cheapest leads you'll ever get.

---

## 4. 90-day roadmap

| Weeks | Theme | Deliverables |
|---|---|---|
| **1** | Lights on | GA4 live, conversions marked, Search Console + sitemap/robots/canonical, GBP claimed & optimized |
| **2–3** | Activate tools | Booking + chat endpoints live, SMS speed-to-lead alerts, review-request flow |
| **4–6** | Traffic foundation | First 4–6 service-area pages, LSA launched & measured, GBP posting cadence |
| **7–9** | Convert harder | Membership plan page + checkout path, financing "$/mo" on CTAs, live review widget |
| **10–13** | Compound | Seasonal tune-up campaign, list reactivation, iterate on GA4 data (double down on best source, cut the worst) |

---

## 5. Fable execution backlog (ready to pick up tomorrow)

Ordered by ROI-per-hour. Items marked **[owner]** need a credential or business decision Fable can't self-serve.

1. **[owner]** Paste GA4 ID into `MBR_GA4_ID`; mark conversions in GA4. *(5 min, unblocks everything.)*
2. Create `sitemap.xml`, `robots.txt`, and add `<link rel="canonical">` to every page. *(Fable, ~30 min.)*
3. Add a stronger `og:image` (branded social card) and Twitter card tags.
4. Build **service-area landing pages** (`service × top-6 cities`) from the existing design system; unique H1/title/description/schema per page; interlink; add to sitemap. *(Biggest SEO unlock.)*
5. **[owner]** Deploy `/booking` + `/chatbot` Workers; paste endpoints. Fable can prep deploy steps and test in demo mode meanwhile.
6. Build an **MBR membership plan section + signup path** (adapt D PEC's $450 plan copy; price for MBR).
7. Add a **live Google reviews widget** (rating + count + latest 3) and a post-job **one-tap review-request** link/QR.
8. Add **"as low as $X/mo"** financing framing to replacement CTAs and the chat's replacement flow.
9. Add **SMS speed-to-lead** notification on new leads (Worker → Twilio/textbelt) so the 5-min SLA is achievable.
10. Ship a **conversion-tracking QA pass**: verify `generate_lead`, `click_to_call`, and booking-confirmed all fire in GA4 DebugView.

---

## 6. KPIs — the dashboard to run weekly (once GA4 is live)

- **Traffic** by source (Organic / GBP / LSA / Paid / Direct)
- **Booking-rate** = booked leads ÷ sessions (target 3–6%)
- **Cost per booked job** by channel (LSA vs. organic vs. GBP)
- **Speed-to-lead** = median minutes to first contact (target < 5)
- **Review velocity** = new Google reviews / month, and average rating
- **Membership count** & attach rate on maintenance visits
- **Average ticket** and **financing attach rate** on replacements

Rule: **every week, double down on the lowest cost-per-booked-job channel and cut the worst.**

---

## 7. Unit economics guardrails

- Track **cost-per-lead** and **cost-per-booked-job**, not cost-per-click. A $60 lead that books a $9k replacement is cheap; a $15 lead that never books is expensive.
- Protect the **5-minute callback SLA** before spending a dollar on more traffic — buying leads you don't call fast is lighting money on fire.
- **Memberships and reviews are the two compounding assets.** Everything else is a faucet you pay to keep running; these two build equity.

---

## 8. Open questions for the owner (answer these to sharpen the plan)

1. **Are MBR and D PEC both yours?** If it's a two-brand portfolio, we should share infrastructure (booking/chat/tracking) and possibly consolidate marketing spend. If they're separate clients, keep them fully isolated.
2. **What's your true service radius and top 3 cities by revenue?** That sets which service-area pages to build first.
3. **Current lead volume & where from today** (phone / referrals / GBP)? Sets the baseline we're growing from.
4. **Do you have Google Ads / LSA budget to deploy, and how much?**
5. **Do you want a membership plan for MBR?** (Strongly recommended — biggest LTV lever.)
6. **Who answers the phone, and how fast today?** The website can't outrun a slow callback.

---

*Prepared on the `claude/fable-launch-prep-3pwg8j` branch so tomorrow's session can execute Section 5 directly. Turn on measurement first — everything else compounds from there.*
