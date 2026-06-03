// lib/supabase.ts
import Constants from "expo-constants";

type SupabaseEnvName =
  | "EXPO_PUBLIC_SUPABASE_URL"
  | "EXPO_PUBLIC_SUPABASE_ANON_KEY";

function readEnv(name: SupabaseEnvName) {
  // ✅ Statik erişim: Expo env inject bununla çalışır (kritik)
  const fromProcess =
    name === "EXPO_PUBLIC_SUPABASE_URL"
      ? process.env.EXPO_PUBLIC_SUPABASE_URL
      : process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

  // ✅ Fallback 1: expoConfig.extra (SDK 49+)
  const extra1 = (Constants.expoConfig as any)?.extra?.[name];

  // ✅ Fallback 2: manifest2 / manifest (bazı prod durumları)
  const extra2 =
    (Constants as any)?.manifest2?.extra?.[name] ??
    (Constants as any)?.manifest?.extra?.[name];

  const v = fromProcess ?? extra1 ?? extra2 ?? "";
  return String(v).trim();
}

const SUPABASE_URL = readEnv("EXPO_PUBLIC_SUPABASE_URL");
const SUPABASE_ANON_KEY = readEnv("EXPO_PUBLIC_SUPABASE_ANON_KEY");

if (__DEV__) {
  console.log("[SB] env url present?", Boolean(SUPABASE_URL));
  console.log("[SB] env anon present?", Boolean(SUPABASE_ANON_KEY));
}

function assertEnv() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      `[SB] Missing env vars. EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY is empty. ` +
        `This usually means the JS bundle did not receive EXPO_PUBLIC vars (wrong EAS environment or dynamic env access).`
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

function restUrl(path: string) {
  assertEnv();
  return `${SUPABASE_URL}/rest/v1${path}`;
}

export function publicStorageUrl(bucket: string, path: string) {
  assertEnv();
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export type StorageAssetLike = {
  bucket?: string | null;
  path?: string | null;
  public_url?: string | null;
  storage_provider?: string | null;
  storage_key?: string | null;
};

export function resolveAssetUrl(asset?: StorageAssetLike | null) {
  if (!asset) return null;

  if (asset.public_url) {
    return asset.public_url;
  }

  if (asset.bucket && asset.path) {
    return publicStorageUrl(asset.bucket, asset.path);
  }

  return null;
}

function safeJsonParse<T>(text: string): T {
  try {
    return JSON.parse(text) as T;
  } catch {
    throw new Error(`[SB] Response is not valid JSON: ${text.slice(0, 200)}`);
  }
}

export async function sbGetOne<T>(pathWithQuery: string): Promise<T> {
  const url = restUrl(pathWithQuery);
  if (__DEV__) console.log("[SB] GET(one)", url);

  const res = await fetch(url, {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] error(one)", res.status, text);
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  if (__DEV__) console.log("[SB] ok(one)");
  return safeJsonParse<T>(text);
}

export async function sbGetMany<T>(pathWithQuery: string): Promise<T[]> {
  const url = restUrl(pathWithQuery);
  if (__DEV__) console.log("[SB] GET(many)", url);

  const res = await fetch(url, {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] error(many)", res.status, text);
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }

  const json = safeJsonParse<T[]>(text);
  if (__DEV__) console.log("[SB] ok count(many)", Array.isArray(json) ? json.length : "n/a");
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

  if (__DEV__) console.log("[SB] EDGE call", url);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${tokenToUse}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] EDGE error", res.status, text);
    throw new Error(`Edge error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

export async function sbRpc<T>(
  functionName: string,
  body: Record<string, any> = {}
): Promise<T> {
  assertEnv();

  const url = `${SUPABASE_URL}/rest/v1/rpc/${functionName}`;

  if (__DEV__) console.log("[SB] RPC", functionName, body);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();

  if (!res.ok) {
    console.error("[SB] RPC error", functionName, res.status, text);
    throw new Error(`Supabase RPC error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}