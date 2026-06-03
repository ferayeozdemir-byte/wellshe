// app/practices/[kind].tsx

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdBanner from "../../components/AdBanner";
import { resolveAssetUrl, sbGetMany } from "../../lib/supabase";
import SpiritualBackground from "../components/practices/SpiritualBackground";

function PracticeBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

type PracticeKind = "breath" | "meditation";

type PracticeRow = {
  id: string;
  status: "draft" | "published" | "scheduled";
  kind: PracticeKind;
  title: string | null;
  technique_title: string | null;
  summary: string | null;
  cover_asset_id: string | null;
  audio_asset_id: string | null;
  default_duration_seconds: number | null;
  sort_order: number | null;
  accent_color: string | null;
  is_featured: boolean | null;
  slug: string | null;
  published_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  cover_asset?: {
    bucket: string | null;
    path: string | null;
    content_type: string | null;
    storage_provider?: string | null;
    storage_key?: string | null;
    public_url?: string | null;
  } | null;
};

function enc(v: string) {
  return encodeURIComponent(v);
}

function formatDuration(seconds?: number | null) {
  const total = Math.max(0, Number(seconds ?? 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;

  if (mins > 0 && secs > 0) return `${mins} dk ${secs} sn`;
  if (mins > 0) return `${mins} dk`;
  return `${secs} sn`;
}

function getPracticeTime(item: PracticeRow) {
  const rawDate = item.created_at || item.published_at || item.updated_at;
  const time = rawDate ? new Date(rawDate).getTime() : 0;

  return Number.isFinite(time) ? time : 0;
}

function getSortOrder(item: PracticeRow) {
  const value = Number(item.sort_order);

  return Number.isFinite(value) ? value : 999999;
}

function sortPractices(rows: PracticeRow[]) {
  return [...rows].sort((a, b) => {
    const aFeatured = a.is_featured === true;
    const bFeatured = b.is_featured === true;

    if (aFeatured !== bFeatured) {
      return aFeatured ? -1 : 1;
    }

    if (aFeatured && bFeatured) {
      const orderDiff = getSortOrder(a) - getSortOrder(b);

      if (orderDiff !== 0) {
        return orderDiff;
      }
    }

    return getPracticeTime(b) - getPracticeTime(a);
  });
}

export default function PracticeListScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();

  const rawKind = Array.isArray(params.kind) ? params.kind[0] : params.kind;
  const kind: PracticeKind =
    rawKind === "meditation" ? "meditation" : "breath";

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [items, setItems] = useState<PracticeRow[]>([]);

  const screenTitle =
    kind === "meditation" ? "Meditasyon" : "Nefes Egzersizi";

  const description =
    kind === "meditation"
      ? "Bugün biraz yavaşlamak, odaklanmak ve iç sesini duymak için meditasyon pratiklerini seçebilirsin."
      : "Zihnini sakinleştirmek ve bedenine kısa bir alan açmak için nefes pratiklerini seçebilirsin.";

  useEffect(() => {
    void trackEvent({
      event_name: "screen_view",
      screen_name: "practices_list",
      feature_name: "practice_list_open",
      meta: {
        kind,
      },
    });
  }, [kind]);

  useTrackScreenDuration({
    screen_name: "practices_list",
    feature_name: "practice_list_duration",
    meta: {
      kind,
    },
  });

  useEffect(() => {
    let cancelled = false;

    async function loadPractices() {
      try {
        setLoading(true);
        setErr(null);

        const rows = await sbGetMany<PracticeRow>(
          `/breathing_practices` +
            `?select=` +
            `id,status,kind,title,technique_title,summary,cover_asset_id,audio_asset_id,default_duration_seconds,sort_order,accent_color,is_featured,slug,published_at,created_at,updated_at,` +
            `cover_asset:assets!breathing_practices_cover_asset_id_fkey(bucket,path,content_type,storage_provider,storage_key,public_url)` +
            `&status=eq.published` +
            `&kind=eq.${enc(kind)}` +
            `&order=created_at.desc.nullslast`
        );

        if (!cancelled) {
          setItems(sortPractices(rows ?? []));
        }
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message ?? "Pratikler yüklenemedi.");
          setItems([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadPractices();

    return () => {
      cancelled = true;
    };
  }, [kind]);

  const handlePracticePress = (item: PracticeRow) => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "practices_list",
      feature_name: "practice_open",
      article_id: item.id,
      article_title: item.title ?? item.technique_title ?? null,
      meta: {
        kind: item.kind,
        practice_id: item.id,
        practice_title: item.title ?? "",
        technique_title: item.technique_title ?? "",
        default_duration_seconds: item.default_duration_seconds ?? 0,
        is_featured: item.is_featured === true,
      },
    });

    router.push({
      pathname: "/practices/player/[id]",
      params: {
        id: item.id,
        kind: item.kind,
        title: item.title ?? "",
      },
    });
  };

  const backgroundVariant = kind === "breath" ? "breath" : "meditation";

  return (
    <>
      <Stack.Screen options={{ title: screenTitle }} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <SpiritualBackground variant={backgroundVariant} />

          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.eyebrow}>PRATİKLER</Text>
          <Text
            style={[
              styles.title,
              kind === "breath" ? styles.titleBreath : styles.titleMeditation,
            ]}
          >
            {screenTitle}
          </Text>
          <Text
            style={[
              styles.subtitle,
              kind === "breath"
                ? styles.subtitleBreath
                : styles.subtitleMeditation,
            ]}
          >
            {description}
          </Text>

          {loading ? (
            <View style={styles.centerBox}>
              <ActivityIndicator />
              <Text style={styles.helperText}>Pratikler yükleniyor…</Text>
            </View>
          ) : err ? (
            <View
              style={[
                styles.emptyCard,
                kind === "breath"
                  ? styles.emptyCardBreath
                  : styles.emptyCardMeditation,
              ]}
            >
              <Text style={styles.emptyTitle}>Bir sorun oluştu</Text>
              <Text style={styles.emptyText}>{err}</Text>
            </View>
          ) : items.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                kind === "breath"
                  ? styles.emptyCardBreath
                  : styles.emptyCardMeditation,
              ]}
            >
              <Text style={styles.emptyTitle}>Henüz içerik yok</Text>
              <Text style={styles.emptyText}>
                Bu alana eklenen pratikler burada görünecek.
              </Text>
            </View>
          ) : (
            items.map((item) => {
              const cover = resolveAssetUrl(item.cover_asset);

              return (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.card,
                    kind === "breath"
                      ? styles.cardBreath
                      : styles.cardMeditation,
                    pressed ? styles.cardPressed : null,
                  ]}
                  onPress={() => handlePracticePress(item)}
                >
                  {cover ? (
                    <Image
                      source={{ uri: cover }}
                      style={styles.cover}
                      resizeMode="cover"
                    />
                  ) : (
                    <View
                      style={[
                        styles.coverFallback,
                        kind === "breath"
                          ? styles.coverFallbackBreath
                          : styles.coverFallbackMeditation,
                      ]}
                    >
                      <Text style={styles.coverFallbackText}>
                        {item.kind === "meditation" ? "Meditasyon" : "Nefes"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardBody}>
                    <View style={styles.badgeRow}>
                      <View
                        style={[
                          styles.kindBadge,
                          kind === "breath"
                            ? styles.kindBadgeBreath
                            : styles.kindBadgeMeditation,
                        ]}
                      >
                        <Text
                          style={[
                            styles.kindBadgeText,
                            kind === "breath"
                              ? styles.kindBadgeTextBreath
                              : styles.kindBadgeTextMeditation,
                          ]}
                        >
                          {item.kind === "meditation"
                            ? "Meditasyon"
                            : "Nefes Egzersizi"}
                        </Text>
                      </View>

                      {!!item.default_duration_seconds && (
                        <Text style={styles.durationText}>
                          {formatDuration(item.default_duration_seconds)}
                        </Text>
                      )}
                    </View>

                    <Text style={styles.cardTitle}>
                      {item.title?.trim() || "İsimsiz pratik"}
                    </Text>

                    {!!item.technique_title && (
                      <Text style={styles.techniqueTitle}>
                        {item.technique_title}
                      </Text>
                    )}

                    {!!item.summary && (
                      <Text style={styles.cardSummary}>{item.summary}</Text>
                    )}

                    <Text
                      style={[
                        styles.cardLink,
                        kind === "breath"
                          ? styles.cardLinkBreath
                          : styles.cardLinkMeditation,
                      ]}
                    >
                      Pratiği aç →
                    </Text>
                  </View>
                </Pressable>
              );
            })
          )}
          </ScrollView>

          <PracticeBannerAd />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F7",
  },

  page: {
    flex: 1,
  },

  container: {
    padding: 20,
    paddingBottom: 28,
  },

  eyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0756F",
    letterSpacing: 0.8,
    marginBottom: 10,
  },

  title: {
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "700",
    color: "#2F2626",
    marginBottom: 10,
  },

  subtitle: {
    fontSize: 15,
    lineHeight: 23,
    color: "#5A4744",
    marginBottom: 22,
  },

  centerBox: {
    paddingVertical: 24,
    alignItems: "center",
    justifyContent: "center",
  },

  helperText: {
    marginTop: 10,
    fontSize: 14,
    color: "#7A615D",
  },

  emptyCard: {
    padding: 18,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DFDA",
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#2F2626",
    marginBottom: 8,
  },

  emptyText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5A4744",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#B98FA3",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  cardBreath: {
    borderColor: "#D9E7D8",
    backgroundColor: "#FCFFFB",
  },

  cardMeditation: {
    borderColor: "#E7D9EE",
    backgroundColor: "#FFFDFE",
  },

  cardPressed: {
    opacity: 0.94,
  },

  cover: {
    width: "100%",
    height: 190,
  },

  coverFallback: {
    width: "100%",
    height: 190,
    alignItems: "center",
    justifyContent: "center",
  },

  coverFallbackBreath: {
    backgroundColor: "#F1F8EF",
  },

  coverFallbackMeditation: {
    backgroundColor: "#F3ECFF",
  },

  coverFallbackText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6F55AA",
  },

  cardBody: {
    padding: 16,
  },

  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    gap: 12,
  },

  kindBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  kindBadgeBreath: {
    backgroundColor: "#F1F8EF",
    borderColor: "#D6E7D1",
  },

  kindBadgeMeditation: {
    backgroundColor: "#F5F1FB",
    borderColor: "#DDD4F2",
  },

  kindBadgeText: {
    fontSize: 12,
    fontWeight: "700",
  },

  kindBadgeTextBreath: {
    color: "#668A5F",
  },

  kindBadgeTextMeditation: {
    color: "#6F55AA",
  },

  durationText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#7A615D",
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2F2626",
    marginBottom: 6,
  },

  techniqueTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B0756F",
    marginBottom: 8,
  },

  cardSummary: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5A4744",
    marginBottom: 12,
  },

  cardLink: {
    fontSize: 15,
    fontWeight: "700",
  },

  cardLinkBreath: {
    color: "#668A5F",
  },

  cardLinkMeditation: {
    color: "#6F55AA",
  },

  emptyCardBreath: {
    borderColor: "#DCE9D7",
    backgroundColor: "#FCFFFB",
  },

  emptyCardMeditation: {
    borderColor: "#E7D9EE",
    backgroundColor: "#FFFDFE",
  },

  titleBreath: {
    color: "#2F4A34",
  },

  titleMeditation: {
    color: "#3F2F4E",
  },

  subtitleBreath: {
    color: "#58705B",
  },

  subtitleMeditation: {
    color: "#5E556A",
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
});