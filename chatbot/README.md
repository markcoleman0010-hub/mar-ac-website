# MBR AC — AI Chat Assistant (backend)

This folder contains the small serverless backend that powers the **"Coolio"** chat
widget on the website. It runs on **Cloudflare Workers** and talks to the **Claude API**.

Why a backend at all? The Anthropic API key must **never** live in the browser
(anyone could steal it and run up your bill). The Worker holds the key securely
and is the only thing the website talks to.

```
Visitor's browser  →  Cloudflare Worker (this code, holds the API key)  →  Claude API
```

---

## What you need (one-time)

1. A **Cloudflare account** — free: https://dash.cloudflare.com/sign-up
2. An **Anthropic API key** — https://console.anthropic.com → *API Keys* → *Create Key*.
   Add a little credit under *Billing* (a local-business chatbot typically costs a few
   dollars a month).
3. **Node.js** installed on your computer (https://nodejs.org).

---

## Deploy it (about 10 minutes)

Open a terminal **in this `chatbot/` folder**, then:

```bash
# 1. Log in to Cloudflare (opens your browser)
npx wrangler login

# 2. Store your Anthropic API key as a secret (it is NOT saved in any file)
npx wrangler secret put ANTHROPIC_API_KEY
#    → paste your key when prompted, press Enter

# 3. Deploy
npx wrangler deploy
```

When it finishes, Wrangler prints your Worker URL, e.g.:

```
https://mbr-ac-chat.<your-subdomain>.workers.dev
```

**Copy that URL** — that's your chat endpoint.

---

## Connect it to the website

Open `index.html` and find this line near the bottom (in the `<script>` section):

```js
window.MBR_CHAT_ENDPOINT = ""; // ← paste your Cloudflare Worker URL here
```

Paste your Worker URL between the quotes:

```js
window.MBR_CHAT_ENDPOINT = "https://mbr-ac-chat.your-subdomain.workers.dev";
```

Commit and push. Done — the chat button on the site is now live.

> Until you paste the URL, the chat button still works but politely tells visitors
> to call (239) 440-9425 instead of erroring out.

---

## Settings you can change

In `wrangler.toml`:

| Setting          | What it does                                                                 |
| ---------------- | ---------------------------------------------------------------------------- |
| `CHAT_MODEL`     | Which Claude model answers. `claude-opus-4-8` (most capable) by default. For lower cost on a busy site, set `claude-haiku-4-5` — still great for HVAC Q&A. |
| `ALLOWED_ORIGIN` | Locks the endpoint to your domain so others can't use your key. Set it to your real site URL (e.g. `https://mbracfl.com`). Use `*` only while testing. |

After changing `wrangler.toml`, run `npx wrangler deploy` again.

The assistant's personality and rules live in the `SYSTEM_PROMPT` at the top of
`worker.js` — edit the business details, hours, or tone there and redeploy.

---

## Cost & safety notes

- The key lives only in Cloudflare's secret store, never in the website or this repo.
- `ALLOWED_ORIGIN` + Cloudflare's free rate limits keep casual abuse down. For extra
  protection you can add Cloudflare's free **Rate Limiting** rule on the Worker route.
- Set a **monthly spend limit** in the Anthropic Console so there are no surprises.
- The bot is instructed never to quote prices, promise arrival times, or give unsafe
  DIY advice — it captures the lead and routes people to call or book.
