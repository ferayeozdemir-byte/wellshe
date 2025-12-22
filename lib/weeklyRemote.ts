// lib/weeklyRemote.ts
import type { WeeklyCategory, WeeklyItem } from "../data/weekly";
import { sbGetMany } from "./supabase";

type WeeklyRow = {
  id: string;
  category: WeeklyCategory;
  week_label: string;
  teaser: string;
  title: string;
  description: string;
  status: "draft" | "published";
  created_at?: string;
  updated_at?: string;
};

function ts(v?: string) {
  const t = v ? new Date(v).getTime() : 0;
  return Number.isFinite(t) ? t : 0;
}

// created_at DESC (son eklenen en üstte). eşitse updated_at DESC.
function sortNewestFirst(rows: WeeklyRow[]) {
  return [...rows].sort((a, b) => {
    const diffCreated = ts(b.created_at) - ts(a.created_at);
    if (diffCreated !== 0) return diffCreated;
    return ts(b.updated_at) - ts(a.updated_at);
  });
}

export async function fetchWeeklyArchive(category: WeeklyCategory): Promise<WeeklyItem[]> {
  const rows = await sbGetMany<WeeklyRow>(
    `/weekly_items?select=id,week_label,teaser,title,description,created_at,updated_at` +
      `&category=eq.${category}` +
      `&status=eq.published`
    // order paramını koymasak bile biz aşağıda sıralıyoruz.
  );

  const sorted = sortNewestFirst(rows);

  return sorted.map((r) => ({
    id: r.id,
    weekLabel: r.week_label,
    teaser: r.teaser,
    title: r.title,
    description: r.description,
  }));
}

export async function fetchLatestWeekly(category: WeeklyCategory): Promise<WeeklyItem | null> {
  const rows = await sbGetMany<WeeklyRow>(
    `/weekly_items?select=id,week_label,teaser,title,description,created_at,updated_at` +
      `&category=eq.${category}` +
      `&status=eq.published`
  );

  const sorted = sortNewestFirst(rows);
  const r = sorted[0];
  if (!r) return null;

  return {
    id: r.id,
    weekLabel: r.week_label,
    teaser: r.teaser,
    title: r.title,
    description: r.description,
  };
}
