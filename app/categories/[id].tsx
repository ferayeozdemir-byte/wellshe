// app/categories/[id].tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { articles as localArticles } from "../../data/content";
import { sbGetMany } from "../../lib/supabase";

const FAVORITES_KEY = "favorite_articles";
const ASTRO_IDS_KEY = "wellshe_astro_notification_ids";

// App route id -> DB category_id (articles.category_id sütunundaki değer)
const categoryIdToDbId: Record<string, string> = {
  healthyEating: "healthy_eating",
  home: "home_living",
  wellbeing: "wellbeing",
  relationships: "relationships",
  sport: "sport",
  fashion: "fashion",
  beauty: "beauty",
  astrology: "astrology",
  travel: "travel",
};

const categoryLabels: Record<string, string> = {
  healthyEating: "Sağlıklı Beslenme",
  relationships: "İlişkiler",
  wellbeing: "Wellbeing",
  sport: "Spor",
  fashion: "Moda",
  beauty: "Güzellik",
  astrology: "Astroloji",
  travel: "Seyahat",
  home: "Ev / Yaşam",
};

type AssetRow = { bucket: string | null; path: string | null };

type RemoteItem = {
  article_id: string;
  lang: string | null;
  title: string | null;
  summary: string | null;
  slug: string | null;
  created_at?: string | null; // article_translations.created_at
  // PostgREST embed: "articles!inner(...)" alanı burada "articles" olarak gelir
  articles: {
    id: string;
    status: "draft" | "scheduled" | "published";
    category_id: string | null;
    created_at?: string | null;

    // ✅ Görsel: FK
    cover_asset_id?: string | null;

    // ✅ İlişki: bazı projelerde tek obje, bazılarında dizi gelebilir.
    assets?: AssetRow | AssetRow[] | null;
  } | null;
};

function enc(v: string) {
  return encodeURIComponent(v);
}

