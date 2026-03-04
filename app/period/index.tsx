// app/period/index.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Calendar } from "react-native-calendars";
import AdBanner from "../../components/AdBanner";

import {
  formatDateTRFromISO,
  formatRangeTR,
  fromISODate,
  getCyclePhaseInfo,
  getNextPeriodStart,
  getOvulationInfo,
  isFutureISODate,
  parseTRDateToISO,
  toISODate,
} from "../../lib/cycle";

type DateObject = { dateString: string };

type PeriodLog = {
  startDate: string; // ISO (YYYY-MM-DD)
};

type PeriodSettings = {
  averageCycleLength: number;
  periodLength: number;
};

type CycleNotificationIds = {
  before?: string;
  start?: string;
};

type MoodLevel = "low" | "neutral" | "good" | "great";

type MoodDay = {
  mood?: MoodLevel;
  symptoms?: string[];
};

type MoodData = Record<string, MoodDay>;

const PERIOD_SETTINGS_KEY = "wellshe_period_settings";
const PERIOD_LOGS_KEY = "wellshe_period_logs";
const CYCLE_NOTIFICATION_IDS_KEY = "wellshe_cycle_notification_ids";
const MOOD_DATA_KEY = "wellshe_mood_data";

// 🧪 DEBUG: Prod’da bile görebilmek için gizli panel
const PERIOD_DEBUG_KEYS = [
  "wellshe_period_settings",
  "wellshe_period_logs",
  "period_settings",
  "periodSettings",
  "period_logs",
  "periodLogs",
];

function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ✅ Default ayarlar
const DEFAULT_SETTINGS: PeriodSettings = {
  averageCycleLength: 28,
  periodLength: 5,
};

function getMarkedDates(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): Record<string, any> {
  const marked: Record<string, any> = {};
  if (!settings) return marked;

  const periodLength = settings.periodLength;

  // Geçmiş regl günleri
  logs.forEach((log) => {
    const start = fromISODate(log.startDate);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = toISODate(d);
      marked[key] = {
        ...(marked[key] || {}),
        selected: true,
        selectedColor: "#FF6B81",
      };
    }
  });

  // Tahmini sonraki regl günleri
  const next = getNextPeriodStart(logs, settings);
  if (next) {
    const nextStart = fromISODate(next);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(nextStart);
      d.setDate(d.getDate() + i);
      const key = toISODate(d);
      if (!marked[key]) {
        marked[key] = { selected: true, selectedColor: "#C4A1FF" };
      }
    }
  }

  // Ovülasyon + verimli günler
  const ovInfo = getOvulationInfo(logs, settings);
  if (ovInfo.ovulationDate && ovInfo.windowStart && ovInfo.windowEnd) {
    const ws = fromISODate(ovInfo.windowStart);
    const we = fromISODate(ovInfo.windowEnd);

    for (
      let d = new Date(ws.getTime());
      d.getTime() <= we.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const key = toISODate(d);
      if (!marked[key]) {
        marked[key] = { selected: true, selectedColor: "#FFE3F0" };
      }
    }

    const ovKey = ovInfo.ovulationDate;
    marked[ovKey] = {
      ...(marked[ovKey] || {}),
      marked: true,
      dotColor: "#FF9EC4",
    };
  }

  return marked;
}

async function clearCycleNotifications() {
  try {
    const json = await AsyncStorage.getItem(CYCLE_NOTIFICATION_IDS_KEY);
    if (!json) return;

    const ids: CycleNotificationIds = JSON.parse(json);
    if (ids.before) {
      try {
        await Notifications.cancelScheduledNotificationAsync(ids.before);
      } catch (e) {
        console.log("before notification cancel error:", e);
      }
    }
    if (ids.start) {
      try {
        await Notifications.cancelScheduledNotificationAsync(ids.start);
      } catch (e) {
        console.log("start notification cancel error:", e);
      }
    }
  } catch (e) {
    console.log("clearCycleNotifications error:", e);
  } finally {
    await AsyncStorage.removeItem(CYCLE_NOTIFICATION_IDS_KEY);
  }
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  } catch (e) {
    console.log("ensureAndroidChannel error:", e);
  }
}

const MOOD_OPTIONS: { key: MoodLevel; label: string; emoji: string }[] = [
  { key: "low", label: "Düşük", emoji: "🌧️" },
  { key: "neutral", label: "Dengede", emoji: "🌤️" },
  { key: "good", label: "İyi", emoji: "🌞" },
  { key: "great", label: "Çok iyi", emoji: "✨" },
];

