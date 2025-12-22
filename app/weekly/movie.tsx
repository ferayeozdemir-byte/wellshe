// app/weekly/movie.tsx
import { useFocusEffect } from "@react-navigation/native";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { weeklyArchive, type WeeklyItem } from "../../data/weekly";
import { fetchWeeklyArchive } from "../../lib/weeklyRemote";

/**
 * id başındaki YYYY-MM-DD tarihini yakalayıp timestamp'e çevirir.
 * Bulamazsa 0 döndürür (en sona düşer).
 */
function getDateTsFromId(id: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(id);
  if (!m) return 0;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const dt = new Date(y, mo, d);
  const ts = dt.getTime();
  return Number.isFinite(ts) ? ts : 0;
}

function sortNewestFirst(list: WeeklyItem[]): WeeklyItem[] {
  return [...list].sort((a, b) => getDateTsFromId(b.id) - getDateTsFromId(a.id));
}

export default function WeeklyMovieScreen() {
  const [items, setItems] = useState<WeeklyItem[] | null>(null);

  // ✅ Ekrana her dönüşte yeniden çek
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      (async () => {
        try {
          // created: son eklenen üstte
          // updated: son düzenlenen üstte
          const remote = await fetchWeeklyArchive("movie", "created");
          if (!isMounted) return;

          if (remote.length > 0) setItems(remote);
          else setItems(sortNewestFirst(weeklyArchive.movie));
        } catch (e) {
          if (!isMounted) return;
          setItems(sortNewestFirst(weeklyArchive.movie));
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  if (!items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.pageTitle}>Haftanın Dizi / Film Önerileri</Text>

        {items.map((item) => (
          <View key={item.id} style={styles.card}>
            <Text style={styles.weekLabel}>{item.weekLabel}</Text>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F3" },
  content: { padding: 16, paddingBottom: 24 },
  pageTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 12,
  },
  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 12,
  },
  weekLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#B0756F",
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A2E2A",
    marginBottom: 6,
  },
  cardDescription: { fontSize: 13, color: "#5A3A35" },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7F3",
  },
});
