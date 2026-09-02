// Deno resolves npm: specifiers when the Edge Function runs.
// eslint-disable-next-line import/no-unresolved
import { createClient } from "npm:@supabase/supabase-js@2";

const JSON_HEADERS = { "Content-Type": "application/json" };
const MAX_BODY_BYTES = 32_768;
const MAX_META_KEYS = 25;

const ALLOWED_EVENT_NAMES = new Set([
  "app_open",
  "screen_view",
  "content_open",
  "feature_used",
  "notification_clicked",
]);

const ALLOWED_PLATFORMS = new Set(["android", "ios", "web"]);

function jsonResponse(body: Record<string, unknown>, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: JSON_HEADERS,
  });
}

function requiredText(value: unknown, maxLength: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

function optionalText(value: unknown, maxLength: number): string | null {
  if (value == null) return null;
  return requiredText(value, maxLength);
}

function sanitizeMeta(
  value: unknown
): Record<string, string | number | boolean> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const clean: Record<string, string | number | boolean> = {};

  for (const [rawKey, rawValue] of Object.entries(value).slice(
    0,
    MAX_META_KEYS
  )) {
    const key = rawKey.trim().slice(0, 64);
    if (!key) continue;

    if (typeof rawValue === "string") {
      clean[key] = rawValue.slice(0, 200);
    } else if (typeof rawValue === "number" && Number.isFinite(rawValue)) {
      clean[key] = rawValue;
    } else if (typeof rawValue === "boolean") {
      clean[key] = rawValue;
    }
  }

  return Object.keys(clean).length ? clean : null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  const contentLength = Number(req.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    return jsonResponse({ error: "Request body too large" }, 413);
  }

  try {
    const body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return jsonResponse({ error: "Invalid request body" }, 400);
    }

    if (JSON.stringify(body).length > MAX_BODY_BYTES) {
      return jsonResponse({ error: "Request body too large" }, 413);
    }

    const eventName = requiredText(body.event_name, 50);
    const installId = requiredText(body.install_id, 100);
    const platform = requiredText(body.platform, 20);

    if (
      !eventName ||
      !ALLOWED_EVENT_NAMES.has(eventName) ||
      !installId ||
      !platform ||
      !ALLOWED_PLATFORMS.has(platform)
    ) {
      return jsonResponse({ error: "Invalid required fields" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("[track-event] Missing Supabase environment variables");
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const authorization =
      req.headers.get("Authorization") ?? `Bearer ${supabaseAnonKey}`;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: authorization },
      },
    });

    const payload = {
      event_name: eventName,
      install_id: installId,
      screen_name: optionalText(body.screen_name, 200),
      feature_name: optionalText(body.feature_name, 200),
      article_id: optionalText(body.article_id, 200),
      article_title: optionalText(body.article_title, 200),
      platform,
      app_version: optionalText(body.app_version, 50),
      meta: sanitizeMeta(body.meta),
    };

    const { error } = await supabase.from("app_events").insert(payload);

    if (error) {
      console.error("[track-event] Insert failed", error.code);
      return jsonResponse({ error: "Unable to record event" }, 400);
    }

    return jsonResponse({ ok: true }, 200);
  } catch (error) {
    console.error("[track-event] Unexpected error", error);
    return jsonResponse({ error: "Internal server error" }, 500);
  }
});
