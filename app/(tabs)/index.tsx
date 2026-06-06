// app/(tabs)/index.tsx

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AdBanner from "../../components/AdBanner";
import { type CategoryId } from "../../data/content";
import { weeklyArchive, type WeeklyItem } from "../../data/weekly";
import {
  fetchActiveAnnouncements,
  type HomeAnnouncement,
} from "../../lib/announcementsRemote";
import { fetchLatestArticlesRemote } from "../../lib/categoriesRemote";
import {
  formatDateTRFromISO,
  getCyclePhaseInfo,
  getNextPeriodStart,
  toISODate,
} from "../../lib/cycle";
import { fetchLatestWeekly } from "../../lib/weeklyRemote";
import { CATEGORY_ICONS, type CategoryKey } from "../_ui/categoryIcons";
import SponsorSplash from "../components/SponsorSplash";

console.log("runtimeVersion", Updates.runtimeVersion);
console.log("updateId", Updates.updateId);
console.log("channel", Updates.channel);
console.log("appVersion", Constants.expoConfig?.version);

const FAVORITES_KEY = "favorite_articles";
const ANNOUNCEMENT_READ_IDS_KEY = "wellshe_announcement_read_ids";
const ANNOUNCEMENT_DELETED_IDS_KEY = "wellshe_announcement_deleted_ids";


// 🔔 Hatırlatıcılar için AsyncStorage anahtarları (id’leri saklarız)
const WATER_IDS_KEY = "wellshe_water_notification_ids";
const MOVE_IDS_KEY = "wellshe_move_notification_ids";
const ASTRO_IDS_KEY = "wellshe_astro_notification_ids";
const WATER_REMINDER_SETTINGS_KEY = "wellshe_water_reminder_settings_v1";
const MOVE_REMINDER_SETTINGS_KEY = "wellshe_move_reminder_settings_v1";

// ✅ OTA prompt davranışı (session bazlı)
const OTA_SESSION_SUPPRESS_KEY = "wellshe_ota_suppress_this_session";

// 🔴 Regl verileri için olası anahtarlar (eski + yeni)
const PERIOD_SETTINGS_KEYS = [
  "wellshe_period_settings",
  "period_settings",
  "periodSettings",
];

const PERIOD_LOGS_KEYS = ["wellshe_period_logs", "period_logs", "periodLogs"];

type PeriodSettings = {
  averageCycleLength: number; // ortalama döngü süresi
  periodLength: number; // regl süresi
};

type PeriodLog = {
  startDate: string; // "2025-11-10" gibi (ISO)
};

type WaterReminderSettings = {
  enabled: boolean;
  startTime: string;
  endTime: string;
  intervalMinutes: number;
};

type MoveReminderSettings = {
  enabled: boolean;
  times: string[];
};

type CyclePhase =
  | "menstruation"
  | "follicular"
  | "ovulation"
  | "luteal"
  | "unknown";

// Bildirimlerin nasıl gösterileceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const silent = notification.request.content.data?.silent === true;

    return {
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: !silent,
      shouldSetBadge: false,
    };
  },
});

// ✅ Bildirim helper’ları (HomeScreen’in ÜSTÜNDE durmalı)
async function ensureNotificationPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === "granted") return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

const SILENT_REMINDER_CHANNEL_ID = "reminders";
const SOUND_REMINDER_CHANNEL_ID = "reminders_sound_v1";

async function ensureAndroidChannel(channelId = SILENT_REMINDER_CHANNEL_ID) {
  if (Platform.OS !== "android") return;

  try {
    const isSoundChannel = channelId === SOUND_REMINDER_CHANNEL_ID;

    await Notifications.setNotificationChannelAsync(channelId, {
      name: isSoundChannel ? "Sesli Hatırlatmalar" : "Hatırlatmalar",
      importance: isSoundChannel
        ? Notifications.AndroidImportance.HIGH
        : Notifications.AndroidImportance.DEFAULT,
      ...(isSoundChannel ? { sound: "default" } : {}),
    });
  } catch {
    // no-op
  }
}

async function cancelStoredNotifications(key: string) {
  const existing = await AsyncStorage.getItem(key);
  if (!existing) return;

  try {
    const ids: string[] = JSON.parse(existing);
    await Promise.all(
      ids.map((id) =>
        Notifications.cancelScheduledNotificationAsync(id).catch(() => null)
      )
    );
  } catch {
    // no-op
  }

  await AsyncStorage.removeItem(key);
}

// 🔍 AsyncStorage'da olası anahtarlar arasından ilk bulunan değeri döndürür
async function getFirstExisting(keys: string[]) {
  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value) {
      console.log("Regl için bulunan key:", key);
      return value;
    }
  }
  console.log("Regl için hiç key bulunamadı:", keys);
  return null;
}

// ✅ Weekly fallback: arşiv dizisi hangi sırada olursa olsun "en güncel"i seç
function pickLatestWeekly(
  arr: WeeklyItem[] | undefined | null
): WeeklyItem | null {
  if (!arr || arr.length === 0) return null;

  const getKey = (x: any) =>
    String(
      x?.created_at ??
      x?.createdAt ??
      x?.date ??
      x?.week_start ??
      x?.weekStart ??
      x?.week_label ??
      x?.weekLabel ??
      ""
    );

  const sorted = [...arr].sort((a: any, b: any) =>
    getKey(b).localeCompare(getKey(a))
  );
  return sorted[0] ?? arr[0] ?? null;
}