const SYMPTOMS = [
  "Karın ağrısı",
  "Bel ağrısı",
  "Baş ağrısı",
  "Şişkinlik",
  "Göğüs hassasiyeti",
  "Duygusal dalgalanma",
  "Enerji düşüklüğü",
  "Odaklanma zorluğu",
  "Bulantı",
  "Tatlı isteği",
];

function PeriodBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function PeriodScreen() {
  // ✅ 1) TÜM STATE’LER EN ÜSTTE (hook sırası garanti)
  const [settings, setSettings] = useState<PeriodSettings | null>(null);
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [moodData, setMoodData] = useState<MoodData>({});
  const [loading, setLoading] = useState(true);

  const [inputLastStartDate, setInputLastStartDate] = useState("");
  const [inputAverageCycle, setInputAverageCycle] = useState("28");
  const [inputPeriodLength, setInputPeriodLength] = useState("5");

  // 🧪 Debug panel state
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugDump, setDebugDump] = useState<string>("");

  const [titleTapCount, setTitleTapCount] = useState(0);
  const [titleTapTimer, setTitleTapTimer] = useState<any>(null);

  const todayKey = toISODate(new Date());
  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Hata", "Bağlantı açılamadı.");
    }
  };
  const todayMood = moodData[todayKey]?.mood;
  const todaySymptoms = moodData[todayKey]?.symptoms ?? [];

  const buildDebugDump = async () => {
    try {
      const pairs = await Promise.all(
        PERIOD_DEBUG_KEYS.map(async (k) => {
          const v = await AsyncStorage.getItem(k);
          return [k, v] as const;
        })
      );

      const existing = pairs.filter(([, v]) => !!v).map(([k]) => k);

      const settingsRaw =
        pairs.find(([k]) => k === PERIOD_SETTINGS_KEY)?.[1] ?? null;
      const logsRaw = pairs.find(([k]) => k === PERIOD_LOGS_KEY)?.[1] ?? null;

      const settingsParsed = safeJsonParse(settingsRaw);
      const logsParsed = safeJsonParse(logsRaw);

      const phase = getCyclePhaseInfo(logs, settings);
      const next = getNextPeriodStart(logs, settings);
      const ovu = getOvulationInfo(logs, settings);

      const payload = {
        now: new Date().toISOString(),
        keysFoundNonEmpty: existing,
        currentKeysExpected: {
          settingsKey: PERIOD_SETTINGS_KEY,
          logsKey: PERIOD_LOGS_KEY,
        },
        rawAtExpectedKeys: {
          settingsRaw,
          logsRaw,
        },
        parsedAtExpectedKeys: {
          settingsParsed,
          logsParsed,
        },
        inMemoryState: {
          settings,
          logs,
          inputLastStartDate,
          inputAverageCycle,
          inputPeriodLength,
        },
        computed: {
          phase,
          nextPeriodIso: next,
          nextPeriodTR: next ? formatDateTRFromISO(next) : null,
          ovulationInfo: ovu,
        },
        allKeysRaw: pairs.reduce((acc, [k, v]) => {
          acc[k] = v;
          return acc;
        }, {} as Record<string, string | null>),
      };

      setDebugDump(JSON.stringify(payload, null, 2));
    } catch (e: any) {
      setDebugDump(
        JSON.stringify(
          { error: e?.message ?? String(e), now: new Date().toISOString() },
          null,
          2
        )
      );
    }
  };

  const handleTitleSecretTap = () => {
    if (titleTapTimer) clearTimeout(titleTapTimer);

    const nextCount = titleTapCount + 1;
    setTitleTapCount(nextCount);

    const timer = setTimeout(() => {
      setTitleTapCount(0);
    }, 1200);

    setTitleTapTimer(timer);

    if (nextCount >= 7) {
      setTitleTapCount(0);
      clearTimeout(timer);
      setTitleTapTimer(null);

      void buildDebugDump();
      setDebugVisible(true);
    }
  };

  // ✅ settings storage garanti eden helper
  const ensureSettingsStored = async (): Promise<PeriodSettings> => {
    if (settings) return settings;

    try {
      const existing = await AsyncStorage.getItem(PERIOD_SETTINGS_KEY);
      if (existing) {
        const parsed: PeriodSettings = JSON.parse(existing);
        setSettings(parsed);
        setInputAverageCycle(String(parsed.averageCycleLength));
        setInputPeriodLength(String(parsed.periodLength));
        return parsed;
      }
    } catch {
      // ignore
    }

    setSettings(DEFAULT_SETTINGS);
    setInputAverageCycle(String(DEFAULT_SETTINGS.averageCycleLength));
    setInputPeriodLength(String(DEFAULT_SETTINGS.periodLength));
    await AsyncStorage.setItem(
      PERIOD_SETTINGS_KEY,
      JSON.stringify(DEFAULT_SETTINGS)
    );
    return DEFAULT_SETTINGS;
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [settingsJson, logsJson, moodJson] = await Promise.all([
          AsyncStorage.getItem(PERIOD_SETTINGS_KEY),
          AsyncStorage.getItem(PERIOD_LOGS_KEY),
          AsyncStorage.getItem(MOOD_DATA_KEY),
        ]);

        if (settingsJson) {
          const parsed: PeriodSettings = JSON.parse(settingsJson);
          setSettings(parsed);
          setInputAverageCycle(String(parsed.averageCycleLength));
          setInputPeriodLength(String(parsed.periodLength));
        } else {
          setSettings(DEFAULT_SETTINGS);
          setInputAverageCycle(String(DEFAULT_SETTINGS.averageCycleLength));
          setInputPeriodLength(String(DEFAULT_SETTINGS.periodLength));
          await AsyncStorage.setItem(
            PERIOD_SETTINGS_KEY,
            JSON.stringify(DEFAULT_SETTINGS)
          );
        }

        if (logsJson) {
          const parsedLogs: PeriodLog[] = JSON.parse(logsJson);
          setLogs(parsedLogs);
          if (parsedLogs.length > 0) {
            setInputLastStartDate(
              formatDateTRFromISO(parsedLogs[parsedLogs.length - 1].startDate)
            );
          }
        }

        if (moodJson) {
          const parsedMood: MoodData = JSON.parse(moodJson);
          setMoodData(parsedMood);
        }
      } catch (e) {
        console.log("Period data load error:", e);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const nextPeriod = useMemo(
    () => getNextPeriodStart(logs, settings),
    [logs, settings]
  );

  const ovulationInfo = useMemo(
    () => getOvulationInfo(logs, settings),
    [logs, settings]
  );

  const markedDates = useMemo(
    () => getMarkedDates(logs, settings),
    [logs, settings]
  );

  const phaseInfo = useMemo(
    () => getCyclePhaseInfo(logs, settings),
    [logs, settings]
  );

  const handleSaveSettings = async () => {
    if (!inputAverageCycle || !inputPeriodLength) {
      Alert.alert("Eksik bilgi", "Lütfen döngü süresi ve regl süresini gir.");
      return;
    }

    const avg = parseInt(inputAverageCycle, 10);
    const len = parseInt(inputPeriodLength, 10);

    if (isNaN(avg) || isNaN(len) || avg <= 0 || len <= 0) {
      Alert.alert(
        "Geçersiz değer",
        "Döngü süresi ve regl süresi pozitif sayı olmalı."
      );
      return;
    }

    const trimmedDate = inputLastStartDate.trim();
    let isoFromInput: string | null = null;

    if (trimmedDate !== "") {
      isoFromInput = parseTRDateToISO(trimmedDate);
      if (!isoFromInput) {
        Alert.alert(
          "Tarih formatı hatalı",
          "Lütfen tarihi 24.11.2025 şeklinde (GG.AA.YYYY) gir ya da takvimden seç."
        );
        return;
      }
      if (isFutureISODate(isoFromInput)) {
        Alert.alert(
          "Geçersiz tarih",
          "Son regl başlangıcı ileri bir tarih olamaz. Lütfen bugünü veya geçmiş bir günü gir."
        );
        return;
      }
    }

    const newSettings: PeriodSettings = {
      averageCycleLength: avg,
      periodLength: len,
    };
    setSettings(newSettings);
    await AsyncStorage.setItem(PERIOD_SETTINGS_KEY, JSON.stringify(newSettings));

    let effectiveLogs = logs;

    if (isoFromInput) {
      const logsArr: PeriodLog[] = [{ startDate: isoFromInput }];
      setLogs(logsArr);
      await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(logsArr));
      effectiveLogs = logsArr;
    }

    await scheduleCycleNotifications(effectiveLogs, newSettings, {
      silent: true,
    });
    Alert.alert("Kaydedildi", "Döngü ayarların güncellendi.");
  };

  const handleTodayStarted = async () => {
    const todayIso = toISODate(new Date());

    const effSettings = await ensureSettingsStored();

    const newLogs: PeriodLog[] = [{ startDate: todayIso }];
    setLogs(newLogs);
    setInputLastStartDate(formatDateTRFromISO(todayIso));
    await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(newLogs));

    await scheduleCycleNotifications(newLogs, effSettings, { silent: true });

    Alert.alert(
      "Kaydedildi",
      "Bugünü regl başlangıcı olarak işaretledin. Tahmini sonraki tarih ve bildirimler bu güne göre güncellendi."
    );
  };

  const handleCalendarDayPress = async (day: DateObject) => {
    try {
      const pickedIso = day.dateString;

      if (isFutureISODate(pickedIso)) {
        Alert.alert(
          "Geçersiz tarih",
          "Son regl başlangıcı ileri bir tarih olamaz. Lütfen bugünü veya geçmiş bir günü seç."
        );
        return;
      }

      const effSettings = await ensureSettingsStored();

      setInputLastStartDate(formatDateTRFromISO(pickedIso));

      const newLogs: PeriodLog[] = [{ startDate: pickedIso }];
      setLogs(newLogs);

      await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(newLogs));

      await scheduleCycleNotifications(newLogs, effSettings, { silent: true });
    } catch (e) {
      console.log("handleCalendarDayPress save error:", e);
      Alert.alert("Hata", "Tarih kaydedilemedi. Lütfen tekrar dene.");
    }
  };

  const scheduleCycleNotifications = async (
    baseLogs: PeriodLog[],
    baseSettings: PeriodSettings | null,
    options?: { silent?: boolean }
  ) => {
    const silent = options?.silent ?? false;

    try {
      if (!baseSettings || baseLogs.length === 0) {
        if (!silent) {
          Alert.alert(
            "Eksik bilgi",
            "Önce son regl başlangıcını ve döngü süreni kaydetmelisin."
          );
        }
        return;
      }

      const next = getNextPeriodStart(baseLogs, baseSettings);
      if (!next) {
        if (!silent) {
          Alert.alert(
            "Hesaplanamıyor",
            "Tahmini bir sonraki regl tarihi şimdilik hesaplanamıyor."
          );
        }
        return;
      }

      const nextDate = fromISODate(next);
      const now = new Date();

      if (nextDate <= now) {
        if (!silent) {
          Alert.alert(
            "Tarih geçmiş",
            "Tahmini regl tarihi geçmiş görünüyor. Lütfen son regl başlangıcını güncelle."
          );
        }
        return;
      }

      const beforeDate = new Date(nextDate);
      beforeDate.setDate(beforeDate.getDate() - 2);

      const existing = await Notifications.getPermissionsAsync();
      let finalStatus = existing.status;

      if (finalStatus !== "granted") {
        if (silent) return;
        const req = await Notifications.requestPermissionsAsync();
        finalStatus = req.status;
      }

      if (finalStatus !== "granted") {
        if (!silent) {
          Alert.alert(
            "İzin yok",
            "Bildirim gönderebilmem için bildirim izni vermen gerekiyor."
          );
        }
        return;
      }

      await ensureAndroidChannel();
      await clearCycleNotifications();

      const ids: CycleNotificationIds = {};

      if (beforeDate > now) {
        const beforeId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Reglin yaklaşıyor 🌸",
            body: "Regline 2 gün kaldı. Hazırlıklı olmak iyi gelebilir.",
            sound: false,
            ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: beforeDate,
          },
        });
        ids.before = beforeId;
      }

      const startId = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Bugün regl başlayabilir 🌙",
          body: "Döngünün yeni bir aşamasına giriyor olabilirsin. Bedenine kulak vermeyi unutma.",
          sound: false,
          ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: nextDate,
        },
      });
      ids.start = startId;

      await AsyncStorage.setItem(CYCLE_NOTIFICATION_IDS_KEY, JSON.stringify(ids));

      if (!silent) {
        Alert.alert(
          "Bildirimler ayarlandı",
          "Bu döngü için regl bildirimleri planlandı. Son regl tarihini güncellediğinde bildirimler otomatik olarak güncellenecek."
        );
      }
    } catch (e: any) {
      console.log("scheduleCycleNotifications error:", e);
      if (!silent) {
        Alert.alert(
          "Hata",
          e?.message
            ? `Bildirimler ayarlanamadı: ${e.message}`
            : "Bildirimler ayarlanamadı. Lütfen tekrar dene."
        );
      }
    }
  };

  const handleSelectMood = async (level: MoodLevel) => {
    setMoodData((prev) => {
      const next: MoodData = { ...prev };
      const day: MoodDay = next[todayKey] ?? {};
      day.mood = level;
      next[todayKey] = day;
      void AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleToggleSymptom = async (symptom: string) => {
    setMoodData((prev) => {
      const next: MoodData = { ...prev };
      const day: MoodDay = next[todayKey] ?? {};
      const currentList = day.symptoms ?? [];
      const exists = currentList.includes(symptom);
      const newList = exists
        ? currentList.filter((s) => s !== symptom)
        : [...currentList, symptom];
      day.symptoms = newList;
      next[todayKey] = day;
      void AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(next));
      return next;
    });
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Regl Takvimi" }} />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
      </>
    );
  }

  const lastStartIso = logs.length > 0 ? logs[logs.length - 1].startDate : null;

  const lastStartTR = lastStartIso ? formatDateTRFromISO(lastStartIso) : null;
  const nextPeriodTR = nextPeriod ? formatDateTRFromISO(nextPeriod) : null;
  const ovulationDateTR = ovulationInfo.ovulationDate
    ? formatDateTRFromISO(ovulationInfo.ovulationDate)
    : null;

  const fertileRangeTR =
    ovulationInfo.windowStart && ovulationInfo.windowEnd
      ? formatRangeTR(ovulationInfo.windowStart, ovulationInfo.windowEnd)
      : null;

  return (
    <>
      <Stack.Screen options={{ title: "Regl Takvimi" }} />

      <View style={styles.page}>
        {/* 🧪 DEBUG MODAL */}
        <Modal
          visible={debugVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setDebugVisible(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.45)",
              padding: 16,
              justifyContent: "center",
            }}
          >
            <View
              style={{
                backgroundColor: "#fff",
                borderRadius: 12,
                padding: 12,
                maxHeight: "85%",
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "800",
                  color: "#4A2E2A",
                  marginBottom: 8,
                }}
              >
                🧪 Period Debug Panel
              </Text>

              <View style={{ flexDirection: "row", gap: 8, marginBottom: 10 }}>
                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: "#B0756F",
                    alignItems: "center",
                  }}
                  onPress={() => buildDebugDump()}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Yenile
                  </Text>
                </Pressable>

                <Pressable
                  style={{
                    flex: 1,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: "#444",
                    alignItems: "center",
                  }}
                  onPress={() => setDebugVisible(false)}
                >
                  <Text style={{ color: "#fff", fontWeight: "800" }}>
                    Kapat
                  </Text>
                </Pressable>
              </View>

              <ScrollView
                style={{
                  borderWidth: 1,
                  borderColor: "#F3B6B3",
                  borderRadius: 10,
                  padding: 10,
                }}
              >
                <Text
                  style={{
                    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
                    fontSize: 12,
                    color: "#2b1a17",
                  }}
                >
                  {debugDump || "Debug verisi yok."}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <ScrollView contentContainerStyle={styles.content}>
          <Pressable onPress={handleTitleSecretTap}>
            <Text style={styles.pageTitle}>Regl Takvimi</Text>
          </Pressable>

          <Text style={styles.pageSubtitle}>
            Regl başlangıçlarını, modunu ve semptomlarını takip ederek bedeninle
            daha uyumlu bir ritim yakalayabilirsin.
          </Text>

          <Pressable
            style={styles.secondaryButton}
            onPress={() =>
              scheduleCycleNotifications(logs, settings, { silent: false })
            }
          >
            <Text style={styles.secondaryButtonText}>
              Döngün İçin Bildirimleri Aç
            </Text>
          </Pressable>

          <Text style={styles.helperText}>
            Bildirim iznin açıksa tahmini reglden 2 gün önce ve tahmini regl
            gününde hatırlatıcı alırsın.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Döngü Özeti</Text>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Son regl başlangıcın:</Text>
              <Text style={styles.summaryValue}>
                {lastStartTR ? lastStartTR : "Henüz kayıt yok"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Ortalama döngü süren:</Text>
              <Text style={styles.summaryValue}>
                {settings?.averageCycleLength ?? "-"} gün
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Regl süren:</Text>
              <Text style={styles.summaryValue}>
                {settings?.periodLength ?? "-"} gün
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>
                Tahmini bir sonraki regl başlangıcı:
              </Text>
              <Text style={styles.summaryValue}>
                {nextPeriodTR ? nextPeriodTR : "Henüz hesaplanamıyor"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tahmini ovülasyon günün:</Text>
              <Text style={styles.summaryValue}>
                {ovulationDateTR ?? "Henüz hesaplanamıyor"}
              </Text>
            </View>

            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Verimli günlerin:</Text>
              <Text style={styles.summaryValue}>
                {fertileRangeTR ? fertileRangeTR : "Henüz hesaplanamıyor"}
              </Text>
            </View>

            <Text style={styles.summaryNote}>
              Tahmini tarih ve verimli günler, son regl başlangıcın ve ortalama
              döngü süren üzerinden hesaplanır. Döngünü güncelledikçe bu alanlar
              da senin ritmine daha çok uyum sağlar.
            </Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Takvim Görünümü</Text>
            <Text style={styles.cardDescription}>
              Son regl başlangıcını takvimden de seçebilirsin. Geçmiş regl
              günlerin, tahmini regl dönemlerin ve verimli günlerin renklerle
              işaretlenir.
            </Text>

            <Calendar
              onDayPress={handleCalendarDayPress}
              markedDates={markedDates}
              maxDate={todayKey}
              theme={{
                todayTextColor: "#B0756F",
                arrowColor: "#B0756F",
              }}
            />
          </View>

          <Pressable style={styles.primaryButton} onPress={handleTodayStarted}>
            <Text style={styles.primaryButtonText}>Bugün Regl Başladı</Text>
          </Pressable>

          <Text style={styles.helperText}>
            Reglinin ilk gününde bu butona dokunarak döngünü güncellersin.
          </Text>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bugün Döngünün Fazı</Text>
            <Text style={styles.phaseTitle}>{phaseInfo.title}</Text>
            <Text style={styles.phaseText}>{phaseInfo.description}</Text>
            <Text style={styles.phaseSuggestion}>{phaseInfo.suggestion}</Text>
          </View>

          <View style={styles.card}>
  <Text style={styles.cardTitle}>Bilgilendirme & Kaynaklar</Text>

  <Text style={styles.summaryNote}>
    Bu sayfadaki döngü fazı, ovülasyon ve verimli günler hesaplamaları genel
    bilgilendirme amaçlıdır ve yalnızca tahmini sonuçlar üretir. Tıbbi
    teşhis/takip yerine geçmez. Doğum kontrol yöntemi olarak kullanılmamalıdır.
    Düzensizlik, şiddetli ağrı veya endişe durumunda bir uzmana danışmanı
    öneririz.
  </Text>

  <Text style={[styles.inputLabel, { marginTop: 10 }]}>Kaynaklar</Text>

  <Pressable
    onPress={() =>
      openUrl(
        "https://www.acog.org/womens-health/faqs/your-menstrual-cycle"
      )
    }
  >
    <Text style={styles.sourceLink}>• ACOG – Menstrual Cycle</Text>
  </Pressable>

  <Pressable
    onPress={() =>
      openUrl(
        "https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cycle/art-20047186"
      )
    }
  >
    <Text style={styles.sourceLink}>• Mayo Clinic – Menstrual cycle basics</Text>
  </Pressable>

  <Pressable onPress={() => openUrl("https://www.nhs.uk/conditions/periods/")}>
    <Text style={styles.sourceLink}>• NHS – Periods</Text>
  </Pressable>
</View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bugünkü Modun & Semptomların</Text>

            <Text style={styles.inputLabel}>Bugün modun nasıl?</Text>
            <View style={styles.moodRow}>
              {MOOD_OPTIONS.map((opt) => {
                const selected = todayMood === opt.key;
                return (
                  <Pressable
                    key={opt.key}
                    style={[
                      styles.moodChip,
                      selected && styles.moodChipSelected,
                      opt.key === "low" &&
                        selected && { backgroundColor: "#FAD4D4" },
                      opt.key === "neutral" &&
                        selected && { backgroundColor: "#FFE8C2" },
                      opt.key === "good" &&
                        selected && { backgroundColor: "#D4F5D6" },
                      opt.key === "great" &&
                        selected && { backgroundColor: "#E9D8FF" },
                    ]}
                    onPress={() => handleSelectMood(opt.key)}
                  >
                    <Text
                      style={[
                        styles.moodChipText,
                        selected && styles.moodChipTextSelected,
                      ]}
                    >
                      {opt.emoji} {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Text style={[styles.inputLabel, { marginTop: 10 }]}>
              Bugün bedeninde neler var?
            </Text>

            <View style={styles.symptomContainer}>
              {SYMPTOMS.map((symptom) => {
                const selected = todaySymptoms.includes(symptom);
                return (
                  <Pressable
                    key={symptom}
                    style={[
                      styles.symptomChip,
                      selected && styles.symptomChipSelected,
                    ]}
                    onPress={() => handleToggleSymptom(symptom)}
                  >
                    <Text
                      style={[
                        styles.symptomChipText,
                        selected && styles.symptomChipTextSelected,
                      ]}
                    >
                      {symptom}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Döngü Ayarların</Text>

            <Text style={styles.inputLabel}>Son regl başlangıcın</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 24.11.2025"
              value={inputLastStartDate}
              onChangeText={setInputLastStartDate}
            />

            <Text style={styles.inputLabel}>Ortalama döngü süren (gün)</Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 28"
              keyboardType="number-pad"
              value={inputAverageCycle}
              onChangeText={setInputAverageCycle}
            />

            <Text style={styles.inputLabel}>
              Reglin ortalama kaç gün sürüyor?
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Örn: 5"
              keyboardType="number-pad"
              value={inputPeriodLength}
              onChangeText={setInputPeriodLength}
            />

            <Pressable
              style={styles.secondaryButton}
              onPress={handleSaveSettings}
            >
              <Text style={styles.secondaryButtonText}>Ayarları Kaydet</Text>
            </Pressable>
          </View>
        </ScrollView>

        <PeriodBannerAd />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#FFF7F3" },
  content: { padding: 16, paddingBottom: 32 },
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#4A2E2A", fontSize: 16 },

  pageTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 8,
  },
  pageSubtitle: { fontSize: 13, color: "#5A3A35", marginBottom: 16 },

  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 8,
  },
  cardDescription: { fontSize: 13, color: "#5A3A35", marginBottom: 10 },

  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  summaryLabel: { fontSize: 13, color: "#5A3A35", flex: 1.2, paddingRight: 8 },
  summaryValue: {
    fontSize: 13,
    color: "#4A2E2A",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  summaryNote: { marginTop: 8, fontSize: 12, color: "#887473" },

  primaryButton: {
    marginTop: 4,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "#B0756F",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },

  helperText: {
    fontSize: 12,
    color: "#887473",
    marginTop: 4,
    marginBottom: 8,
  },

  inputLabel: {
    fontSize: 13,
    color: "#5A3A35",
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: "#F3B6B3",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: "#4A2E2A",
  },

  secondaryButton: {
    marginTop: 6,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#b86e65ff",
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonText: { color: "#f0ededff", fontSize: 15, fontWeight: "600" },

  moodRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  moodChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    backgroundColor: "#FFF7F3",
  },
  moodChipSelected: { borderColor: "#B0756F" },
  moodChipText: { fontSize: 12, color: "#5A3A35" },
  moodChipTextSelected: { fontWeight: "700", color: "#4A2E2A" },

  symptomContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 6,
  },
  symptomChip: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    backgroundColor: "#FFFFFF",
  },
  symptomChipSelected: { backgroundColor: "#FCE8E4", borderColor: "#B0756F" },
  symptomChipText: { fontSize: 12, color: "#5A3A35" },
  symptomChipTextSelected: { fontWeight: "600", color: "#4A2E2A" },

  phaseTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#B0756F",
    marginBottom: 4,
  },
  phaseText: { fontSize: 13, color: "#5A3A35", marginBottom: 6 },
  phaseSuggestion: { fontSize: 12, color: "#887473" },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },

    sourceLink: {
    color: "#B0756F",
    fontWeight: "700",
    marginBottom: 6,
  },
});
