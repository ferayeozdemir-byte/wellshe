// app/period/index.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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

type DateObject = { dateString: string };

type PeriodLog = {
  startDate: string; // İçeride ISO format (YYYY-MM-DD) tutuluyor
};

type PeriodSettings = {
  averageCycleLength: number; // ortalama döngü süresi (gün)
  periodLength: number; // regl süresi (gün)
};

type CycleNotificationIds = {
  before?: string;
  start?: string;
};

type OvulationInfo = {
  ovulationDate: string | null;
  windowStart: string | null;
  windowEnd: string | null;
};

type MoodLevel = "low" | "neutral" | "good" | "great";

type MoodDay = {
  mood?: MoodLevel;
  symptoms?: string[];
};

type MoodData = Record<string, MoodDay>;

type CyclePhase =
  | "menstruation"
  | "follicular"
  | "ovulation"
  | "luteal"
  | "unknown";

type CyclePhaseInfo = {
  key: CyclePhase;
  title: string;
  description: string;
  suggestion: string;
};

const PERIOD_SETTINGS_KEY = "wellshe_period_settings";
const PERIOD_LOGS_KEY = "wellshe_period_logs";
const CYCLE_NOTIFICATION_IDS_KEY = "wellshe_cycle_notification_ids";
const MOOD_DATA_KEY = "wellshe_mood_data";

