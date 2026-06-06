import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { useFocusEffect } from "@react-navigation/native";
import { Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Pressable,
    SafeAreaView,
    ScrollView,
    StyleSheet,
    Text,
    View,
} from "react-native";

import AdBanner from "../../components/AdBanner";
import {
    weeklyArchive,
    type WeeklyCategory,
    type WeeklyItem,
} from "../../data/weekly";
import { fetchWeeklyArchive } from "../../lib/weeklyRemote";

const INITIAL_VISIBLE_COUNT = 5;
const LOAD_MORE_COUNT = 5;

type Props = {
  category: WeeklyCategory;
  stackTitle: string;
  pageTitle: string;
  screenName: string;
};

function getDateTsFromId(id: string): number {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(id);
  if (!m) return 0;

  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  const ts = new Date(y, mo, d).getTime();

  return Number.isFinite(ts) ? ts : 0;
}

function sortNewestFirst(list: WeeklyItem[]): WeeklyItem[] {
  return [...list].sort((a, b) => getDateTsFromId(b.id) - getDateTsFromId(a.id));
}

function WeeklyBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function WeeklyArchiveScreen({
  category,
  stackTitle,
  pageTitle,
  screenName,
}: Props) {
  const [items, setItems] = useState<WeeklyItem[] | null>(null);
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE_COUNT);

  useEffect(() => {
    void trackEvent({
      event_name: "screen_view",
      screen_name: screenName,
      feature_name: "weekly_screen_view",
      meta: {
        weekly_type: category,
      },
    });
  }, [category, screenName]);

  useTrackScreenDuration({
    screen_name: screenName,
    feature_name: "weekly_duration",
    meta: {
      weekly_type: category,
    },
  });

  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      (async () => {
        try {
          const remote = await fetchWeeklyArchive(category);
          if (!isMounted) return;

          if (remote.length > 0) {
            setItems(remote);
          } else {
            setItems(sortNewestFirst(weeklyArchive[category]));
          }

          setVisibleCount(INITIAL_VISIBLE_COUNT);
        } catch {
          if (!isMounted) return;

          setItems(sortNewestFirst(weeklyArchive[category]));
          setVisibleCount(INITIAL_VISIBLE_COUNT);
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [category])
  );

  if (!items) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  const visibleItems = items.slice(0, visibleCount);
  const canShowMore = visibleCount < items.length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <Stack.Screen options={{ title: stackTitle }} />

        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>{pageTitle}</Text>

          {visibleItems.map((item) => (
            <View key={item.id} style={styles.card}>
              <Text style={styles.weekLabel}>{item.weekLabel}</Text>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
          ))}

          {canShowMore ? (
            <Pressable
              style={styles.loadMoreButton}
              onPress={() =>
                setVisibleCount((current) =>
                  Math.min(current + LOAD_MORE_COUNT, items.length)
                )
              }
            >
              <Text style={styles.loadMoreText}>Daha fazla göster</Text>
            </Pressable>
          ) : null}
        </ScrollView>

        <WeeklyBannerAd />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F3" },
  page: { flex: 1 },
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
  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
  loadMoreButton: {
    marginTop: 4,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignItems: "center",
  },
  loadMoreText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B0756F",
  },
});