function parseStoredIdList(raw: string | null): string[] {
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed.filter((item) => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function formatAnnouncementDate(value?: string | null) {
  if (!value) return "";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";

  return parsed.toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// Kategori menüsü
const categories: { key: CategoryKey; label: string }[] = [
  { key: "healthyEating", label: "Sağlıklı\nBeslenme" },
  { key: "relationships", label: "İlişkiler" },
  { key: "wellbeing", label: "Wellbeing" },
  { key: "sport", label: "Spor" },
  { key: "fashion", label: "Moda" },
  { key: "beauty", label: "Güzellik" },
  { key: "astrology", label: "Astroloji" },
  { key: "travel", label: "Seyahat" },
  { key: "home", label: "Ev / Yaşam" },
];

// Kategori etiketleri (Son eklenen içerikler için)
const categoryLabels: Record<CategoryId, string> = {
  healthyEating: "Sağlıklı Beslenme",
  relationships: "İlişkiler",
  wellbeing: "Wellbeing",
  sport: "Spor",
  fashion: "Moda",
  beauty: "Güzellik",
  astrology: "Astroloji",
  travel: "Seyahat",
  home: "Ev / Yaşam",
};

const LATEST_CATEGORY_IMAGES: Record<CategoryKey, any> = {
  healthyEating: require("../../assets/images/home/latest/healthy-eating.png"),
  relationships: require("../../assets/images/home/latest/relationships.png"),
  wellbeing: require("../../assets/images/home/latest/wellbeing.png"),
  sport: require("../../assets/images/home/latest/sport.png"),
  fashion: require("../../assets/images/home/latest/fashion.png"),
  beauty: require("../../assets/images/home/latest/beauty.png"),
  astrology: require("../../assets/images/home/latest/astrology.png"),
  travel: require("../../assets/images/home/latest/travel.png"),
  home: require("../../assets/images/home/latest/home.png"),
};

const FEATURED_HOME_IMAGES = {
  calorie: require("../../assets/images/home/featured/calorie-card.png"),
};

const WEEKLY_FEATURED_IMAGES = {
  movie: require("../../assets/images/home/weekly/movie-card.png"),
  music: require("../../assets/images/home/weekly/music-card.png"),
  book: require("../../assets/images/home/weekly/book-card.png"),
};

// 🔥 Motivasyon cümleleri
const MOTIVATION_QUOTES: string[] = [
  "Bugün kendin için en az bir küçük iyilik yap. Küçük adımlar, büyük değişim yaratır.",
  "Kendine karşı nazik ol. Unutma, en çok kendi desteğine ihtiyacın var.",
  "Bugün mükemmel olmak zorunda değilsin, sadece ilerlemen yeterli.",
  "Küçük bir adım bile yerinde saymaktan daha iyidir.",
  "Dinlenmek, pes etmek değildir. Yeniden başlamak için nefes almaktır.",
  "Kendini sevdiğinde dünya sana farklı görünmeye başlar.",
  "Yarının daha iyi olması için yapabileceğin minicik bir şey seç.",
  "İç sesini duy, zaten sandığından daha güçlüsün!",
  "Bugün kendin için attığın her küçük adım, yarın büyük bir değişime dönüşür.",
  "Kendine iyi baktığında hayatın her alanı iyileşir.",
  "Bugün, yeni bir başlangıç için en doğru zaman.",
  "Küçük ilerlemeler büyük yolculukların temelidir.",
  "Kendine inandığında geri kalan her şeyin yolu açılır.",
  "Dengeni bulduğunda hayatın ritmi değişir.",
  "Zihnini sadeleştir, yolun netleşsin.",
  "Senin için doğru olan zaten sana gelir.",
  "Kendine verdiğin söz, en değerli sözdür.",
  "Bugün de pes etme. Çünkü hikâyen yeni başlıyor.",
  "Kendini geliştirmek, kendine verebileceğin en güzel hediye.",
  "Bir adım at, bırak yol seni karşılasın.",
  "Kendini sevmek, hayatın kapısını açar.",
  "Nefes al, sakinleş ve enerjini tazele.",
  "Bugün, yapabildiğinin en iyisini yapman yeterli.",
  "Yavaş ilerlemek de bir ilerleme.",
  "Kendini zorladığın her gün biraz daha güçlenirsin.",
  "Odaklandığın şey büyür, iyiyi seç.",
  "Zihnini sakinleştirdiğinde kalbin konuşur.",
  "Hiçbir şey tesadüf değil. Her şey büyük bir bulmacanın parçası.",
  "Senin yolun, senin hızın.",
  "İyileşmek bir yolculuk. Ve yol, adım adım güzelleşir.",
  "Kendine sınır koyma, potansiyelin düşündüğünden büyük.",
  "İçindeki güç, sandığından daha fazla.",
  "Bir dur, nefes al ve devam et.",
  "Unutma, değişim küçük bir karar ile başlar.",
  "Kendini affet. Yeniden başlamak özgürlüktür.",
  "Her gün, bir önceki günden daha iyi olabilirsin.",
  "Bugün kendine verdiğin her emek, yarın mutluluk olur.",
  "Enerjini koru. Her yere yetişmek zorunda değilsin.",
  "Zor günler, güçlenen senin habercisidir.",
  "Şefkatle yaklaş. En çok da kendine.",
  "Cesaret, korkunun yokluğu değil; ona rağmen yürümektir.",
  "Hayat, seninle birlikte şekilleniyor.",
  "Kendine zaman tanı. Her şey yoluna girecek.",
  "Sen aynı anda hem başlangıç hem mucizesin.",
  "Güne iyi bir niyetle başla, gerisi akacaktır.",
  "Bugün hayatına iyi gelecek bir seçim yap.",
  "Zorluklar seni durdurmak için değil, güçlendirmek için var.",
  "En büyük değişim, en sessiz anda başlar.",
  "İç huzurun her şeyden değerli.",
  "Düşünmek yetmez, harekete geç!",
  "Kendine yüklenme, her şeyin bir zamanı var.",
  "Işığını saklama! Dünya senin enerjine ihtiyaç duyuyor.",
  "Bugün, potansiyelini hatırlama günü olsun.",
  "Kendine güven, en sağlam temel odur.",
  "Düştüğünde değil, kalktığında güçlenirsin.",
  "Başarı, sabırlı olanları sever.",
  "Bugün, zihnini yenilemek için bir fırsat.",
  "Kendinle barıştığında dünya da seninle barışır.",
  "Küçük gelişmeleri kutla. Onlar sana güç verir.",
  "Hayallerin sandığından daha yakın!",
  "Kendinle gurur duy, bugünlere kolay gelmedin!",
  "Rekabet etmen gereken tek kişi, dünkü sensin.",
  "Bugün, yeniden başlamak için mükemmel bir gün.",
  "Zihnini karıştıran şeyleri sadeleştir.",
  "Enerjini doğru yere yönlendirdiğinde sonuçların değiştiğini görebilirsin.",
  "İç sesini dinle, en doğru cevap onda.",
  "Kendini keşfetmek, en büyük yolculuktur.",
  "Kendini olduğun gibi kabul etmek, özgürlüktür.",
  "Ne kadar yol alacağını bugün attığın adım belirler.",
  "Cesaretinle hayatına yön verebilirsin.",
  "Beklediğin değişim seninle başlar.",
  "Kendin için durduğunda bile ilerliyorsun.",
  "Bugün güzellikleri fark etmeye niyet et.",
  "Hayat senden yana. Yeter ki sen de kendinden yana ol.",
  "En zor günün bile içinde bir kıvılcım vardır.",
  "Her gün, yeniden başlamak için bir şans.",
  "Kalbini dinlediğinde yolunu bulursun.",
  "Ne kadar ilerlediğini fark etmek için bir an dur.",
  "Kendine alan aç. Büyümek için buna ihtiyacın var.",
  "Şimdi başla! Mükemmel anı bekleme.",
  "Kendini, olduğundan daha iyi bir yere taşıyabilirsin.",
  "Bugün hayatına iyi gelen şeylere odaklan.",
  "Kendini yenilemek adına harekete geçmek için asla geç değil.",
  "Şefkati bir prensip hâline getir. En çok da kendin için.",
  "Zihnin sakinleştiğinde çözümler belirir.",
  "Adım adım ilerlediğinde büyük işleri başarırsın.",
  "Kendine inandığında evren de seninle birlikte çalışır.",
  "İçindeki huzur en güzel rehberin.",
  "Kendini hafife alma, potansiyelin büyük!",
  "Bugün daha iyi bir sen yaratmak için harika bir gün.",
  "Sen bu yolculuğun en değerli parçasısın.",
];

const MOTIVATION_START_DATE = new Date("2025-01-01").getTime();
const WATER_GOAL = 6;
const WATER_TRACK_KEY = "wellshe_water_today";

const DEFAULT_WATER_REMINDER_SETTINGS: WaterReminderSettings = {
  enabled: false,
  startTime: "09:00",
  endTime: "22:00",
  intervalMinutes: 60,
};

const DEFAULT_MOVE_REMINDER_SETTINGS: MoveReminderSettings = {
  enabled: false,
  times: ["10:00", "13:30", "17:45"],
};

const WATER_INTERVAL_PRESETS = [30, 45, 60, 90, 120, 180, 240];
const MAX_MOVE_REMINDER_TIMES = 8;

// 🔁 Faz anahtarından tek cümlelik mini öneri (Home kartı için)
function getPhaseOneLinerFromKey(phaseKey: CyclePhase): string {
  if (phaseKey === "menstruation") {
    return "Regl fazındasın. Tempoyu biraz düşürmek, sıcak içecekler hazırlamak ve yumuşak dinlenme alanları yaratmak bedenine çok iyi gelebilir.";
  }
  if (phaseKey === "follicular") {
    return "Folikül fazındasın. Yeni başlangıçlar ve plan yapmak, hafif hareketle rutine dönmek için destekleyici bir dönemdesin.";
  }
  if (phaseKey === "ovulation") {
    return "Ovülasyon fazındasın. Enerjinin yükseldiği bu dönemde sosyalleşmek ve üretmek için kendine alan açabilirsin.";
  }
  if (phaseKey === "luteal") {
    return "Luteal fazdasın. Enerjini korumak için sınır çizmen, yapılacakları sadeleştirmen ve dinlenmeye alan açman çok kıymetli.";
  }
  return "Bugün bedenini gözlemleyip ihtiyacına göre küçük bir iyilik yapman çok değerli.";
}

function getTodayMotivation(): string {
  const today = new Date().getTime();
  const diffDays = Math.floor(
    (today - MOTIVATION_START_DATE) / (1000 * 60 * 60 * 24)
  );
  const index =
    ((diffDays % MOTIVATION_QUOTES.length) + MOTIVATION_QUOTES.length) %
    MOTIVATION_QUOTES.length;
  return MOTIVATION_QUOTES[index];
}

function padTimePart(value: number) {
  return String(value).padStart(2, "0");
}

function normalizeClockInput(value: string): string | null {
  const raw = value.trim().replace(".", ":");

  if (!raw) return null;

  const colonMatch = raw.match(/^(\d{1,2}):(\d{1,2})$/);
  if (colonMatch) {
    const hour = Number(colonMatch[1]);
    const minute = Number(colonMatch[2]);

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${padTimePart(hour)}:${padTimePart(minute)}`;
    }

    return null;
  }

  const digits = raw.replace(/\D/g, "");

  if (digits.length <= 2) {
    const hour = Number(digits);
    if (hour >= 0 && hour <= 23) return `${padTimePart(hour)}:00`;
    return null;
  }

  if (digits.length === 3 || digits.length === 4) {
    const hour = Number(digits.slice(0, digits.length - 2));
    const minute = Number(digits.slice(-2));

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${padTimePart(hour)}:${padTimePart(minute)}`;
    }
  }

  return null;
}

function minutesFromClock(value: string): number | null {
  const normalized = normalizeClockInput(value);
  if (!normalized) return null;

  const [hour, minute] = normalized.split(":").map(Number);
  return hour * 60 + minute;
}

function clockFromMinutes(value: number) {
  const minutesInDay = 24 * 60;
  const normalized = ((value % minutesInDay) + minutesInDay) % minutesInDay;
  const hour = Math.floor(normalized / 60);
  const minute = normalized % 60;

  return `${padTimePart(hour)}:${padTimePart(minute)}`;
}

function buildWaterReminderTimes(
  startTime: string,
  endTime: string,
  intervalMinutes: number
): string[] {
  const start = minutesFromClock(startTime);
  const end = minutesFromClock(endTime);

  if (start == null || end == null || end <= start || intervalMinutes <= 0) {
    return [];
  }

  const times: string[] = [];

  for (let current = start; current <= end; current += intervalMinutes) {
    times.push(clockFromMinutes(current));
  }

  return times;
}

function sanitizeMoveTimes(times: string[]): string[] {
  const normalized = times
    .map((time) => normalizeClockInput(time))
    .filter((time): time is string => !!time);

  return Array.from(new Set(normalized)).sort((a, b) => {
    const aMinutes = minutesFromClock(a) ?? 0;
    const bMinutes = minutesFromClock(b) ?? 0;
    return aMinutes - bMinutes;
  });
}

function formatTimesForAlert(times: string[]) {
  if (times.length <= 4) return times.join(", ");
  return `${times.slice(0, 4).join(", ")} ve ${times.length - 4} saat daha`;
}

function parseWaterReminderSettings(raw: string | null): WaterReminderSettings {
  if (!raw) return DEFAULT_WATER_REMINDER_SETTINGS;

  try {
    const parsed = JSON.parse(raw);
    const startTime = normalizeClockInput(String(parsed?.startTime ?? ""));
    const endTime = normalizeClockInput(String(parsed?.endTime ?? ""));
    const intervalMinutes = Number(parsed?.intervalMinutes);

    if (!startTime || !endTime || !Number.isFinite(intervalMinutes)) {
      return DEFAULT_WATER_REMINDER_SETTINGS;
    }

    return {
      enabled: Boolean(parsed?.enabled),
      startTime,
      endTime,
      intervalMinutes: Math.round(intervalMinutes),
    };
  } catch {
    return DEFAULT_WATER_REMINDER_SETTINGS;
  }
}

function parseMoveReminderSettings(raw: string | null): MoveReminderSettings {
  if (!raw) return DEFAULT_MOVE_REMINDER_SETTINGS;

  try {
    const parsed = JSON.parse(raw);
    const times = sanitizeMoveTimes(Array.isArray(parsed?.times) ? parsed.times : []);

    return {
      enabled: Boolean(parsed?.enabled),
      times: times.length > 0 ? times : DEFAULT_MOVE_REMINDER_SETTINGS.times,
    };
  } catch {
    return DEFAULT_MOVE_REMINDER_SETTINGS;
  }
}

export default function HomeScreen() {
  const [showSponsor, setShowSponsor] = useState(true);

  // Home mount log
  useEffect(() => {
    console.log("HOME INDEX LOADED ✅", new Date().toISOString());

    void trackEvent({
      event_name: "screen_view",
      screen_name: "home",
    });
  }, []);

  useTrackScreenDuration({
    screen_name: "home",
  });

  const router = useRouter();

  // DB -> UI kategori label map
  const dbCategoryLabels = useMemo<Record<string, string>>(
    () => ({
      healthy_eating: "Sağlıklı Beslenme",
      home_living: "Ev / Yaşam",
      wellbeing: "Wellbeing",
      relationships: "İlişkiler",
      sport: "Spor",
      fashion: "Moda",
      beauty: "Güzellik",
      astrology: "Astroloji",
      travel: "Seyahat",
    }),
    []
  );

  // OTA debug görünürlüğü
  const showOtaDebug = useMemo(() => {
    const channel = (Updates as any)?.channel ?? "";
    return __DEV__ || String(channel).toLowerCase() === "preview";
  }, []);

  const otaSuppressedThisSessionRef = useRef(false);

  useEffect(() => {
    const initSessionSuppression = async () => {
      try {
        const stored = await AsyncStorage.getItem(OTA_SESSION_SUPPRESS_KEY);
        if (stored === "1") otaSuppressedThisSessionRef.current = true;
      } catch {
        // no-op
      }
    };
    void initSessionSuppression();
  }, []);

  useEffect(() => {
    const checkForOta = async () => {
      try {
        if (otaSuppressedThisSessionRef.current) return;

        const update = await Updates.checkForUpdateAsync();

        if (update.isAvailable) {
          Alert.alert(
            "Güncelleme Var",
            "Uygulamanın yeni bir sürümü hazır. Şimdi güncellemek ister misiniz?",
            [
              {
                text: "Sonra",
                style: "cancel",
                onPress: async () => {
                  otaSuppressedThisSessionRef.current = true;
                  try {
                    await AsyncStorage.setItem(OTA_SESSION_SUPPRESS_KEY, "1");
                  } catch {
                    // no-op
                  }
                },
              },
              {
                text: "Güncelle",
                onPress: async () => {
                  try {
                    await Updates.fetchUpdateAsync();
                    await Updates.reloadAsync();
                  } catch (e) {
                    console.log("OTA fetch/reload failed:", e);
                  }
                },
              },
            ]
          );
        }
      } catch (e) {
        console.log("OTA check failed:", e);
      }
    };

    void checkForOta();
  }, []);

  // ✅ Home: Son eklenenler (SADECE Supabase)
  const [latestRemote, setLatestRemote] = useState<
    {
      id: string;
      title: string;
      summary: string;
      slug: string | null;
      categoryLabel: string;
      categoryKey: CategoryKey | null;
      coverUrl: string | null;
    }[]
  >([]);
  const [latestRemoteLoading, setLatestRemoteLoading] = useState(false);

  const loadLatestRemote = useCallback(async () => {
    try {
      setLatestRemoteLoading(true);

      const rows = await fetchLatestArticlesRemote(3);
      console.log("[Home latest] rows:", rows);

      const dbToAppCategoryKey: Record<string, CategoryKey> = {
        healthy_eating: "healthyEating",
        home_living: "home",
        wellbeing: "wellbeing",
        relationships: "relationships",
        sport: "sport",
        fashion: "fashion",
        beauty: "beauty",
        astrology: "astrology",
        travel: "travel",
      };

      const mapped = (rows ?? []).map((r: any) => {
        const dbCat = String(r.category_id ?? "");
        const title = String(r.title ?? "").trim();
        const summary = String(r.summary ?? "").trim();

        return {
          id: String(r.article_id),
          title: title || "Başlık yok",
          summary,
          slug: r.slug ?? null,
          categoryLabel: dbCategoryLabels[dbCat] ?? (dbCat || "Kategori"),
          categoryKey: dbToAppCategoryKey[dbCat] ?? null,
          coverUrl: r.imageUrl ?? null,
        };
      });

      setLatestRemote(mapped);
    } catch (e) {
      console.log("Home latest remote hata:", e);
      setLatestRemote([]);
    } finally {
      setLatestRemoteLoading(false);
    }
  }, [dbCategoryLabels]);

  // FAVORİ SİSTEMİ
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const loadFavorites = async () => {
    try {
      const json = await AsyncStorage.getItem(FAVORITES_KEY);
      setFavoriteIds(json ? JSON.parse(json) : []);
    } catch (e) {
      console.log("Favoriler yüklenirken hata:", e);
      setFavoriteIds([]);
    }
  };

  useEffect(() => {
    void loadFavorites();
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadFavorites();
    }, [])
  );

  const toggleFavorite = async (articleId: string) => {
    try {
      const updated = favoriteIds.includes(articleId)
        ? favoriteIds.filter((id) => id !== articleId)
        : [...favoriteIds, articleId];

      setFavoriteIds(updated);
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log("Favori güncellenirken hata:", e);
    }
  };

  const isFavorite = (articleId: string) => favoriteIds.includes(articleId);

  const [name, setName] = useState<string | null>(null);
  const [tempName, setTempName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [waterCount, setWaterCount] = useState(0);
  const [homeSearchQuery, setHomeSearchQuery] = useState("");

  const [waterReminderModalVisible, setWaterReminderModalVisible] =
    useState(false);
  const [moveReminderModalVisible, setMoveReminderModalVisible] =
    useState(false);

  const [waterReminderSettings, setWaterReminderSettings] =
    useState<WaterReminderSettings>(DEFAULT_WATER_REMINDER_SETTINGS);
  const [waterStartInput, setWaterStartInput] = useState(
    DEFAULT_WATER_REMINDER_SETTINGS.startTime
  );
  const [waterEndInput, setWaterEndInput] = useState(
    DEFAULT_WATER_REMINDER_SETTINGS.endTime
  );
  const [waterIntervalInput, setWaterIntervalInput] = useState(
    String(DEFAULT_WATER_REMINDER_SETTINGS.intervalMinutes)
  );

  const [moveReminderSettings, setMoveReminderSettings] =
    useState<MoveReminderSettings>(DEFAULT_MOVE_REMINDER_SETTINGS);
  const [moveReminderTimesInput, setMoveReminderTimesInput] = useState<string[]>(
    DEFAULT_MOVE_REMINDER_SETTINGS.times
  );
  const [moveTimeInput, setMoveTimeInput] = useState("13:00");

  const [announcements, setAnnouncements] = useState<HomeAnnouncement[]>([]);
  const [announcementsVisible, setAnnouncementsVisible] = useState(false);
  const [readAnnouncementIds, setReadAnnouncementIds] = useState<string[]>([]);
  const [deletedAnnouncementIds, setDeletedAnnouncementIds] = useState<string[]>(
    []
  );

  const loadAnnouncements = useCallback(async () => {
    try {
      const [remoteAnnouncements, readRaw, deletedRaw] = await Promise.all([
        fetchActiveAnnouncements(),
        AsyncStorage.getItem(ANNOUNCEMENT_READ_IDS_KEY),
        AsyncStorage.getItem(ANNOUNCEMENT_DELETED_IDS_KEY),
      ]);

      setAnnouncements(remoteAnnouncements);
      setReadAnnouncementIds(parseStoredIdList(readRaw));
      setDeletedAnnouncementIds(parseStoredIdList(deletedRaw));
    } catch (e) {
      console.log("Duyurular yüklenirken hata:", e);
      setAnnouncements([]);
      setReadAnnouncementIds([]);
      setDeletedAnnouncementIds([]);
    }
  }, []);

  useEffect(() => {
    void loadAnnouncements();
  }, [loadAnnouncements]);

  useFocusEffect(
    useCallback(() => {
      void loadAnnouncements();
    }, [loadAnnouncements])
  );

  const loadReminderSettings = useCallback(async () => {
    try {
      const [waterRaw, moveRaw] = await Promise.all([
        AsyncStorage.getItem(WATER_REMINDER_SETTINGS_KEY),
        AsyncStorage.getItem(MOVE_REMINDER_SETTINGS_KEY),
      ]);

      const waterSettings = parseWaterReminderSettings(waterRaw);
      const moveSettings = parseMoveReminderSettings(moveRaw);

      setWaterReminderSettings(waterSettings);
      setWaterStartInput(waterSettings.startTime);
      setWaterEndInput(waterSettings.endTime);
      setWaterIntervalInput(String(waterSettings.intervalMinutes));

      setMoveReminderSettings(moveSettings);
      setMoveReminderTimesInput(moveSettings.times);
    } catch (e) {
      console.log("Hatırlatıcı ayarları yüklenirken hata:", e);
    }
  }, []);

  useEffect(() => {
    void loadReminderSettings();
  }, [loadReminderSettings]);

  useFocusEffect(
    useCallback(() => {
      void loadReminderSettings();
    }, [loadReminderSettings])
  );

  const activeAnnouncements = useMemo(
    () =>
      announcements.filter(
        (announcement) => !deletedAnnouncementIds.includes(announcement.id)
      ),
    [announcements, deletedAnnouncementIds]
  );

  const unreadAnnouncements = useMemo(
    () =>
      activeAnnouncements.filter(
        (announcement) => !readAnnouncementIds.includes(announcement.id)
      ),
    [activeAnnouncements, readAnnouncementIds]
  );

  const unreadAnnouncementCount = unreadAnnouncements.length;

  const handleOpenAnnouncements = () => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "announcements_open",
      meta: {
        total_announcements: activeAnnouncements.length,
        unread_announcements: unreadAnnouncementCount,
      },
    });

    setAnnouncementsVisible(true);
  };

  const handleMarkAnnouncementRead = async (announcement: HomeAnnouncement) => {
    if (readAnnouncementIds.includes(announcement.id)) return;

    const next = Array.from(new Set([...readAnnouncementIds, announcement.id]));

    setReadAnnouncementIds(next);

    try {
      await AsyncStorage.setItem(
        ANNOUNCEMENT_READ_IDS_KEY,
        JSON.stringify(next)
      );
    } catch (e) {
      console.log("Duyuru okundu kaydı hatası:", e);
    }

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "announcement_mark_read",
      meta: {
        announcement_id: announcement.id,
        announcement_title: announcement.title,
      },
    });
  };

  const handleDeleteAnnouncement = async (announcement: HomeAnnouncement) => {
    const nextDeleted = Array.from(
      new Set([...deletedAnnouncementIds, announcement.id])
    );

    const nextRead = Array.from(
      new Set([...readAnnouncementIds, announcement.id])
    );

    setDeletedAnnouncementIds(nextDeleted);
    setReadAnnouncementIds(nextRead);

    try {
      await Promise.all([
        AsyncStorage.setItem(
          ANNOUNCEMENT_DELETED_IDS_KEY,
          JSON.stringify(nextDeleted)
        ),
        AsyncStorage.setItem(
          ANNOUNCEMENT_READ_IDS_KEY,
          JSON.stringify(nextRead)
        ),
      ]);
    } catch (e) {
      console.log("Duyuru silme kaydı hatası:", e);
    }

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "announcement_delete",
      meta: {
        announcement_id: announcement.id,
        announcement_title: announcement.title,
      },
    });
  };

  // 🔹 Su sayacı – gün bazlı kalıcı hale getir
  const loadWaterForToday = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(WATER_TRACK_KEY);
      const todayKey = toISODate(new Date());

      if (!raw) {
        setWaterCount(0);
        await AsyncStorage.setItem(
          WATER_TRACK_KEY,
          JSON.stringify({ date: todayKey, count: 0 })
        );
        return;
      }

      const parsed = JSON.parse(raw);

      if (parsed?.date === todayKey && typeof parsed.count === "number") {
        setWaterCount(parsed.count);
      } else {
        setWaterCount(0);
        await AsyncStorage.setItem(
          WATER_TRACK_KEY,
          JSON.stringify({ date: todayKey, count: 0 })
        );
      }
    } catch (e) {
      console.log("Su sayacı yüklenirken hata:", e);
      setWaterCount(0);
    }
  }, []);

  useEffect(() => {
    void loadWaterForToday();
  }, [loadWaterForToday]);

  useFocusEffect(
    useCallback(() => {
      void loadWaterForToday();
    }, [loadWaterForToday])
  );

  // ✅ OTA debug state
  const [otaDebug, setOtaDebug] = useState<string>("");

  useEffect(() => {
    if (!showOtaDebug) return;

    const channel = (Updates as any).channel ?? "-";
    const runtime = Updates.runtimeVersion ?? "-";
    const updateId = (Updates as any).updateId ?? "-";
    const createdAt = (Updates as any).createdAt
      ? String((Updates as any).createdAt)
      : "-";
    const isEmbedded = (Updates as any).isEmbeddedLaunch ?? "-";

    setOtaDebug(
      `channel: ${channel}\nruntime: ${runtime}\nupdateId: ${updateId}\ncreatedAt: ${createdAt}\nembedded: ${isEmbedded}`
    );
  }, [showOtaDebug]);

  const checkAndApplyOta = async () => {
    try {
      const r = await Updates.checkForUpdateAsync();
      if (!r.isAvailable) {
        Alert.alert("OTA", "Bu build için yeni update bulunamadı.");
        return;
      }

      Alert.alert("OTA", "Yeni update bulundu. İndiriliyor...");
      await Updates.fetchUpdateAsync();
      await Updates.reloadAsync();
    } catch (e: any) {
      Alert.alert(
        "OTA Hata",
        e?.message ?? "Update kontrolünde hata oluştu."
      );
    }
  };

  const reloadOnly = async () => {
    try {
      await Updates.reloadAsync();
    } catch {
      // no-op
    }
  };

  // ✅ Haftalık önerileri remote + fallback
  const [weeklyLatest, setWeeklyLatest] = useState<{
    movie: WeeklyItem | null;
    music: WeeklyItem | null;
    book: WeeklyItem | null;
  } | null>(null);

  // Regl bilgisi (tek kaynak: lib/cycle)
  const [cycleInfo, setCycleInfo] = useState<{
    phaseKey: CyclePhase;
    phaseTitle: string;
    phaseDescription: string;
    nextPeriodDateText: string;
    statusText: string;
    cycleDayLabel: string;
  } | null>(null);

  const motivationText = getTodayMotivation();
  const phaseOneLiner = cycleInfo
    ? getPhaseOneLinerFromKey(cycleInfo.phaseKey)
    : null;

  // Kullanıcı adını yükle
  useEffect(() => {
    const loadUser = async () => {
      try {
        let storedName: string | null = null;

        try {
          storedName = await SecureStore.getItemAsync("userName");
        } catch (e) {
          console.log("SecureStore okunurken hata:", e);
        }

        if (!storedName) {
          try {
            storedName = await AsyncStorage.getItem("userName");
          } catch (e2) {
            console.log("AsyncStorage okunurken hata:", e2);
          }
        }

        if (storedName) setName(storedName);
      } finally {
        setIsLoading(false);
      }
    };

    void loadUser();
  }, []);

  // ✅ Weekly verisini ekrana her dönüşte yenile
  useFocusEffect(
    useCallback(() => {
      let isMounted = true;

      (async () => {
        try {
          const [movie, music, book] = await Promise.all([
            fetchLatestWeekly("movie"),
            fetchLatestWeekly("music"),
            fetchLatestWeekly("book"),
          ]);

          if (!isMounted) return;

          setWeeklyLatest({
            movie: movie ?? pickLatestWeekly(weeklyArchive.movie),
            music: music ?? pickLatestWeekly(weeklyArchive.music),
            book: book ?? pickLatestWeekly(weeklyArchive.book),
          });
        } catch {
          if (!isMounted) return;
          setWeeklyLatest({
            movie: pickLatestWeekly(weeklyArchive.movie),
            music: pickLatestWeekly(weeklyArchive.music),
            book: pickLatestWeekly(weeklyArchive.book),
          });
        }
      })();

      return () => {
        isMounted = false;
      };
    }, [])
  );

  const latestMovie = weeklyLatest?.movie ?? pickLatestWeekly(weeklyArchive.movie);
  const latestMusic = weeklyLatest?.music ?? pickLatestWeekly(weeklyArchive.music);
  const latestBook = weeklyLatest?.book ?? pickLatestWeekly(weeklyArchive.book);

  const getWeeklyTeaser = (item: WeeklyItem | null, fallback: string) =>
    String((item as any)?.teaser ?? fallback).trim();

  const movieWeeklyTeaser = getWeeklyTeaser(
    latestMovie,
    "Bu haftanın ilham veren yapımını keşfet."
  );

  const musicWeeklyTeaser = getWeeklyTeaser(
    latestMusic,
    "Bu haftanın müzik önerisini keşfet."
  );

  const bookWeeklyTeaser = getWeeklyTeaser(
    latestBook,
    "Bu haftanın kitap önerisini keşfet."
  );

  useEffect(() => {
    if (!name || showSponsor) return;

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "sponsor_view",
      meta: {
        sponsor_name: "Global Solar",
        placement: "home_sponsor_row",
      },
    });
  }, [name, showSponsor]);

  // Regl verilerini storage'dan okuyup cycleInfo'yu güncelleyen fonksiyon
  const loadPeriodData = useCallback(async () => {
    try {
      const [settingsRaw, logsRaw] = await Promise.all([
        getFirstExisting(PERIOD_SETTINGS_KEYS),
        getFirstExisting(PERIOD_LOGS_KEYS),
      ]);

      console.log("🔴 PERIOD DEBUG - RAW values:", { settingsRaw, logsRaw });

      if (!settingsRaw || !logsRaw) {
        setCycleInfo(null);
        return;
      }

      let settings: PeriodSettings;
      let logs: PeriodLog[] = [];

      try {
        settings = JSON.parse(settingsRaw);
      } catch (e) {
        console.log("❌ PERIOD DEBUG - settings JSON parse hatası:", e);
        setCycleInfo(null);
        return;
      }

      try {
        const parsedLogs = JSON.parse(logsRaw);

        if (Array.isArray(parsedLogs)) {
          logs = parsedLogs;
        } else if (parsedLogs && Array.isArray(parsedLogs.logs)) {
          logs = parsedLogs.logs;
        } else if (parsedLogs && parsedLogs.startDate) {
          logs = [parsedLogs as PeriodLog];
        } else {
          console.log("❌ PERIOD DEBUG - logs beklenen formatta değil:", parsedLogs);
          setCycleInfo(null);
          return;
        }
      } catch (e) {
        console.log("❌ PERIOD DEBUG - logs JSON parse hatası:", e);
        setCycleInfo(null);
        return;
      }

      const normalizedLogs = logs
        .filter((item) => !!item?.startDate)
        .sort((a, b) => a.startDate.localeCompare(b.startDate));

      if (!normalizedLogs.length) {
        setCycleInfo(null);
        return;
      }

      const phase = getCyclePhaseInfo(normalizedLogs, settings);
      const nextIso = getNextPeriodStart(normalizedLogs, settings);
      const nextPeriodDateText = nextIso
        ? formatDateTRFromISO(nextIso)
        : "Henüz hesaplanamıyor";

      const lastStartIso = normalizedLogs[normalizedLogs.length - 1].startDate;

      const dayMs = 24 * 60 * 60 * 1000;

      const parseIsoDate = (iso: string) => {
        const d = new Date(`${iso}T00:00:00`);
        d.setHours(0, 0, 0, 0);
        return d;
      };

      const todayIso = toISODate(new Date());
      const todayDate = parseIsoDate(todayIso);
      const lastStartDate = parseIsoDate(lastStartIso);
      const nextDate = nextIso ? parseIsoDate(nextIso) : null;

      const cycleDayRaw =
        Math.floor((todayDate.getTime() - lastStartDate.getTime()) / dayMs) + 1;

      const cycleDay =
        Number.isFinite(cycleDayRaw) && cycleDayRaw > 0 ? cycleDayRaw : 1;

      let statusText = "Takvimini güncel tut";

      if (cycleDay <= settings.periodLength) {
        statusText = `Reglin ${cycleDay}. günü`;
      } else if (nextDate) {
        const daysUntilNextPeriod = Math.round(
          (nextDate.getTime() - todayDate.getTime()) / dayMs
        );

        if (daysUntilNextPeriod > 0) {
          statusText = `${daysUntilNextPeriod} gün kaldı`;
        } else if (daysUntilNextPeriod === 0) {
          statusText = "Bugün başlayabilir";
        } else {
          statusText = `${Math.abs(daysUntilNextPeriod)} gün gecikme`;
        }
      }

      const cycleDayLabel =
        cycleDay > 0 ? `Döngünün ${cycleDay}. günü` : "Döngü bilgisi hazır";

      console.log("🔴 PERIOD DEBUG - phase/next:", {
        phaseKey: phase.key,
        phaseTitle: phase.title,
        nextIso,
        statusText,
        cycleDayLabel,
      });

      setCycleInfo({
        phaseKey: phase.key as CyclePhase,
        phaseTitle: phase.title,
        phaseDescription: phase.description,
        nextPeriodDateText,
        statusText,
        cycleDayLabel,
      });
    } catch (e) {
      console.log("❌ Regl verileri yüklenirken genel hata:", e);
      setCycleInfo(null);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPeriodData();
    }, [loadPeriodData])
  );

  // ✅ latest remote: ilk açılış + her dönüş
  useEffect(() => {
    void loadLatestRemote();
  }, [loadLatestRemote]);

  useFocusEffect(
    useCallback(() => {
      void loadLatestRemote();
    }, [loadLatestRemote])
  );

  const openWaterReminderSettings = () => {
    setWaterStartInput(waterReminderSettings.startTime);
    setWaterEndInput(waterReminderSettings.endTime);
    setWaterIntervalInput(String(waterReminderSettings.intervalMinutes));

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "water_reminder_click",
    });

    setWaterReminderModalVisible(true);
  };

  const handleWaterReminder = openWaterReminderSettings;

  const handleSaveWaterReminderSettings = async () => {
    const startTime = normalizeClockInput(waterStartInput);
    const endTime = normalizeClockInput(waterEndInput);
    const intervalMinutes = Number.parseInt(waterIntervalInput.trim(), 10);

    if (!startTime || !endTime) {
      Alert.alert("Saat bilgisi eksik", "Lütfen başlangıç ve bitiş saatini 09:00 formatında gir.");
      return;
    }

    if (!Number.isFinite(intervalMinutes) || intervalMinutes < 15 || intervalMinutes > 480) {
      Alert.alert(
        "Aralık uygun değil",
        "Su hatırlatma aralığını 15 ile 480 dakika arasında seçebilirsin."
      );
      return;
    }

    const times = buildWaterReminderTimes(startTime, endTime, intervalMinutes);

    if (times.length === 0) {
      Alert.alert(
        "Saat aralığı uygun değil",
        "Bitiş saati başlangıç saatinden sonra olmalı."
      );
      return;
    }

    if (times.length > 24) {
      Alert.alert(
        "Çok fazla bildirim",
        "Bu ayar günde çok fazla bildirim oluşturuyor. Aralığı biraz artırmayı dene."
      );
      return;
    }

    try {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          "Bildirim izni yok",
          "Su hatırlatıcıları için lütfen bildirim izni ver."
        );
        return;
      }

      await ensureAndroidChannel(SOUND_REMINDER_CHANNEL_ID);
      await cancelStoredNotifications(WATER_IDS_KEY);

      const ids: string[] = [];

      for (const time of times) {
        const minutes = minutesFromClock(time);
        if (minutes == null) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Su zamanı 💧",
            body: "Bir bardak su içme zamanı 🧡",
            sound: true,
            data: { reminderType: "water", silent: false },
            ...(Platform.OS === "android"
              ? { channelId: SOUND_REMINDER_CHANNEL_ID }
              : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: Math.floor(minutes / 60),
            minute: minutes % 60,
          },
        });

        ids.push(id);
      }

      const nextSettings: WaterReminderSettings = {
        enabled: true,
        startTime,
        endTime,
        intervalMinutes,
      };

      await Promise.all([
        AsyncStorage.setItem(WATER_IDS_KEY, JSON.stringify(ids)),
        AsyncStorage.setItem(
          WATER_REMINDER_SETTINGS_KEY,
          JSON.stringify(nextSettings)
        ),
      ]);

      setWaterReminderSettings(nextSettings);
      setWaterStartInput(startTime);
      setWaterEndInput(endTime);
      setWaterIntervalInput(String(intervalMinutes));
      setWaterReminderModalVisible(false);

      void trackEvent({
        event_name: "feature_used",
        screen_name: "home",
        feature_name: "water_reminder_save",
        meta: {
          start_time: startTime,
          end_time: endTime,
          interval_minutes: intervalMinutes,
          notification_count: ids.length,
        },
      });

      Alert.alert(
        "Tamamdır 💧",
        `${startTime} - ${endTime} arasında ${intervalMinutes} dakikada bir su hatırlatıcısı alacaksın.`
      );
    } catch (e) {
      console.log("Su bildirimi planlanırken hata:", e);
      Alert.alert("Hata", "Su hatırlatıcısı ayarlanırken bir sorun oluştu.");
    }
  };

  const handleDisableWaterReminder = async () => {
    try {
      await cancelStoredNotifications(WATER_IDS_KEY);

      const nextSettings: WaterReminderSettings = {
        ...waterReminderSettings,
        enabled: false,
      };

      await AsyncStorage.setItem(
        WATER_REMINDER_SETTINGS_KEY,
        JSON.stringify(nextSettings)
      );

      setWaterReminderSettings(nextSettings);
      setWaterReminderModalVisible(false);

      void trackEvent({
        event_name: "feature_used",
        screen_name: "home",
        feature_name: "water_reminder_disable",
      });

      Alert.alert("Kapatıldı", "Su hatırlatıcıların kapatıldı.");
    } catch (e) {
      console.log("Su hatırlatıcısı kapatılırken hata:", e);
      Alert.alert("Hata", "Su hatırlatıcısı kapatılırken bir sorun oluştu.");
    }
  };

  const openMoveReminderSettings = () => {
    setMoveReminderTimesInput(moveReminderSettings.times);

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "move_reminder_click",
    });

    setMoveReminderModalVisible(true);
  };

  const handleDailyMoveReminder = openMoveReminderSettings;

  const handleAddMoveReminderTime = () => {
    const normalized = normalizeClockInput(moveTimeInput);

    if (!normalized) {
      Alert.alert("Saat uygun değil", "Lütfen saati 09:00 formatında gir.");
      return;
    }

    if (moveReminderTimesInput.includes(normalized)) {
      Alert.alert("Bu saat zaten ekli", `${normalized} zaten hatırlatıcı listende var.`);
      return;
    }

    if (moveReminderTimesInput.length >= MAX_MOVE_REMINDER_TIMES) {
      Alert.alert(
        "Sınır doldu",
        `Günde en fazla ${MAX_MOVE_REMINDER_TIMES} hareket hatırlatıcısı ekleyebilirsin.`
      );
      return;
    }

    const next = sanitizeMoveTimes([...moveReminderTimesInput, normalized]);
    setMoveReminderTimesInput(next);
    setMoveTimeInput(normalized);
  };

  const handleRemoveMoveReminderTime = (time: string) => {
    setMoveReminderTimesInput((prev) => prev.filter((item) => item !== time));
  };

  const handleSaveMoveReminderSettings = async () => {
    const times = sanitizeMoveTimes(moveReminderTimesInput);

    if (times.length === 0) {
      Alert.alert(
        "Saat seçmelisin",
        "Hareket hatırlatıcısını açmak için en az bir saat eklemelisin."
      );
      return;
    }

    try {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert("Bildirim izni yok", "Hareket hatırlatıcısı için izin gerekli.");
        return;
      }

      await ensureAndroidChannel(SOUND_REMINDER_CHANNEL_ID);
      await cancelStoredNotifications(MOVE_IDS_KEY);

      const ids: string[] = [];

      for (const time of times) {
        const minutes = minutesFromClock(time);
        if (minutes == null) continue;

        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Hareket Zamanı 🧘‍♀️",
            body: "Kısa bir yürüyüş veya esneme ile bedenini harekete geçir.",
            sound: true,
            data: { reminderType: "move", silent: false },
            ...(Platform.OS === "android"
              ? { channelId: SOUND_REMINDER_CHANNEL_ID }
              : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: Math.floor(minutes / 60),
            minute: minutes % 60,
          },
        });

        ids.push(id);
      }

      const nextSettings: MoveReminderSettings = {
        enabled: true,
        times,
      };

      await Promise.all([
        AsyncStorage.setItem(MOVE_IDS_KEY, JSON.stringify(ids)),
        AsyncStorage.setItem(MOVE_REMINDER_SETTINGS_KEY, JSON.stringify(nextSettings)),
      ]);

      setMoveReminderSettings(nextSettings);
      setMoveReminderTimesInput(times);
      setMoveReminderModalVisible(false);

      void trackEvent({
        event_name: "feature_used",
        screen_name: "home",
        feature_name: "move_reminder_save",
        meta: {
          reminder_count: ids.length,
          times: times.join(","),
        },
      });

      Alert.alert(
        "Tamam 🧡",
        `Hareket hatırlatıcın şu saatlere kuruldu: ${formatTimesForAlert(times)}.`
      );
    } catch (e) {
      console.log("Hareket bildirimi planlanirken hata:", e);
      Alert.alert("Hata", "Hareket hatırlatıcısı ayarlanırken bir sorun oluştu.");
    }
  };

  const handleDisableMoveReminder = async () => {
    try {
      await cancelStoredNotifications(MOVE_IDS_KEY);

      const nextSettings: MoveReminderSettings = {
        ...moveReminderSettings,
        enabled: false,
      };

      await AsyncStorage.setItem(
        MOVE_REMINDER_SETTINGS_KEY,
        JSON.stringify(nextSettings)
      );

      setMoveReminderSettings(nextSettings);
      setMoveReminderModalVisible(false);

      void trackEvent({
        event_name: "feature_used",
        screen_name: "home",
        feature_name: "move_reminder_disable",
      });

      Alert.alert("Kapatıldı", "Hareket hatırlatıcıların kapatıldı.");
    } catch (e) {
      console.log("Hareket hatırlatıcısı kapatılırken hata:", e);
      Alert.alert("Hata", "Hareket hatırlatıcısı kapatılırken bir sorun oluştu.");
    }
  };

  // ✅ Haftalık astroloji bildirimi (WEEKLY / süresiz)
  const scheduleWeeklyAstroReminder = async () => {
    try {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert("Bildirim izni yok", "Astroloji bildirimi için izin gerekli.");
        return;
      }

      await ensureAndroidChannel();
      await cancelStoredNotifications(ASTRO_IDS_KEY);

      // Expo: weekday 1=Sunday ... 7=Saturday
      const sunday = 1;

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Haftanın Astrolojik Yorumu 🔮",
          body: "Yeni hafta için burç yorumlarını okumayı unutma.",
          sound: false,
          ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          weekday: sunday,
          hour: 18,
          minute: 0,
        },
      });

      await AsyncStorage.setItem(ASTRO_IDS_KEY, JSON.stringify([id]));

      Alert.alert("Tamam ✨", "Her Pazar 18:00'de astroloji bildirimi alacaksın.");
    } catch (e) {
      console.log("Astroloji bildirimi planlanırken hata:", e);
      Alert.alert("Hata", "Astroloji bildirimi ayarlanırken bir sorun oluştu.");
    }
  };

  // Kullanıcı adını kaydet
  const handleSaveName = async () => {
    const trimmed = tempName.trim();
    if (!trimmed) return;

    try {
      await SecureStore.setItemAsync("userName", trimmed);
    } catch (e) {
      console.log("SecureStore kaydederken hata, AsyncStorage'a düşüyoruz:", e);
      try {
        await AsyncStorage.setItem("userName", trimmed);
      } catch (e2) {
        console.log("AsyncStorage kaydederken hata:", e2);
      }
    }

    setName(trimmed);
  };

  const handleCategoryPress = (key: CategoryKey) => {
    const category = categories.find((item) => item.key === key);

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "category_click",
      meta: {
        category_id: key,
        category_label: category?.label.replace(/\n/g, " ") ?? key,
      },
    });

    router.push(`/categories/${key}`);
  };

  const handlePeriodPress = (source: "cycle_card" | "cycle_empty") => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "period_card_click",
      meta: {
        source,
      },
    });

    router.push("/period");
  };

  const handleCaloriePress = () => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "calorie_card_click",
    });

    router.push("/calorie");
  };

  const handlePracticesPress = () => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "practices_card_click",
    });

    router.push("/practices");
  };

  const handleWeeklyPress = (type: "movie" | "music" | "book") => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: `weekly_${type}_click`,
      meta: {
        weekly_type: type,
      },
    });

    if (type === "movie") router.push("/weekly/movie");
    if (type === "music") router.push("/weekly/music");
    if (type === "book") router.push("/weekly/book");
  };

  const handleLatestArticlePress = (article: {
    id: string;
    title: string;
    summary: string;
    slug: string | null;
    categoryLabel: string;
    categoryKey: CategoryKey | null;
    coverUrl: string | null;
  }) => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "latest_article_click",
      article_id: article.id,
      article_title: article.title,
      meta: {
        category_key: article.categoryKey ?? "",
        category_label: article.categoryLabel,
      },
    });

    router.push({
      pathname: article.slug ? `/article/${article.slug}` : `/article/${article.id}`,
      params: {
        articleId: article.id,
        initialTitle: article.title,
        initialSummary: article.summary,
        initialCoverUrl: article.coverUrl ?? "",
      },
    });
  };

  const handleHomeSearchSubmit = () => {
    const q = homeSearchQuery.trim();

    if (q.length < 2) {
      Alert.alert("Arama", "Lütfen en az 2 karakter girin.");
      return;
    }

    void trackEvent({
      event_name: "feature_used",
      screen_name: "home",
      feature_name: "home_search_submit",
      meta: {
        query_length: q.length,
      },
    });

    router.push({
      pathname: "/search",
      params: { q },
    });
  };

  // Su sayacını değiştir + AsyncStorage'a kaydet (günlük)
  const changeWaterCount = (delta: number) => {
    const todayKey = toISODate(new Date());

    setWaterCount((prev: number) => {
      let next = prev + delta;

      if (next < 0) next = 0;

      void trackEvent({
        event_name: "feature_used",
        screen_name: "home",
        feature_name: delta > 0 ? "water_count_increment" : "water_count_decrement",
        meta: {
          previous_count: prev,
          next_count: next,
        },
      });

      AsyncStorage.setItem(
        WATER_TRACK_KEY,
        JSON.stringify({ date: todayKey, count: next })
      ).catch((e) => {
        console.log("Su sayacı kaydedilirken hata:", e);
      });

      return next;
    });
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  // ✅ İsim kayıtlıysa önce sponsor ekranını göster
  if (showSponsor && name) {
    return <SponsorSplash onDone={() => setShowSponsor(false)} />;
  }

  // İsim henüz yoksa
  if (!name) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.onboardingContainer}>
          <Text style={styles.welcomeTitle}>WellShe&apos;ye hoş geldin 🌸</Text>
          <Text style={styles.welcomeSubtitle}>
            Seni daha yakından tanımak için önce adını soralım.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Adın"
            placeholderTextColor="#b88c86"
            value={tempName}
            onChangeText={setTempName}
          />

          <TouchableOpacity style={styles.button} onPress={handleSaveName}>
            <Text style={styles.buttonText}>Devam et</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Ana ekran
  return (
    <SafeAreaView style={styles.safeArea}>

      <Modal
        visible={announcementsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setAnnouncementsVisible(false)}
      >
        <View style={styles.announcementOverlay}>
          <View style={styles.announcementModalCard}>
            <View style={styles.announcementHeaderRow}>
              <View>
                <Text style={styles.announcementEyebrow}>WELLSHE</Text>
                <Text style={styles.announcementModalTitle}>Duyurular</Text>
              </View>

              <Pressable
                onPress={() => setAnnouncementsVisible(false)}
                style={styles.announcementCloseButton}
              >
                <Text style={styles.announcementCloseText}>Kapat</Text>
              </Pressable>
            </View>

            {activeAnnouncements.length === 0 ? (
              <View style={styles.announcementEmptyCard}>
                <Ionicons
                  name="notifications-outline"
                  size={26}
                  color="#B0756F"
                />
                <Text style={styles.announcementEmptyTitle}>
                  Şu anda yeni duyuru yok
                </Text>
                <Text style={styles.announcementEmptyText}>
                  Yeni bir gelişme olduğunda burada görebilirsin.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={styles.announcementList}
                contentContainerStyle={styles.announcementListContent}
                showsVerticalScrollIndicator={false}
              >
                {activeAnnouncements.map((announcement) => {
                  const isRead = readAnnouncementIds.includes(announcement.id);

                  return (
                    <View
                      key={announcement.id}
                      style={[
                        styles.announcementCard,
                        isRead ? styles.announcementCardRead : null,
                      ]}
                    >
                      <View style={styles.announcementCardTop}>
                        <Text style={styles.announcementDate}>
                          {formatAnnouncementDate(announcement.created_at)}
                        </Text>

                        {!isRead ? (
                          <View style={styles.announcementNewBadge}>
                            <Text style={styles.announcementNewBadgeText}>
                              Yeni
                            </Text>
                          </View>
                        ) : (
                          <Text style={styles.announcementReadLabel}>
                            Okundu
                          </Text>
                        )}
                      </View>

                      <Text style={styles.announcementTitle}>
                        {announcement.title}
                      </Text>
                      <Text style={styles.announcementBody}>
                        {announcement.body}
                      </Text>

                      <View style={styles.announcementActions}>
                        {!isRead ? (
                          <Pressable
                            style={styles.announcementPrimaryAction}
                            onPress={() =>
                              handleMarkAnnouncementRead(announcement)
                            }
                          >
                            <Text style={styles.announcementPrimaryActionText}>
                              Okudum
                            </Text>
                          </Pressable>
                        ) : null}

                        <Pressable
                          style={styles.announcementDeleteAction}
                          onPress={() => handleDeleteAnnouncement(announcement)}
                        >
                          <Text style={styles.announcementDeleteActionText}>
                            Sil
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={waterReminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWaterReminderModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
          style={styles.reminderOverlay}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reminderKeyboardScrollContent}
          >
            <View style={styles.reminderModalCard}>
              <View style={styles.reminderModalHandle} />

              <View style={styles.reminderModalHeader}>
                <View style={styles.reminderTitleRow}>
                  <Text style={styles.reminderEmoji}>💧</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderModalTitle}>
                      Su Hatırlatıcısı Ayarları
                    </Text>
                    <Text style={styles.reminderModalSubtitle}>
                      Gün içindeki su molalarını kendi ritmine göre ayarla.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setWaterReminderModalVisible(false)}
                  hitSlop={10}
                >
                  <Text style={styles.reminderCloseText}>Kapat</Text>
                </Pressable>
              </View>

              <View style={styles.reminderStatusBox}>
                <Text style={styles.reminderStatusText}>
                  Hatırlatıcı {waterReminderSettings.enabled ? "açık" : "kapalı"}
                </Text>
                <View
                  style={[
                    styles.reminderStatusDot,
                    waterReminderSettings.enabled
                      ? styles.reminderStatusDotActive
                      : null,
                  ]}
                />
              </View>

              <View style={styles.reminderFormCard}>
                <View style={styles.reminderInputRow}>
                  <View style={styles.reminderInputLabelRow}>
                    <Ionicons name="time-outline" size={18} color="#7A5751" />
                    <Text style={styles.reminderInputLabel}>Başlangıç saati</Text>
                  </View>
                  <TextInput
                    value={waterStartInput}
                    onChangeText={setWaterStartInput}
                    placeholder="09:00"
                    placeholderTextColor="#B99B95"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    style={styles.reminderTimeInput}
                  />
                </View>

                <View style={styles.reminderInputRow}>
                  <View style={styles.reminderInputLabelRow}>
                    <Ionicons name="time-outline" size={18} color="#7A5751" />
                    <Text style={styles.reminderInputLabel}>Bitiş saati</Text>
                  </View>
                  <TextInput
                    value={waterEndInput}
                    onChangeText={setWaterEndInput}
                    placeholder="22:00"
                    placeholderTextColor="#B99B95"
                    keyboardType="numbers-and-punctuation"
                    maxLength={5}
                    style={styles.reminderTimeInput}
                  />
                </View>

                <View style={styles.reminderInputRowLast}>
                  <View style={styles.reminderInputLabelRow}>
                    <Ionicons name="repeat-outline" size={18} color="#7A5751" />
                    <Text style={styles.reminderInputLabel}>
                      Hatırlatma aralığı (dakika)
                    </Text>
                  </View>
                  <TextInput
                    value={waterIntervalInput}
                    onChangeText={(value) =>
                      setWaterIntervalInput(value.replace(/[^0-9]/g, ""))
                    }
                    placeholder="60"
                    placeholderTextColor="#B99B95"
                    keyboardType="number-pad"
                    maxLength={3}
                    style={styles.reminderTimeInput}
                  />
                </View>

                <Text style={styles.reminderHelperText}>
                  İstediğin dakikayı yazabilir ya da hazır seçeneklerden birini
                  seçebilirsin.
                </Text>

                <View style={styles.reminderChipRow}>
                  {WATER_INTERVAL_PRESETS.map((minutes) => {
                    const selected = waterIntervalInput === String(minutes);

                    return (
                      <Pressable
                        key={minutes}
                        style={[
                          styles.reminderChip,
                          selected ? styles.reminderChipSelected : null,
                        ]}
                        onPress={() => setWaterIntervalInput(String(minutes))}
                      >
                        <Text
                          style={[
                            styles.reminderChipText,
                            selected ? styles.reminderChipTextSelected : null,
                          ]}
                        >
                          {minutes} dk
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              <Pressable
                style={styles.reminderPrimaryButton}
                onPress={handleSaveWaterReminderSettings}
              >
                <Text style={styles.reminderPrimaryButtonText}>Kaydet</Text>
              </Pressable>

              <Pressable
                style={styles.reminderSecondaryButton}
                onPress={handleDisableWaterReminder}
              >
                <Text style={styles.reminderSecondaryButtonText}>
                  Hatırlatıcıyı kapat
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={moveReminderModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setMoveReminderModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 16 : 0}
          style={styles.reminderOverlay}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.reminderKeyboardScrollContent}
          >
            <View style={styles.reminderModalCard}>
              <View style={styles.reminderModalHandle} />

              <View style={styles.reminderModalHeader}>
                <View style={styles.reminderTitleRow}>
                  <Text style={styles.reminderEmoji}>🧘‍♀️</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderModalTitle}>
                      Hareket Hatırlatıcısı
                    </Text>
                    <Text style={styles.reminderModalSubtitle}>
                      Gün içinde istediğin saatlerde kısa hareket molaları ekle.
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setMoveReminderModalVisible(false)}
                  hitSlop={10}
                >
                  <Text style={styles.reminderCloseText}>Kapat</Text>
                </Pressable>
              </View>

              <View style={styles.reminderStatusBox}>
                <Text style={styles.reminderStatusText}>
                  Hatırlatıcı {moveReminderSettings.enabled ? "açık" : "kapalı"}
                </Text>
                <View
                  style={[
                    styles.reminderStatusDot,
                    moveReminderSettings.enabled
                      ? styles.reminderStatusDotActive
                      : null,
                  ]}
                />
              </View>

              <View style={styles.reminderFormCard}>
                <Text style={styles.reminderSectionLabel}>Seçtiğin saatler</Text>

                {moveReminderTimesInput.length > 0 ? (
                  <View style={styles.moveTimeChipWrap}>
                    {moveReminderTimesInput.map((time) => (
                      <Pressable
                        key={time}
                        style={styles.moveTimeChip}
                        onPress={() => handleRemoveMoveReminderTime(time)}
                      >
                        <Text style={styles.moveTimeChipText}>{time}</Text>
                        <Text style={styles.moveTimeChipRemove}>×</Text>
                      </Pressable>
                    ))}
                  </View>
                ) : (
                  <Text style={styles.reminderHelperText}>
                    Henüz saat eklemedin. Aşağıdan istediğin saati yazıp ekle.
                  </Text>
                )}

                <View style={styles.moveAddRow}>
                  <View style={styles.moveAddInputWrap}>
                    <Ionicons name="time-outline" size={18} color="#7A5751" />
                    <TextInput
                      value={moveTimeInput}
                      onChangeText={setMoveTimeInput}
                      placeholder="15:20"
                      placeholderTextColor="#B99B95"
                      keyboardType="numbers-and-punctuation"
                      maxLength={5}
                      style={styles.moveTimeInput}
                    />
                  </View>

                  <Pressable
                    style={styles.moveAddButton}
                    onPress={handleAddMoveReminderTime}
                  >
                    <Text style={styles.moveAddButtonText}>Saat ekle</Text>
                  </Pressable>
                </View>

                <Text style={styles.reminderHelperText}>
                  İstediğin saati kendin ekleyebilirsin. Günde birden fazla
                  hatırlatma seçebilirsin.
                </Text>
              </View>

              <Pressable
                style={styles.reminderPrimaryButton}
                onPress={handleSaveMoveReminderSettings}
              >
                <Text style={styles.reminderPrimaryButtonText}>Kaydet</Text>
              </Pressable>

              <Pressable
                style={styles.reminderSecondaryButton}
                onPress={handleDisableMoveReminder}
              >
                <Text style={styles.reminderSecondaryButtonText}>
                  Hatırlatıcıyı kapat
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <View pointerEvents="none" style={styles.decorLayer}>
          <View style={styles.decorBlobLeft} />
          <View style={styles.decorBlobRight} />
          <Text style={styles.decorFlowerRight}>✿</Text>
          <Text style={styles.decorLeafLeft}>❀</Text>
        </View>

        {/* Sadece lotus logo */}
        <View style={styles.appLogoCrop}>
          <Image
            source={require("../../assets/images/logo/lotus.png")}
            style={styles.appLogoCropImage}
            resizeMode="contain"
          />
        </View>

        {/* ✅ OTA DEBUG KARTI (PROD’DA GİZLİ) */}
        {showOtaDebug ? (
          <View style={styles.otaCard}>
            <Text style={styles.otaTitle}>OTA DEBUG</Text>
            <Text style={styles.otaMono}>{otaDebug}</Text>

            <Pressable style={styles.otaBtn} onPress={checkAndApplyOta}>
              <Text style={styles.otaBtnText}>CHECK & APPLY OTA</Text>
            </Pressable>

            <Pressable style={styles.otaBtnSecondary} onPress={reloadOnly}>
              <Text style={styles.otaBtnText}>RELOAD ONLY</Text>
            </Pressable>
          </View>
        ) : null}

        {/* Sponsor alanı */}
        <View style={styles.sponsorRow}>
          <View style={styles.sponsorLogoCircle}>
            <Image
              source={require("../../assets/sponsors/global-solar.png")}
              style={styles.sponsorLogoInner}
              resizeMode="cover"
            />
          </View>

          <Text style={styles.sponsorRowText}>ENERJİ SPONSORUMUZ</Text>
        </View>

        {/* Selamlama + Profil */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Merhaba {name} 🌸</Text>
          </View>

          <View style={styles.headerActionsColumn}>
            <TouchableOpacity
              style={styles.profilePill}
              onPress={() => {
                void trackEvent({
                  event_name: "feature_used",
                  screen_name: "home",
                  feature_name: "profile_click",
                });

                router.push("/profile");
              }}
            >
              <Ionicons name="person-outline" size={16} color="#7A5751" />
              <Text style={styles.profilePillText}>Profil</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.announcementBellButton}
              onPress={handleOpenAnnouncements}
              activeOpacity={0.85}
            >
              <Ionicons name="notifications-outline" size={20} color="#7A5751" />

              {unreadAnnouncementCount > 0 ? (
                <View style={styles.announcementCountBadge}>
                  <Text style={styles.announcementCountText}>
                    {unreadAnnouncementCount > 9 ? "9+" : unreadAnnouncementCount}
                  </Text>
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        </View>

        {/* Günün motivasyon cümlesi */}
        <View style={styles.motivationCard}>
          <View style={styles.quoteRow}>
            <Text style={styles.quoteMark}>❝</Text>
            <Text style={styles.motivationText}>{motivationText}</Text>
          </View>
        </View>

        {/* Döngü kartı */}
        {cycleInfo ? (
          <View style={styles.periodHeroCard}>
            <View style={styles.periodHeroContent}>
              <View style={styles.periodHeroLeft}>
                <Text style={styles.periodTitle}>Döngün</Text>
                <Text style={styles.phaseMiniTitle}>Bugün bedenin ne söylüyor?</Text>
                <Text style={styles.phaseTitleText}>{cycleInfo.phaseTitle}</Text>
                <Text style={styles.periodText}>{cycleInfo.phaseDescription}</Text>

                <TouchableOpacity
                  style={styles.periodButton}
                  onPress={() => handlePeriodPress("cycle_card")}
                >
                  <Text style={styles.periodButtonText}>Regl takvimini aç</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.periodHeroRight}>
                <View style={styles.periodRingOuter}>
                  <View style={styles.periodRingMiddle}>
                    <View style={styles.periodRingInner}>
                      <Text style={styles.periodHeart}>♥</Text>
                    </View>
                  </View>
                </View>

                <Text style={styles.periodStatusLabel}>
                  TAHMİNİ BİR SONRAKİ REGLİNE
                </Text>
                <Text style={styles.periodStatusValue}>{cycleInfo.statusText}</Text>

                <View style={styles.periodBadge}>
                  <Text style={styles.periodBadgeText}>{cycleInfo.cycleDayLabel}</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.periodHeroCard}>
            <Text style={styles.periodTitle}>Döngün</Text>
            <Text style={styles.periodFallbackText}>
              Regl bilgilerini eklediğinde burada fazını ve döngü özetini görebilirsin.
            </Text>

            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => handlePeriodPress("cycle_empty")}
            >
              <Text style={styles.periodButtonText}>Regl takvimini oluştur</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Su & hareket kartları */}
        <View style={styles.utilityRow}>
          {/* Su kartı */}
          <View style={[styles.smallCard, styles.waterSmallCard]}>
            <View pointerEvents="none" style={styles.waterCardGlow} />
            <View pointerEvents="none" style={styles.waterCardWave} />

            <Text style={styles.smallCardTitle}>Su Hatırlatıcısı 💧</Text>
            <Text style={styles.smallCardText}>
              Bugünkü hedefin {WATER_GOAL} bardak su.
            </Text>
            <Text style={styles.smallCardText}>
              Şu ana kadar {waterCount} bardak içtin.
            </Text>

            <View style={styles.waterRow}>
              <TouchableOpacity
                style={styles.waterButton}
                onPress={() => changeWaterCount(-1)}
              >
                <Text style={styles.waterButtonText}>-</Text>
              </TouchableOpacity>

              <Text style={styles.waterCountText}>{waterCount}</Text>

              <TouchableOpacity
                style={styles.waterButton}
                onPress={() => changeWaterCount(1)}
              >
                <Text style={styles.waterButtonText}>+</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.reminderButton, styles.waterReminderButton]}
              onPress={handleWaterReminder}
            >
              <Text style={styles.reminderButtonText}>Su hatırlatıcısını aç</Text>
            </TouchableOpacity>
          </View>

          {/* Hareket kartı */}
          <View style={[styles.smallCard, styles.moveSmallCard]}>
            <View pointerEvents="none" style={styles.moveCardGlow} />
            <View pointerEvents="none" style={styles.moveCardLeaf} />

            <Text style={styles.smallCardTitle}>Hareket Et 🧘‍♀️</Text>
            <Text style={styles.smallCardText}>
              En az 30 dakikalık hafif hareket planla.
            </Text>
            <Text style={styles.smallCardText}>
              Kısa yürüyüş, esneme ya da ev egzersizi olabilir.
            </Text>

            <TouchableOpacity
              style={[styles.reminderButton, styles.moveReminderButton]}
              onPress={handleDailyMoveReminder}
            >
              <Text style={styles.reminderButtonText}>Bana hatırlat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nefes & Meditasyon kartı */}
        <TouchableOpacity
          style={styles.meditationCard}
          onPress={handlePracticesPress}
          activeOpacity={0.9}
        >
          <View style={styles.meditationTextWrap}>
            <Text style={styles.meditationTitle}>
              Nefes Egzersizi &{"\n"}Meditasyon
            </Text>

            <Text style={styles.meditationDescription}>
              Kısa bir mola ver, zihnini sakinleştir ve rahatla.
            </Text>

            <Text style={styles.meditationLink}>Pratiklere git →</Text>
          </View>

          <Image
            source={require("../../assets/images/home/meditation-card.png")}
            style={styles.meditationImage}
            resizeMode="contain"
          />
        </TouchableOpacity>

        {/* Kategoriler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>

          <View style={styles.homeSearchBar}>
            <Ionicons
              name="search-outline"
              size={20}
              color="#8E8E93"
              style={styles.homeSearchIcon}
            />

            <TextInput
              value={homeSearchQuery}
              onChangeText={setHomeSearchQuery}
              placeholder="İçerik ara"
              placeholderTextColor="#8E8E93"
              style={styles.homeSearchInput}
              returnKeyType="search"
              onSubmitEditing={handleHomeSearchSubmit}
            />

            {homeSearchQuery.trim().length > 0 ? (
              <Pressable
                onPress={() => setHomeSearchQuery("")}
                hitSlop={10}
                style={styles.homeSearchClear}
              >
                <Ionicons name="close-circle" size={20} color="#B0B0B5" />
              </Pressable>
            ) : null}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.menuStoriesContent}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.key}
                style={styles.menuItem}
                onPress={() => handleCategoryPress(cat.key)}
              >
                <View style={styles.menuCircle}>
                  <Image
                    source={CATEGORY_ICONS[cat.key]}
                    style={styles.menuIcon}
                    resizeMode="cover"
                  />
                </View>

                <Text style={styles.menuLabel}>{cat.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* 🔥 Kalori hesaplama butonu */}
          <TouchableOpacity
            style={styles.featuredCalorieCard}
            onPress={handleCaloriePress}
            activeOpacity={0.92}
          >
            <Image
              source={FEATURED_HOME_IMAGES.calorie}
              style={styles.featuredCalorieImage}
              resizeMode="cover"
            />

            <View style={styles.featuredCalorieOverlay}>
              <View style={styles.featuredCalorieTextBox}>

                <Text style={styles.featuredCalorieTitle}>Kalori Hesapla</Text>

                <Text style={styles.featuredCalorieText}>
                  Hedefine uygun kalori miktarını öğren.
                </Text>
              </View>

              <View style={styles.featuredCalorieArrow}>
                <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Son eklenen içerikler + favori kalp */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Son Eklenen İçerikler</Text>

          {latestRemoteLoading ? (
            <View style={styles.centerInline}>
              <ActivityIndicator />
            </View>
          ) : latestRemote.length === 0 ? (
            <View style={styles.contentCard}>
              <Text style={styles.contentTitle}>Henüz içerik yok.</Text>
            </View>
          ) : (
            latestRemote.map((article) => {
              const fallbackImage =
                article.categoryKey ? LATEST_CATEGORY_IMAGES[article.categoryKey] : null;

              return (
                <View key={article.id} style={styles.latestArticleCard}>
                  <Pressable
                    style={styles.latestArticlePressable}
                    onPress={() => handleLatestArticlePress(article)}
                  >
                    {fallbackImage ? (
                      <Image
                        source={fallbackImage}
                        style={styles.latestArticleThumb}
                        resizeMode="cover"
                      />
                    ) : null}

                    <View style={styles.latestArticleContent}>
                      <View style={styles.latestArticleTop}>
                        <View style={styles.latestCategoryPill}>
                          <Text style={styles.latestCategoryPillText}>
                            {article.categoryLabel}
                          </Text>
                        </View>

                        <Ionicons name="chevron-forward" size={18} color="#AE8B86" />
                      </View>

                      <Text
                        style={styles.latestArticleTitle}
                        numberOfLines={3}
                        ellipsizeMode="tail"
                      >
                        {article.title}
                      </Text>
                    </View>
                  </Pressable>

                  <Pressable
                    onPress={() => toggleFavorite(article.id)}
                    style={styles.favoriteButtonModern}
                  >
                    <Text style={styles.favoriteIcon}>
                      {isFavorite(article.id) ? "💖" : "🤍"}
                    </Text>
                  </Pressable>
                </View>
              );
            })
          )}
        </View>

        {/* Haftanın Önerileri */}
        <View style={styles.weeklyHomeSection}>
          <View style={styles.weeklyHomeHeader}>
            <Text style={styles.weeklyHomeTitle}>Haftanın Önerileri ✨</Text>
          </View>

          {/* Dizi / Film - yazı solda */}
          <TouchableOpacity
            style={styles.weeklyHomeCard}
            onPress={() => handleWeeklyPress("movie")}
            activeOpacity={0.9}
          >
            <Image
              source={WEEKLY_FEATURED_IMAGES.movie}
              style={styles.weeklyHomeBg}
              resizeMode="cover"
            />

            <View style={styles.weeklyHomeSoftOverlay} />

            <View style={[styles.weeklyHomeTextPanel, styles.weeklyHomeTextPanelLeft]}>
              <Text style={styles.weeklyHomeItemTitle} numberOfLines={2}>
                Dizi/Film
              </Text>

              <Text style={styles.weeklyHomeTeaser} numberOfLines={3}>
                {movieWeeklyTeaser}
              </Text>
            </View>

            <View style={styles.weeklyHomeArrowRight}>
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Müzik - yazı sağda */}
          <TouchableOpacity
            style={styles.weeklyHomeCard}
            onPress={() => handleWeeklyPress("music")}
            activeOpacity={0.9}
          >
            <Image
              source={WEEKLY_FEATURED_IMAGES.music}
              style={styles.weeklyHomeBg}
              resizeMode="cover"
            />

            <View style={styles.weeklyHomeSoftOverlay} />

            <View style={[styles.weeklyHomeTextPanel, styles.weeklyHomeTextPanelRight]}>
              <Text
                style={[styles.weeklyHomeItemTitle, styles.weeklyHomeItemTitleMusic]}
                numberOfLines={1}
              >
                Müzik
              </Text>

              <Text style={styles.weeklyHomeTeaser} numberOfLines={3}>
                {musicWeeklyTeaser}
              </Text>
            </View>

            <View style={[styles.weeklyHomeArrowLeft, styles.weeklyHomeArrowMusic]}>
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          {/* Kitap - yazı solda */}
          <TouchableOpacity
            style={styles.weeklyHomeCard}
            onPress={() => handleWeeklyPress("book")}
            activeOpacity={0.9}
          >
            <Image
              source={WEEKLY_FEATURED_IMAGES.book}
              style={styles.weeklyHomeBg}
              resizeMode="cover"
            />

            <View style={styles.weeklyHomeSoftOverlay} />

            <View style={[styles.weeklyHomeTextPanel, styles.weeklyHomeTextPanelLeft]}>
              <Text style={styles.weeklyHomeItemTitle} numberOfLines={2}>
                Kitap
              </Text>

              <Text style={styles.weeklyHomeTeaser} numberOfLines={3}>
                {bookWeeklyTeaser}
              </Text>
            </View>

            <View style={styles.weeklyHomeArrowRight}>
              <Ionicons name="chevron-forward" size={22} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Çiçekli minik not */}
        <View style={styles.flowerNote}>
          <Text style={styles.flowerText}>
            🌸 Unutma, kendine iyi bakmak lüks değil; temel ihtiyaç.
          </Text>
        </View>

        {/* Reklam Banner (Home) */}
        <View style={styles.homeAdContainer}>
          <AdBanner />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F7",
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    position: "relative",
  },

  decorLayer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },

  decorBlobLeft: {
    position: "absolute",
    top: 10,
    left: -30,
    width: 120,
    height: 180,
    backgroundColor: "#FCE9EE",
    borderBottomRightRadius: 120,
    borderTopRightRadius: 120,
    opacity: 0.9,
  },

  decorBlobRight: {
    position: "absolute",
    top: 24,
    right: -20,
    width: 90,
    height: 90,
    backgroundColor: "#FDF1F4",
    borderRadius: 45,
    opacity: 0.85,
  },

  decorFlowerRight: {
    position: "absolute",
    top: 52,
    right: 22,
    fontSize: 28,
    color: "#EAB7C9",
    opacity: 0.75,
  },

  decorLeafLeft: {
    position: "absolute",
    top: 58,
    left: 18,
    fontSize: 20,
    color: "#EAB7C9",
    opacity: 0.6,
  },

  homeSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    borderRadius: 18,
    backgroundColor: "#F3F3F6",
    paddingHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
  },

  homeSearchIcon: {
    marginRight: 8,
  },

  homeSearchInput: {
    flex: 1,
    color: "#2F2626",
    fontSize: 16,
    paddingVertical: 0,
  },

  homeSearchClear: {
    marginLeft: 8,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF8F7",
  },

  centerInline: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },

  otaCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#000000",
    marginBottom: 12,
  },

  otaTitle: {
    fontWeight: "800",
    marginBottom: 6,
    color: "#000000",
  },

  otaMono: {
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
    color: "#000000",
  },

  otaBtn: {
    marginTop: 10,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#000000",
    alignItems: "center",
  },

  otaBtnSecondary: {
    marginTop: 8,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: "#444444",
    alignItems: "center",
  },

  otaBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
  },

  onboardingContainer: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },

  welcomeTitle: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 12,
    color: "#4A2E2A",
  },

  welcomeSubtitle: {
    fontSize: 16,
    marginBottom: 24,
    color: "#6B4A44",
  },

  input: {
    borderWidth: 1,
    borderColor: "#F3B6B3",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    color: "#4A2E2A",
  },

  button: {
    backgroundColor: "#F3B6B3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },

  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },

  appLogoCrop: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 14,
  },

  appLogoCropImage: {
    width: "100%",
    height: "100%",
  },

  appLogoCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    marginBottom: 10,
    overflow: "hidden",
  },

  appLogoInner: {
    width: "110%",
    height: "110%",
  },

  headerLogo: {
    width: 110,
    height: 110,
    alignSelf: "center",
    marginTop: 16,
    marginBottom: 8,
    opacity: 0.95,
  },

  sponsorPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: "#F2DFDA",
    marginBottom: 16,
    minWidth: 250,
  },

  sponsorRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    marginBottom: 14,
  },

  sponsorLogoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginRight: 14,
  },

  sponsorLogoInner: {
    width: "123%",
    height: "123%",
  },

  sponsorTextWrap: {
    flex: 1,
  },

  sponsorTagline: {
    fontSize: 12,
    color: "#9A807B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  sponsorBrand: {
    fontSize: 15,
    fontWeight: "700",
    color: "#3D2C2A",
    marginTop: 2,
  },

  sponsorRowText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#B0756F",
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },

  sponsorProfileColumn: {
    alignItems: "flex-end",
  },

  sponsorBadge: {
    alignItems: "flex-end",
    marginBottom: 4,
  },

  sponsorTag: {
    fontSize: 10,
    fontWeight: "600",
    color: "#B0756F",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },

  sponsorLogoSmall: {
    width: 72,
    height: 40,
  },

  greetingRow: {
    marginBottom: 14,
    flexDirection: "row",
    alignItems: "center",
  },

  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2F2626",
  },

  profileLink: {
    fontSize: 18,
    color: "#B0756F",
    fontWeight: "600",
    textDecorationLine: "underline",
  },

  profilePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9CDC8",
  },

  profilePillText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6F5A56",
  },


  headerActionsColumn: {
    alignItems: "flex-end",
    gap: 8,
  },

  announcementBellButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D9CDC8",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  announcementCountBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    backgroundColor: "#D77878",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF8F7",
  },

  announcementCountText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  announcementOverlay: {
    flex: 1,
    backgroundColor: "rgba(47, 38, 38, 0.42)",
    justifyContent: "center",
    paddingHorizontal: 18,
  },

  announcementModalCard: {
    maxHeight: "78%",
    borderRadius: 26,
    backgroundColor: "#FFFDFC",
    borderWidth: 1,
    borderColor: "#F2DFDA",
    padding: 18,
    shadowColor: "#000000",
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },

  announcementHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    gap: 12,
  },

  announcementEyebrow: {
    fontSize: 12,
    fontWeight: "800",
    color: "#B0756F",
    letterSpacing: 1,
    marginBottom: 4,
  },

  announcementModalTitle: {
    fontSize: 24,
    lineHeight: 30,
    fontWeight: "800",
    color: "#2F2626",
  },

  announcementCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#FFF3F0",
  },

  announcementCloseText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#B75F61",
  },

  announcementEmptyCard: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderRadius: 18,
    backgroundColor: "#FFF8F7",
    borderWidth: 1,
    borderColor: "#F2DFDA",
  },

  announcementEmptyTitle: {
    marginTop: 10,
    fontSize: 17,
    fontWeight: "800",
    color: "#2F2626",
    textAlign: "center",
  },

  announcementEmptyText: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 21,
    color: "#6D5854",
    textAlign: "center",
  },

  announcementList: {
    maxHeight: 430,
  },

  announcementListContent: {
    paddingBottom: 2,
    gap: 12,
  },

  announcementCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0D6D0",
    backgroundColor: "#FFF8F7",
    padding: 14,
  },

  announcementCardRead: {
    backgroundColor: "#FFFFFF",
    opacity: 0.82,
  },

  announcementCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    gap: 10,
  },

  announcementDate: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0756F",
  },

  announcementNewBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#D77878",
  },

  announcementNewBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#FFFFFF",
  },

  announcementReadLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#8B7772",
  },

  announcementTitle: {
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "800",
    color: "#2F2626",
    marginBottom: 7,
  },

  announcementBody: {
    fontSize: 14,
    lineHeight: 21,
    color: "#5A4744",
  },

  announcementActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
    marginTop: 12,
  },

  announcementPrimaryAction: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#D77878",
  },

  announcementPrimaryActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "800",
  },

  announcementDeleteAction: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E7D6D2",
  },

  announcementDeleteActionText: {
    color: "#7A615D",
    fontSize: 13,
    fontWeight: "800",
  },

  motivationCard: {
    backgroundColor: "#FFF7F7",
    borderWidth: 1,
    borderColor: "#F2DFDA",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginBottom: 14,
  },

  quoteRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  quoteMark: {
    fontSize: 22,
    color: "#8D6B66",
    marginRight: 10,
    lineHeight: 24,
  },

  motivationText: {
    flex: 1,
    fontSize: 15,
    color: "#5A4744",
    lineHeight: 22,
  },

  contentCardRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 10,
  },

  favoriteButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },

  favoriteIcon: {
    fontSize: 22,
  },

  phaseMiniTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#413331",
    marginBottom: 4,
  },

  phaseMiniText: {
    fontSize: 14,
    color: "#5A3A35",
  },

  phaseTitleText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#D67997",
    marginBottom: 6,
  },

  periodCard: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FDECF3",
    borderWidth: 1,
    borderColor: "#F3B6D0",
    marginBottom: 18,
  },

  periodHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F2DFDA",
    padding: 16,
    marginBottom: 14,
  },

  periodHeroContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  periodHeroLeft: {
    flex: 1,
    paddingRight: 8,
  },

  periodHeroRight: {
    width: 150,
    alignItems: "center",
  },

  periodTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2F2626",
    marginBottom: 6,
  },

  periodText: {
    fontSize: 14,
    color: "#5A4744",
    lineHeight: 21,
    marginBottom: 14,
  },

  periodFallbackText: {
    fontSize: 14,
    color: "#5A4744",
    lineHeight: 21,
    marginBottom: 14,
  },

  periodNext: {
    fontSize: 14,
    color: "#7A5852",
    marginBottom: 10,
  },

  periodRingOuter: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#FCE6EC",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  periodRingMiddle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "#F4C6D2",
    alignItems: "center",
    justifyContent: "center",
  },

  periodRingInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  periodHeart: {
    fontSize: 20,
    color: "#C77286",
  },

  periodStatusLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#8D7873",
    textAlign: "center",
    letterSpacing: 0.4,
    marginBottom: 4,
  },

  periodStatusValue: {
    fontSize: 26,
    fontWeight: "800",
    color: "#3D2C2A",
    textAlign: "center",
    marginBottom: 8,
  },

  periodBadge: {
    borderWidth: 1,
    borderColor: "#E8D8D4",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#FFFDFC",
  },

  periodBadgeText: {
    fontSize: 13,
    color: "#7A615D",
    fontWeight: "600",
  },

  periodButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#E96B8E",
  },

  periodButtonText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },

  utilityRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 12,
  },

  smallCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DFDA",
    minHeight: 175,
    overflow: "hidden",
    position: "relative",
  },

  smallCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
    color: "#2F2626",
  },

  smallCardText: {
    fontSize: 14,
    color: "#5A4744",
    lineHeight: 20,
    marginBottom: 4,
  },

  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 6,
    marginBottom: 10,
    gap: 12,
  },

  waterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E7D6D2",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
  },

  waterButtonText: {
    fontSize: 18,
    color: "#4A2E2A",
    fontWeight: "600",
  },

  waterCountText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2F2626",
    minWidth: 28,
    textAlign: "center",
  },

  reminderButton: {
    marginTop: "auto",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#FFF3F0",
    alignItems: "center",
  },

  reminderButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "800",
  },

  waterSmallCard: {
    backgroundColor: "#F9FDFF",
    borderColor: "#CFEAF8",
  },

  moveSmallCard: {
    backgroundColor: "#FFF8FC",
    borderColor: "#F3D6E8",
  },

  waterCardGlow: {
    position: "absolute",
    top: -36,
    left: -36,
    width: 150,
    height: 150,
    borderRadius: 999,
    backgroundColor: "rgba(179, 232, 255, 0.22)",
  },

  waterCardWave: {
    position: "absolute",
    bottom: -26,
    left: -18,
    width: 150,
    height: 76,
    borderTopRightRadius: 120,
    borderTopLeftRadius: 60,
    borderBottomLeftRadius: 120,
    borderBottomRightRadius: 20,
    backgroundColor: "rgba(145, 220, 255, 0.16)",
  },

  moveCardGlow: {
    position: "absolute",
    top: -34,
    right: -34,
    width: 145,
    height: 145,
    borderRadius: 999,
    backgroundColor: "rgba(243, 186, 227, 0.20)",
  },

  moveCardLeaf: {
    position: "absolute",
    bottom: 12,
    right: 10,
    width: 92,
    height: 92,
    borderRadius: 999,
    backgroundColor: "rgba(245, 205, 234, 0.15)",
  },

  practiceCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3ECFF",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#E3D7FB",
    padding: 16,
    marginBottom: 18,
    overflow: "hidden",
  },

  waterReminderButton: {
    backgroundColor: "#ee8ca3",
  },

  moveReminderButton: {
    marginTop: "auto",
    backgroundColor: "#e58feb",
  },

  practiceTextWrap: {
    flex: 1,
    paddingRight: 10,
  },

  practiceTitle: {
    fontSize: 19,
    fontWeight: "700",
    color: "#7352A2",
    marginBottom: 6,
  },

  practiceText: {
    fontSize: 14,
    color: "#564A6A",
    lineHeight: 20,
    marginBottom: 8,
  },

  practiceLink: {
    fontSize: 15,
    fontWeight: "700",
    color: "#7352A2",
  },

  practiceImage: {
    width: 170,
    height: 115,
    marginLeft: 8,
  },

  practiceIconWrap: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: "#E8DCF9",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },

  practiceEmoji: {
    fontSize: 34,
  },

  section: {
    marginBottom: 20,
    marginTop: 4,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 12,
    color: "#2F2626",
  },

  menuStoriesContent: {
    paddingRight: 8,
  },

  menuItem: {
    alignItems: "center",
    marginRight: 12,
  },

  menuCircle: {
    width: 88,
    height: 72,
    borderRadius: 36,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f0c6c6",
  },

  menuIcon: {
    width: "100%",
    height: "100%",
  },

  menuLabel: {
    fontSize: 14,
    fontWeight: "700",
    marginTop: 6,
    textAlign: "center",
    color: "#4A2E2A",
  },

  contentCard: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 10,
  },

  contentCategory: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 4,
    color: "#B0756F",
  },

  contentTitle: {
    fontSize: 16,
    color: "#4A2E2A",
  },

  flowerNote: {
    marginTop: 8,
    marginBottom: 12,
  },

  flowerText: {
    fontSize: 16,
    color: "#6B4A44",
    textAlign: "center",
  },

  astroNotifyButton: {
    marginTop: 10,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#F7AFC2",
    alignItems: "center",
  },

  astroNotifyButtonText: {
    fontSize: 17,
    color: "#FFFFFF",
    fontWeight: "700",
  },

  latestIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },

  latestIcon: {
    width: "100%",
    height: "100%",
  },

  latestCategoryText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#B0756F",
  },

  weeklyRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 8,
  },

  weeklyIcon: {
    width: 30,
    height: 30,
  },

  weeklyLabel: {
    fontSize: 16,
    fontWeight: "800",
    color: "#B0756F",
  },

  homeAdContainer: {
    marginTop: 8,
    marginBottom: 4,
    alignItems: "center",
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },

  latestRowTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 6,
  },

  meditationCard: {
    marginTop: 14,
    marginHorizontal: 16,
    minHeight: 190,
    borderRadius: 24,
    backgroundColor: "#F1EEF8",
    borderWidth: 1,
    borderColor: "#DDD4F2",
    paddingLeft: 18,
    paddingTop: 18,
    paddingBottom: 18,
    paddingRight: 18,
    position: "relative",
    overflow: "hidden",
  },

  meditationTextWrap: {
    width: "52%",
    zIndex: 2,
  },

  meditationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6F55AA",
    lineHeight: 25,
    marginBottom: 10,
  },

  meditationDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5F5A6F",
    marginBottom: 14,
  },

  meditationLink: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6F55AA",
  },

  meditationImage: {
    position: "absolute",
    right: 6,
    bottom: 0,
    width: 230,
    height: 150,
  },

  featuredCalorieCard: {
    height: 168,
    borderRadius: 24,
    overflow: "hidden",
    marginTop: 8,
    marginBottom: 6,
    position: "relative",
  },

  featuredCalorieImage: {
    width: "100%",
    height: "100%",
  },

  featuredCalorieOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingVertical: 16,
  },

  featuredCalorieTextBox: {
    width: "64%",
    backgroundColor: "rgba(255,255,255,0.74)",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },

  featuredCalorieTextWrap: {
    width: "62%",
  },

  featuredCalorieTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#5A3732",
    marginBottom: 6,
  },

  featuredCalorieText: {
    fontSize: 14,
    lineHeight: 20,
    color: "#4A2E2A",
    fontWeight: "600",
  },

  featuredCalorieArrow: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(217,141,137,0.95)",
    alignItems: "center",
    justifyContent: "center",
  },

  latestArticleCard: {
    position: "relative",
    marginBottom: 12,
  },

  latestArticlePressable: {
    flexDirection: "row",
    alignItems: "stretch",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F2DFDA",
    borderRadius: 20,
    overflow: "hidden",
  },

  latestArticleThumb: {
    width: 112,
    height: 112,
  },

  latestArticleContent: {
    flex: 1,
    paddingLeft: 14,
    paddingRight: 64,
    justifyContent: "center",
  },

  latestArticleTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },

  latestCategoryPill: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FCEEEE",
  },

  latestCategoryPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#B0756F",
  },

  latestArticleTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "700",
    color: "#4E342E",
    marginTop: 8,
  },

  favoriteButtonModern: {
    position: "absolute",
    right: 12,
    bottom: 10,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.95)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#F2DFDA",
  },

  weeklyHomeSection: {
    marginTop: 4,
    marginBottom: 18,
  },

  weeklyHomeHeader: {
    marginBottom: 12,
  },

  weeklyHomeTitle: {
    fontSize: 23,
    fontWeight: "800",
    color: "#3F2724",
    letterSpacing: -0.2,
  },

  weeklyHomeCard: {
    height: 178,
    borderRadius: 24,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#F0CDC8",
    backgroundColor: "#FFFFFF",
    position: "relative",
    shadowColor: "#D8A7A0",
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },

  weeklyHomeBg: {
    ...StyleSheet.absoluteFillObject,
    width: "100%",
    height: "100%",
  },

  weeklyHomeSoftOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.04)",
  },

  weeklyHomeTextPanel: {
    position: "absolute",
    top: 14,
    bottom: 14,
    width: "58%",
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.64)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },

  weeklyHomeTextPanelRight: {
    right: 14,
  },

  weeklyHomeTextPanelLeft: {
    left: 14,
  },

  weeklyHomeArrowLeft: {
    position: "absolute",
    left: 18,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(111,76,160,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6F4CA0",
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  weeklyHomeArrowRight: {
    position: "absolute",
    right: 18,
    bottom: 18,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(111,76,160,0.92)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#6F4CA0",
    shadowOpacity: 0.22,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },

  weeklyHomeItemTitle: {
    fontSize: 19,
    lineHeight: 23,
    fontWeight: "900",
    color: "#3F246B",
    marginBottom: 8,
    textShadowColor: "rgba(255,255,255,0.55)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  weeklyHomeItemTitleMusic: {
    color: "#C94F65",
  },

  weeklyHomeTeaser: {
    fontSize: 14,
    lineHeight: 18,
    color: "#2A1A18",
    fontWeight: "800",
    textShadowColor: "rgba(255,255,255,0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },

  weeklyHomeArrowMusic: {
    backgroundColor: "rgba(217,94,114,0.92)",
  },

  reminderOverlay: {
    flex: 1,
    backgroundColor: "rgba(47, 38, 38, 0.42)",
  },

  reminderKeyboardScrollContent: {
    flexGrow: 1,
    justifyContent: "flex-end",
  },

  reminderModalCard: {
    maxHeight: "88%",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    backgroundColor: "#FFFDFB",
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 22,
    borderWidth: 1,
    borderColor: "#F2DFDA",
  },

  reminderModalHandle: {
    width: 42,
    height: 5,
    borderRadius: 999,
    backgroundColor: "#D8C7C2",
    alignSelf: "center",
    marginBottom: 14,
  },

  reminderModalHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 14,
  },

  reminderTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },

  reminderEmoji: {
    fontSize: 28,
    marginTop: 2,
  },

  reminderModalTitle: {
    fontSize: 22,
    lineHeight: 27,
    fontWeight: "900",
    color: "#2F2626",
  },

  reminderModalSubtitle: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    color: "#6B5753",
  },

  reminderCloseText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#B65E70",
  },

  reminderStatusBox: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F0DAD6",
    backgroundColor: "#FFF8F6",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  reminderStatusText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#5A4744",
  },

  reminderStatusDot: {
    width: 38,
    height: 22,
    borderRadius: 999,
    backgroundColor: "#D8C7C2",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  reminderStatusDotActive: {
    backgroundColor: "#CE6B7C",
  },

  reminderFormCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#F0DAD6",
    backgroundColor: "#FFFFFF",
    padding: 12,
    marginBottom: 14,
  },

  reminderInputRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: "#F5E8E5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  reminderInputRowLast: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },

  reminderInputLabelRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  reminderInputLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: "700",
    color: "#4A2E2A",
  },

  reminderTimeInput: {
    minWidth: 82,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5D4CF",
    paddingHorizontal: 10,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#2F2626",
    backgroundColor: "#FFFDFB",
  },

  reminderHelperText: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: "#7A615D",
  },

  reminderChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },

  reminderChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
    backgroundColor: "#FFF8F6",
    borderWidth: 1,
    borderColor: "#EAD7D2",
  },

  reminderChipSelected: {
    backgroundColor: "#CE6B7C",
    borderColor: "#CE6B7C",
  },

  reminderChipText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#5A4744",
  },

  reminderChipTextSelected: {
    color: "#FFFFFF",
  },

  reminderPrimaryButton: {
    minHeight: 50,
    borderRadius: 14,
    backgroundColor: "#CE6B7C",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  reminderPrimaryButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
  },

  reminderSecondaryButton: {
    minHeight: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2B5B5",
    backgroundColor: "#FFFDFB",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
  },

  reminderSecondaryButtonText: {
    color: "#B65E70",
    fontSize: 15,
    fontWeight: "900",
  },

  reminderSectionLabel: {
    fontSize: 15,
    fontWeight: "900",
    color: "#4A2E2A",
    marginBottom: 10,
  },

  moveTimeChipWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },

  moveTimeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 999,
    backgroundColor: "#F5D9DD",
  },

  moveTimeChipText: {
    fontSize: 14,
    fontWeight: "800",
    color: "#6B3E46",
  },

  moveTimeChipRemove: {
    fontSize: 18,
    lineHeight: 18,
    fontWeight: "800",
    color: "#8B5660",
  },

  moveAddRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  moveAddInputWrap: {
    flex: 1,
    minHeight: 46,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "#E5D4CF",
    backgroundColor: "#FFFDFB",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },

  moveTimeInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: "800",
    color: "#2F2626",
    paddingVertical: 0,
  },

  moveAddButton: {
    minHeight: 46,
    borderRadius: 13,
    paddingHorizontal: 14,
    backgroundColor: "#FFF1F4",
    borderWidth: 1,
    borderColor: "#E9B3BF",
    alignItems: "center",
    justifyContent: "center",
  },

  moveAddButtonText: {
    fontSize: 13,
    fontWeight: "900",
    color: "#B65E70",
  },

});