// app/categories/astrology/index.tsx
import * as Notifications from "expo-notifications";
import { Stack, useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { articles } from "../../../data/content";

async function scheduleWeeklyAstroReminder() {
  const { status } = await Notifications.requestPermissionsAsync();

  if (status !== "granted") {
    Alert.alert(
      "Bildirim izni yok",
      "Astroloji hatırlatmalarını alabilmek için bildirim izni vermen gerekiyor."
    );
    return;
  }

  // Android channel (varsa HomeScreen’deki ile aynı isimde)
  if (Platform.OS === "android") {
    try {
      await Notifications.setNotificationChannelAsync("reminders", {
        name: "Hatırlatmalar",
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    } catch {}
  }

  // ✅ SDK 54 uyumlu: Calendar trigger -> type + weekday/hour/minute
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Haftanın Astrolojik Yorumu 🔮",
      body: "Yeni hafta için burç yorumlarını WellShe'de okumayı unutma.",
      ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: 1, // pazar (bazı cihazlarda 7 gerekebilir)
      hour: 18,   // ✅ istediğin saat
      minute: 0,
    },
  });

  Alert.alert("Tamamdır ✨", "Her pazar 18:00'da astroloji bildirimi alacaksın.");
}

export default function AstrologyScreen() {
  const router = useRouter();

  // Sadece astroloji içeriklerini al
  const astroArticles = articles
  .filter((a) => a.category === "astrology")
  .sort((a, b) => b.date.localeCompare(a.date));

  return (
    <>
      <Stack.Screen options={{ title: "Astroloji" }} />

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Astroloji</Text>

        {/* Haftalık burç bildirimi kutusu */}
        <View style={styles.reminderBox}>
          <Text style={styles.reminderTitle}>Haftalık burç bildirimi</Text>
          <Text style={styles.reminderText}>
            Her pazar sabahı, yeni haftanın astrolojik enerjisini ve burç
            yorumlarını hatırlatan bir bildirim almak için aşağıdaki butona
            dokunabilirsin.
          </Text>

          <Pressable
            style={styles.reminderButton}
            onPress={scheduleWeeklyAstroReminder}
          >
            <Text style={styles.reminderButtonText}>
              Her pazar burç bildirimi al
            </Text>
          </Pressable>
        </View>

        {astroArticles.map((article) => (
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
            <Text style={styles.cardCategory}>Astroloji</Text>
            <Text style={styles.cardTitle}>{article.title}</Text>
            <Text style={styles.cardSummary}>{article.summary}</Text>
            <Text style={styles.cardDate}>{article.date}</Text>
          </Pressable>
        ))}

        {astroArticles.length === 0 && (
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

  // 🔮 Haftalık burç bildirimi kutusu stilleri
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
  reminderText: {
    fontSize: 13,
    color: "#5A3A35",
    marginBottom: 10,
  },
  reminderButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "#B0756F",
    alignItems: "center",
    justifyContent: "center",
  },
  reminderButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
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
