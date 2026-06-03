// app/categories/[id].tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { sbGetMany } from "../../lib/supabase";

const CATEGORY_CACHE_KEY_PREFIX = "wellshe_category_cache_"; // (şimdilik kullanılmıyor ama dursun)
const FAVORITES_KEY = "favorite_articles";
const ASTRO_IDS_KEY = "wellshe_astro_notification_ids";

const INITIAL_LIMIT = 5; // 👉 ilk açılışta gösterilecek içerik sayısı
const LOAD_MORE_LIMIT = 10; // 👉 her "Daha fazla göster" tıklamasında gelecek ekstra içerik sayısı

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
  articles: {
    id: string;
    status: "draft" | "scheduled" | "published";
    category_id: string | null;
    created_at?: string | null;
    cover_asset_id?: string | null;
    assets?: AssetRow | AssetRow[] | null;
  } | null;
};

function enc(v: string) {
  return encodeURIComponent(v);
}

/**
 * ✅ Storage public URL üret
 * Not: app.json/app.config.js içinde:
 * EXPO_PUBLIC_SUPABASE_URL
 */
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";

function pickAsset(assets?: AssetRow | AssetRow[] | null): AssetRow | null {
  if (!assets) return null;
  if (Array.isArray(assets)) return assets[0] ?? null;
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
    await Promise.all(
      ids.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => null)
      )
    );
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

  // Bugün pazar ise ve saat geçtiyse bir sonraki pazara at
  if (daysUntilSunday === 0 && d.getTime() <= now.getTime()) {
    d.setDate(d.getDate() + 7);
    return d;
  }

  d.setDate(d.getDate() + daysUntilSunday);
  return d;
}

