// app/favorites.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { sbGetMany } from "../lib/supabase";

const FAVORITES_KEY = "favorite_articles";
const LANG = "tr";

// DB'deki category_id -> ekranda gösterilecek etiket
const DB_CATEGORY_LABELS: Record<string, string> = {
  healthy_eating: "Sağlıklı Beslenme",
  home_living: "Ev / Yaşam",
  wellbeing: "Wellbeing",
  relationships: "İlişkiler",
  sport: "Spor",
  fashion: "Moda",
  beauty: "Güzellik",
  astrology: "Astroloji",
  travel: "Seyahat",
};

type TranslationRow = {
  article_id: string;
  title: string | null;
  slug: string | null;
};

type ArticleRow = {
  id: string;
  category_id: string | null;
};

type FavoriteItem = {
  routeId: string;           // AsyncStorage'da saklanan değer (UUID veya slug)
  articleId: string;         // Gerçek article_id (UUID)
  title: string;
  categoryLabel: string | null;
};

function looksLikeUuid(v: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    v
  );
}

function enc(v: string) {
  return encodeURIComponent(v);
}

// 🔍 Tek bir favorite için başlık + kategori çek
async function fetchFavoriteMeta(routeId: string): Promise<FavoriteItem | null> {
  console.log("[favorites] fetch meta for routeId:", routeId);

  let trRows: TranslationRow[] = [];

  if (looksLikeUuid(routeId)) {
    // UUID → article_id üzerinden translation bul
    trRows = await sbGetMany<TranslationRow>(
      `/article_translations?select=article_id,title,slug` +
        `&article_id=eq.${enc(routeId)}` +
        `&lang=eq.${LANG}` +
        `&limit=1`
    );
  } else {
    // slug → slug üzerinden translation bul
    trRows = await sbGetMany<TranslationRow>(
      `/article_translations?select=article_id,title,slug` +
        `&slug=eq.${enc(routeId)}` +
        `&lang=eq.${LANG}` +
        `&limit=1`
    );
  }

  const tr = trRows?.[0];
  if (!tr) {
    console.log("[favorites] translation bulunamadı:", routeId);
    return null;
  }

  // Kategori bilgisini articles tablosundan çek
  let categoryLabel: string | null = null;

  try {
    const aRows = await sbGetMany<ArticleRow>(
      `/articles?select=id,category_id&id=eq.${enc(tr.article_id)}&limit=1`
    );
    const art = aRows?.[0];
    if (art?.category_id) {
      categoryLabel =
        DB_CATEGORY_LABELS[art.category_id] ?? String(art.category_id);
    }
  } catch (e) {
    console.log("[favorites] articles sorgusunda hata:", e);
  }

  return {
    routeId, // Navigasyonda /article/[id] için kullanacağız
    articleId: tr.article_id,
    title: tr.title ?? "İsimsiz içerik",
    categoryLabel,
  };
}

export default function FavoritesScreen() {
  const router = useRouter();

  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [favoriteArticles, setFavoriteArticles] = useState<FavoriteItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const raw = await AsyncStorage.getItem(FAVORITES_KEY);
        const ids: string[] = raw ? JSON.parse(raw) : [];
        console.log("[favorites] AsyncStorage'tan gelen ID'ler:", ids);

        setFavoriteIds(ids);

        if (!ids.length) {
          setFavoriteArticles([]);
          return;
        }

        // Her ID için meta veriyi Supabase'ten çek
        const metas = await Promise.all(
          ids.map(async (id) => {
            try {
              return await fetchFavoriteMeta(id);
            } catch (e) {
              console.log("[favorites] meta fetch error for", id, e);
              return null;
            }
          })
        );

        // Sıralamayı koruyarak null olmayanları filtrele
        const ordered: FavoriteItem[] = [];
        ids.forEach((id) => {
          const hit = metas.find((m) => m && m.routeId === id);
          if (hit) ordered.push(hit);
        });

        console.log("[favorites] UI'ya girecek favoriler:", ordered);
        setFavoriteArticles(ordered);
      } catch (e) {
        console.log("[favorites] load error:", e);
        setFavoriteIds([]);
        setFavoriteArticles([]);
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, []);

  const toggleFavorite = async (routeId: string) => {
    try {
      const updatedIds = favoriteIds.filter((id) => id !== routeId);
      setFavoriteIds(updatedIds);
      setFavoriteArticles((prev) =>
        prev.filter((item) => item.routeId !== routeId)
      );
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updatedIds));
    } catch (e) {
      console.log("[favorites] toggle error:", e);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Favorilerim 💖</Text>

        {favoriteArticles.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyText}>
              Henüz favorilere eklediğin bir içerik yok.
            </Text>
            <Text style={styles.emptySub}>
              Ana sayfadan içerikleri 💖 ile işaretleyebilirsin.
            </Text>
          </View>
        ) : (
          favoriteArticles.map((article) => (
            <View key={article.routeId} style={styles.cardRow}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() =>
                  router.push(`/article/${article.routeId}`)
                }
              >
                {!!article.categoryLabel && (
                  <Text style={styles.categoryText}>
                    {article.categoryLabel}
                  </Text>
                )}
                <Text style={styles.titleText}>{article.title}</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleFavorite(article.routeId)}
                style={styles.favoriteButton}
              >
                <Text style={styles.favoriteIcon}>💔</Text>
              </Pressable>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F3",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 16,
  },
  emptyBox: {
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  emptyText: {
    fontSize: 15,
    color: "#4A2E2A",
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 13,
    color: "#7A5852",
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 10,
  },
  categoryText: {
    fontSize: 12,
    color: "#B0756F",
    marginBottom: 4,
  },
  titleText: {
    fontSize: 15,
    color: "#4A2E2A",
  },
  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  favoriteIcon: {
    fontSize: 22,
  },
});
