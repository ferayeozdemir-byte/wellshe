// lib/categoriesRemote.ts
import { sbGetMany } from "./supabase";

export type RemoteArticle = {
  article_id: string;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null;
  image_url?: string | null;
};

function enc(v: string) {
  return encodeURIComponent(v);
}

export async function fetchArticlesByCategoryRemote(dbCategoryId: string) {
  const path =
    `/article_translations` +
    `?select=article_id,title,summary,slug,created_at,articles!inner(image_url,id,category_id,status)` +
    `&lang=eq.tr` +
    `&articles.status=eq.published` +
    `&articles.category_id=eq.${enc(dbCategoryId)}` +
    `&order=created_at.desc` +
    `&limit=50`;

  const rows = await sbGetMany<any>(path);

  return (rows ?? []).map((r: any) => ({
    article_id: r.article_id,
    title: r.title ?? null,
    summary: r.summary ?? null,
    slug: r.slug ?? null,
    created_at: r.created_at ?? null,
    image_url: r.articles?.image_url ?? null,
  })) as RemoteArticle[];
}

// ✅ Home: en yeni published içerikler (Sadece Supabase)
export type RemoteLatestHomeItem = {
  article_id: string;
  title: string | null;
  slug: string | null;
  created_at?: string | null;
  category_id: string | null;
};

export async function fetchLatestArticlesRemote(limit = 3) {
  const path =
    `/article_translations` +
    `?select=article_id,title,slug,created_at,articles!inner(category_id,status)` +
    `&lang=eq.tr` +
    `&articles.status=eq.published` +
    `&order=created_at.desc` +
    `&limit=${limit}`;

  const rows = await sbGetMany<any>(path);

  return (rows ?? []).map((r: any) => ({
    article_id: r.article_id,
    title: r.title ?? null,
    slug: r.slug ?? null,
    created_at: r.created_at ?? null,
    category_id: r.articles?.category_id ?? null,
  })) as RemoteLatestHomeItem[];
}
