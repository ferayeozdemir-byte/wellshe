// app/practices/player/[id].tsx

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ImageBackground,
  PanResponder,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdBanner from "../../../components/AdBanner";

import { resolveAssetUrl, sbGetMany } from "../../../lib/supabase";

const meditationPlayerBg = require("../../../assets/images/practices/player-meditation-bg.png");
const breathPlayerBg = require("../../../assets/images/practices/player-breath-bg.png");
const lotusImage = require("../../../assets/images/logo/lotus.png");

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
  audio_asset?: {
    bucket: string | null;
    path: string | null;
    content_type: string | null;
    storage_provider?: string | null;
    storage_key?: string | null;
    public_url?: string | null;
  } | null;
};

const THEMES = {
  meditation: {
    pageBg: "#F8F1F5",
    title: "#2F2732",
    subtitle: "#6A5B6D",
    accent: "#B995E2",
    accentSoft: "#E5D4F8",
    centerBg: "rgba(233, 217, 248, 0.88)",
    centerGlow: "rgba(185, 149, 226, 0.18)",
    ring: "#DDBEF3",
    seekTrack: "rgba(255,255,255,0.72)",
    seekFill: "#B995E2",
    buttonBg: "rgba(255,255,255,0.92)",
    buttonIcon: "#6A4A9A",
    backBg: "rgba(255,255,255,0.84)",
    backBorder: "rgba(210, 193, 221, 0.55)",
  },
  breath: {
    pageBg: "#F5F3EF",
    title: "#2F352F",
    subtitle: "#627062",
    accent: "#8DB89C",
    accentSoft: "#D6E9DB",
    centerBg: "rgba(221, 235, 223, 0.90)",
    centerGlow: "rgba(141, 184, 156, 0.16)",
    ring: "#BCD6C4",
    seekTrack: "rgba(255,255,255,0.72)",
    seekFill: "#8DB89C",
    buttonBg: "rgba(255,255,255,0.94)",
    buttonIcon: "#567360",
    backBg: "rgba(255,255,255,0.86)",
    backBorder: "rgba(191, 208, 196, 0.55)",
  },
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function formatClock(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function formatShortSeconds(ms: number) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  return `${totalSeconds} sn`;
}

function PracticePlayerBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function PracticePlayerScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string; kind?: string }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  const initialKind: PracticeKind =
    params.kind === "breath" ? "breath" : "meditation";

  const soundRef = useRef<Audio.Sound | null>(null);
  const soundLoadingRef = useRef<Promise<Audio.Sound | null> | null>(null);
  const activeAudioUrlRef = useRef<string | null>(null);
  const isSeekingRef = useRef(false);

  const practiceRef = useRef<PracticeRow | null>(null);
  const idRef = useRef<string | null>(id ?? null);
  const kindRef = useRef<PracticeKind>(initialKind);

  const didTrackPlayerOpenRef = useRef(false);
  const sessionStartedAtRef = useRef(Date.now());
  const listenedMsRef = useRef(0);
  const playStartedAtRef = useRef<number | null>(null);
  const completedRef = useRef(false);
  const sessionEndSentRef = useRef(false);

  const durationMsRef = useRef(1);
  const positionMsRef = useRef(0);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [practice, setPractice] = useState<PracticeRow | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const [durationMs, setDurationMs] = useState(1);
  const [positionMs, setPositionMs] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [seekWidth, setSeekWidth] = useState(1);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekRatio, setSeekRatio] = useState(0);

  const resolvedKind: PracticeKind =
    practice?.kind === "breath" || initialKind === "breath"
      ? "breath"
      : "meditation";

  const theme = THEMES[resolvedKind];
  const playerBackground =
    resolvedKind === "breath" ? breathPlayerBg : meditationPlayerBg;

  const progress = isSeeking
    ? seekRatio
    : clamp(positionMs / Math.max(durationMs, 1), 0, 1);

  const shownPosition = isSeeking
    ? Math.round(seekRatio * durationMs)
    : positionMs;

  const remainingMs = Math.max(durationMs - shownPosition, 0);

  const durationTrackingMeta = useMemo(
    () => ({
      kind: resolvedKind,
      practice_id: id ?? "",
      practice_title: practice?.title ?? "",
      technique_title: practice?.technique_title ?? "",
      default_duration_seconds: practice?.default_duration_seconds ?? 0,
    }),
    [
      id,
      resolvedKind,
      practice?.title,
      practice?.technique_title,
      practice?.default_duration_seconds,
    ]
  );

  useTrackScreenDuration({
    screen_name: "practice_player",
    feature_name: "practice_player_duration",
    article_id: id ?? null,
    article_title: practice?.title ?? null,
    meta: durationTrackingMeta,
  });

  useEffect(() => {
    idRef.current = id ?? null;
    kindRef.current = resolvedKind;
  }, [id, resolvedKind]);

  useEffect(() => {
    practiceRef.current = practice;
  }, [practice]);

  useEffect(() => {
    durationMsRef.current = durationMs;
  }, [durationMs]);

  useEffect(() => {
    positionMsRef.current = positionMs;
  }, [positionMs]);

  useEffect(() => {
    didTrackPlayerOpenRef.current = false;
    sessionStartedAtRef.current = Date.now();
    listenedMsRef.current = 0;
    playStartedAtRef.current = null;
    completedRef.current = false;
    sessionEndSentRef.current = false;
    positionMsRef.current = 0;
  }, [id]);

  const updateListeningTime = useCallback(() => {
    const startedAt = playStartedAtRef.current;
    if (!startedAt) return;

    listenedMsRef.current += Math.max(0, Date.now() - startedAt);
    playStartedAtRef.current = null;
  }, []);

  const getProgressPercent = useCallback(() => {
    const total = Math.max(durationMsRef.current, 1);
    return Math.round(clamp(positionMsRef.current / total, 0, 1) * 100);
  }, []);

  const buildTrackingMeta = useCallback(
    (extra?: Record<string, unknown>) => {
      const currentPractice = practiceRef.current;
      const currentDurationMs = Math.max(durationMsRef.current, 1);
      const currentPositionMs = Math.max(positionMsRef.current, 0);
      const activeListeningMs = playStartedAtRef.current
        ? Math.max(0, Date.now() - playStartedAtRef.current)
        : 0;

      return {
        kind: currentPractice?.kind ?? kindRef.current,
        practice_id: currentPractice?.id ?? idRef.current ?? "",
        practice_title: currentPractice?.title ?? "",
        technique_title: currentPractice?.technique_title ?? "",
        default_duration_seconds:
          currentPractice?.default_duration_seconds ?? 0,
        duration_seconds: Math.round(currentDurationMs / 1000),
        position_seconds: Math.round(currentPositionMs / 1000),
        listened_seconds: Math.round(
          (listenedMsRef.current + activeListeningMs) / 1000
        ),
        progress_percent: getProgressPercent(),
        has_audio: !!activeAudioUrlRef.current,
        ...(extra ?? {}),
      };
    },
    [getProgressPercent]
  );

  const trackPracticeFeature = useCallback(
    (featureName: string, extra?: Record<string, unknown>) => {
      const currentPractice = practiceRef.current;

      void trackEvent({
        event_name: "feature_used",
        screen_name: "practice_player",
        feature_name: featureName,
        article_id: currentPractice?.id ?? idRef.current ?? null,
        article_title: currentPractice?.title ?? null,
        meta: buildTrackingMeta(extra),
      });
    },
    [buildTrackingMeta]
  );

  useEffect(() => {
    if (!practice || didTrackPlayerOpenRef.current) return;

    didTrackPlayerOpenRef.current = true;

    void trackEvent({
      event_name: "screen_view",
      screen_name: "practice_player",
      feature_name: "practice_player_open",
      article_id: practice.id,
      article_title: practice.title ?? null,
      meta: buildTrackingMeta({
        kind: practice.kind,
        practice_id: practice.id,
        practice_title: practice.title ?? "",
        technique_title: practice.technique_title ?? "",
        has_audio: !!audioUrl,
      }),
    });
  }, [practice, audioUrl, buildTrackingMeta]);

  useEffect(() => {
    return () => {
      updateListeningTime();

      if (!sessionEndSentRef.current) {
        sessionEndSentRef.current = true;

        trackPracticeFeature("practice_session_end", {
          exit_reason: completedRef.current ? "completed" : "unmount",
        });
      }
    };
  }, [trackPracticeFeature, updateListeningTime]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      if (!id) {
        setErr("Pratik id bulunamadı.");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setErr(null);

        const rows = await sbGetMany<PracticeRow>(
          `/breathing_practices` +
            `?select=` +
            `id,status,kind,title,technique_title,summary,cover_asset_id,audio_asset_id,default_duration_seconds,sort_order,accent_color,is_featured,slug,` +
            `audio_asset:assets!breathing_practices_audio_asset_id_fkey(bucket,path,content_type,storage_provider,storage_key,public_url)` +
            `&id=eq.${encodeURIComponent(id)}` +
            `&limit=1`
        );

        const item = rows?.[0] ?? null;
        if (!item) throw new Error("Pratik bulunamadı.");

        const resolvedAudioUrl = resolveAssetUrl(item.audio_asset);

        if (!mounted) return;

        setPractice(item);
        setAudioUrl(resolvedAudioUrl);

        const fallbackDuration = Math.max(
          1,
          (item.default_duration_seconds || 1) * 1000
        );

        durationMsRef.current = fallbackDuration;
        positionMsRef.current = 0;

        setDurationMs(fallbackDuration);
        setPositionMs(0);
        setIsPlaying(false);
      } catch (e: any) {
        if (!mounted) return;
        setErr(e?.message || "Pratik yüklenemedi.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    activeAudioUrlRef.current = audioUrl;
    soundLoadingRef.current = null;
    setIsPlaying(false);
    setPositionMs(0);
    positionMsRef.current = 0;
    playStartedAtRef.current = null;

    if (soundRef.current) {
      const currentSound = soundRef.current;
      soundRef.current = null;
      currentSound.unloadAsync().catch(() => {});
    }

    return () => {
      activeAudioUrlRef.current = null;
      soundLoadingRef.current = null;
      updateListeningTime();

      if (soundRef.current) {
        const currentSound = soundRef.current;
        soundRef.current = null;
        currentSound.unloadAsync().catch(() => {});
      }
    };
  }, [audioUrl, updateListeningTime]);

  const commitSeek = useCallback(
    async (ratio: number) => {
      const nextRatio = clamp(ratio, 0, 1);
      const nextMs = Math.round(nextRatio * durationMs);

      setSeekRatio(nextRatio);
      setPositionMs(nextMs);
      positionMsRef.current = nextMs;

      if (soundRef.current) {
        try {
          await soundRef.current.setPositionAsync(nextMs);
        } catch {}
      }
    },
    [durationMs]
  );

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,

        onPanResponderGrant: (evt) => {
          isSeekingRef.current = true;
          setIsSeeking(true);
          const ratio = clamp(evt.nativeEvent.locationX / seekWidth, 0, 1);
          setSeekRatio(ratio);
        },

        onPanResponderMove: (evt) => {
          const ratio = clamp(evt.nativeEvent.locationX / seekWidth, 0, 1);
          setSeekRatio(ratio);
        },

        onPanResponderRelease: async () => {
          const finalRatio = seekRatio;
          setIsSeeking(false);
          isSeekingRef.current = false;
          await commitSeek(finalRatio);

          trackPracticeFeature("practice_seek", {
            seek_to_percent: Math.round(clamp(finalRatio, 0, 1) * 100),
          });
        },

        onPanResponderTerminate: async () => {
          const finalRatio = seekRatio;
          setIsSeeking(false);
          isSeekingRef.current = false;
          await commitSeek(finalRatio);

          trackPracticeFeature("practice_seek", {
            seek_to_percent: Math.round(clamp(finalRatio, 0, 1) * 100),
          });
        },
      }),
    [seekRatio, seekWidth, commitSeek, trackPracticeFeature]
  );

  async function ensureSoundLoaded() {
    if (soundRef.current) {
      return soundRef.current;
    }

    if (soundLoadingRef.current) {
      return soundLoadingRef.current;
    }

    if (!audioUrl) {
      Alert.alert("Hata", "Ses dosyası bulunamadı.");
      return null;
    }

    const targetAudioUrl = audioUrl;

    const loadingPromise: Promise<Audio.Sound | null> = (async () => {
      const sound = new Audio.Sound();

      await sound.loadAsync(
        { uri: targetAudioUrl },
        {
          shouldPlay: false,
          progressUpdateIntervalMillis: 250,
        }
      );

      if (activeAudioUrlRef.current !== targetAudioUrl) {
        await sound.unloadAsync().catch(() => {});
        return null;
      }

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        const nextPositionMs = status.positionMillis ?? 0;

        if (!isSeekingRef.current) {
          positionMsRef.current = nextPositionMs;
          setPositionMs(nextPositionMs);
        }

        if (typeof status.durationMillis === "number") {
          durationMsRef.current = status.durationMillis;
          setDurationMs(status.durationMillis);
        }

        if (status.isPlaying) {
          if (!playStartedAtRef.current) {
            playStartedAtRef.current = Date.now();
          }
        } else {
          updateListeningTime();
        }

        setIsPlaying(status.isPlaying ?? false);

        if (status.didJustFinish) {
          updateListeningTime();

          const finalDurationMs =
            typeof status.durationMillis === "number"
              ? status.durationMillis
              : durationMsRef.current;

          durationMsRef.current = finalDurationMs;
          positionMsRef.current = finalDurationMs;

          setIsPlaying(false);
          setPositionMs(finalDurationMs);

          if (!completedRef.current) {
            completedRef.current = true;

            trackPracticeFeature("practice_audio_complete", {
              completion_source: "playback_status",
            });

            if (!sessionEndSentRef.current) {
              sessionEndSentRef.current = true;

              trackPracticeFeature("practice_session_end", {
                exit_reason: "completed",
              });
            }
          }
        }
      });

      soundRef.current = sound;
      return sound;
    })();

    soundLoadingRef.current = loadingPromise;

    try {
      return await loadingPromise;
    } finally {
      if (soundLoadingRef.current === loadingPromise) {
        soundLoadingRef.current = null;
      }
    }
  }

  async function togglePlayPause() {
    try {
      const sound = await ensureSoundLoaded();
      if (!sound) return;

      const status = await sound.getStatusAsync();
      if (!status.isLoaded) return;

      if (status.isPlaying) {
        await sound.pauseAsync();
        updateListeningTime();

        trackPracticeFeature("practice_audio_pause", {
          pause_source: "main_button",
        });

        return;
      }

      const currentDurationMs =
        typeof status.durationMillis === "number"
          ? status.durationMillis
          : durationMs;

      if (positionMs >= currentDurationMs - 250) {
        await sound.setPositionAsync(0);
        positionMsRef.current = 0;
        setPositionMs(0);
        completedRef.current = false;
        sessionEndSentRef.current = false;
      } else if (positionMs > 0) {
        await sound.setPositionAsync(positionMs);
      }

      if (!playStartedAtRef.current) {
        playStartedAtRef.current = Date.now();
      }

      trackPracticeFeature("practice_audio_play", {
        play_source: "main_button",
      });

      await sound.playAsync();
    } catch (e: any) {
      Alert.alert("Hata", e?.message || "Oynatma işlemi başarısız oldu.");
    }
  }

  async function seekBy(deltaMs: number) {
    const nextMs = clamp(shownPosition + deltaMs, 0, durationMs);

    setPositionMs(nextMs);
    positionMsRef.current = nextMs;

    try {
      await soundRef.current?.setPositionAsync(nextMs);

      trackPracticeFeature("practice_seek", {
        seek_delta_seconds: Math.round(deltaMs / 1000),
      });
    } catch {}
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <ImageBackground
          source={playerBackground}
          resizeMode="cover"
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageInner}
        >
          <View style={styles.overlay}>
            <View style={styles.centerState}>
              <ActivityIndicator size="large" color={theme.accent} />
              <Text style={[styles.centerStateText, { color: theme.subtitle }]}>
                Pratik yükleniyor...
              </Text>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  if (err || !practice) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Stack.Screen options={{ headerShown: false }} />
        <ImageBackground
          source={playerBackground}
          resizeMode="cover"
          style={styles.backgroundImage}
          imageStyle={styles.backgroundImageInner}
        >
          <View style={styles.overlay}>
            <View style={styles.centerState}>
              <Text style={[styles.errorTitle, { color: theme.title }]}>
                Bir sorun oluştu
              </Text>
              <Text style={[styles.centerStateText, { color: theme.subtitle }]}>
                {err || "Pratik bulunamadı."}
              </Text>

              <Pressable
                onPress={() => router.back()}
                style={[styles.backInline, { backgroundColor: theme.buttonBg }]}
              >
                <Text
                  style={[styles.backInlineText, { color: theme.buttonIcon }]}
                >
                  Geri dön
                </Text>
              </Pressable>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ headerShown: false }} />
      <ImageBackground
        source={playerBackground}
        resizeMode="cover"
        style={styles.backgroundImage}
        imageStyle={styles.backgroundImageInner}
      >
        <View style={styles.overlay}>
          <View style={styles.topBar}>
            <Pressable
              onPress={() => router.back()}
              style={[
                styles.backCircle,
                {
                  backgroundColor: theme.backBg,
                  borderColor: theme.backBorder,
                },
              ]}
            >
              <Ionicons name="chevron-back" size={26} color={theme.title} />
            </Pressable>
          </View>

          <View style={styles.content}>
            <View style={styles.heroWrap}>
              <View
                style={[styles.heroGlow, { backgroundColor: theme.centerGlow }]}
              />
              <View style={[styles.heroRing, { borderColor: theme.ring }]} />
              <View
                style={[styles.heroInner, { backgroundColor: theme.centerBg }]}
              />
              <Image
                source={lotusImage}
                style={styles.lotusImage}
                resizeMode="contain"
              />
            </View>

            <Text style={[styles.smallRemaining, { color: theme.accent }]}>
              {formatShortSeconds(remainingMs)}
            </Text>

            <Text
              style={[
                styles.bigRemaining,
                {
                  color: theme.buttonIcon,
                  textShadowColor: theme.centerGlow,
                },
              ]}
            >
              {formatClock(remainingMs)}
            </Text>

            <View style={styles.seekWrap}>
              <View
                style={styles.seekArea}
                onLayout={(e) => setSeekWidth(e.nativeEvent.layout.width)}
                {...panResponder.panHandlers}
              >
                <View
                  style={[
                    styles.seekTrack,
                    { backgroundColor: theme.seekTrack },
                  ]}
                />
                <View
                  style={[
                    styles.seekFill,
                    {
                      width: `${progress * 100}%`,
                      backgroundColor: theme.seekFill,
                    },
                  ]}
                />
                <View
                  style={[
                    styles.seekThumb,
                    {
                      left: progress * seekWidth - 12,
                      backgroundColor: theme.buttonBg,
                      borderColor: theme.seekFill,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.controlsRow}>
              <Pressable
                onPress={() => seekBy(-10_000)}
                style={[styles.sideButton, { backgroundColor: theme.buttonBg }]}
              >
                <Ionicons
                  name="play-back"
                  size={28}
                  color={theme.buttonIcon}
                />
              </Pressable>

              <Pressable
                onPress={togglePlayPause}
                style={[styles.mainButton, { backgroundColor: theme.buttonBg }]}
              >
                <Ionicons
                  name={isPlaying ? "pause" : "play"}
                  size={34}
                  color={theme.buttonIcon}
                  style={!isPlaying ? { marginLeft: 2 } : undefined}
                />
              </Pressable>

              <Pressable
                onPress={() => seekBy(10_000)}
                style={[styles.sideButton, { backgroundColor: theme.buttonBg }]}
              >
                <Ionicons
                  name="play-forward"
                  size={28}
                  color={theme.buttonIcon}
                />
              </Pressable>
            </View>

            <PracticePlayerBannerAd />
          </View>
        </View>
      </ImageBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  backgroundImage: {
    flex: 1,
  },

  backgroundImageInner: {
    resizeMode: "cover",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },

  centerState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
  },

  centerStateText: {
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 22,
    fontWeight: "800",
    marginBottom: 8,
  },

  backInline: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 999,
  },

  backInlineText: {
    fontSize: 15,
    fontWeight: "700",
  },

  topBar: {
    paddingHorizontal: 18,
    paddingTop: 8,
    alignItems: "flex-start",
  },

  backCircle: {
    width: 50,
    height: 50,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },

  content: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 22,
    paddingTop: 8,
    paddingBottom: 24,
  },

  mainTitle: {
    marginTop: 8,
    fontSize: 27,
    fontWeight: "800",
    textAlign: "center",
  },

  techniqueTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "500",
    textAlign: "center",
  },

  heroWrap: {
    width: 252,
    height: 252,
    marginTop: 18,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  heroGlow: {
    position: "absolute",
    width: 204,
    height: 204,
    borderRadius: 999,
  },

  heroRing: {
    position: "absolute",
    width: 252,
    height: 252,
    borderRadius: 999,
    borderWidth: 7,
  },

  heroInner: {
    position: "absolute",
    width: 156,
    height: 156,
    borderRadius: 999,
  },

  lotusImage: {
    width: 96,
    height: 96,
  },

  smallRemaining: {
    marginTop: 8,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },

  bigRemaining: {
    marginTop: 4,
    fontSize: 60,
    lineHeight: 66,
    fontWeight: "800",
    letterSpacing: -1,
    textAlign: "center",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 16,
  },

  seekWrap: {
    width: "100%",
    marginTop: 22,
    alignItems: "center",
  },

  seekArea: {
    width: "82%",
    height: 34,
    justifyContent: "center",
  },

  seekTrack: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 14,
    borderRadius: 999,
  },

  seekFill: {
    position: "absolute",
    left: 0,
    height: 14,
    borderRadius: 999,
  },

  seekThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 999,
    top: 5,
    borderWidth: 2,
  },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    marginTop: 28,
  },

  sideButton: {
    width: 70,
    height: 70,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },

  mainButton: {
    width: 94,
    height: 94,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },

  adContainer: {
    width: "100%",
    marginTop: 22,
    paddingHorizontal: 8,
    alignItems: "center",
  },
});