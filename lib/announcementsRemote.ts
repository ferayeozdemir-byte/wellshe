// lib/announcementsRemote.ts

import { sbGetMany } from "./supabase";

export type HomeAnnouncement = {
  id: string;
  title: string;
  body: string;
  priority: number;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
};

type AnnouncementRow = {
  id: string;
  title: string | null;
  body: string | null;
  priority: number | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export async function fetchActiveAnnouncements(): Promise<HomeAnnouncement[]> {
  const rows = await sbGetMany<AnnouncementRow>(
    `/announcements` +
      `?select=id,title,body,priority,starts_at,ends_at,created_at,updated_at` +
      `&status=eq.published` +
      `&order=priority.desc` +
      `&order=created_at.desc` +
      `&limit=20`
  );

  return (rows ?? [])
    .filter((item) => item.id && item.title && item.body)
    .map((item) => ({
      id: String(item.id),
      title: String(item.title ?? "").trim(),
      body: String(item.body ?? "").trim(),
      priority: Number(item.priority ?? 0),
      starts_at: item.starts_at ?? null,
      ends_at: item.ends_at ?? null,
      created_at: item.created_at ?? "",
      updated_at: item.updated_at ?? "",
    }));
}