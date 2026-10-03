// Supabase Edge Function: reads a photo of a sheep's, goat's or cow's lower front teeth
// and returns the dentition stage (milk, 2/4/6 permanent teeth, full, worn, broken).
// The app turns the stage into an age range, so the age table lives in one place.
//
// Secret to set in Supabase (Edge Functions -> Secrets): ANTHROPIC_API_KEY.
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are provided automatically.
// Deploy with JWT verification off; abuse is limited by the daily quotas below.
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const MODEL = "claude-opus-5-5";
const PER_IP_DAILY = 10; // photos per network per day
const GLOBAL_DAILY = 300; // all users together; caps the daily bill
const MAX_IMAGE_B64 = 3_000_000; // ~2.2 MB; the app sends ~200 KB

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SPECIES: Record<string, string> = { Sheep: "sheep", Goat: "goat", Cattle: "cattle (cow or bull)" };
const LANGS: Record<string, string> = {
  fr: "French",
  ar: "Arabic (simple Modern Standard Arabic that Algerian farmers understand)",
  en: "English",
};

const SYSTEM = `You estimate the age of sheep, goats and cattle from a photo of their lower front teeth (incisors), the way an experienced livestock vet or market buyer does.

These animals have no upper incisors (only a hard dental pad) and 8 lower incisors (4 pairs). Young animals have small, narrow milk incisors. With age these are replaced by large, broad permanent incisors, one pair at a time, starting in the centre and moving outward. A permanent incisor is roughly twice as wide as a milk tooth. Later, the permanent teeth wear down, get shorter and spread apart, and finally break or fall out.

Stages:
- milk: all incisors are small milk teeth; no permanent teeth.
- p2: the 2 central incisors are permanent (clearly larger and wider than their neighbours).
- p4: 4 permanent incisors.
- p6: 6 permanent incisors.
- full: all 8 incisors are permanent and in good condition.
- worn: all permanent, but clearly worn down, short, or spread apart.
- broken: some incisors are broken or missing.
- unknown: you cannot tell.

Count the teeth carefully, pair by pair from the centre. Judge by width and shape, not only colour.

If the lower incisors are not clearly visible (lip covering them, wrong angle, blurry, too dark, too far, or not the mouth of a sheep, goat or cow), set photo_ok to false, pick the matching problem, set stage to "unknown", and say in advice how to retake the photo. Otherwise set photo_ok to true and problem to "none".

permanent_teeth is the number of permanent incisors you can see (0 to 8), or -1 if you can't tell.
Do not state an age yourself; the app converts the stage into an age range.
Write explanation (what you see, 1 or 2 short sentences in simple words for a farmer) and advice (an empty string if there is nothing to add) in the language the user asks for.`;

const SCHEMA = {
  type: "object",
  properties: {
    photo_ok: { type: "boolean" },
    problem: {
      type: "string",
      enum: ["none", "not_a_mouth", "teeth_not_visible", "too_dark", "too_blurry", "too_far", "other"],
    },
    stage: { type: "string", enum: ["milk", "p2", "p4", "p6", "full", "worn", "broken", "unknown"] },
    permanent_teeth: { type: "integer" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    explanation: { type: "string" },
    advice: { type: "string" },
  },
  required: ["photo_ok", "problem", "stage", "permanent_teeth", "confidence", "explanation", "advice"],
  additionalProperties: false,
};

const anthropic = new Anthropic(); // reads ANTHROPIC_API_KEY
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function reply(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

// Counts one use against a daily quota; true while still under the limit.
async function underQuota(key: string, limit: number) {
  const { data, error } = await db.rpc("ai_usage_hit", { p_key: key, p_limit: limit });
  if (error) throw error;
  return data === true;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return reply(405, { error: "method" });

  let body: { image?: string; species?: string; lang?: string };
  try {
    body = await req.json();
  } catch {
    return reply(400, { error: "bad_request" });
  }
  const { image, species = "Sheep", lang = "fr" } = body;
  if (typeof image !== "string" || !image || image.length > MAX_IMAGE_B64 || !SPECIES[species]) {
    return reply(400, { error: "bad_request" });
  }

  const ip = (req.headers.get("x-forwarded-for") ?? "unknown").split(",")[0].trim();
  try {
    if (!(await underQuota("all", GLOBAL_DAILY))) return reply(429, { error: "busy" });
    if (!(await underQuota("ip:" + ip, PER_IP_DAILY))) return reply(429, { error: "limit" });
  } catch (e) {
    console.error("quota check failed", e);
    return reply(500, { error: "server" });
  }

  try {
    const response = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 8000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // if a safety check declines, Anthropic retries on its recommended model
      output_config: { effort: "medium", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{
        role: "user",
        content: [
          { type: "image", source: { type: "base64", media_type: "image/jpeg", data: image } },
          { type: "text", text: `Animal: ${SPECIES[species]}. Write explanation and advice in ${LANGS[lang] ?? LANGS.fr}.` },
        ],
      }],
    });

    if (response.stop_reason === "refusal" || response.stop_reason === "max_tokens") {
      console.error("no usable answer:", response.stop_reason, response.stop_details);
      return reply(502, { error: "ai" });
    }
    const text = response.content.find((b) => b.type === "text");
    if (!text || text.type !== "text") return reply(502, { error: "ai" });
    return reply(200, JSON.parse(text.text));
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError) return reply(429, { error: "busy" });
    if (e instanceof Anthropic.BadRequestError) {
      console.error("bad request to Claude:", e.message);
      return reply(400, { error: "bad_image" });
    }
    console.error("Claude call failed", e);
    return reply(502, { error: "ai" });
  }
});
