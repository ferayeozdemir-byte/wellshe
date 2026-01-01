// lib/categoriesRemote.ts
import { publicStorageUrl, sbGetMany } from "./supabase";

/**
 * ⚠️ DEPRECATED
 * -----------------------------------------
 * Bu fonksiyon eski `image_url` modeline dayanır.
 * WellShe artık `assets (bucket/path)` modeli kullanmaktadır.
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

export async function fetchLatestArticlesRemote(limit = 3) {
  const path =
    `/article_translations` +
    `?select=` +
    // çeviri alanları
    `article_id,title,summary,slug,created_at,` +
    // bağlı olduğu article ve cover asset
    `articles!inner(category_id,status,assets(bucket,path,content_type))` +
    `&lang=eq.tr` +
    `&articles.status=eq.published` +
    `&order=created_at.desc` +
    `&limit=${limit}`;

  const rows = await sbGetMany<any>(path);

  return (rows ?? []).map((r: any) => {
    // assets tek kayıt veya dizi olabilir, ikisini de ele al
    const rawAssets = r.articles?.assets;
    const asset = Array.isArray(rawAssets) ? rawAssets[0] : rawAssets;

    let imageUrl: string | null = null;
    if (asset?.bucket && asset?.path) {
      imageUrl = publicStorageUrl(asset.bucket, asset.path);
    }

    return {
      article_id: r.article_id,
      title: r.title ?? null,
      summary: r.summary ?? null,
      slug: r.slug ?? null,
      created_at: r.created_at ?? null,
      category_id: r.articles?.category_id ?? null,
      imageUrl,
    } as RemoteLatestHomeItem;
  });
}