/**
 * ✅ Storage public URL üret
 * Not: Bu ENV değerini app.json/app.config.js içinde tanımlı tutmalısınız:
 * EXPO_PUBLIC_SUPABASE_URL
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

function pickAsset(assets?: AssetRow | AssetRow[] | null): AssetRow | null {
  if (!assets) return null;
  if (Array.isArray(assets)) return assets[0] ?? null; // olası 1-n durumda ilkini al
  return assets;
}

function getPublicAssetUrl(assets?: AssetRow | AssetRow[] | null) {
  const a = pickAsset(assets);
  if (!SUPABASE_URL || !a?.bucket || !a?.path) return null;
  return `${SUPABASE_URL}/storage/v1/object/public/${a.bucket}/${a.path}`;
}

// 🔔 izin + android channel
async function ensureNotificationPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === "granted") return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Hatırlatmalar",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch {
    // no-op
  }
}

async function cancelStoredNotifications(key: string) {
  const existing = await AsyncStorage.getItem(key);
  if (!existing) return;

  try {
    const ids: string[] = JSON.parse(existing);
    await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => null)));
  } catch {
    // no-op
  }

  await AsyncStorage.removeItem(key);
}

function getNextSundayAt(hour: number, minute: number) {
  const now = new Date();
  const d = new Date(now);

  const day = d.getDay(); // 0=pazar
  const daysUntilSunday = (7 - day) % 7;

  d.setHours(hour, minute, 0, 0);

  if (daysUntilSunday === 0 && d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 7);
    return d;
  }

  d.setDate(d.getDate() + daysUntilSunday);
  return d;
}

async function scheduleWeeklyAstroReminderAt18() {
  const ok = await ensureNotificationPermission();
  if (!ok) {
    Alert.alert("Bildirim izni yok", "Astroloji hatırlatmalarını alabilmek için bildirim izni vermen gerekiyor.");
    return;
  }

  await ensureAndroidChannel();
  await cancelStoredNotifications(ASTRO_IDS_KEY);

  const start = getNextSundayAt(18, 0);
  const weeks = 52;
  const ids: string[] = [];

  for (let i = 0; i < weeks; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i * 7);

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Haftanın Astrolojik Yorumu 🔮",
        body: "Yeni hafta için burç yorumlarını WellShe'de okumayı unutma.",
        sound: false,
        ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date,
      },
    });

    ids.push(id);
  }

  await AsyncStorage.setItem(ASTRO_IDS_KEY, JSON.stringify(ids));
  Alert.alert("Tamamdır ✨", "Her pazar 18:00'da astroloji bildirimi alacaksın.");
}

export default function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [remoteItems, setRemoteItems] = useState<RemoteItem[]>([]);
  const [loadingRemote, setLoadingRemote] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        setFavoriteIds(raw ? JSON.parse(raw) : []);
      } catch (e) {
        console.log("Kategori favorileri yüklenirken hata:", e);
      }
    })();
  }, []);

  const toggleFavorite = async (articleId: string) => {
    try {
      const updated = favoriteIds.includes(articleId)
        ? favoriteIds.filter((x) => x !== articleId)
        : [...favoriteIds, articleId];

      setFavoriteIds(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log("Kategori favori güncellenirken hata:", e);
    }
  };

  const isFavorite = (articleId: string) => favoriteIds.includes(articleId);

  if (!id) {
    return (
      <View style={styles.center}>
        <Text>Kategori bulunamadı.</Text>
      </View>
    );
  }

  const isValidCategory = Object.prototype.hasOwnProperty.call(categoryLabels, id);

  // kategori değilse ama local article id ise
  useEffect(() => {
    if (!isValidCategory) {
      const article = localArticles.find((a) => a.id === id);
      if (article) router.replace(`/article/${id}`);
    }
  }, [id, isValidCategory, router]);

  if (!isValidCategory) {
    const article = localArticles.find((a) => a.id === id);
    if (!article) {
      return (
        <View style={styles.center}>
          <Text>Bu sayfa bulunamadı.</Text>
        </View>
      );
    }
    return <View style={styles.center} />;
  }

  // ✅ Local içerikler (fallback / hibrit için)
  const localFiltered = useMemo(
    () => localArticles.filter((a) => a.category === id).sort((a, b) => b.date.localeCompare(a.date)),
    [id]
  );

  // ✅ Remote (Supabase)
  useEffect(() => {
    let cancelled = false;

    async function loadRemote() {
      const dbCategoryId = categoryIdToDbId[id] ?? id;

      try {
        setLoadingRemote(true);

        console.log("[Category] appId:", id, "dbCategoryId:", dbCategoryId);

        // ✅ image_url yok → cover_asset_id + assets(bucket,path)
        const path =
          `/article_translations` +
          `?select=article_id,lang,title,summary,slug,created_at,articles!inner(id,category_id,status,created_at,cover_asset_id,assets(bucket,path))` +
          `&lang=eq.tr` +
          `&articles.status=eq.published` +
          `&articles.category_id=eq.${enc(dbCategoryId)}` +
          `&order=created_at.desc` +
          `&limit=50`;

        console.log("[Category] REST path:", path);

        const rows = await sbGetMany<RemoteItem>(path);

        console.log("[Category] remote rows:", rows?.length ?? 0);

        if (!cancelled) setRemoteItems(rows ?? []);
      } catch (e: any) {
        console.log("Supabase kategori içerik hatası:", e?.message ?? e);
        if (!cancelled) setRemoteItems([]);
      } finally {
        if (!cancelled) setLoadingRemote(false);
      }
    }

    loadRemote();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const title = categoryLabels[id] ?? "Kategori";

  // ✅ Remote + Local birleşim (remote’da olan local’ı gizle)
  const mergedLocal = useMemo(() => {
    const remoteIds = new Set(remoteItems.map((r) => r.article_id));
    return localFiltered.filter((a) => !remoteIds.has(a.id));
  }, [localFiltered, remoteItems]);

  const hasAny = remoteItems.length > 0 || mergedLocal.length > 0;
  const emptyState = !loadingRemote && !hasAny;

  return (
    <>
      <Stack.Screen options={{ title }} />
      <ScrollView contentContainerStyle={styles.container}>
        {id === "astrology" && (
          <View style={styles.reminderBox}>
            <Text style={styles.reminderTitle}>Haftalık burç bildirimi</Text>
            <Text style={styles.reminderText}>
              Her Pazar saat 18:00'da yeni haftanın astrolojik enerjisini ve burç yorumlarını hatırlatan bir bildirim
              almak için aşağıdaki butona dokun.
            </Text>

            <Pressable style={styles.reminderButton} onPress={scheduleWeeklyAstroReminderAt18}>
              <Text style={styles.reminderButtonText}>🔔 Her pazar 18:00 bildirimi aç</Text>
            </Pressable>
          </View>
        )}

        {loadingRemote && (
          <View style={styles.center}>
            <Text>İçerikler kontrol ediliyor…</Text>
          </View>
        )}

        {emptyState && (
          <View style={styles.center}>
            <Text>Bu kategoride henüz içerik yok.</Text>
          </View>
        )}

        {/* ✅ 1) Remote içerikler */}
        {remoteItems.map((item) => {
          const imageUrl = getPublicAssetUrl(item.articles?.assets ?? null);

          return (
            <View key={item.article_id} style={styles.articleCard}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => router.push(item.slug ? `/article/${item.slug}` : `/article/${item.article_id}`)}
              >
                {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.articleImage} resizeMode="cover" /> : null}

                <Text style={styles.articleCategory}>{categoryLabels[id] ?? ""}</Text>
                <Text style={styles.articleTitle}>{item.title ?? ""}</Text>
                <Text style={styles.articleSummary}>{item.summary ?? ""}</Text>
              </Pressable>

              <Pressable onPress={() => toggleFavorite(item.article_id)} style={styles.favoriteButton}>
                <Text style={styles.favoriteIcon}>{isFavorite(item.article_id) ? "💜" : "🤍"}</Text>
              </Pressable>
            </View>
          );
        })}

        {/* ✅ 2) Remote’da olmayan local içerikler */}
        {mergedLocal.map((article) => (
          <View key={article.id} style={styles.articleCard}>
            <Pressable style={{ flex: 1 }} onPress={() => router.push(`/article/${article.id}`)}>
              {/* Local görseller şu an sizde localden geliyor. Onu bozmamak için dokunmadım.
                  İsterseniz bir sonraki adımda local card image’ı da buraya ekleriz. */}
              <Text style={styles.articleCategory}>{categoryLabels[article.category] ?? ""}</Text>
              <Text style={styles.articleTitle}>{article.title}</Text>
              <Text style={styles.articleSummary}>{article.summary}</Text>
            </Pressable>

            <Pressable onPress={() => toggleFavorite(article.id)} style={styles.favoriteButton}>
              <Text style={styles.favoriteIcon}>{isFavorite(article.id) ? "💜" : "🤍"}</Text>
            </Pressable>
          </View>
        ))}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 24 },
  center: { padding: 24, alignItems: "center", justifyContent: "center" },

  reminderBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFE7E4",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 16,
  },
  reminderTitle: { fontSize: 16, fontWeight: "700", color: "#4A2E2A", marginBottom: 6 },
  reminderText: { fontSize: 13, color: "#5A3A35", marginBottom: 10 },
  reminderButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#B0756F",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "600" },

  articleCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 12,
  },

  articleImage: {
    width: "100%",
    height: 170,
    borderRadius: 14,
    marginBottom: 10,
  },

  articleCategory: { fontSize: 13, fontWeight: "600", color: "#B0756F", marginBottom: 4 },
  articleTitle: { fontSize: 16, fontWeight: "600", marginBottom: 6, color: "#4A2E2A" },
  articleSummary: { fontSize: 14, color: "#5A3A35" },

  favoriteButton: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  favoriteIcon: { fontSize: 24 },
});
