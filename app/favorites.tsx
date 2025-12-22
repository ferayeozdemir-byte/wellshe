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

import { articles } from "../data/content";

const FAVORITES_KEY = "favorite_articles";

export default function FavoritesScreen() {
  const router = useRouter();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Favorileri yükle
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        const json = await AsyncStorage.getItem(FAVORITES_KEY);
        if (json) {
          setFavoriteIds(JSON.parse(json));
        } else {
          setFavoriteIds([]);
        }
      } catch (e) {
        console.log("Favoriler yüklenirken hata:", e);
        setFavoriteIds([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadFavorites();
  }, []);

  // Favori makaleleri bul
  const favoriteArticles = articles.filter((a) =>
    favoriteIds.includes(a.id)
  );

  // Favoriden çıkar
  const toggleFavorite = async (articleId: string) => {
    try {
      const updated = favoriteIds.filter((id) => id !== articleId);
      setFavoriteIds(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log("Favori güncellenirken hata:", e);
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
            <View key={article.id} style={styles.cardRow}>
              <Pressable
                style={{ flex: 1 }}
                onPress={() => router.push(`/article/${article.id}`)}
              >
                <Text style={styles.categoryText}>{article.category}</Text>
                <Text style={styles.titleText}>{article.title}</Text>
              </Pressable>

              <Pressable
                onPress={() => toggleFavorite(article.id)}
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
