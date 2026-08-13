// app/period/index.tsx

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
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
  getCyclePhaseInfo,
  getNextPeriodStart,
  getOvulationInfo,
  isFutureISODate,
  parseTRDateToISO,
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
  late1?: string;
  late7?: string;
};

type MoodLevel = "low" | "neutral" | "good" | "great";

type MoodDay = {
  mood?: MoodLevel;
  symptoms?: string[];
};

type MoodData = Record<string, MoodDay>;

type LateState = {
  isLate: boolean;
  lateDays: number;
  predictedStartIso: string | null;
  shouldShowPregnancyNote: boolean;
};

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

// ✅ Default ayarlar
const DEFAULT_SETTINGS: PeriodSettings = {
  averageCycleLength: 28,
  periodLength: 5,
};

const LATE_REMINDER_DAYS = 1;
const PREGNANCY_CHECK_REMINDER_DAYS = 7;

const COLORS = {
  bg: "#FFF8F5",
  text: "#4A2E2A",
  textSoft: "#6D5854",
  textMuted: "#8B7772",
  border: "#F2DFD8",
  card: "#FFFFFF",
  primary: "#D77878",
  primaryDark: "#B75F61",
  period: "#FF7D8E",
  fertile: "#FFE6F0",
  ovulation: "#FF98BA",
  today: "#CDA6A6",
  chip: "#FFF3F0",
  heroBg: "#FFF0EC",
  lateBg: "#FFF4F1",
};

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

function safeJsonParse<T = any>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function fromLocalISODate(iso: string, hour = 12) {
  const [year, month, day] = iso.split("-").map(Number);
  return new Date(year, month - 1, day, hour, 0, 0, 0);
}

function toLocalISODate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLocalISODateTR(iso: string) {
  const [year, month, day] = iso.split("-");
  return `${day}.${month}.${year}`;
}

function formatLocalRangeTR(startIso: string, endIso: string) {
  return `${formatLocalISODateTR(startIso)}\n${formatLocalISODateTR(endIso)}`;
}

function differenceInDays(a: Date, b: Date) {
  const aCopy = new Date(a);
  const bCopy = new Date(b);
  aCopy.setHours(0, 0, 0, 0);
  bCopy.setHours(0, 0, 0, 0);
  return Math.round((aCopy.getTime() - bCopy.getTime()) / 86400000);
}

function sortLogs(logs: PeriodLog[]) {
  return [...logs].sort((a, b) => a.startDate.localeCompare(b.startDate));
}

function normalizeLogs(logs: PeriodLog[]) {
  const seen = new Set<string>();
  const unique = sortLogs(
    logs.filter((log) => {
      if (!log?.startDate || seen.has(log.startDate)) return false;
      seen.add(log.startDate);
      return true;
    })
  );
  return unique;
}

const MIN_TYPICAL_CYCLE_DAYS = 21;

type PeriodStartConflict =
  | {
      kind: "duplicate";
      relatedStartDate: string;
      distanceDays: 0;
    }
  | {
      kind: "inside_existing_period";
      relatedStartDate: string;
      distanceDays: number;
    }
  | {
      kind: "too_close";
      relatedStartDate: string;
      distanceDays: number;
    };

/**
 * Takvimden yeni bir regl başlangıcı eklerken mevcut geçmişi korur.
 * Bu fonksiyon hiçbir eski kaydı silmez veya başka tarihle değiştirmez.
 */
function addPeriodStartLog(logs: PeriodLog[], startDate: string): PeriodLog[] {
  return normalizeLogs([...logs, { startDate }]);
}

/**
 * Takvimde dokunulan gün gerçek bir regl kaydının boyanan aralığına denk geliyor mu?
 * Bir regl kaydı `startDate` ile temsil edildiği için, dönemin herhangi bir kırmızı
 * gününe dokunulduğunda ilgili başlangıç kaydını buluruz.
 */
function findPeriodLogForDate(
  logs: PeriodLog[],
  dateIso: string,
  periodLength: number
): PeriodLog | null {
  const normalized = normalizeLogs(logs);
  const target = fromLocalISODate(dateIso);

  for (let i = normalized.length - 1; i >= 0; i--) {
    const log = normalized[i];
    const start = fromLocalISODate(log.startDate);
    const dayOffset = differenceInDays(target, start);

    if (dayOffset >= 0 && dayOffset < Math.max(periodLength, 1)) {
      return log;
    }
  }

  return null;
}

/**
 * Belirli bir regl başlangıcını düzenler. Diğer tüm geçmiş kayıtlar aynen korunur.
 */
function replacePeriodStartLog(
  logs: PeriodLog[],
  originalStartDate: string,
  nextStartDate: string
): PeriodLog[] {
  const normalized = normalizeLogs(logs);
  const replaced = normalized.map((log) =>
    log.startDate === originalStartDate
      ? { ...log, startDate: nextStartDate }
      : log
  );

  return normalizeLogs(replaced);
}

/**
 * Yalnızca seçilen regl başlangıç kaydını siler.
 */
function removePeriodStartLog(
  logs: PeriodLog[],
  startDate: string
): PeriodLog[] {
  return normalizeLogs(logs).filter((log) => log.startDate !== startDate);
}

/**
 * Yeni bir regl başlangıcının mevcut kayıtlarla çakışıp çakışmadığını kontrol eder.
 *
 * - Aynı gün zaten kayıtlıysa tekrar eklenmez.
 * - Mevcut regl döneminin içine düşüyorsa yeni başlangıç sayılmaz.
 * - Başka bir regl başlangıcına 21 günden daha yakınsa kullanıcıdan açık onay isteriz.
 *
 * `ignoreStartDate`, "son regl başlangıcı" alanından mevcut son kaydı düzeltirken
 * o kaydın kendi kendisiyle çakışmasını engellemek için kullanılır.
 */
function getPeriodStartConflict(
  logs: PeriodLog[],
  startDate: string,
  periodLength: number,
  ignoreStartDate?: string
): PeriodStartConflict | null {
  const normalized = normalizeLogs(logs).filter(
    (log) => log.startDate !== ignoreStartDate
  );
  const target = fromLocalISODate(startDate);

  let closestTooClose: PeriodStartConflict | null = null;

  for (const log of normalized) {
    const existingStart = fromLocalISODate(log.startDate);
    const signedDiff = differenceInDays(target, existingStart);
    const distanceDays = Math.abs(signedDiff);

    if (distanceDays === 0) {
      return {
        kind: "duplicate",
        relatedStartDate: log.startDate,
        distanceDays: 0,
      };
    }

    if (signedDiff > 0 && signedDiff < Math.max(periodLength, 1)) {
      return {
        kind: "inside_existing_period",
        relatedStartDate: log.startDate,
        distanceDays,
      };
    }

    if (distanceDays < MIN_TYPICAL_CYCLE_DAYS) {
      if (!closestTooClose || distanceDays < closestTooClose.distanceDays) {
        closestTooClose = {
          kind: "too_close",
          relatedStartDate: log.startDate,
          distanceDays,
        };
      }
    }
  }

  return closestTooClose;
}

