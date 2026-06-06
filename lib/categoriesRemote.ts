// lib/categoriesRemote.ts
import { resolveAssetUrl, sbGetMany, type StorageAssetLike } from "./supabase";

/**
 * ⚠️ DEPRECATED
 * -----------------------------------------
 * Bu fonksiyon eski `image_url` modeline dayanır.
 * WellShe artık `assets (bucket/path/public_url)` modeli kullanmaktadır.
 *
 * ❌ KULLANMAYIN
 * Category ekranları kendi assets tabanlı sorgularını yapıyor.
 *
 * Eğer biri yanlışlıkla import ederse,
 * uygulama sessizce bozulmasın diye burada bilinçli olarak hata fırlatır.
 */
export async function fetchArticlesByCategoryRemote(): Promise<never> {
  throw new Error(
    "fetchArticlesByCategoryRemote DEPRECATED: image_url modeli kullanıyor. Category ekranlarında assets tabanlı sorgu kullanın."
  );
}

// ------------------------------------------------------
// ✅ HOME EKRANI – en yeni published içerikler (Supabase)
// ------------------------------------------------------

export type RemoteLatestHomeItem = {
  article_id: string;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null;
  category_id: string | null;
  imageUrl?: string | null;
};

type LatestArticleRow = {
  article_id: string;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null;
  articles?: {
    category_id?: string | null;
    status?: string | null;
    assets?: StorageAssetLike | StorageAssetLike[] | null;
  } | null;
};

export async function fetchLatestArticlesRemote(
  limit = 3
): Promise<RemoteLatestHomeItem[]> {
  const path =
    `/article_translations` +
    `?select=` +
    // çeviri alanları
    `article_id,title,summary,slug,created_at,` +
    // bağlı olduğu article ve cover asset
    `articles!inner(` +
    `category_id,status,` +
    `assets(bucket,path,public_url,storage_provider,storage_key,content_type)` +
    `)` +
    `&lang=eq.tr` +
    `&articles.status=eq.published` +
    `&order=created_at.desc` +
    `&limit=${limit}`;

  const rows = await sbGetMany<LatestArticleRow>(path);

  return (rows ?? []).map((r) => {
    const rawAssets = r.articles?.assets;
    const asset = Array.isArray(rawAssets) ? rawAssets[0] : rawAssets;

    return {
      article_id: r.article_id,
      title: r.title ?? null,
      summary: r.summary ?? null,
      slug: r.slug ?? null,
      created_at: r.created_at ?? null,
      category_id: r.articles?.category_id ?? null,
      imageUrl: resolveAssetUrl(asset),
    };
  });
}