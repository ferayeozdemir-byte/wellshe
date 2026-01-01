// app/(tabs)/index.tsx

import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import * as Updates from "expo-updates";
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
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { type CategoryId } from "../../data/content";
import { weeklyArchive, type WeeklyItem } from "../../data/weekly";
import { fetchLatestArticlesRemote } from "../../lib/categoriesRemote";
import { fetchLatestWeekly } from "../../lib/weeklyRemote";
import { CATEGORY_ICONS, type CategoryKey } from "../_ui/categoryIcons";
import { WEEKLY_ICONS } from "../_ui/weeklyIcons";

const FAVORITES_KEY = "favorite_articles";

// 🔔 Hatırlatıcılar için AsyncStorage anahtarları (id’leri saklarız)
const WATER_IDS_KEY = "wellshe_water_notification_ids";
const MOVE_IDS_KEY = "wellshe_move_notification_ids";
const ASTRO_IDS_KEY = "wellshe_astro_notification_ids";

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
  startDate: string; // "2025-11-10" gibi
};

// Bildirimlerin nasıl gösterileceğini ayarla
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// ✅ Bildirim helper’ları (HomeScreen’in ÜSTÜNDE durmalı)
async function ensureNotificationPermission(): Promise<boolean> {
  const perm = await Notifications.getPermissionsAsync();
  if (perm.status === "granted") return true;

  const req = await Notifications.requestPermissionsAsync();
  return req.status === "granted";
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  try {
    await Notifications.setNotificationChannelAsync("reminders", {
      name: "Hatırlatmalar",
      importance: Notifications.AndroidImportance.DEFAULT,
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

// 🔥 Motivasyon cümleleri
const MOTIVATION_QUOTES: string[] = [
  "Bugün kendin için en az bir küçük iyilik yap. Küçük adımlar, büyük değişim yaratır.",
  "Kendine nazik ol. Unutma, en çok kendi desteğine ihtiyacın var.",
  "Bugün mükemmel olmak zorunda değilsin, sadece ilerlemen yeterli.",
  "Küçük bir adım bile yerinde saymaktan daha iyidir.",
  "Dinlenmek, pes etmek değildir. Yeniden başlamak için nefes almaktır.",
  "Kendini sevdiğinde dünya sana farklı görünmeye başlar.",
  "Bugün, yarının daha iyi olması için yapabileceğin minicik bir şey seç.",
  "İç sesini duy: Zaten sandığından daha güçlüsün.",
  "Bugün kendin için attığın her küçük adım yarın büyük bir değişime dönüşür.",
  "Kendine iyi baktığında hayatın her alanı iyileşir.",
  "Bugün, yeni bir başlangıç için en doğru zaman.",
  "Küçük ilerlemeler büyük yolculukların temelidir.",
  "Kendine inandığında geri kala her şeyin yolu açılır.",
  "Dengeni bulduğunda hayatın ritmi değişir.",
  "Zihnini sadeleştir, yolun netleşsin.",
  "Senin için doğru olan zaten sana doğru gelir.",
  "Kendine verdiğin söz, en değerli sözdür.",
  "Bugün de pes etme. Çünkü hikâyen yeni başlıyor.",
  "Kendini geliştirmek, kendine verebileceğin en güzel hediyedir.",
  "Bir adım at, bırak yol seni karşılasın.",
  "Kendini sevmek, hayatın kapısını açar.",
  "Nefes al, sakinleş ve enerjini tazele.",
  "Bugün, yapabildiğinin en iyisini yapman yeterli.",
  "Yavaş ilerlemek de bir ilerlemedir.",
  "Kendini zorladığın her gün biraz daha güçlenirsin.",
  "Odaklandığın şey büyür, iyiyi seç.",
  "Zihnini sakinleştirdiğinde kalbin konuşur.",
  "Hiçbir şey tesadüf değildir. Her şey büyük bir bulmacanın parçasıdır.",
  "Senin yolun, senin hızın.",
  "İyileşmek bir yolculuktur, adım adım güzelleşir.",
  "Kendine sınır koyma; potansiyelin düşündüğünden büyük.",
  "İçindeki güç sandığından daha fazla.",
  "Bir dur, nefes al ve devam et.",
  "Unutma: Değişim küçük bir karar ile başlar.",
  "Kendini affet. Yeniden başlamak özgürlüktür.",
  "Her gün, bir önceki günden daha iyi olabilirsin.",
  "Bugün kendine verdiğin her emek yarın mutluluk olur.",
  "Enerjini koru. Her yere yetişmek zorunda değilsin.",
  "Zor günler, güçlenen senin habercisidir.",
  "Şefkatle yaklaş. En çok da kendine.",
  "Cesaret, korkunun yokluğu değil; ona rağmen yürümektir.",
  "Hayat, seninle birlikte şekilleniyor.",
  "Kendine zaman tanı. Her şey yoluna girecek.",
  "Sen aynı anda hem bir başlangıç hem bir mucizesin.",
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
  "Küçük gelişmeleri kutla, onlar sana güç verir.",
  "Hayallerin sandığından daha yakın!",
  "Kendinle gurur duy, bugünlere kolay gelmedin!",
  "Sınırlarını aşman gereken tek kişi dünkü sensin.",
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
  "En zor günde bile içinde bir kıvılcım vardır.",
  "Her gün yeniden başlamak için bir şans.",
  "Kalbini dinlediğinde yolunu bulursun.",
  "Ne kadar ilerlediğini fark etmek için bir an dur.",
  "Kendine alan aç. Büyümek için buna ihtiyacın var.",
  "Şimdi başla! Mükemmel anı bekleme.",
  "Kendini, olduğun yerden daha iyi bir yere taşıyabilirsin.",
  "Bugün hayatına iyi gelen şeylere odaklan.",
  "Kendini yenilemek adına harekete geçmek için asla geç değil.",
  "Şefkati bir prensip hâline getir. En çok da kendin için.",
  "Zihnin sakinleştiğinde çözümler belirir.",
  "Adım adım ilerlediğinde büyük işler başarırsın.",
  "Kendine inandığında evren de seninle birlikte çalışır.",
  "İçindeki huzur en güzel rehberin.",
  "Kendini hafife alma, potansiyelin büyük!",
  "Bugün daha iyi bir sen yaratmak için harika bir gün.",
  "Sen bu yolculuğun en değerli parçasısın.",
];

const MOTIVATION_START_DATE = new Date("2025-01-01").getTime();
const WATER_GOAL = 6;
const WATER_TRACK_KEY = "wellshe_water_today";

// 🔴 Küçük yardımcılar – regl kartı için
function diffInDaysUTC(from: Date, to: Date) {
  const d1 = new Date(
    from.getFullYear(),
    from.getMonth(),
    from.getDate()
  ).getTime();
  const d2 = new Date(
    to.getFullYear(),
    to.getMonth(),
    to.getDate()
  ).getTime();
  return Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
}

function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function formatDateTR(date: Date) {
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  return `${dd}.${mm}.${yyyy}`;
}

function getTodayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  // Storage için sade ISO format
  return `${yyyy}-${mm}-${dd}`;
}

function getPhaseInfo(cycleDay: number, settings: PeriodSettings) {
  const { periodLength, averageCycleLength } = settings;

  let phaseLabel = "Döngü";
  let phaseDescription =
    "Döngünün bugününü bedenini gözlemleyerek geçir. Her fazın ihtiyacı farklıdır.";

  if (cycleDay <= periodLength) {
    phaseLabel = "Regl dönemi";
    phaseDescription =
      "Bedeninin dinlenmeye ve yavaşlamaya ihtiyaç duyduğu bir fazdasın. Kendine nazik ol, iyi beslen ve mümkün oldukça dinlenmeye alan aç.";
  } else if (cycleDay <= periodLength + 7) {
    phaseLabel = "Toparlanma & yenilenme";
    phaseDescription =
      "Enerjin yavaş yavaş yükseliyor. Hafif egzersizler, düzenli uyku ve dengeli beslenme sana çok iyi gelebilir.";
  } else if (
    cycleDay >= Math.round(averageCycleLength / 2) - 1 &&
    cycleDay <= Math.round(averageCycleLength / 2) + 1
  ) {
    phaseLabel = "Ovülasyon (zirve enerji)";
    phaseDescription =
      "Enerjinin ve çekiciliğinin en yüksek olduğu fazdasın. Sosyalleşmek, üretmek ve görünür olmak için güzel bir zaman.";
  } else if (cycleDay > periodLength) {
    phaseLabel = "Luteal dönem";
    phaseDescription =
      "Bedenin yavaş yavaş içe dönmeye hazırlanıyor. Duygular yoğunlaşabilir; hafif hareket, sıcak içecekler ve kendine şefkatle yaklaşmak destekleyici olacaktır.";
  }

  return { phaseLabel, phaseDescription };
}

// 🔁 Faz etiketinden tek cümlelik mini öneri
function getPhaseOneLiner(phaseLabel: string): string {
  if (phaseLabel.startsWith("Regl")) {
    return "Regl fazındasın; tempoyu biraz düşürmek, sıcak içecekler hazırlamak ve yumuşak dinlenme alanları yaratmak bedenine çok iyi gelebilir.";
  }
  if (phaseLabel.startsWith("Toparlanma")) {
    return "Toparlanma fazındasın; hafif hareket ve dengeli beslenme enerjini yavaş yavaş geri çağırmana yardımcı olur.";
  }
  if (phaseLabel.startsWith("Ovülasyon")) {
    return "Ovülasyon fazındasın; enerjinin yüksek olduğu bu dönemde sosyalleşmek ve üretmek için kendine alan açabilirsin.";
  }
  if (phaseLabel.startsWith("Luteal")) {
    return "Luteal fazdasın; enerjini korumak için sınır çizmen ve dinlenmeye alan açman çok kıymetli.";
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

export default function HomeScreen() {
  // Home mount log
  useEffect(() => {
    console.log("HOME INDEX LOADED ✅", new Date().toISOString());
  }, []);

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

  // 🔹 Su sayacı – gün bazlı kalıcı hale getir
  const loadWaterForToday = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(WATER_TRACK_KEY);
      if (!raw) {
        setWaterCount(0);
        return;
      }

      const parsed = JSON.parse(raw);
      const todayKey = getTodayKey();

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

  // Regl bilgisi
  const [cycleInfo, setCycleInfo] = useState<{
    cycleDay: number;
    phaseLabel: string;
    phaseDescription: string;
    nextPeriodDateText: string;
  } | null>(null);

  const motivationText = getTodayMotivation();
  const phaseOneLiner = cycleInfo ? getPhaseOneLiner(cycleInfo.phaseLabel) : null;

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

  // Regl verilerini storage'dan okuyup cycleInfo'yu güncelleyen fonksiyon
  const loadPeriodData = useCallback(async () => {
    try {
      const [settingsRaw, logsRaw] = await Promise.all([
        getFirstExisting(PERIOD_SETTINGS_KEYS),
        getFirstExisting(PERIOD_LOGS_KEYS),
      ]);

      console.log("🔴 PERIOD DEBUG - RAW values:", {
        settingsRaw,
        logsRaw,
      });

      if (!settingsRaw || !logsRaw) {
        console.log("🔴 PERIOD DEBUG - settings veya logs yok, cycleInfo null");
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
          // Tek kayıt tutulmuş eski formatı da destekle
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

      if (!logs.length) {
        console.log("🔴 PERIOD DEBUG - logs array boş, cycleInfo null");
        setCycleInfo(null);
        return;
      }

      const lastLog = logs[logs.length - 1];
      const lastStart = new Date(lastLog.startDate);
      const today = new Date();

      const dayDiff = diffInDaysUTC(lastStart, today);
      const cycleDay = dayDiff + 1;

      console.log("🔴 PERIOD DEBUG - lastStart, cycleDay:", {
        lastStart: lastStart.toISOString(),
        today: today.toISOString(),
        dayDiff,
        cycleDay,
      });

      if (cycleDay <= 0) {
        console.log("🔴 PERIOD DEBUG - cycleDay <= 0, henüz başlamamış gibi");
        setCycleInfo(null);
        return;
      }

      const nextStart = addDays(lastStart, settings.averageCycleLength);
      const nextPeriodDateText = formatDateTR(nextStart);

      const { phaseLabel, phaseDescription } = getPhaseInfo(cycleDay, settings);

      console.log("🔴 PERIOD DEBUG - phase:", {
        phaseLabel,
        phaseDescription,
        nextPeriodDateText,
      });

      setCycleInfo({
        cycleDay,
        phaseLabel,
        phaseDescription,
        nextPeriodDateText,
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

  // ✅ Su hatırlatıcısı (DAILY / süresiz)
  const handleWaterReminder = async () => {
    try {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert(
          "Bildirim izni yok",
          "Su hatırlatıcıları için lütfen bildirim izni ver."
        );
        return;
      }

      await ensureAndroidChannel();
      await cancelStoredNotifications(WATER_IDS_KEY);

      const times = [
        { hour: 10, minute: 0 },
        { hour: 13, minute: 0 },
        { hour: 16, minute: 0 },
        { hour: 20, minute: 0 },
      ];

      const ids: string[] = [];

      for (const t of times) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: "Su zamanı 💧",
            body: "Bir bardak su içme zamanı 🧡",
            sound: false,
            ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: t.hour,
            minute: t.minute,
          },
        });

        ids.push(id);
      }

      await AsyncStorage.setItem(WATER_IDS_KEY, JSON.stringify(ids));

      Alert.alert("Tamamdır 💧", "Her gün 4 saatte bir su hatırlatıcısı alacaksın.");
    } catch (e) {
      console.log("Su bildirimi planlanırken hata:", e);
      Alert.alert("Hata", "Su hatırlatıcısı ayarlanırken bir sorun oluştu.");
    }
  };

  // ✅ Günlük hareket hatırlatıcısı (DAILY / süresiz)
  const handleDailyMoveReminder = async () => {
    try {
      const ok = await ensureNotificationPermission();
      if (!ok) {
        Alert.alert("Bildirim izni yok", "Hareket hatırlatıcısı için izin gerekli.");
        return;
      }

      await ensureAndroidChannel();
      await cancelStoredNotifications(MOVE_IDS_KEY);

      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: "Hareket Zamanı 🧘‍♀️",
          body: "Kısa bir yürüyüş veya esneme ile bedenini harekete geçir.",
          sound: false,
          ...(Platform.OS === "android" ? { channelId: "reminders" } : {}),
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: 13,
          minute: 0,
        },
      });

      await AsyncStorage.setItem(MOVE_IDS_KEY, JSON.stringify([id]));

      Alert.alert("Tamam 🧡", "Her gün 13:00'te hareket hatırlatıcısı alacaksın.");
    } catch (e) {
      console.log("Hareket bildirimi planlanirken hata:", e);
      Alert.alert("Hata", "Hareket hatırlatıcısı ayarlanırken bir sorun oluştu.");
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

  const handleCategoryPress = (key: string) => {
    router.push(`/categories/${key}`);
  };

  // Su sayacını değiştir + AsyncStorage'a kaydet (günlük)
  const changeWaterCount = (delta: number) => {
    const todayKey = getTodayKey();

    setWaterCount((prev: number) => {
      let next = prev + delta;
      if (next < 0) next = 0;
      if (next > WATER_GOAL) next = WATER_GOAL;

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
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Logo */}
        <Image
          source={require("../../assets/images/logo/wellshe_logo.png")}
          style={styles.headerLogo}
        />

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

        {/* Selamlama */}
        <View style={styles.greetingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.greeting}>Merhaba {name} 🌸</Text>
          </View>

          <TouchableOpacity onPress={() => router.push("/profile")}>
            <Text style={styles.profileLink}>Profil</Text>
          </TouchableOpacity>
        </View>

        {/* Günün motivasyon cümlesi */}
        <View style={styles.motivationCard}>
          <Text style={styles.motivationText}>{motivationText}</Text>
        </View>

        {/* Bugün döngü fazın kartı */}
        {cycleInfo ? (
          <View style={styles.periodCard}>
            <Text style={styles.periodTitle}>Döngün</Text>

            {phaseOneLiner && (
              <>
                <Text style={styles.phaseMiniTitle}>
                  🔁 Bugün bedenin ne diyor?
                </Text>
                <Text style={styles.phaseMiniText}>{phaseOneLiner}</Text>
              </>
            )}

            <Text style={styles.periodNext}>
              Tahmini sonraki regl başlangıcı:{" "}
              <Text style={{ fontWeight: "600" }}>
                {cycleInfo.nextPeriodDateText}
              </Text>
            </Text>

            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => router.push("/period")}
            >
              <Text style={styles.periodButtonText}>Regl takvimini aç</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.periodCard}>
            <Text style={styles.periodTitle}>Regl döngünü takip et</Text>
            <Text style={styles.periodText}>
              Döngünü uygulamaya kaydettiğinde burada her gün hangi fazda
              olduğunu ve tahmini regl tarihini görebilirsin.
            </Text>
            <TouchableOpacity
              style={styles.periodButton}
              onPress={() => router.push("/period")}
            >
              <Text style={styles.periodButtonText}>Regl takvimini oluştur</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Su & hareket kartları */}
        <View style={styles.row}>
          {/* Su kartı */}
          <View style={styles.smallCard}>
            <Text style={styles.smallCardTitle}>Su Hatırlatıcısı 💧</Text>
            <Text style={styles.smallCardText}>
              Bugünkü hedefin: {WATER_GOAL} bardak su.{"\n"}
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
              style={styles.reminderButton}
              onPress={handleWaterReminder}
            >
              <Text style={styles.reminderButtonText}>
                Su hatırlatıcısını aç
              </Text>
            </TouchableOpacity>
          </View>

          {/* Hareket kartı */}
          <View style={styles.smallCard}>
            <Text style={styles.smallCardTitle}>Hareket Et 🧘‍♀️</Text>
            <Text style={styles.smallCardText}>
              En az 30 dakikalık hafif hareket planla: Kısa yürüyüş, esneme ya da
              basit bir ev egzersizi olabilir.
            </Text>

            <TouchableOpacity
              style={[
                styles.reminderButton,
                { marginTop: 8 },
                styles.moveReminderButton,
              ]}
              onPress={handleDailyMoveReminder}
            >
              <Text style={styles.reminderButtonText}>Bana Hatırlat</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Kategoriler */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kategoriler</Text>

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
            style={styles.astroNotifyButton}
            onPress={() => router.push("/calorie")}
          >
            <Text style={styles.astroNotifyButtonText}>🔥 Kalori Hesapla</Text>
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
            latestRemote.map((article) => (
              <View key={article.id} style={styles.contentCardRow}>
                <Pressable
                  style={{ flex: 1 }}
                  onPress={() =>
                    router.push({
                      pathname: article.slug
                        ? `/article/${article.slug}`
                        : `/article/${article.id}`,
                      params: {
                        articleId: article.id,
                        initialTitle: article.title,
                        initialSummary: article.summary,
                        initialCoverUrl: article.coverUrl ?? "",
                      },
                    })
                  }
                >
                  <View style={styles.latestRowTop}>
                    {article.categoryKey ? (
                      <View style={styles.latestIconWrap}>
                        <Image
                          source={CATEGORY_ICONS[article.categoryKey]}
                          style={styles.latestIcon}
                          resizeMode="cover"
                        />
                      </View>
                    ) : null}

                    <Text style={styles.latestCategoryText}>
                      {article.categoryLabel}
                    </Text>
                  </View>

                  <Text style={styles.contentTitle}>{article.title}</Text>
                </Pressable>

                <Pressable
                  onPress={() => toggleFavorite(article.id)}
                  style={styles.favoriteButton}
                >
                  <Text style={styles.favoriteIcon}>
                    {isFavorite(article.id) ? "💖" : "🤍"}
                  </Text>
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Haftanın Önerileri */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Haftanın Önerileri</Text>
        </View>

        <Pressable
          style={styles.contentCard}
          onPress={() => router.push("/weekly/movie")}
        >
          <View style={styles.weeklyRow}>
            <Image
              source={WEEKLY_ICONS.movie}
              style={styles.weeklyIcon}
              resizeMode="contain"
            />
            <Text style={styles.weeklyLabel}>Dizi / Film</Text>
          </View>
          <Text style={styles.contentTitle}>
            {latestMovie?.teaser ?? "Bu hafta ilham veren bir yapım: ..."}
          </Text>
        </Pressable>

        <Pressable
          style={styles.contentCard}
          onPress={() => router.push("/weekly/music")}
        >
          <View style={styles.weeklyRow}>
            <Image
              source={WEEKLY_ICONS.music}
              style={styles.weeklyIcon}
              resizeMode="contain"
            />
            <Text style={styles.weeklyLabel}>Müzik</Text>
          </View>
          <Text style={styles.contentTitle}>
            {latestMusic?.teaser ?? "Ruhunu besleyecek bir müzik önerisi."}
          </Text>
        </Pressable>

        <Pressable
          style={styles.contentCard}
          onPress={() => router.push("/weekly/book")}
        >
          <View style={styles.weeklyRow}>
            <Image
              source={WEEKLY_ICONS.book}
              style={styles.weeklyIcon}
              resizeMode="contain"
            />
            <Text style={styles.weeklyLabel}>Kitap</Text>
          </View>
          <Text style={styles.contentTitle}>
            {latestBook?.teaser ?? "Sakin bir akşam için bir kitap."}
          </Text>
        </Pressable>

        {/* Çiçekli minik not */}
        <View style={styles.flowerNote}>
          <Text style={styles.flowerText}>
            🌸 Unutma, kendine iyi bakmak lüks değil; temel ihtiyaç.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF7F3",
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFF7F3",
  },
  centerInline: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
  },

  // ✅ OTA
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
  greetingRow: {
    marginTop: 24,
    marginBottom: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  greeting: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
  },
  profileLink: {
    fontSize: 18,
    color: "#B0756F",
    fontWeight: "600",
    textDecorationLine: "underline",
  },
  headerLogo: {
    width: 90,
    height: 90,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
    opacity: 0.9,
  },
  motivationCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FCE8E4",
    marginBottom: 16,
  },
  motivationText: {
    fontSize: 16,
    color: "#5A3A35",
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
    color: "#4A2E2A",
    marginBottom: 4,
  },
  phaseMiniText: {
    fontSize: 14,
    color: "#5A3A35",
  },
  periodCard: {
    padding: 10,
    borderRadius: 16,
    backgroundColor: "#FDECF3",
    borderWidth: 1,
    borderColor: "#F3B6D0",
    marginBottom: 18,
  },
  periodTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A2E2A",
    marginBottom: 4,
  },
  periodText: {
    fontSize: 14,
    color: "#5A3A35",
    marginBottom: 6,
  },
  periodNext: {
    fontSize: 14,
    color: "#7A5852",
    marginBottom: 10,
  },
  periodButton: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#F3B6D0",
  },
  periodButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  smallCard: {
    flex: 1,
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  smallCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 6,
    color: "#4A2E2A",
  },
  smallCardText: {
    fontSize: 15,
    color: "#5A3A35",
    marginBottom: 8,
  },
  waterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
    gap: 12,
  },
  waterButton: {
    width: 38,
    height: 38,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFF7F3",
  },
  waterButtonText: {
    fontSize: 14,
    color: "#4A2E2A",
  },
  waterCountText: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A2E2A",
  },
  reminderButton: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "#F3B6B3",
    alignItems: "center",
  },
  reminderButtonText: {
    fontSize: 13,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  moveReminderButton: {
    marginTop: 20,
  },
  section: {
    marginBottom: 20,
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#4A2E2A",
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
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#F3B6D0",
    alignItems: "center",
  },
  astroNotifyButtonText: {
    fontSize: 16,
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
});
