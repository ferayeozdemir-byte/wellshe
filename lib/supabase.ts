// lib/supabase.ts
import Constants from "expo-constants";

// 1) EXPO_PUBLIC_ değişkenleri normalde build-time inject edilir.
// 2) Bazı senaryolarda (yanlış EAS environment) undefined gelebilir.
// Bu yüzden fallback + net hata veriyoruz.

function readEnv(name: "EXPO_PUBLIC_SUPABASE_URL" | "EXPO_PUBLIC_SUPABASE_ANON_KEY") {
  const v =
    process.env?.[name] ??
    // (İleride isterseniz app.json extra'ya da koyabilirsiniz; şimdilik sadece fallback)
    (Constants?.expoConfig as any)?.extra?.[name] ??
    "";

  return String(v || "").trim();
}

const SUPABASE_URL = readEnv("EXPO_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");

// Uygulama açılır açılmaz env durumunu bir kere logla (anahtarın kendisini yazmıyoruz)
console.log("[SB] env url present?", Boolean(SUPABASE_URL));
console.log("[SB] env anon present?", Boolean(SUPABASE_ANON_KEY));

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    // Burada bilinçli şekilde net hata veriyoruz ki “içerik gelmiyor” diye boğuşmayın.
    throw new Error(
      `[SB] Missing env vars. SUPABASE_URL or SUPABASE_ANON_KEY is empty. ` +
        `This usually means the EAS build/update used the wrong environment (e.g. profile=development but env vars exist only in preview/production).`
    );
  }
}

function baseHeaders() {
  assertEnv();
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

// Supabase REST base: /rest/v1
function restUrl(path: string) {
  assertEnv();
  return `${SUPABASE_URL}/rest/v1${path}`;
}

export function publicStorageUrl(bucket: string, path: string) {
  assertEnv();
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

function safeJsonParse<T>(text: string): T {
  // boş string / json olmayan cevaplarda patlamasın
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`[SB] Response is not valid JSON: ${text.slice(0, 200)}`);
  }
}

export async function sbGetOne<T>(pathWithQuery: string): Promise<T> {
  const url = restUrl(pathWithQuery);
  console.log("[SB] GET(one)", url);

  const res = await fetch(url, {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  console.log("[SB] status(one)", res.status);

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] error(one)", text);
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  const json = safeJsonParse<T>(text);
  console.log("[SB] ok(one)");
  return json;
}

export async function sbGetMany<T>(pathWithQuery: string): Promise<T[]> {
  const url = restUrl(pathWithQuery);
  console.log("[SB] GET(many)", url);

  const res = await fetch(url, {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  console.log("[SB] status(many)", res.status);

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] error(many)", text);
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  const json = safeJsonParse<T[]>(text);
  console.log("[SB] ok count(many)", Array.isArray(json) ? json.length : "n/a");
  return json;
}

export async function callEdgeFunction<T>(
  functionName: string,
  body: any,
  authToken?: string
): Promise<T> {
  assertEnv();

  const tokenToUse = authToken ?? SUPABASE_ANON_KEY;
  const url = `${SUPABASE_URL}/functions/v1/${functionName}`;

  console.log("[SB] EDGE call", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${tokenToUse}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();
  console.log("[SB] EDGE status", res.status);

  if (!res.ok) {
    console.error("[SB] EDGE error", text);
    throw new Error(`Edge error ${res.status}: ${text}`);
  }

  // Edge function bazen text döndürebilir; json parse zorlamıyoruz
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
