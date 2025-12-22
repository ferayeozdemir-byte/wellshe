// app/categories/relationships/index.tsx
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { articles } from "../../../data/content";

export default function RelationshipsScreen() {
  const router = useRouter();

  // Bu kategorideki yazılar → en yeni en üstte
  const relArticles = articles
    .filter((a) => a.category === "relationships")
    .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Stack.Screen options={{ title: "İlişkiler" }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>İlişkiler</Text>

        {relArticles.map((article) => (
          <Pressable
            key={article.id}
            style={styles.card}
            onPress={() =>
              router.push({
                pathname: "/categories/[id]",
                params: { id: article.id },
              })
            }
          >
            <Text style={styles.cardCategory}>İlişkiler</Text>
            <Text style={styles.cardTitle}>{article.title}</Text>
            <Text style={styles.cardSummary}>{article.summary}</Text>
            <Text style={styles.cardDate}>{article.date}</Text>
          </Pressable>
        ))}

        {relArticles.length === 0 && (
          <View style={{ padding: 20 }}>
            <Text style={{ color: "#444" }}>
              Bu kategoride henüz içerik yok.
            </Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 16,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 12,
  },
  cardCategory: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0756F",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A2E2A",
    marginBottom: 4,
  },
  cardSummary: {
    fontSize: 14,
    color: "#5A3A35",
    marginBottom: 6,
  },
  cardDate: {
    fontSize: 11,
    color: "#887473",
  },
});