/**
 * Takvim veya input ile "son regl başlangıcını" düzeltirken kullanılır.
 * Geçmişin tamamını çoğaltmaz, sadece en son kaydı günceller.
 */
function replaceLatestPeriodLog(logs: PeriodLog[], startDate: string): PeriodLog[] {
  const normalized = normalizeLogs(logs);

  if (normalized.length === 0) {
    return [{ startDate }];
  }

  const logsWithoutLatest = normalized.slice(0, -1);
  return normalizeLogs([...logsWithoutLatest, { startDate }]);
}

function getLearnedCycleLength(logs: PeriodLog[], fallback: number): number {
  const normalized = normalizeLogs(logs);

  // Çok erken öğrenmeye başlamasın.
  if (normalized.length < 3) return fallback;

  const intervals: number[] = [];

  for (let i = 1; i < normalized.length; i++) {
    const prev = fromLocalISODate(normalized[i - 1].startDate);
    const curr = fromLocalISODate(normalized[i].startDate);
    const diff = differenceInDays(curr, prev);

    // Aşırı kısa / aşırı uzun farklar genelde hatalı girişten gelir.
    if (diff >= 15 && diff <= 60) {
      intervals.push(diff);
    }
  }

  // En az 2 tamamlanmış aralık olmadan öğrenme yapmasın.
  if (intervals.length < 2) return fallback;

  const recentIntervals = intervals.slice(-6);
  const average =
    recentIntervals.reduce((sum, value) => sum + value, 0) /
    recentIntervals.length;

  return Math.round(average);
}

function getEffectiveSettings(
  settings: PeriodSettings | null,
  logs: PeriodLog[]
): PeriodSettings | null {
  if (!settings) return null;

  return {
    ...settings,
    averageCycleLength: getLearnedCycleLength(
      logs,
      settings.averageCycleLength || DEFAULT_SETTINGS.averageCycleLength
    ),
  };
}

function getLateState(
  logs: PeriodLog[],
  settings: PeriodSettings | null,
  todayIso: string
): LateState {
  const effectiveSettings = getEffectiveSettings(settings, logs);
  if (!effectiveSettings || logs.length === 0) {
    return {
      isLate: false,
      lateDays: 0,
      predictedStartIso: null,
      shouldShowPregnancyNote: false,
    };
  }

  const predictedStartIso = getNextPeriodStart(logs, effectiveSettings);
  if (!predictedStartIso) {
    return {
      isLate: false,
      lateDays: 0,
      predictedStartIso: null,
      shouldShowPregnancyNote: false,
    };
  }

  const lateDays = differenceInDays(
    fromLocalISODate(todayIso),
    fromLocalISODate(predictedStartIso)
  );

  return {
    isLate: lateDays > 0,
    lateDays: Math.max(lateDays, 0),
    predictedStartIso,
    shouldShowPregnancyNote: lateDays >= PREGNANCY_CHECK_REMINDER_DAYS,
  };
}

function getMarkedDates(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): Record<string, any> {
  const marked: Record<string, any> = {};
  const effectiveSettings = getEffectiveSettings(settings, logs);
  if (!effectiveSettings) return marked;

  const periodLength = effectiveSettings.periodLength;
  const normalizedLogs = normalizeLogs(logs);

  // Geçmiş regl günleri
  normalizedLogs.forEach((log) => {
    const start = fromLocalISODate(log.startDate);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = toLocalISODate(d);
      marked[key] = {
        ...(marked[key] || {}),
        selected: true,
        selectedColor: COLORS.period,
      };
    }
  });

  // Tahmini sonraki regl günleri
  const next = getNextPeriodStart(normalizedLogs, effectiveSettings);
  if (next) {
    const nextStart = fromLocalISODate(next);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(nextStart);
      d.setDate(d.getDate() + i);
      const key = toLocalISODate(d);
      if (!marked[key]) {
        marked[key] = { selected: true, selectedColor: "#F7D3E2" };
      }
    }
  }

  // Ovülasyon + verimli günler
  const ovInfo = getOvulationInfo(normalizedLogs, effectiveSettings);
  if (ovInfo.ovulationDate && ovInfo.windowStart && ovInfo.windowEnd) {
    const ws = fromLocalISODate(ovInfo.windowStart);
    const we = fromLocalISODate(ovInfo.windowEnd);

    for (
      let d = new Date(ws.getTime());
      d.getTime() <= we.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const key = toLocalISODate(d);
      if (!marked[key]) {
        marked[key] = { selected: true, selectedColor: COLORS.fertile };
      }
    }

    const ovKey = ovInfo.ovulationDate;
    marked[ovKey] = {
      ...(marked[ovKey] || {}),
      marked: true,
      dotColor: COLORS.ovulation,
    };
  }

  return marked;
}

