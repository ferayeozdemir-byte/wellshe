import { publicStorageUrl, sbRpc } from "./supabase";

export type SearchArticleRemoteItem = {
  article_id: string;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null;
  category_id: string | null;
  imageUrl?: string | null;
  rank?: number | null;
};

type SearchRpcRow = {
  article_id: string;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null;
  category_id: string | null;
  cover_bucket: string | null;
  cover_path: string | null;
  rank?: number | null;
};

export async function searchArticlesRemote(
  query: string,
  limit = 20
): Promise<SearchArticleRemoteItem[]> {
  const trimmed = String(query ?? "").trim();

  if (trimmed.length < 2) return [];

  const rows = await sbRpc<SearchRpcRow[]>("search_articles_tr", {
    search_query: trimmed,
    max_results: limit,
  });

  return (rows ?? []).map((row: SearchRpcRow) => {
    let imageUrl: string | null = null;

    if (row.cover_bucket && row.cover_path) {
      imageUrl = publicStorageUrl(row.cover_bucket, row.cover_path);
    }

    return {
      article_id: row.article_id,
      title: row.title ?? null,
      summary: row.summary ?? null,
      slug: row.slug ?? null,
      created_at: row.created_at ?? null,
      category_id: row.category_id ?? null,
      imageUrl,
      rank: row.rank ?? null,
    };
  });
}