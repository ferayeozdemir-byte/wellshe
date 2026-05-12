import { searchArticlesRemote } from "@/lib/searchArticlesRemote";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type SearchItem = Awaited<ReturnType<typeof searchArticlesRemote>>[number];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawQ = params.q;
  const initialQuery = Array.isArray(rawQ) ? rawQ[0] : rawQ;

  const [query, setQuery] = useState(String(initialQuery ?? ""));
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<SearchItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const trimmedQuery = useMemo(() => query.trim(), [query]);

  async function runSearch(nextQuery?: string) {
    const q = String(nextQuery ?? query).trim();

    if (q.length < 2) {
      setItems([]);
      setError(null);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const rows = await searchArticlesRemote(q, 20);
      setItems(rows);
    } catch (e: any) {
      setError("Arama sırasında bir sorun oluştu.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setQuery(String(initialQuery ?? ""));
    if (String(initialQuery ?? "").trim().length >= 2) {
      void runSearch(String(initialQuery ?? ""));
    } else {
      setItems([]);
      setError(null);
    }
  }, [initialQuery]);

  function submitSearch() {
    const q = trimmedQuery;
    if (q.length < 2) return;

    router.replace({
      pathname: "/search",
      params: { q },
    });
  }

  return (
    <>
      <Stack.Screen options={{ title: "İçerik Ara" }} />

      <SafeAreaView style={styles.safe}>
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.searchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#8E8E93"
              style={styles.searchIcon}
            />

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="İçerik, konu veya kelime ara"
              placeholderTextColor="#8E8E93"
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={submitSearch}
            />

            {query.trim().length > 0 ? (
              <Pressable
                onPress={() => setQuery("")}
                hitSlop={10}
                style={styles.searchClear}
              >
                <Ionicons name="close-circle" size={20} color="#B0B0B5" />
              </Pressable>
            ) : null}
          </View>

          {trimmedQuery.length > 0 && trimmedQuery.length < 2 && (
            <Text style={styles.infoText}>
              Arama için en az 2 karakter girin.
            </Text>
          )}

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator />
            </View>
          ) : error ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>{error}</Text>
            </View>
          ) : trimmedQuery.length >= 2 && items.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyTitle}>
                Aradığınız kelimelerle eşleşen bir içerik bulamadık.
              </Text>
              <Text style={styles.emptyText}>
                Farklı bir kelime ya da daha kısa bir ifade deneyin.
              </Text>
            </View>
          ) : (
            <View style={styles.listWrap}>
              {items.map((article) => (
                <Pressable
                  key={article.article_id}
                  style={styles.card}
                  onPress={() =>
                    router.push({
                      pathname: article.slug
                        ? `/article/${article.slug}`
                        : `/article/${article.article_id}`,
                      params: {
                        articleId: article.article_id,
                        initialTitle: article.title ?? "",
                        initialSummary: article.summary ?? "",
                        initialCoverUrl: article.imageUrl ?? "",
                      },
                    })
                  }
                >
                  {!!article.imageUrl && (
                    <Image
                      source={{ uri: article.imageUrl }}
                      style={styles.cover}
                      resizeMode="cover"
                    />
                  )}

                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle}>
                      {article.title ?? "İçerik"}
                    </Text>

                    {!!article.summary && (
                      <Text style={styles.cardSummary} numberOfLines={3}>
                        {article.summary}
                      </Text>
                    )}
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#FFFDFD",
  },

  container: {
    padding: 16,
    paddingBottom: 32,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F3F3F6",
    paddingHorizontal: 14,
    marginBottom: 16,
  },

  searchIcon: {
    marginRight: 8,
  },

  searchInput: {
    flex: 1,
    color: "#2F2626",
    fontSize: 16,
    paddingVertical: 0,
  },

  searchClear: {
    marginLeft: 8,
    justifyContent: "center",
  },

  infoText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#7A6A6A",
    marginBottom: 8,
  },

  centerBox: {
    paddingVertical: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  emptyBox: {
    marginTop: 8,
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFF7F7",
    borderWidth: 1,
    borderColor: "#F0DEDF",
  },

  emptyTitle: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "600",
    color: "#413636",
  },

  emptyText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: "#746767",
  },

  listWrap: {
    gap: 12,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#EFE3E3",
  },

  cover: {
    width: "100%",
    height: 170,
  },

  cardBody: {
    padding: 14,
  },

  cardTitle: {
    fontSize: 17,
    lineHeight: 24,
    fontWeight: "700",
    color: "#2F2626",
  },

  cardSummary: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    color: "#5E4F4F",
  },
});