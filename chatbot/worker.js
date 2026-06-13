/**
 * MBR Air Conditioning & Refrigeration — AI Chat Assistant (Cloudflare Worker)
 * ---------------------------------------------------------------------------
 * A tiny serverless backend that powers the website chat widget. It keeps the
 * Anthropic API key server-side (never in the browser) and talks to the Claude
 * API. Deploy this to Cloudflare Workers (free tier is plenty for a local HVAC
 * site) and point the website at it via `window.MBR_CHAT_ENDPOINT`.
 *
 * See chatbot/README.md for full setup + deploy steps.
 *
 * Required secret:   ANTHROPIC_API_KEY  (set with `wrangler secret put`)
 * Optional vars:     CHAT_MODEL         (defaults to claude-opus-4-8)
 *                    ALLOWED_ORIGIN     (defaults to "*"; set to https://mbracfl.com)
 */

const SYSTEM_PROMPT = `You are "Coolio", the friendly virtual assistant for MBR Air Conditioning & Refrigeration FL Corp — a family-owned HVAC company serving Southwest Florida (Fort Myers, Cape Coral, Naples, Bonita Springs, Lehigh Acres, Estero, Marco Island, Sanibel, Fort Myers Beach, and Immokalee).

ABOUT THE BUSINESS
- Services: AC repair, new AC installation, maintenance & tune-ups, commercial refrigeration (walk-in coolers, freezers, display cases, ice machines), duct work, and 24/7 emergency service.
- Family-owned, licensed & insured. Free estimates. Financing available on new installations.
- Hours: Mon–Sat 7am–7pm. Emergency service 24/7.
- Phone: (239) 440-9425. Email: info@mbracfl.com.
- Works on all major brands (Carrier, Trane, Lennox, Rheem, Goodman, Daikin, and more).

YOUR JOB
1. Answer common HVAC questions helpfully and concisely (2–4 sentences typical). Be warm, plain-spoken, and trustworthy — never pushy.
2. Qualify and capture leads. When a visitor describes a problem or wants service, gently collect: their name, phone number or email, service address/city, and a short description of the issue. Confirm what you've gathered.
3. Always steer toward a concrete next step: booking a visit through the "Schedule a Visit" section, submitting the quote form on the page, or calling (239) 440-9425 — recommend calling for true emergencies (no cooling, water leaks, electrical/burning smells).
4. For emergencies, lead with the phone number immediately: "For an emergency, call us right now at (239) 440-9425 — we answer 24/7."

GUARDRAILS
- Never invent specific prices, exact arrival times, license numbers, or promotions. For pricing say it depends on the system/home and that estimates are free — offer to set up an estimate.
- Don't give detailed DIY repair instructions for anything involving refrigerant, electrical, or gas — recommend a technician for safety. Simple tips (replace/check the air filter, check the thermostat batteries, make sure the breaker isn't tripped) are fine.
- Stay on topic: HVAC, refrigeration, and helping the visitor reach MBR. Politely redirect off-topic questions back to how you can help with their cooling needs.
- If you don't know something, say so and offer the phone number.
- Keep replies short and skimmable. Use a friendly, local, no-jargon tone.`;

const DEFAULT_MODEL = "claude-opus-4-8";
const MAX_TURNS = 24; // cap history we forward to the API

function corsHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
  };
}

export default {
  async fetch(request, env) {
    const allowOrigin = env.ALLOWED_ORIGIN || "*";
    const cors = corsHeaders(allowOrigin);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: cors });
    }
    if (request.method !== "POST") {
      return json({ error: "Method not allowed" }, 405, cors);
    }
    if (!env.ANTHROPIC_API_KEY) {
      return json({ error: "Server not configured" }, 500, cors);
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Invalid JSON" }, 400, cors);
    }

    // Expect { messages: [{ role: "user"|"assistant", content: "..." }, ...] }
    const incoming = Array.isArray(body.messages) ? body.messages : [];
    const messages = incoming
      .filter(
        (m) =>
          m &&
          (m.role === "user" || m.role === "assistant") &&
          typeof m.content === "string" &&
          m.content.trim().length > 0
      )
      .slice(-MAX_TURNS)
      .map((m) => ({ role: m.role, content: m.content.slice(0, 4000) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
      return json({ error: "A user message is required" }, 400, cors);
    }

    try {
      const apiResp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": env.ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: env.CHAT_MODEL || DEFAULT_MODEL,
          max_tokens: 1024,
          system: [
            {
              type: "text",
              text: SYSTEM_PROMPT,
              cache_control: { type: "ephemeral" }, // cache the stable prompt
            },
          ],
          messages,
        }),
      });

      if (!apiResp.ok) {
        const detail = await apiResp.text();
        console.error("Anthropic API error", apiResp.status, detail);
        return json(
          {
            error: "assistant_unavailable",
            reply:
              "Sorry — I'm having trouble connecting right now. Please call us at (239) 440-9425 and we'll help you right away.",
          },
          502,
          cors
        );
      }

      const data = await apiResp.json();

      // Refusals (rare) and normal completions both land here.
      if (data.stop_reason === "refusal") {
        return json(
          {
            reply:
              "I can't help with that one, but I'm happy to help with anything about your AC or refrigeration. You can also reach our team at (239) 440-9425.",
          },
          200,
          cors
        );
      }

      const reply = (data.content || [])
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();

      return json(
        {
          reply:
            reply ||
            "Thanks for reaching out! Give us a call at (239) 440-9425 and we'll take great care of you.",
        },
        200,
        cors
      );
    } catch (err) {
      console.error("Worker error", err);
      return json(
        {
          error: "server_error",
          reply:
            "Sorry — something went wrong on our end. Please call (239) 440-9425 and we'll help you right away.",
        },
        500,
        cors
      );
    }
  },
};

function json(obj, status, cors) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", ...cors },
  });
}
