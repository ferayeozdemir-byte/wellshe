// lib/supabase.ts
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

function headers() {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
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
  const res = await fetch(restUrl(pathWithQuery), { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return (await res.json()) as T;
}

export async function sbGetMany<T>(pathWithQuery: string): Promise<T[]> {
  const res = await fetch(restUrl(pathWithQuery), { headers: headers() });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase REST error ${res.status}: ${text}`);
  }
  return (await res.json()) as T[];
}