// Yardımcı: Date -> "YYYY-MM-DD" (iç format)
function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// ISO -> "GG.AA.YYYY" (kullanıcıya gösterilen format)
function formatDateTRFromISO(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}.${m}.${y}`;
}

// "GG.AA.YYYY" -> ISO ("YYYY-MM-DD")
// Kullanıcı input’unu iç formata çeviriyoruz
function parseTRDateToISO(tr: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(tr.trim());
  if (!match) return null;

  const [, dStr, mStr, yStr] = match;
  const d = parseInt(dStr, 10);
  const m = parseInt(mStr, 10);
  const y = parseInt(yStr, 10);

  const date = new Date(y, m - 1, d);
  if (Number.isNaN(date.getTime())) return null;

  // Geçersiz tarihleri ele (32.01.2025 gibi)
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }

  return formatDate(date);
}

// ISO aralık -> "19.12 - 23.12 2025" (yıl 1 kez)
function formatRangeTR(startIso: string, endIso: string): string {
  const [sy, sm, sd] = startIso.split("-");
  const [ey, em, ed] = endIso.split("-");
  if (!sy || !sm || !sd || !ey || !em || !ed) return `${startIso} - ${endIso}`;

  const startShort = `${sd}.${sm}`;
  const endShort = `${ed}.${em}`;

  if (sy === ey) return `${startShort} - ${endShort} ${sy}`;
  return `${startShort}.${sy} - ${endShort}.${ey}`;
}

// Tarih formatı kontrolü (ISO: YYYY-MM-DD)
function isValidISODate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const date = new Date(str);
  if (Number.isNaN(date.getTime())) return false;
  return formatDate(date) === str;
}

// ✅ Gelecek tarih kontrolü (ISO)
function isFutureISODate(iso: string): boolean {
  if (!isValidISODate(iso)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const picked = new Date(iso);
  picked.setHours(0, 0, 0, 0);

  return picked.getTime() > today.getTime();
}

// Tahmini sonraki regl başlangıç tarihi (ISO)
function getNextPeriodStart(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): string | null {
  if (!settings || logs.length === 0) return null;
  const last = logs[logs.length - 1];
  const lastDate = new Date(last.startDate);
  lastDate.setDate(lastDate.getDate() + settings.averageCycleLength);
  return formatDate(lastDate);
}

// Ovülasyon + verimli gün aralığı (hepsi ISO iç formatta)
function getOvulationInfo(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): OvulationInfo {
  if (!settings || logs.length === 0) {
    return { ovulationDate: null, windowStart: null, windowEnd: null };
  }

  const lastStart = new Date(logs[logs.length - 1].startDate);
  const ovulation = new Date(lastStart);
  ovulation.setDate(
    ovulation.getDate() + Math.round(settings.averageCycleLength / 2)
  );

  const windowStart = new Date(ovulation);
  windowStart.setDate(windowStart.getDate() - 2);

  const windowEnd = new Date(ovulation);
  windowEnd.setDate(windowEnd.getDate() + 2);

  return {
    ovulationDate: formatDate(ovulation),
    windowStart: formatDate(windowStart),
    windowEnd: formatDate(windowEnd),
  };
}

// Takvimde gösterilecek işaretli günler (ISO key'ler)
function getMarkedDates(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): Record<string, any> {
  const marked: Record<string, any> = {};
  if (!settings) return marked;

  const periodLength = settings.periodLength;

  // 1) Geçmiş regl günleri (kırmızı/pembe)
  logs.forEach((log) => {
    const start = new Date(log.startDate);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      const key = formatDate(d);
      marked[key] = {
        ...(marked[key] || {}),
        selected: true,
        selectedColor: "#FF6B81",
      };
    }
  });

  // 2) Tahmini sonraki regl (mor)
  const next = getNextPeriodStart(logs, settings);
  if (next) {
    const nextStart = new Date(next);
    for (let i = 0; i < periodLength; i++) {
      const d = new Date(nextStart);
      d.setDate(d.getDate() + i);
      const key = formatDate(d);
      if (!marked[key]) {
        marked[key] = { selected: true, selectedColor: "#C4A1FF" };
      }
    }
  }

  // 3) Ovülasyon + verimli günler
  const ovInfo = getOvulationInfo(logs, settings);
  if (ovInfo.ovulationDate && ovInfo.windowStart && ovInfo.windowEnd) {
    const ws = new Date(ovInfo.windowStart);
    const we = new Date(ovInfo.windowEnd);

    for (
      let d = new Date(ws.getTime());
      d.getTime() <= we.getTime();
      d.setDate(d.getDate() + 1)
    ) {
      const key = formatDate(d);
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

// Eski döngü bildirimlerini iptal et
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

// Android kanalını sizin mevcut yapınızla uyumlu tuttum: "reminders"
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

// Döngü fazı hesaplama
function getCyclePhaseInfo(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): CyclePhaseInfo {
  if (!settings || logs.length === 0) {
    return {
      key: "unknown",
      title: "Faz hesaplanamıyor",
      description:
        "Son regl başlangıç tarihin ve döngü süren netleştiğinde faz bilgisi burada görünecek.",
      suggestion:
        "Regl başlangıcını kaydedip döngü süreni girdikten sonra bu alan çok daha anlamlı çalışmaya başlayacak.",
    };
  }

  const lastStartStr = logs[logs.length - 1].startDate;
  const lastStartDate = new Date(lastStartStr);
  const today = new Date();

  const diffMs = today.getTime() - lastStartDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const cycleLen = settings.averageCycleLength;
  const periodLen = settings.periodLength;
  const mid = Math.round(cycleLen / 2);

  if (diffDays < 0 || diffDays > cycleLen + 10) {
    return {
      key: "unknown",
      title: "Faz dışı aralık",
      description:
        "Son regl başlangıç tarihin ile bugünün arasındaki fark beklenen döngü süresinin dışında görünüyor.",
      suggestion:
        "Son regl başlangıcını güncellersen bu alan güncel döngüne göre yeni fazı gösterecek.",
    };
  }

  if (diffDays >= 0 && diffDays < periodLen) {
    return {
      key: "menstruation",
      title: "Regl Fazı",
      description:
        "Bedenin yenilenme ve arınma sürecinde. Enerjinin dalgalanması son derece normal.",
      suggestion:
        "Bugün kendine biraz daha nazik davranmak, tempoyu düşürmek ve dinlenmeye alan açmak iyi gelebilir.",
    };
  }

  if (diffDays >= mid - 2 && diffDays <= mid + 2) {
    return {
      key: "ovulation",
      title: "Ovülasyon Fazı",
      description:
        "Enerjinin ve öz güveninin arttığı, sosyal olarak daha dışa dönük hissetmeye eğilimli olabileceğin bir fazdasın.",
      suggestion:
        "Görüşmeler, yaratıcı projeler, kendini ifade etmen gereken işler için bu dönemi değerlendirebilirsin.",
    };
  }

  if (diffDays >= periodLen && diffDays < mid - 2) {
    return {
      key: "follicular",
      title: "Folikül Fazı",
      description:
        "Regl sonrası enerjinin yavaş yavaş yükseldiği, zihinsel olarak daha açık ve meraklı hissettiğin bir dönemdesin.",
      suggestion:
        "Yeni şeyler öğrenmek, plan yapmak ve hafif tempolu egzersizlere başlamak için bu faz oldukça destekleyici.",
    };
  }

  if (diffDays > mid + 2 && diffDays < cycleLen) {
    return {
      key: "luteal",
      title: "Luteal faz",
      description:
        "Bedenin yavaş yavaş içe dönmeye hazırlanıyor. Duygular hassaslaşabilir, enerji iniş çıkışları yaşayabilirsin.",
      suggestion:
        "Bu dönemde yapılacaklar listeni sadeleştirmek, sana iyi gelen rutinlere ağırlık vermek ve kendine karşı anlayışlı olmak çok değerli.",
    };
  }

  return {
    key: "unknown",
    title: "Geçiş dönemi",
    description:
      "Bugün için net bir faz tanımı yapamıyoruz, ama bu da döngünün doğal dalgalanmalarının bir parçası.",
    suggestion:
      "Bedeninin bugün nasıl hissettiğini gözlemlemek ve buna göre küçük ayarlamalar yapmak en sağlıklı rehber olacaktır.",
  };
}

// 🔹 Regl ekranı için banner komponenti (article/calorie mimarisiyle aynı mantık)
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

  const todayKey = formatDate(new Date());
  const todayMood = moodData[todayKey]?.mood;
  const todaySymptoms = moodData[todayKey]?.symptoms ?? [];

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
          const defaultSettings: PeriodSettings = {
            averageCycleLength: 28,
            periodLength: 5,
          };
          setSettings(defaultSettings);
          setInputAverageCycle("28");
          setInputPeriodLength("5");
        }

        if (logsJson) {
          const parsedLogs: PeriodLog[] = JSON.parse(logsJson);
          setLogs(parsedLogs);
          if (parsedLogs.length > 0) {
            // Input’a TR formatı göster
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

      // ✅ Gelecek tarih kaydedilemesin
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

    // 🔁 Ayarlar veya son regl tarihi değiştiyse, bildirimleri yeni değerlere göre sessizce güncelle
    await scheduleCycleNotifications(effectiveLogs, newSettings, { silent: true });

    Alert.alert("Kaydedildi", "Döngü ayarların güncellendi.");
  };

  const handleTodayStarted = async () => {
    const todayIso = formatDate(new Date());

    const newLogs: PeriodLog[] = [{ startDate: todayIso }];
    setLogs(newLogs);
    setInputLastStartDate(formatDateTRFromISO(todayIso));
    await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(newLogs));

    // 🔁 Yeni döngüye göre bildirimleri otomatik güncelle (sessiz)
    await scheduleCycleNotifications(newLogs, settings, { silent: true });

    Alert.alert(
      "Kaydedildi",
      "Bugünü regl başlangıcı olarak işaretledin. Tahmini sonraki tarih ve bildirimler bu güne göre güncellendi."
    );
  };

  const handleCalendarDayPress = async (day: DateObject) => {
    try {
      const pickedIso = day.dateString;

      // ✅ Gelecek tarih seçilemesin (takvim ISO döner)
      if (isFutureISODate(pickedIso)) {
        Alert.alert(
          "Geçersiz tarih",
          "Son regl başlangıcı ileri bir tarih olamaz. Lütfen bugünü veya geçmiş bir günü seç."
        );
        return;
      }

      setInputLastStartDate(formatDateTRFromISO(pickedIso));

      const newLogs: PeriodLog[] = [{ startDate: pickedIso }];
      setLogs(newLogs);

      await AsyncStorage.setItem(PERIOD_LOGS_KEY, JSON.stringify(newLogs));

      // 🔁 Yeni tarihe göre bildirimleri otomatik güncelle (sessiz)
      await scheduleCycleNotifications(newLogs, settings, { silent: true });
    } catch (e) {
      console.log("handleCalendarDayPress save error:", e);
      Alert.alert("Hata", "Tarih kaydedilemedi. Lütfen tekrar dene.");
    }
  };

  // ✅ SDK 54 + TS uyumlu: trigger = { type: DATE, date }
  // baseLogs & baseSettings parametreli, silent mod destekli
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

      const nextDate = new Date(next);
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
        if (silent) {
          // Otomatik modda izin istemiyoruz, sessizce vazgeç
          return;
        }

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

      // 2 gün önce (ileri bir tarihse)
      if (beforeDate > now) {
        const beforeId = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Reglin yaklaşıyor 🌸",
            body: "Regline 2 gün kaldı. Yanına tampon veya ped almayı ihmal etme.",
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

      // Tahmini regl günü
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

      await AsyncStorage.setItem(
        CYCLE_NOTIFICATION_IDS_KEY,
        JSON.stringify(ids)
      );

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
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.pageTitle}>Regl Takvimi</Text>
          <Text style={styles.pageSubtitle}>
            Regl başlangıçlarını, modunu ve semptomlarını takip ederek bedeninle
            daha uyumlu bir ritim yakalayabilirsin.
          </Text>

          {/* ✅ Bildirim butonu: döngü özetinin hemen üstünde */}
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

          {/* Döngü Özeti */}
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

          {/* ✅ Takvim: döngü özetinin altına alındı */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Takvim Görünümü</Text>
            <Text style={styles.cardDescription}>
              Son regl başlangıcını takvimden de seçebilirsin.
              Geçmiş regl günlerin, tahmini regl dönemlerin ve verimli günlerin
              renklerle işaretlenir.
            </Text>

            <Calendar
              onDayPress={handleCalendarDayPress}
              markedDates={markedDates}
              maxDate={todayKey} // ✅ gelecek günler seçilemez
              theme={{
                todayTextColor: "#B0756F",
                arrowColor: "#B0756F",
              }}
            />

            <View style={styles.legendContainer}>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#FF6B81" }]}
                />
                <Text style={styles.legendText}>
                  Kırmızı alanlar: Regl olduğun günler
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#C4A1FF" }]}
                />
                <Text style={styles.legendText}>
                  Mor alanlar: Tahmini bir sonraki regl döneminin günleri
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[styles.legendColor, { backgroundColor: "#FFE3F0" }]}
                />
                <Text style={styles.legendText}>
                  Açık pembe alanlar: Tahmini verimli günlerin
                </Text>
              </View>
              <View style={styles.legendRow}>
                <View
                  style={[
                    styles.legendColor,
                    { backgroundColor: "#FF9EC4", borderRadius: 999 },
                  ]}
                />
                <Text style={styles.legendText}>
                  Pembe nokta: Tahmini ovülasyon günün
                </Text>
              </View>
            </View>
          </View>

          {/* Bugün Regl Başladı butonu */}
          <Pressable style={styles.primaryButton} onPress={handleTodayStarted}>
            <Text style={styles.primaryButtonText}>Bugün Regl Başladı</Text>
          </Pressable>
          <Text style={styles.helperText}>
            Reglinin ilk gününde bu butona dokunarak döngünü güncellersin.
          </Text>

          {/* Bugünkü faz */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bugün Döngünün Fazı</Text>
            <Text style={styles.phaseTitle}>{phaseInfo.title}</Text>
            <Text style={styles.phaseText}>{phaseInfo.description}</Text>
            <Text style={styles.phaseSuggestion}>{phaseInfo.suggestion}</Text>
          </View>

          {/* Mod & Semptom */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Bugünkü Modun & Semptomların</Text>
            <Text style={styles.cardDescription}>
              Bugün nasıl hissettiğini ve bedeninde neler olduğunu kısaca
              işaretleyebilirsin. Böylece zaman içinde döngüyle birlikte
              modunun nasıl değiştiğini daha net görebilirsin.
            </Text>

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

            <Text style={styles.helperText}>
              Modunu ve semptomlarını her gün birkaç saniyede işaretleyebilirsin.
              Bu kayıtlar sadece senin cihazında saklanır.
            </Text>
          </View>

          {/* Ayarlar */}
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

            <Text style={styles.helperText}>
              Son regl başlangıcını veya döngü süreni değiştirdiğinde uygulama,
              bildirimleri otomatik olarak günceller. İstersen döngü bilgilerini yukarıdaki
              butondan manuel olarak da ayarlayabilirsin.
            </Text>
          </View>
        </ScrollView>

        {/* 🔹 Alt bant reklam (native + web-safe AdBanner) */}
        <PeriodBannerAd />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: "#FFF7F3",
  },

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

  helperText: { fontSize: 12, color: "#887473", marginTop: 4, marginBottom: 8 },

  inputLabel: { fontSize: 13, color: "#5A3A35", marginTop: 8, marginBottom: 4 },
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

  legendContainer: { marginTop: 12 },
  legendRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  legendColor: { width: 16, height: 16, marginRight: 8, borderRadius: 4 },
  legendText: { fontSize: 12, color: "#5A3A35", flex: 1 },

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
});
