// lib/analytics.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import { Platform } from "react-native";
import "react-native-get-random-values";
import { v4 as uuidv4 } from "uuid";

import { callEdgeFunction } from "./supabase";

const INSTALL_ID_KEY = "wellshe_install_id";

export type AnalyticsEventName =
  | "app_open"
  | "screen_view"
  | "content_open"
  | "feature_used"
  | "notification_clicked";

type TrackEventParams = {
  event_name: AnalyticsEventName;
  screen_name?: string | null;
  feature_name?: string | null;
  article_id?: string | null;
  article_title?: string | null;
  meta?: Record<string, unknown> | null;
};

let installIdMemoryCache: string | null = null;

export async function getInstallId(): Promise<string> {
  if (installIdMemoryCache) return installIdMemoryCache;

  try {
    const existing = await AsyncStorage.getItem(INSTALL_ID_KEY);
    if (existing?.trim()) {
      installIdMemoryCache = existing;
      return existing;
    }

    const newId = uuidv4();
    await AsyncStorage.setItem(INSTALL_ID_KEY, newId);
    installIdMemoryCache = newId;
    return newId;
  } catch (e) {
    console.log("[analytics] install id error:", e);
    const fallback = uuidv4();
    installIdMemoryCache = fallback;
    return fallback;
  }
}

function getAppVersion(): string {
  return String(Constants.expoConfig?.version ?? "");
}

function sanitizeText(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = String(value).trim();
  return trimmed ? trimmed.slice(0, 200) : null;
}

function sanitizeMeta(
  meta?: Record<string, unknown> | null
): Record<string, unknown> | null {
  if (!meta || typeof meta !== "object") return null;

  const clean: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    if (value == null) continue;

    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      clean[key] =
        typeof value === "string" ? value.slice(0, 200) : value;
    }
  }

  return Object.keys(clean).length ? clean : null;
}

export async function trackEvent(params: TrackEventParams): Promise<void> {
  try {
    const install_id = await getInstallId();

    const payload = {
      event_name: params.event_name,
      install_id,
      screen_name: sanitizeText(params.screen_name),
      feature_name: sanitizeText(params.feature_name),
      article_id: sanitizeText(params.article_id),
      article_title: sanitizeText(params.article_title),
      platform: Platform.OS,
      app_version: getAppVersion(),
      meta: sanitizeMeta(params.meta),
    };

    await callEdgeFunction("track-event", payload);
  } catch (e) {
    console.log("[analytics] trackEvent skipped:", e);
    // analytics asla app'i bozmasın
  }
}