export default function CategoryScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const rawId = params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  // 🔹 Artık tek liste var: şu ana kadar yüklenmiş içerikler
  const [items, setItems] = useState<RemoteItem[]>([]);

  // 🔹 Pagination state
  const [offset, setOffset] = useState(0);
  const [loadingInitial, setLoadingInitial] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadingRemote = loadingInitial || loadingMore;

  const isValidCategory =
    !!id && Object.prototype.hasOwnProperty.call(categoryLabels, id);

  const title = id && isValidCategory ? categoryLabels[id] : "Kategori";

  const dbCategoryId =
    id && isValidCategory ? categoryIdToDbId[id] ?? id : null;

  const analyticsMeta = useMemo(
    () => ({
      category_id: id ?? "unknown",
      category_db_id: dbCategoryId ?? "unknown",
      category_title: title,
    }),
    [dbCategoryId, id, title]
  );

  // ✅ Favoriler yükle
  useEffect(() => {
    (async () => {
      try {
        console.log(
          "[Category] favorites load START",
          new Date().toISOString()
        );
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        setFavoriteIds(raw ? JSON.parse(raw) : []);
        console.log(
          "[Category] favorites load END",
          new Date().toISOString()
        );
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

  // 🔹 Supabase’ten sayfa sayfa veri çeken fonksiyon
  const fetchPage = useCallback(
    async (options: { reset: boolean }) => {
      if (!id || !isValidCategory || !dbCategoryId) return;

      const { reset } = options;

      const limit = reset ? INITIAL_LIMIT : LOAD_MORE_LIMIT;
      const currentOffset = reset ? 0 : offset;

      console.log("[Category] fetchPage START", {
        id,
        dbCategoryId,
        reset,
        limit,
        offset: currentOffset,
        at: new Date().toISOString(),
      });

      try {
        if (reset) {
          setLoadingInitial(true);
          setHasMore(true);
        } else {
          if (loadingMore) return; // çifte tıklamaya karşı koruma
          setLoadingMore(true);
        }

        const path =
          `/article_translations` +
          `?select=article_id,lang,title,summary,slug,created_at,` +
          `articles!inner(id,category_id,status,created_at,cover_asset_id,assets(bucket,path))` +
          `&lang=eq.tr` +
          `&articles.status=eq.published` +
          `&articles.category_id=eq.${enc(dbCategoryId)}` +
          `&order=created_at.desc` +
          `&limit=${limit}` +
          `&offset=${currentOffset}`;

        console.log("[Category] supabase query START", {
          path,
          at: new Date().toISOString(),
        });

        const rows = await sbGetMany<RemoteItem>(path);
        const safeRows = rows ?? [];

        console.log("[Category] supabase query END", {
          count: safeRows.length,
          at: new Date().toISOString(),
        });

        if (reset) {
          setItems(safeRows);
          setOffset(safeRows.length);
        } else {
          setItems((prev) => [...prev, ...safeRows]);
          setOffset((prev) => prev + safeRows.length);
        }

        // gelen kayıt sayısı limit'ten küçükse devamı yoktur
        setHasMore(safeRows.length === limit);
      } catch (e: any) {
        console.log("Supabase kategori içerik hatası:", e?.message ?? e);
        if (reset) {
          setItems([]);
          setOffset(0);
          setHasMore(false);
        }
      } finally {
        if (reset) {
          setLoadingInitial(false);
        } else {
          setLoadingMore(false);
        }
        console.log("[Category] fetchPage END", {
          reset,
          at: new Date().toISOString(),
        });
      }
    },
    [dbCategoryId, id, isValidCategory, loadingMore, offset]
  );

  // ✅ İlk giriş: sadece son 5 içerik
  useEffect(() => {
    if (!id || !isValidCategory) return;

    console.log("[Category] mount -> fetchPage(reset=true)", {
      id,
      at: new Date().toISOString(),
    });

    void fetchPage({ reset: true });
  }, [id, isValidCategory, fetchPage]);

  // ✅ Ekrana her geri dönüşte: yine son 5’i taze çek (en güncel liste için)
  useFocusEffect(
    useCallback(() => {
      if (!id || !isValidCategory) return;

      void trackEvent({
        event_name: "screen_view",
        screen_name: "category",
        meta: analyticsMeta,
      });

      console.log("[Category] focus -> fetchPage(reset=true)", {
        id,
        at: new Date().toISOString(),
      });

      void fetchPage({ reset: true });
    }, [analyticsMeta, id, isValidCategory, fetchPage])
  );

  useTrackScreenDuration({
    screen_name: isValidCategory ? "category" : "category_invalid",
    meta: analyticsMeta,
  });

  const handleArticlePress = useCallback(
    (item: RemoteItem, imageUrl: string | null) => {
      void trackEvent({
        event_name: "feature_used",
        screen_name: "category",
        feature_name: "category_article_click",
        article_id: item.article_id,
        article_title: item.title,
        meta: {
          ...analyticsMeta,
          article_slug: item.slug ?? "",
          has_cover: Boolean(imageUrl),
        },
      });

      router.push({
        pathname: item.slug
          ? `/article/${item.slug}`
          : `/article/${item.article_id}`,
        params: {
          articleId: item.article_id,
          initialTitle: item.title ?? "",
          initialSummary: item.summary ?? "",
          initialCoverUrl: imageUrl ?? "",
        },
      });
    },
    [analyticsMeta, router]
  );

  const handleLoadMore = useCallback(() => {
    if (!loadingMore && hasMore) {
      void trackEvent({
        event_name: "feature_used",
        screen_name: "category",
        feature_name: "category_load_more_click",
        meta: {
          ...analyticsMeta,
          current_offset: offset,
          loaded_count: items.length,
        },
      });

      void fetchPage({ reset: false });
    }
  }, [analyticsMeta, fetchPage, hasMore, items.length, loadingMore, offset]);

  if (!id) {
    return (
      <View style={styles.center}>
        <Text>Kategori bulunamadı.</Text>
      </View>
    );
  }

  if (!isValidCategory) {
    return (
      <View style={styles.center}>
        <Text>Bu sayfa bulunamadı.</Text>
      </View>
    );
  }

  const emptyState = !loadingRemote && items.length === 0;

  console.log("[Category] render STATE", {
    id,
    total: items.length,
    offset,
    loadingInitial,
    loadingMore,
    hasMore,
  });

  return (
    <>
      <Stack.Screen options={{ title }} />

      <ScrollView contentContainerStyle={styles.container}>
        {id === "astrology" && (
          <View style={styles.reminderBox}>
            <Text style={styles.reminderTitle}>Haftalık Burç Bildirimi</Text>
            <Text style={styles.reminderText}>
              Her Pazar saat 18:00&apos;da yeni haftanın astrolojik enerjisini ve
              burç yorumlarını hatırlatan bir bildirim almak için aşağıdaki
              butona dokun.
            </Text>

            <Pressable
              style={styles.reminderButton}
              onPress={async () => {
                const ok = await ensureNotificationPermission();
                if (!ok) {
                  Alert.alert(
                    "Bildirim izni yok",
                    "Astroloji hatırlatmalarını alabilmek için bildirim izni vermen gerekiyor."
                  );
                  return;
                }

                await ensureAndroidChannel();
                await cancelStoredNotifications(ASTRO_IDS_KEY);

                const start = getNextSundayAt(18, 0);
                const weeks = 52;
                const ids: string[] = [];

                try {
                  for (let i = 0; i < weeks; i++) {
                    const date = new Date(start);
                    date.setDate(start.getDate() + i * 7);

                    const notifId =
                      await Notifications.scheduleNotificationAsync({
                        content: {
                          title: "Haftanın Astrolojik Yorumu 🔮",
                          body: "Yeni hafta için burç yorumlarını WellShe'de okumayı unutma.",
                          sound: false,
                          ...(Platform.OS === "android"
                            ? { channelId: "reminders" }
                            : {}),
                        },
                        trigger: {
                          type: Notifications.SchedulableTriggerInputTypes.DATE,
                          date,
                        },
                      });

                    ids.push(notifId);
                  }

                  await AsyncStorage.setItem(ASTRO_IDS_KEY, JSON.stringify(ids));
                  Alert.alert(
                    "Tamamdır ✨",
                    "Her pazar 18:00'da astroloji bildirimi alacaksın."
                  );
                } catch (e) {
                  console.log(
                    "Astroloji bildirimleri planlanırken hata:",
                    e
                  );
                  Alert.alert(
                    "Hata",
                    "Astroloji bildirimi ayarlanırken bir sorun oluştu."
                  );
                }
              }}
            >
              <Text style={styles.reminderButtonText}>
                🔔 Haftalık Astroloji Bildirimini Aç
              </Text>
            </Pressable>
          </View>
        )}

        {loadingInitial && (
          <View style={styles.center}>
            <Text>İçerikler kontrol ediliyor…</Text>
          </View>
        )}

        {emptyState && (
          <View style={styles.center}>
            <Text>Bu kategoride henüz içerik yok.</Text>
          </View>
        )}

        {items.map((item) => {
          const imageUrl = getPublicAssetUrl(item.articles?.assets ?? null);

          return (
            <View key={item.article_id} style={styles.articleCard}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => handleArticlePress(item, imageUrl)}
              >
                {imageUrl ? (
                  <Image
                    source={{ uri: imageUrl }}
                    style={styles.articleImage}
                    resizeMode="cover"
                  />
                ) : null}

                <Text style={styles.articleTitle}>{item.title ?? ""}</Text>
                <Text style={styles.articleSummary}>{item.summary ?? ""}</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleFavorite(item.article_id)}
                style={styles.favoriteButton}
              >
                <Text style={styles.favoriteIcon}>
                  {isFavorite(item.article_id) ? "💜" : "🤍"}
                </Text>
              </Pressable>
            </View>
          );
        })}

        {hasMore && !loadingInitial && (
          <View style={styles.loadMoreBox}>
            <Pressable
              onPress={handleLoadMore}
              style={styles.loadMoreButton}
            >
              <Text style={styles.loadMoreText}>
                {loadingMore ? "Yükleniyor..." : "Daha fazla göster"}
              </Text>
            </Pressable>
          </View>
        )}
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
  reminderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 6,
  },
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

  articleTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#4A2E2A",
  },
  articleSummary: { fontSize: 14, color: "#5A3A35" },

  favoriteButton: { paddingHorizontal: 8, paddingVertical: 4, marginLeft: 8 },
  favoriteIcon: { fontSize: 24 },

  loadMoreBox: {
    alignItems: "center",
    marginTop: 4,
    marginBottom: 20,
  },
  loadMoreButton: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    backgroundColor: "#FFF7F6",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A2E2A",
  },
});