async function clearCycleNotifications() {
  try {
    const json = await AsyncStorage.getItem(CYCLE_NOTIFICATION_IDS_KEY);
    if (!json) return;

    const ids: CycleNotificationIds = JSON.parse(json);
    const notificationIds = Object.values(ids).filter(Boolean) as string[];

    for (const id of notificationIds) {
      try {
        await Notifications.cancelScheduledNotificationAsync(id);
      } catch (e) {
        console.log("notification cancel error:", e);
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

function LegendItem({
  type,
  label,
}: {
  type: "period" | "fertile" | "ovulation" | "today";
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      {type === "period" ? (
        <View style={[styles.legendDot, styles.legendPeriod]} />
      ) : null}
      {type === "fertile" ? (
        <View style={[styles.legendDot, styles.legendFertile]} />
      ) : null}
      {type === "ovulation" ? (
        <View
          style={[
            styles.legendDot,
            styles.legendFertile,
            styles.legendOvulationWrap,
          ]}
        >
          <View style={styles.legendOvulationDot} />
        </View>
      ) : null}
      {type === "today" ? (
        <View style={[styles.legendDot, styles.legendToday]} />
      ) : null}
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function MetricCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

function PeriodBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function PeriodScreen() {
  const [settings, setSettings] = useState<PeriodSettings | null>(null);
  const [logs, setLogs] = useState<PeriodLog[]>([]);
  const [moodData, setMoodData] = useState<MoodData>({});
  const [loading, setLoading] = useState(true);

  const [inputLastStartDate, setInputLastStartDate] = useState("");
  const [inputAverageCycle, setInputAverageCycle] = useState("28");
  const [inputPeriodLength, setInputPeriodLength] = useState("5");
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [editingPeriodStart, setEditingPeriodStart] = useState<string | null>(
    null
  );

  // 🧪 Debug panel state
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugDump, setDebugDump] = useState<string>("");

  const [titleTapCount, setTitleTapCount] = useState(0);
  const [titleTapTimer, setTitleTapTimer] = useState<any>(null);

  const todayKey = toLocalISODate(new Date());

  useEffect(() => {
    void trackEvent({
      event_name: "screen_view",
      screen_name: "period",
    });
  }, []);

  useTrackScreenDuration({
    screen_name: "period",
  });

  const openUrl = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert("Hata", "Bağlantı açılamadı.");
    }
  };

  const todayMood = moodData[todayKey]?.mood;
  const todaySymptoms = moodData[todayKey]?.symptoms ?? [];

  const normalizedLogs = useMemo(() => normalizeLogs(logs), [logs]);

  const effectiveSettings = useMemo(
    () => getEffectiveSettings(settings, normalizedLogs),
    [settings, normalizedLogs]
  );

  const learnedCycleLength =
    effectiveSettings?.averageCycleLength ?? DEFAULT_SETTINGS.averageCycleLength;

  const nextPeriod = useMemo(
    () => getNextPeriodStart(normalizedLogs, effectiveSettings),
    [normalizedLogs, effectiveSettings]
  );

  const ovulationInfo = useMemo(
    () => getOvulationInfo(normalizedLogs, effectiveSettings),
    [normalizedLogs, effectiveSettings]
  );

  const markedDates = useMemo(
    () => getMarkedDates(normalizedLogs, settings),
    [normalizedLogs, settings]
  );

  const phaseInfo = useMemo(
    () => getCyclePhaseInfo(normalizedLogs, effectiveSettings),
    [normalizedLogs, effectiveSettings]
  );

  const lateState = useMemo(
    () => getLateState(normalizedLogs, settings, todayKey),
    [normalizedLogs, settings, todayKey]
  );

  const lastStartIso =
    normalizedLogs.length > 0
      ? normalizedLogs[normalizedLogs.length - 1].startDate
      : null;

  const lastStartTR = lastStartIso ? formatLocalISODateTR(lastStartIso) : null;
  const nextPeriodTR = nextPeriod ? formatLocalISODateTR(nextPeriod) : null;

  const ovulationDateTR = ovulationInfo.ovulationDate
    ? formatLocalISODateTR(ovulationInfo.ovulationDate)
    : null;

  const fertileRangeTR =
    ovulationInfo.windowStart && ovulationInfo.windowEnd
      ? formatLocalRangeTR(ovulationInfo.windowStart, ovulationInfo.windowEnd)
      : null;

  const cycleDay = lastStartIso
    ? Math.max(
      differenceInDays(
        fromLocalISODate(todayKey),
        fromLocalISODate(lastStartIso)
      ) + 1,
      1
    )
    : null;

  const isCurrentlyInPeriod =
    cycleDay !== null &&
    cycleDay >= 1 &&
    cycleDay <=
    (effectiveSettings?.periodLength ?? DEFAULT_SETTINGS.periodLength);

  const heroEyebrow = isCurrentlyInPeriod
    ? "ŞU ANDA"
    : lateState.isLate
      ? "BEKLENEN TARİH GEÇTİ"
      : "TAHMİNİ BİR SONRAKİ REGLİNE";

  const heroMainText = useMemo(() => {
    if (isCurrentlyInPeriod && cycleDay) {
      return `Reglin ${cycleDay}. günü`;
    }

    if (!nextPeriod) return "Henüz hesaplanamıyor";

    const daysUntil = differenceInDays(
      fromLocalISODate(nextPeriod),
      fromLocalISODate(todayKey)
    );

    if (lateState.isLate) {
      return `${lateState.lateDays} gün gecikme`;
    }

    if (daysUntil === 0) {
      return "Bugün başlayabilir";
    }

    if (daysUntil === 1) {
      return "1 gün kaldı";
    }

    return `${daysUntil} gün kaldı`;
  }, [isCurrentlyInPeriod, cycleDay, nextPeriod, todayKey, lateState]);

  const settingsSummaryLine = `${learnedCycleLength} günlük döngü · ${effectiveSettings?.periodLength ?? DEFAULT_SETTINGS.periodLength
    } gün regl süresi`;

  const settingsLastPeriodLine = lastStartTR
    ? `Son regl: ${lastStartTR}`
    : "Son regl tarihi henüz yok";

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
          effectiveSettings,
          learnedCycleLength,
          logs,
          lateState,
          inputLastStartDate,
          inputAverageCycle,
          inputPeriodLength,
        },
        computed: {
          phaseInfo,
          nextPeriodIso: nextPeriod,
          nextPeriodTR,
          ovulationInfo,
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
          const parsedLogs: PeriodLog[] = normalizeLogs(JSON.parse(logsJson));
          setLogs(parsedLogs);
          if (parsedLogs.length > 0) {
            setInputLastStartDate(
              formatLocalISODateTR(parsedLogs[parsedLogs.length - 1].startDate)
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

    void loadData();
  }, []);

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
            "Önce son regl başlangıcını ve regl süreni kaydetmelisin."
          );
        }
        return;
      }

      const effective = getEffectiveSettings(baseSettings, baseLogs);
      const next = getNextPeriodStart(baseLogs, effective);
      if (!effective || !next) {
        if (!silent) {
          Alert.alert(
            "Hesaplanamıyor",
            "Tahmini bir sonraki regl tarihi şimdilik hesaplanamıyor."
          );
        }
        return;
      }

      const nextDate = fromLocalISODate(next, 9);
      const now = new Date();

      const beforeDate = new Date(nextDate);
      beforeDate.setDate(beforeDate.getDate() - 2);

      const late1Date = new Date(nextDate);
      late1Date.setDate(late1Date.getDate() + LATE_REMINDER_DAYS);

      const late7Date = new Date(nextDate);
      late7Date.setDate(late7Date.getDate() + PREGNANCY_CHECK_REMINDER_DAYS);

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

      if (nextDate > now) {
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
      }

      if (late1Date > now) {
        const late1Id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Regl hatırlatması",
            body: "Reglin gecikmiş olabilir. Başladığında kaydetmeyi unutma.",
            sound: false,
            ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: late1Date,
          },
        });
        ids.late1 = late1Id;
      }

      if (late7Date > now) {
        const late7Id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Kısa bir kontrol iyi olabilir",
            body: "Reglin hâlâ başlamadıysa ve gebelik ihtimali varsa test yapmayı düşünebilirsin.",
            sound: false,
            ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: late7Date,
          },
        });
        ids.late7 = late7Id;
      }

      await AsyncStorage.setItem(
        CYCLE_NOTIFICATION_IDS_KEY,
        JSON.stringify(ids)
      );

      if (!silent) {
        Alert.alert(
          "Bildirimler ayarlandı",
          "Bu döngü için hatırlatıcılar planlandı. Son regl tarihini güncellediğinde bildirimler otomatik yenilenir."
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

  const persistLogsAndReschedule = async (
    nextLogs: PeriodLog[],
    nextSettings: PeriodSettings
  ) => {
    const normalized = normalizeLogs(nextLogs);
    setLogs(normalized);
    await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(normalized));

    if (normalized.length === 0) {
      await clearCycleNotifications();
      return;
    }

    await scheduleCycleNotifications(normalized, nextSettings, {
      silent: true,
    });
  };

  const saveNewPeriodStart = async (
    startDate: string,
    nextSettings: PeriodSettings,
    source: "today" | "calendar"
  ) => {
    const newLogs = addPeriodStartLog(logs, startDate);
    const latestStart = newLogs[newLogs.length - 1]?.startDate;

    if (latestStart) {
      setInputLastStartDate(formatLocalISODateTR(latestStart));
    }

    await persistLogsAndReschedule(newLogs, nextSettings);

    Alert.alert(
      "Kaydedildi",
      source === "today"
        ? "Bugünü regl başlangıcı olarak işaretledin. Geçmiş kayıtların korundu; tahminler güncellendi."
        : "Bu tarihi regl başlangıcı olarak ekledin. Geçmiş kayıtların korundu; tahminler güncellendi."
    );
  };

  const handlePeriodStartCandidate = async (
    startDate: string,
    nextSettings: PeriodSettings,
    source: "today" | "calendar"
  ) => {
    const conflict = getPeriodStartConflict(
      logs,
      startDate,
      nextSettings.periodLength
    );

    if (!conflict) {
      await saveNewPeriodStart(startDate, nextSettings, source);
      return;
    }

    const relatedDateTR = formatLocalISODateTR(conflict.relatedStartDate);

    if (conflict.kind === "duplicate") {
      Alert.alert(
        "Bu tarih zaten kayıtlı",
        `${relatedDateTR} zaten regl başlangıcı olarak kayıtlı. Yeni bir kayıt eklenmedi.`
      );
      return;
    }

    if (conflict.kind === "inside_existing_period") {
      Alert.alert(
        "Bu gün mevcut regl döneminin içinde",
        `${startDate === conflict.relatedStartDate ? relatedDateTR : formatLocalISODateTR(startDate)} tarihi, ${relatedDateTR} tarihinde başlayan kayıtlı regl döneminin içinde görünüyor. Yeni bir regl başlangıcı eklenmedi.`
      );
      return;
    }

    Alert.alert(
      "Regl başlangıçları birbirine çok yakın",
      `${formatLocalISODateTR(startDate)} tarihi, ${relatedDateTR} tarihindeki kayıtlı regl başlangıcına ${conflict.distanceDays} gün uzaklıkta. 21 günden kısa aralıklar tipik döngü aralığının dışındadır ve bu kanama ara kanama/lekelenme de olabilir.

Tarihi düzeltmek istiyorsan “Döngü Ayarları”ndaki son regl başlangıcı alanını kullan. Bunun gerçekten yeni bir regl dönemi olduğundan eminsen yine de kaydedebilirsin.`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Yine de regl olarak kaydet",
          style: "destructive",
          onPress: () => {
            void saveNewPeriodStart(startDate, nextSettings, source);
          },
        },
      ]
    );
  };

  const saveEditedPeriodStart = async (
    originalStartDate: string,
    nextStartDate: string,
    nextSettings: PeriodSettings
  ) => {
    const nextLogs = replacePeriodStartLog(
      logs,
      originalStartDate,
      nextStartDate
    );
    const latestStart = nextLogs[nextLogs.length - 1]?.startDate;

    setEditingPeriodStart(null);
    setInputLastStartDate(
      latestStart ? formatLocalISODateTR(latestStart) : ""
    );
    await persistLogsAndReschedule(nextLogs, nextSettings);

    Alert.alert(
      "Güncellendi",
      `${formatLocalISODateTR(originalStartDate)} başlangıçlı regl kaydı ${formatLocalISODateTR(nextStartDate)} olarak güncellendi. Diğer geçmiş kayıtların korundu.`
    );
  };

  const handleEditPeriodStartCandidate = async (
    originalStartDate: string,
    nextStartDate: string,
    nextSettings: PeriodSettings
  ) => {
    const conflict = getPeriodStartConflict(
      logs,
      nextStartDate,
      nextSettings.periodLength,
      originalStartDate
    );

    if (!conflict) {
      await saveEditedPeriodStart(
        originalStartDate,
        nextStartDate,
        nextSettings
      );
      return;
    }

    const relatedDateTR = formatLocalISODateTR(conflict.relatedStartDate);

    if (conflict.kind === "duplicate") {
      Alert.alert(
        "Bu tarih zaten kayıtlı",
        `${relatedDateTR} zaten başka bir regl başlangıcı olarak kayıtlı. Farklı bir tarih seç.`
      );
      return;
    }

    if (conflict.kind === "inside_existing_period") {
      Alert.alert(
        "Bu gün başka bir regl döneminin içinde",
        `${formatLocalISODateTR(nextStartDate)} tarihi, ${relatedDateTR} tarihinde başlayan başka bir regl döneminin içine düşüyor. Farklı bir tarih seç.`
      );
      return;
    }

    Alert.alert(
      "Yeni tarih başka bir kayda çok yakın",
      `${formatLocalISODateTR(nextStartDate)} tarihi, ${relatedDateTR} tarihindeki regl başlangıcına ${conflict.distanceDays} gün uzaklıkta. Bunun doğru olduğundan eminsen kaydı yine de değiştirebilirsin.`,
      [
        { text: "Başka tarih seç", style: "cancel" },
        {
          text: "Yine de değiştir",
          style: "destructive",
          onPress: () => {
            void saveEditedPeriodStart(
              originalStartDate,
              nextStartDate,
              nextSettings
            );
          },
        },
      ]
    );
  };

  const deletePeriodStart = async (
    startDate: string,
    nextSettings: PeriodSettings
  ) => {
    const nextLogs = removePeriodStartLog(logs, startDate);
    const latestStart = nextLogs[nextLogs.length - 1]?.startDate;

    if (editingPeriodStart === startDate) {
      setEditingPeriodStart(null);
    }

    setInputLastStartDate(
      latestStart ? formatLocalISODateTR(latestStart) : ""
    );
    await persistLogsAndReschedule(nextLogs, nextSettings);

    Alert.alert(
      "Silindi",
      `${formatLocalISODateTR(startDate)} başlangıçlı regl kaydı silindi. Diğer geçmiş kayıtların korundu.`
    );
  };

  const handleExistingPeriodPress = (
    startDate: string,
    nextSettings: PeriodSettings
  ) => {
    const start = fromLocalISODate(startDate);
    const end = new Date(start);
    end.setDate(
      end.getDate() + Math.max(nextSettings.periodLength, 1) - 1
    );

    const rangeText =
      nextSettings.periodLength > 1
        ? `${formatLocalISODateTR(startDate)} – ${formatLocalISODateTR(
            toLocalISODate(end)
          )}`
        : formatLocalISODateTR(startDate);

    Alert.alert(
      "Regl kaydını düzenle",
      `${rangeText} olarak görünen bu dönem, ${formatLocalISODateTR(startDate)} başlangıç kaydından hesaplanıyor. Ne yapmak istersin?`,
      [
        { text: "Vazgeç", style: "cancel" },
        {
          text: "Başlangıcı değiştir",
          onPress: () => {
            setEditingPeriodStart(startDate);
          },
        },
        {
          text: "Kaydı sil",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Regl kaydı silinsin mi?",
              `${formatLocalISODateTR(startDate)} başlangıçlı regl kaydı silinecek. Bu işlem döngü tahminlerini değiştirebilir.`,
              [
                { text: "Vazgeç", style: "cancel" },
                {
                  text: "Kaydı sil",
                  style: "destructive",
                  onPress: () => {
                    void deletePeriodStart(startDate, nextSettings);
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const resetPeriodHistory = async () => {
    try {
      await AsyncStorage.removeItem(PERIOD_LOGS_KEY);
      await clearCycleNotifications();
      setLogs([]);
      setInputLastStartDate("");
      setSettingsModalVisible(false);

      Alert.alert(
        "Temizlendi",
        "Regl geçmişi sıfırlandı. Ayarların korundu."
      );
    } catch (e) {
      console.log("resetPeriodHistory error:", e);
      Alert.alert("Hata", "Geçmiş temizlenemedi. Lütfen tekrar dene.");
    }
  };

  const handleSaveSettings = async () => {
    if (!inputPeriodLength.trim()) {
      Alert.alert("Eksik bilgi", "Lütfen regl süresini gir.");
      return;
    }

    const avgInput = inputAverageCycle.trim();
    const len = parseInt(inputPeriodLength, 10);
    const avg = avgInput
      ? parseInt(avgInput, 10)
      : settings?.averageCycleLength ?? DEFAULT_SETTINGS.averageCycleLength;

    if (isNaN(avg) || avg <= 0 || isNaN(len) || len <= 0) {
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

    if (isoFromInput && logs.length > 0) {
      const normalizedLogs = normalizeLogs(logs);
      const latestStart = normalizedLogs[normalizedLogs.length - 1]?.startDate;
      const conflict = getPeriodStartConflict(
        normalizedLogs,
        isoFromInput,
        len,
        latestStart
      );

      if (conflict) {
        const relatedDateTR = formatLocalISODateTR(conflict.relatedStartDate);

        if (conflict.kind === "duplicate") {
          Alert.alert(
            "Bu tarih başka bir kayıtta var",
            `${relatedDateTR} zaten farklı bir regl başlangıcı olarak kayıtlı. Son regl başlangıcı bu tarihle değiştirilemedi.`
          );
        } else if (conflict.kind === "inside_existing_period") {
          Alert.alert(
            "Tarih kayıtlı bir regl dönemine denk geliyor",
            `Seçtiğin tarih, ${relatedDateTR} tarihinde başlayan kayıtlı regl döneminin içine düşüyor. Önce kayıtlarını kontrol et.`
          );
        } else {
          Alert.alert(
            "Tarih önceki kayda çok yakın",
            `Bu değişiklik ${relatedDateTR} tarihindeki regl başlangıcıyla yalnızca ${conflict.distanceDays} günlük aralık oluşturuyor. Gerçekten ayrı bir regl dönemi eklemek istiyorsan takvimden ekle; son regl tarihini düzeltmek istiyorsan kayıtlarını kontrol edip tekrar dene.`
          );
        }
        return;
      }
    }

    const newSettings: PeriodSettings = {
      averageCycleLength: avg,
      periodLength: len,
    };

    setSettings(newSettings);
    await AsyncStorage.setItem(
      PERIOD_SETTINGS_KEY,
      JSON.stringify(newSettings)
    );

    let effectiveLogs = logs;

    if (isoFromInput) {
      effectiveLogs = replaceLatestPeriodLog(logs, isoFromInput);
      setInputLastStartDate(formatLocalISODateTR(isoFromInput));
      await persistLogsAndReschedule(effectiveLogs, newSettings);
    } else if (logs.length > 0) {
      await scheduleCycleNotifications(logs, newSettings, { silent: true });
    }

    setSettingsModalVisible(false);
    Alert.alert("Kaydedildi", "Döngü ayarların güncellendi.");
  };

  const handleTodayStarted = async () => {
    try {
      const todayIso = toLocalISODate(new Date());
      const effSettings = await ensureSettingsStored();
      await handlePeriodStartCandidate(todayIso, effSettings, "today");
    } catch (e) {
      console.log("handleTodayStarted save error:", e);
      Alert.alert("Hata", "Regl başlangıcı kaydedilemedi. Lütfen tekrar dene.");
    }
  };

  const handleCalendarDayPress = async (day: DateObject) => {
    try {
      const pickedIso = day.dateString;

      if (isFutureISODate(pickedIso)) {
        Alert.alert(
          "Geçersiz tarih",
          "Regl başlangıcı ileri bir tarih olamaz. Lütfen bugünü veya geçmiş bir günü seç."
        );
        return;
      }

      const effSettings = await ensureSettingsStored();

      if (editingPeriodStart) {
        await handleEditPeriodStartCandidate(
          editingPeriodStart,
          pickedIso,
          effSettings
        );
        return;
      }

      const existingPeriod = findPeriodLogForDate(
        logs,
        pickedIso,
        effSettings.periodLength
      );

      if (existingPeriod) {
        handleExistingPeriodPress(existingPeriod.startDate, effSettings);
        return;
      }

      await handlePeriodStartCandidate(pickedIso, effSettings, "calendar");
    } catch (e) {
      console.log("handleCalendarDayPress save error:", e);
      Alert.alert("Hata", "Tarih kaydedilemedi. Lütfen tekrar dene.");
    }
  };

  const handleSelectMood = async (level: MoodLevel) => {
    setMoodData((prev: MoodData) => {
      const next: MoodData = { ...prev };
      const day: MoodDay = next[todayKey] ?? {};
      day.mood = level;
      next[todayKey] = day;
      void AsyncStorage.setItem(MOOD_DATA_KEY, JSON.stringify(next));
      return next;
    });
  };

  const handleToggleSymptom = async (symptom: string) => {
    setMoodData((prev: MoodData) => {
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

  return (
    <>
      <Stack.Screen options={{ title: "Regl Takvimi" }} />

      <View style={styles.page}>
        <Modal
          visible={debugVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDebugVisible(false)}
        >
          <View style={styles.debugOverlay}>
            <View style={styles.debugCard}>
              <Text style={styles.debugTitle}>🧪 Period Debug Panel</Text>

              <View style={styles.debugActions}>
                <Pressable
                  style={styles.debugButtonPrimary}
                  onPress={() => buildDebugDump()}
                >
                  <Text style={styles.debugButtonText}>Yenile</Text>
                </Pressable>

                <Pressable
                  style={styles.debugButtonSecondary}
                  onPress={() => setDebugVisible(false)}
                >
                  <Text style={styles.debugButtonText}>Kapat</Text>
                </Pressable>
              </View>

              <ScrollView style={styles.debugScroll}>
                <Text style={styles.debugText}>
                  {debugDump || "Debug verisi yok."}
                </Text>
              </ScrollView>
            </View>
          </View>
        </Modal>

        <Modal
          visible={settingsModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setSettingsModalVisible(false)}
        >
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 24 : 0}
            style={styles.modalKeyboardAvoid}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalCard}>
              <View style={styles.modalHeaderRow}>
                <Text style={styles.modalTitle}>Döngü ayarların</Text>

                <Pressable onPress={() => setSettingsModalVisible(false)}>
                  <Text style={styles.modalClose}>Kapat</Text>
                </Pressable>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.modalContent}
              >
                <Text style={styles.modalDescription}>
                  Başlangıç değeri olarak 28 gün kullanılır. Uygulama,
                  kaydettiğin regl başlangıçlarına göre zamanla döngünü öğrenir.
                </Text>

                <Text style={styles.inputLabel}>Son regl başlangıcın</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: 24.11.2025"
                  value={inputLastStartDate}
                  onChangeText={setInputLastStartDate}
                />

                <Text style={styles.inputLabel}>
                  Başlangıç döngü süren (bilmiyorsan 28 kalsın)
                </Text>
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
                  style={styles.modalPrimaryButton}
                  onPress={handleSaveSettings}
                >
                  <Text style={styles.modalPrimaryButtonText}>
                    Ayarları kaydet
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.modalDangerButton}
                  onPress={() =>
                    Alert.alert(
                      "Regl geçmişini sıfırla",
                      "Yanlış eklenen tüm regl kayıtları silinecek. Ayarların korunur.",
                      [
                        { text: "Vazgeç", style: "cancel" },
                        {
                          text: "Sıfırla",
                          style: "destructive",
                          onPress: () => {
                            void resetPeriodHistory();
                          },
                        },
                      ]
                    )
                  }
                >
                  <Text style={styles.modalDangerButtonText}>
                    Regl geçmişini sıfırla
                  </Text>
                </Pressable>
              </ScrollView>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={handleTitleSecretTap}>
            <Text style={styles.pageTitle}>Regl Takvimi</Text>
          </Pressable>

          <Text style={styles.pageSubtitle}>
            Döngünü takip et, bedenini daha iyi anlamak ve kendinle daha uyumlu
            bir ritim yakalamak için buradasın.
          </Text>

          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={styles.heroVisualWrap}>
                <View style={styles.heroVisualOuter}>
                  <View style={styles.heroVisualMiddle}>
                    <View style={styles.heroVisualInner}>
                      <Text style={styles.heroVisualHeart}>♥</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.heroDotsRow}>
                  <View style={styles.heroDot} />
                  <View style={styles.heroDot} />
                  <View style={styles.heroDot} />
                  <View style={styles.heroDot} />
                </View>
              </View>

              <View style={styles.heroTextWrap}>
                <Text style={styles.heroEyebrow}>{heroEyebrow}</Text>

                <Text style={styles.heroMain}>{heroMainText}</Text>

                <View style={styles.heroChips}>
                  <View style={styles.heroChip}>
                    <Text style={styles.heroChipText}>{phaseInfo.title}</Text>
                  </View>

                  {cycleDay ? (
                    <View style={styles.heroChip}>
                      <Text style={styles.heroChipText}>
                        Döngünün {cycleDay}. günü
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={handleTodayStarted}>
              <Text style={styles.primaryButtonText}>Bugün regl oldum</Text>
            </Pressable>

            <Pressable
              style={styles.linkButton}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Text style={styles.linkButtonText}>Başka bir tarih seç</Text>
              <Text style={styles.linkButtonArrow}>›</Text>
            </Pressable>

            <Pressable
              style={styles.notificationButton}
              onPress={() =>
                scheduleCycleNotifications(normalizedLogs, settings, {
                  silent: false,
                })
              }
            >
              <Text style={styles.notificationButtonText}>
                Regl hatırlatıcılarını aç
              </Text>
            </Pressable>

            <Text style={styles.helperText}>
              Tahmini regl gününden 2 gün önce, beklenen gün ve gecikme
              durumunda bildirim alabilirsin.
            </Text>
          </View>

          {lateState.isLate ? (
            <View style={styles.lateCard}>
              <Text style={styles.lateTitle}>Reglin gecikmiş olabilir</Text>
              <Text style={styles.lateText}>
                Reglin başladığında kaydetmen tahminlerin daha doğru çalışmasına
                yardımcı olur.
              </Text>

              {lateState.shouldShowPregnancyNote ? (
                <Text style={styles.lateFootnote}>
                  Hâlâ başlamadıysa ve gebelik ihtimali varsa test yapmayı
                  düşünebilirsin.
                </Text>
              ) : null}
            </View>
          ) : null}

          <Text style={styles.sectionTitle}>Döngü Özeti</Text>

          <View style={styles.metricsGrid}>
            <MetricCard label="Son regl" value={lastStartTR ?? "Kayıt yok"} />
            <MetricCard
              label="Sonraki regl"
              value={nextPeriodTR ?? "Hesaplanamıyor"}
            />
            <MetricCard label="Döngü" value={`${learnedCycleLength} gün`} />
            <MetricCard
              label="Regl süresi"
              value={`${effectiveSettings?.periodLength ?? DEFAULT_SETTINGS.periodLength
                } gün`}
            />
          </View>

          <View style={styles.infoListCard}>
            <View style={styles.infoListRow}>
              <Text style={styles.infoListLabel}>Ovülasyon</Text>
              <Text style={styles.infoListValue}>
                {ovulationDateTR ?? "Henüz hesaplanamıyor"}
              </Text>
            </View>

            <View style={styles.infoDivider} />

            <View style={styles.infoListRow}>
              <Text style={styles.infoListLabel}>Verimli günler</Text>
              <Text style={styles.infoListValue}>
                {fertileRangeTR ?? "Henüz hesaplanamıyor"}
              </Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderTextWrap}>
                <Text style={styles.cardTitle}>Takvim Görünümü</Text>
                <Text style={styles.cardDescription}>
                  Geçmiş regl günlerin, tahmini regl dönemlerin ve verimli
                  günlerin burada işaretlenir.
                </Text>
                <Text style={styles.calendarEditHint}>
                  Bir regl kaydını düzeltmek veya silmek için kırmızı bir güne
                  dokun.
                </Text>
              </View>

              <View style={styles.sectionIconBadge}>
                <Text style={styles.sectionIconText}>🗓️</Text>
              </View>
            </View>

            {editingPeriodStart ? (
              <View style={styles.calendarEditMode}>
                <Text style={styles.calendarEditModeText}>
                  {formatLocalISODateTR(editingPeriodStart)} başlangıcını
                  değiştiriyorsun. Yeni başlangıç gününe dokun.
                </Text>
                <Pressable
                  onPress={() => setEditingPeriodStart(null)}
                  hitSlop={8}
                >
                  <Text style={styles.calendarEditModeCancel}>Vazgeç</Text>
                </Pressable>
              </View>
            ) : null}

            <Calendar
              onDayPress={handleCalendarDayPress}
              markedDates={markedDates}
              maxDate={todayKey}
              firstDay={1}
              theme={{
                todayTextColor: COLORS.primaryDark,
                arrowColor: COLORS.primaryDark,
                monthTextColor: COLORS.text,
                textDayFontSize: 16,
                textMonthFontSize: 18,
                textDayHeaderFontSize: 13,
                textDayFontWeight: "500",
                textMonthFontWeight: "700",
              }}
            />

            <View style={styles.legendWrap}>
              <LegendItem type="period" label="Regl günleri" />
              <LegendItem type="fertile" label="Verimli günler" />
              <LegendItem type="ovulation" label="Ovülasyon" />
              <LegendItem type="today" label="Bugün" />
            </View>
          </View>

          <View style={styles.phaseCard}>
            <View style={styles.phaseTextWrap}>
              <Text style={styles.cardTitle}>Bugün Döngünün Fazı</Text>
              <Text style={styles.phaseTitle}>{phaseInfo.title}</Text>
              <Text style={styles.phaseText}>{phaseInfo.description}</Text>
              <Text style={styles.phaseSuggestion}>{phaseInfo.suggestion}</Text>
            </View>

            <View style={styles.phaseDecorationWrap}>
              <Text style={styles.phaseDecoration}>🌸</Text>
            </View>
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

            <Text style={[styles.inputLabel, { marginTop: 14 }]}>
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
            <View style={styles.settingsTopRow}>
              <View style={styles.settingsIconWrap}>
                <Text style={styles.settingsIcon}>🩷</Text>
              </View>

              <View style={styles.settingsTextWrap}>
                <Text style={styles.cardTitle}>Döngü ayarların</Text>
                <Text style={styles.settingsMeta}>{settingsSummaryLine}</Text>
                <Text style={styles.settingsMeta}>{settingsLastPeriodLine}</Text>
              </View>
            </View>

            <Pressable
              style={styles.settingsActionRow}
              onPress={() => setSettingsModalVisible(true)}
            >
              <Text style={styles.settingsActionText}>Düzenle</Text>
              <Text style={styles.settingsActionArrow}>›</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <View style={styles.infoHeaderRow}>
              <View style={styles.infoIconWrap}>
                <Text style={styles.infoIcon}>✚</Text>
              </View>

              <View style={styles.infoHeaderTextWrap}>
                <Text style={styles.cardTitle}>Tıbbi bilgilendirme</Text>
                <Text style={styles.summaryNote}>
                  Tahminler genel bilgilendirme amaçlıdır ve yalnızca tahmini
                  sonuçlar üretir. Tıbbi teşhis yerine geçmez ve doğum kontrol
                  yöntemi olarak kullanılmamalıdır.
                </Text>
              </View>
            </View>

            <View style={styles.sourcesRow}>
              <Pressable
                style={styles.sourcePill}
                onPress={() =>
                  openUrl(
                    "https://my.clevelandclinic.org/health/articles/10132-menstrual-cycle"
                  )
                }
              >
                <Text style={styles.sourcePillText}>Cleveland Clinic</Text>
              </Pressable>

              <Pressable
                style={styles.sourcePill}
                onPress={() =>
                  openUrl(
                    "https://www.mayoclinic.org/healthy-lifestyle/womens-health/in-depth/menstrual-cycle/art-20047186"
                  )
                }
              >
                <Text style={styles.sourcePillText}>Mayo Clinic</Text>
              </Pressable>

              <Pressable
                style={styles.sourcePill}
                onPress={() => openUrl("https://www.nhs.uk/conditions/periods/")}
              >
                <Text style={styles.sourcePillText}>NHS</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        <PeriodBannerAd />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },

  content: {
    padding: 16,
    paddingBottom: 32,
  },

  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  loadingText: {
    color: COLORS.text,
    fontSize: 16,
  },

  pageTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  pageSubtitle: {
    fontSize: 16,
    lineHeight: 24,
    color: COLORS.textSoft,
    marginBottom: 16,
  },

  heroCard: {
    padding: 18,
    borderRadius: 24,
    backgroundColor: "#FFF4EF",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 18,
  },

  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  heroVisualWrap: {
    width: 120,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  heroVisualOuter: {
    width: 96,
    height: 96,
    borderRadius: 999,
    borderWidth: 8,
    borderColor: "#F6CFCF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroVisualMiddle: {
    width: 68,
    height: 68,
    borderRadius: 999,
    borderWidth: 6,
    borderColor: "#E58A8A",
    alignItems: "center",
    justifyContent: "center",
  },

  heroVisualInner: {
    width: 42,
    height: 42,
    borderRadius: 999,
    backgroundColor: "#FFF9F8",
    alignItems: "center",
    justifyContent: "center",
  },

  heroVisualHeart: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  heroDotsRow: {
    flexDirection: "row",
    marginTop: 10,
  },

  heroDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: "#E8B8B8",
    marginHorizontal: 3,
  },

  heroTextWrap: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSoft,
    letterSpacing: 0.4,
    marginBottom: 8,
  },

  heroMain: {
    fontSize: 34,
    lineHeight: 40,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },

  heroChips: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  heroChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFF9F7",
    borderWidth: 1,
    borderColor: "#EFDCD7",
    marginRight: 8,
    marginBottom: 8,
  },

  heroChipText: {
    fontSize: 13,
    color: COLORS.textSoft,
    fontWeight: "600",
  },

  primaryButton: {
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "800",
  },

  linkButton: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  linkButtonText: {
    color: COLORS.primaryDark,
    fontSize: 16,
    fontWeight: "600",
  },

  linkButtonArrow: {
    color: COLORS.primaryDark,
    fontSize: 22,
    marginLeft: 6,
    lineHeight: 22,
  },

  notificationButton: {
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F7E3DE",
    alignItems: "center",
    justifyContent: "center",
  },

  notificationButtonText: {
    color: COLORS.primaryDark,
    fontSize: 15,
    fontWeight: "700",
  },

  helperText: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginTop: 8,
    textAlign: "center",
  },

  lateCard: {
    padding: 14,
    borderRadius: 18,
    backgroundColor: COLORS.lateBg,
    borderWidth: 1,
    borderColor: "#F2D8D4",
    marginBottom: 16,
  },

  lateTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 4,
  },

  lateText: {
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.textSoft,
  },

  lateFootnote: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
    marginTop: 6,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 12,
  },

  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  metricCard: {
    width: "48%",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },

  metricLabel: {
    fontSize: 13,
    color: COLORS.textMuted,
    marginBottom: 8,
  },

  metricValue: {
    fontSize: 20,
    lineHeight: 24,
    fontWeight: "800",
    color: COLORS.text,
  },

  infoListCard: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 20,
    marginBottom: 14,
  },

  infoListRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  infoListLabel: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
    flex: 1,
  },

  infoListValue: {
    fontSize: 16,
    lineHeight: 22,
    color: COLORS.text,
    fontWeight: "700",
    textAlign: "right",
    flex: 1,
  },

  infoDivider: {
    height: 1,
    backgroundColor: COLORS.border,
  },

  card: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
  },

  cardHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 4,
  },

  cardHeaderTextWrap: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  cardDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    marginBottom: 8,
  },

  calendarEditHint: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.primaryDark,
    fontWeight: "700",
    marginBottom: 12,
  },

  calendarEditMode: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    backgroundColor: COLORS.chip,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 10,
  },

  calendarEditModeText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textSoft,
    fontWeight: "600",
  },

  calendarEditModeCancel: {
    fontSize: 12,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  sectionIconBadge: {
    marginLeft: 12,
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF0EB",
    alignItems: "center",
    justifyContent: "center",
  },

  sectionIconText: {
    fontSize: 22,
  },

  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 14,
  },

  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 14,
    marginBottom: 8,
  },

  legendDot: {
    width: 16,
    height: 16,
    borderRadius: 999,
    marginRight: 6,
  },

  legendPeriod: {
    backgroundColor: COLORS.period,
  },

  legendFertile: {
    backgroundColor: COLORS.fertile,
  },

  legendOvulationWrap: {
    alignItems: "center",
    justifyContent: "center",
  },

  legendOvulationDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: COLORS.ovulation,
  },

  legendToday: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: COLORS.today,
  },

  legendLabel: {
    fontSize: 12,
    color: COLORS.textSoft,
  },

  phaseCard: {
    padding: 16,
    borderRadius: 22,
    backgroundColor: "#FFF7F5",
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  phaseTextWrap: {
    flex: 1,
  },

  phaseTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: COLORS.primaryDark,
    marginBottom: 6,
  },

  phaseText: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    marginBottom: 6,
  },

  phaseSuggestion: {
    fontSize: 12,
    lineHeight: 18,
    color: COLORS.textMuted,
  },

  phaseDecorationWrap: {
    marginLeft: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  phaseDecoration: {
    fontSize: 34,
  },

  inputLabel: {
    fontSize: 14,
    color: COLORS.textSoft,
    marginTop: 8,
    marginBottom: 6,
    fontWeight: "600",
  },

  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: COLORS.text,
    backgroundColor: "#FFFDFC",
  },

  moodRow: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  moodChip: {
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.chip,
    marginRight: 8,
    marginBottom: 8,
  },

  moodChipSelected: {
    borderColor: "#E2A4A1",
    backgroundColor: "#FFF0EC",
  },

  moodChipText: {
    fontSize: 13,
    color: COLORS.textSoft,
  },

  moodChipTextSelected: {
    fontWeight: "700",
    color: COLORS.text,
  },

  symptomContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },

  symptomChip: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.card,
    marginRight: 8,
    marginBottom: 8,
  },

  symptomChipSelected: {
    backgroundColor: "#FFF0EC",
    borderColor: "#E2A4A1",
  },

  symptomChipText: {
    fontSize: 13,
    color: COLORS.textSoft,
  },

  symptomChipTextSelected: {
    fontWeight: "700",
    color: COLORS.text,
  },

  settingsTopRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },

  settingsIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF0EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  settingsIcon: {
    fontSize: 20,
  },

  settingsTextWrap: {
    flex: 1,
  },

  settingsMeta: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.textSoft,
    marginBottom: 2,
  },

  settingsActionRow: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FFFDFC",
  },

  settingsActionText: {
    fontSize: 16,
    color: COLORS.text,
    fontWeight: "600",
  },

  settingsActionArrow: {
    fontSize: 24,
    color: COLORS.primaryDark,
    lineHeight: 24,
  },

  infoHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFF0EB",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoIcon: {
    fontSize: 18,
    color: COLORS.primaryDark,
    fontWeight: "800",
  },

  infoHeaderTextWrap: {
    flex: 1,
  },

  summaryNote: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 20,
    color: COLORS.textMuted,
  },

  sourcesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 12,
  },

  sourcePill: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: "#FFF7F4",
    marginRight: 8,
    marginBottom: 8,
  },

  sourcePillText: {
    color: COLORS.primaryDark,
    fontWeight: "700",
    fontSize: 13,
  },

  modalKeyboardAvoid: {
    flex: 1,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.25)",
    justifyContent: "flex-end",
  },

  modalCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 18,
    paddingHorizontal: 18,
    paddingBottom: 28,
    maxHeight: "85%",
  },

  modalHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.text,
  },

  modalClose: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  modalContent: {
    paddingBottom: 16,
  },

  modalDescription: {
    fontSize: 14,
    lineHeight: 21,
    color: COLORS.textSoft,
    marginBottom: 8,
  },

  modalPrimaryButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  modalPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },

  modalDangerButton: {
    marginTop: 10,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: "#FFF1F0",
    alignItems: "center",
    justifyContent: "center",
  },

  modalDangerButtonText: {
    color: "#C15757",
    fontSize: 15,
    fontWeight: "700",
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },

  debugOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    padding: 16,
    justifyContent: "center",
  },

  debugCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    maxHeight: "85%",
  },

  debugTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: COLORS.text,
    marginBottom: 8,
  },

  debugActions: {
    flexDirection: "row",
    marginBottom: 10,
  },

  debugButtonPrimary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.primaryDark,
    alignItems: "center",
    marginRight: 8,
  },

  debugButtonSecondary: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#444",
    alignItems: "center",
  },

  debugButtonText: {
    color: "#fff",
    fontWeight: "800",
  },

  debugScroll: {
    borderWidth: 1,
    borderColor: "#F3B6B3",
    borderRadius: 10,
    padding: 10,
  },

  debugText: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    fontSize: 12,
    color: "#2b1a17",
  },
});