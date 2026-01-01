// lib/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function baseHeaders() {
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
  };
}

// Supabase REST base: /rest/v1
function restUrl(path: string) {
  return `${SUPABASE_URL}/rest/v1${path}`;
}

export function publicStorageUrl(bucket: string, path: string) {
  return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

export async function sbGetOne<T>(pathWithQuery: string): Promise<T> {
  const res = await fetch(restUrl(pathWithQuery), {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function sbGetMany<T>(pathWithQuery: string): Promise<T[]> {
  const res = await fetch(restUrl(pathWithQuery), {
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return (await res.json()) as T[];
}

/**
 * Edge Function çağrısı.
 * - Verify JWT OFF ise: anon key ile çağrı yeterli olur.
 * - Verify JWT ON ise: authToken parametresiyle gerçek kullanıcı access_token göndermen gerekir.
 */
export async function callEdgeFunction<T>(
  functionName: string,
  body: any,
  authToken?: string
): Promise<T> {
  const tokenToUse = authToken ?? SUPABASE_ANON_KEY;

  const res = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: "POST",
    headers: {
      ...baseHeaders(),
      Authorization: `Bearer ${tokenToUse}`,
    },
    body: JSON.stringify(body ?? {}),
  });

  const text = await res.text();

  if (!res.ok) {
    throw new Error(`Edge error ${res.status}: ${text}`);
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}
