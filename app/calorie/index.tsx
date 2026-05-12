// app/calorie/index.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import AdBanner from "../../components/AdBanner";
import { callEdgeFunction } from "../../lib/supabase";

type Sex = "female" | "male";
type Activity = "sedentary" | "light" | "moderate" | "active" | "very_active";
type Goal = "maintain" | "lose" | "gain";
type Mode = "calc" | "track";

type FoodItem = {
  id: string;
  name: string;
  grams: number | null;
  kcalPer100g: number | null;
  kcalTotal: number;
  createdAt: number;
};

const EDGE_FN_NAME = "smart-endpoint";

// ✅ Edge test sadece kontrol amaçlıydı; üretimde gereksizse kapalı kalsın
const ENABLE_EDGE_TEST = false;

// ✅ Hesapla ayarlarını kalıcı yapmak için tek bir storage key
const CALC_SETTINGS_KEY = "wellshe_calorie_calc_settings_v1";

const activityFactor: Record<Activity, number> = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very_active: 1.9,
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
function storageKeyForToday() {
  return `wellshe_calorie_food_${todayKey()}`;
}
function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
function onlyDigits(s: string) {
  return s.replace(/[^0-9]/g, "");
}

const QUICK_FOODS: { name: string; kcalPer100g: number; unit?: "g" | "ml" }[] = [
  { name: "Yoğurt", kcalPer100g: 60 },
  { name: "Yumurta", kcalPer100g: 155 },
  { name: "Peynir", kcalPer100g: 260 },
  { name: "Tavuk göğsü", kcalPer100g: 165 },
  { name: "Pilav", kcalPer100g: 130 },
  { name: "Makarna", kcalPer100g: 150 },
  { name: "Ekmek", kcalPer100g: 265 },
  { name: "Muz", kcalPer100g: 89 },
  { name: "Elma", kcalPer100g: 52 },
  { name: "Badem", kcalPer100g: 579 },
  { name: "Sütlü çikolata", kcalPer100g: 535 },
  { name: "Bitter çikolata", kcalPer100g: 550 },
  { name: "Zeytin", kcalPer100g: 115 },
  { name: "Bir dilim pasta", kcalPer100g: 350 },
  { name: "Cips", kcalPer100g: 540 },
  { name: "Kola", kcalPer100g: 42, unit: "ml" },
];

export default function CalorieScreen() {
  const [mode, setMode] = useState<Mode>("track");

  // ✅ Hesaplama alanı
  const [sex, setSex] = useState<Sex>("female");
  const [age, setAge] = useState("30");
  const [heightCm, setHeightCm] = useState("165");
  const [weightKg, setWeightKg] = useState("60");
  const [activity, setActivity] = useState<Activity>("light");
  const [goal, setGoal] = useState<Goal>("maintain");

  // ✅ Takip alanı
  const [foodName, setFoodName] = useState("");
  const [gramsText, setGramsText] = useState("100");
  const [kcalPer100gText, setKcalPer100gText] = useState("");
  const [kcalDirectText, setKcalDirectText] = useState("");
  const [items, setItems] = useState<FoodItem[]>([]);
  const [gramUnit, setGramUnit] = useState<"g" | "ml">("g");
  const [calcHydrated, setCalcHydrated] = useState(false);

  const computed = useMemo(() => {
  const a = Number(age);
  const h = Number(heightCm);
  const w = Number(weightKg);

  const valid =
    Number.isFinite(a) &&
    Number.isFinite(h) &&
    Number.isFinite(w) &&
    a > 0 &&
    a < 120 &&
    h > 80 &&
    h < 230 &&
    w > 20 &&
    w < 400;

  if (!valid) return null;

  const base = 10 * w + 6.25 * h - 5 * a;
  const bmr = sex === "male" ? base + 5 : base - 161;
  const tdee = bmr * activityFactor[activity];

  let recommended = tdee;
  if (goal === "lose") recommended = tdee - 400;
  if (goal === "gain") recommended = tdee + 300;

  const minSafe = sex === "male" ? 1500 : 1200;
  if (goal !== "maintain" && recommended < minSafe) recommended = minSafe;

  const heightM = h / 100;
  const bmi = w / (heightM * heightM);

  const healthyWeightMin = 18.5 * heightM * heightM;
  const healthyWeightMax = 24.9 * heightM * heightM;

  let bmiCategory = "Belirsiz";
  if (bmi < 18.5) bmiCategory = "Düşük";
  else if (bmi < 25) bmiCategory = "Sağlıklı aralık";
  else if (bmi < 30) bmiCategory = "Yüksek";
  else bmiCategory = "Obezite aralığı";

  let weightNote = "Kilon boyuna göre sağlıklı aralıkta görünüyor.";
  if (w < healthyWeightMin) {
    weightNote = "Kilon boyuna göre sağlıklı aralığın altında görünüyor.";
  } else if (w > healthyWeightMax) {
    weightNote = "Kilon boyuna göre sağlıklı aralığın üzerinde görünüyor.";
  }

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    recommended: Math.round(recommended),
    bmi: Number(bmi.toFixed(1)),
    bmiCategory,
    healthyWeightMin: Math.round(healthyWeightMin),
    healthyWeightMax: Math.round(healthyWeightMax),
    weightNote,
  };
}, [age, heightCm, weightKg, sex, activity, goal]);

  const totalKcal = useMemo(() => {
    return items.reduce((sum, it) => sum + (Number(it.kcalTotal) || 0), 0);
  }, [items]);

  const remaining = useMemo(() => {
    if (!computed?.recommended) return null;
    return computed.recommended - totalKcal;
  }, [computed?.recommended, totalKcal]);

  // ✅ İlk açılış: bugünün kayıtlarını + hesap ayarlarını yükle
  useEffect(() => {
    const load = async () => {
      try {
        // 1) Bugünün yediklerini yükle
        const key = storageKeyForToday();
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed: FoodItem[] = JSON.parse(raw);
          setItems(Array.isArray(parsed) ? parsed : []);
        } else {
          setItems([]);
        }

        // 2) Hesapla ayarlarını yükle
        const calcRaw = await AsyncStorage.getItem(CALC_SETTINGS_KEY);
        console.log("[CALC] loaded raw", calcRaw);
        if (calcRaw) {
          const c = JSON.parse(calcRaw);

          if (c?.mode === "calc" || c?.mode === "track") setMode(c.mode);

          if (c?.sex === "female" || c?.sex === "male") setSex(c.sex);

          if (typeof c?.age === "string") setAge(c.age);
          if (typeof c?.heightCm === "string") setHeightCm(c.heightCm);
          if (typeof c?.weightKg === "string") setWeightKg(c.weightKg);

          if (
            c?.activity === "sedentary" ||
            c?.activity === "light" ||
            c?.activity === "moderate" ||
            c?.activity === "active" ||
            c?.activity === "very_active"
          ) {
            setActivity(c.activity);
          }

          if (c?.goal === "maintain" || c?.goal === "lose" || c?.goal === "gain") {
            setGoal(c.goal);
          }
        }
      } catch {
        // sessiz geç
      } finally {
    setCalcHydrated(true);
    }
    };

    const testEdge = async () => {
      if (!ENABLE_EDGE_TEST) return;
      try {
        const r = await callEdgeFunction<any>(EDGE_FN_NAME, { ping: true });
        console.log("EDGE TEST:", r);
      } catch (e) {
        console.log("EDGE TEST ERROR:", e);
      }
    };

    load();
    testEdge();
  }, []);

  // ✅ Her değişiklikte “bugünün yediklerini” kaydet
  useEffect(() => {
    const save = async () => {
      try {
        const key = storageKeyForToday();
        await AsyncStorage.setItem(key, JSON.stringify(items));
      } catch {
        // no-op
      }
    };
    save();
  }, [items]);

  // ✅ Her değişiklikte “Hesapla” ayarlarını kaydet (kalıcı olsun)
useEffect(() => {
  if (!calcHydrated) return;

  const saveCalc = async () => {
    try {
      const payload = { mode, sex, age, heightCm, weightKg, activity, goal };
      const json = JSON.stringify(payload);
      await AsyncStorage.setItem(CALC_SETTINGS_KEY, json);

      const check = await AsyncStorage.getItem(CALC_SETTINGS_KEY);
      console.log("[CALC] saved?", check);
    } catch (e) {
      console.log("[CALC] save error", e);
    }
  };

  saveCalc();
}, [calcHydrated, mode, sex, age, heightCm, weightKg, activity, goal]);

  const addFood = () => {
    const name = foodName.trim();
    if (!name) {
      Alert.alert("Eksik bilgi", "Lütfen besin adını yazın.");
      return;
    }

    // 1) Direkt kcal girildiyse
    const direct = Number(kcalDirectText);
    if (kcalDirectText.trim() && Number.isFinite(direct) && direct > 0) {
      const kcalTotal = Math.round(direct);
      const item: FoodItem = {
        id: uid(),
        name,
        grams: null,
        kcalPer100g: null,
        kcalTotal,
        createdAt: Date.now(),
      };
      setItems((prev) => [item, ...prev]);
      setFoodName("");
      setKcalDirectText("");
      return;
    }

    // 2) Gram + 100g kcal üzerinden
    const grams = Number(gramsText);
    const kcalPer100g = Number(kcalPer100gText);

    if (!Number.isFinite(grams) || grams <= 0) {
      Alert.alert("Eksik bilgi", "Gram bilgisi geçerli olmalı.");
      return;
    }
    if (!Number.isFinite(kcalPer100g) || kcalPer100g <= 0) {
      Alert.alert("Eksik bilgi", "100g kalori bilgisi geçerli olmalı.");
      return;
    }

    const kcalTotal = Math.round((grams * kcalPer100g) / 100);

    const item: FoodItem = {
      id: uid(),
      name,
      grams: Math.round(grams),
      kcalPer100g: Math.round(kcalPer100g),
      kcalTotal,
      createdAt: Date.now(),
    };

    setItems((prev) => [item, ...prev]);
    setFoodName("");
    setKcalPer100gText("");
    setKcalDirectText("");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((x) => x.id !== id));
  };

  const addQuickFood = (q: { name: string; kcalPer100g: number; unit?: "g" | "ml" }) => {
    setFoodName(q.name);
    setKcalPer100gText(String(q.kcalPer100g));
    setGramUnit(q.unit ?? "g");
    if (!gramsText.trim()) setGramsText("100");
    setKcalDirectText("");
  };

  const clearToday = () => {
    Alert.alert(
      "Bugünü sıfırla",
      "Bugün eklediğiniz tüm besinler silinecek. Emin misiniz?",
      [
        { text: "Vazgeç", style: "cancel" },
        { text: "Sil", style: "destructive", onPress: () => setItems([]) },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Kalori" }} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.headerCard}>
              <Text style={styles.title}>Kalori</Text>
              <Text style={styles.subtitle}>
                Günlük hedefini hesapla ve yediklerini ekleyerek aldığın toplam kaloriyi takip et.
              </Text>

              <View style={styles.segmentRow}>
                <SegmentButton text="Takip" active={mode === "track"} onPress={() => setMode("track")} />
                <SegmentButton text="Hesapla" active={mode === "calc"} onPress={() => setMode("calc")} />
              </View>
            </View>

            {mode === "track" ? (
              <>
                <View style={styles.card}>
                  <View style={styles.summaryRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.sectionTitle}>Bugün</Text>
                      <Text style={styles.muted}>Tarih: {todayKey()}</Text>
                    </View>

                    <Pressable onPress={clearToday} style={styles.secondaryBtn}>
                      <Text style={styles.secondaryBtnText}>Sıfırla</Text>
                    </Pressable>
                  </View>

                  <View style={styles.summaryNumbersRow}>
                    <SummaryBox label="Aldığınız" value={`${totalKcal} kcal`} />
                    <SummaryBox label="Hedef" value={`${computed?.recommended ?? "-"} kcal`} />
                    <SummaryBox
                      label="Kalan"
                      value={
                        remaining === null
                          ? "-"
                          : remaining >= 0
                          ? `${remaining} kcal`
                          : `${Math.abs(remaining)} kcal (aştı)`
                      }
                      emphasize={remaining !== null && remaining < 0}
                    />
                  </View>

                  {!computed?.recommended ? (
                    <Text style={styles.infoText}>
                      Hedefinizi görmek için “Hesapla” sekmesinden bilgilerinizi girin.
                    </Text>
                  ) : null}
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Bugün Yediklerin</Text>

                  {items.length === 0 ? (
                    <Text style={styles.muted}>Henüz bir şey eklemedin. İlk besinini ekle 🌸</Text>
                  ) : (
                    <View style={{ gap: 10, marginTop: 10 }}>
                      {items.map((it) => (
                        <View key={it.id} style={styles.foodRow}>
                          <View style={{ flex: 1 }}>
                            <Text style={styles.foodName}>{it.name}</Text>
                            {it.grams && it.kcalPer100g ? (
                              <Text style={styles.foodMeta}>
                                {it.grams} g • {it.kcalPer100g} /100g
                              </Text>
                            ) : (
                              <Text style={styles.foodMeta}>Direkt giriş</Text>
                            )}
                          </View>

                          <View style={styles.foodRight}>
                            <Text style={styles.foodKcal}>{it.kcalTotal} kcal</Text>
                            <Pressable onPress={() => removeItem(it.id)}>
                              <Text style={styles.deleteText}>Sil</Text>
                            </Pressable>
                          </View>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Besin Ekle</Text>

                  <Text style={styles.label}>Besin adı</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="örn. tavuk göğsü"
                    placeholderTextColor="#B88C86"
                    value={foodName}
                    onChangeText={setFoodName}
                  />

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>{gramUnit === "ml" ? "Miktar (ml)" : "Gram"}</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="örn. 150"
                        placeholderTextColor="#B88C86"
                        keyboardType="numeric"
                        value={gramsText}
                        onChangeText={(t) => setGramsText(onlyDigits(t))}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Kalori / 100g</Text>
                      <TextInput
                        style={styles.input}
                        placeholder="örn. 165"
                        placeholderTextColor="#B88C86"
                        keyboardType="numeric"
                        value={kcalPer100gText}
                        onChangeText={(t) => setKcalPer100gText(onlyDigits(t))}
                      />
                    </View>
                  </View>

                  <Text style={styles.orText}>veya</Text>

                  <Text style={styles.label}>Toplam Kalori (Direkt)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="örn. 320"
                    placeholderTextColor="#B88C86"
                    keyboardType="numeric"
                    value={kcalDirectText}
                    onChangeText={(t) => setKcalDirectText(onlyDigits(t))}
                  />

                  <Pressable style={styles.primaryBtn} onPress={addFood}>
                    <Text style={styles.primaryBtnText}>Ekle</Text>
                  </Pressable>

                  <Text style={styles.smallMuted}>
                    Not: “Toplam kalori” girersen gram/100g alanları dikkate alınmaz.
                  </Text>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Hızlı Ekleme</Text>
                  <Text style={styles.muted}>Birini seçip gramı ayarla, sonra “Ekle” de.</Text>

                  <View style={styles.quickWrap}>
                    {QUICK_FOODS.map((q) => (
                      <Pressable key={q.name} onPress={() => addQuickFood(q)} style={styles.quickChip}>
                        <Text style={styles.quickChipText}>{q.name}</Text>
                        <Text style={styles.quickChipSub}>{q.kcalPer100g} /100g</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            ) : (
              <>
                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Günlük hedefini hesapla</Text>

                  <Text style={styles.label}>Cinsiyet</Text>
                  <View style={styles.segmentRow}>
                    <SegmentButton text="Kadın" active={sex === "female"} onPress={() => setSex("female")} />
                    <SegmentButton text="Erkek" active={sex === "male"} onPress={() => setSex("male")} />
                  </View>

                  <View style={styles.twoColRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Yaş</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={age}
                        onChangeText={(t) => setAge(onlyDigits(t))}
                        placeholder="örn. 30"
                        placeholderTextColor="#B88C86"
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text style={styles.label}>Boy (cm)</Text>
                      <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={heightCm}
                        onChangeText={(t) => setHeightCm(onlyDigits(t))}
                        placeholder="örn. 165"
                        placeholderTextColor="#B88C86"
                      />
                    </View>
                  </View>

                  <Text style={styles.label}>Kilo (kg)</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={weightKg}
                    onChangeText={(t) => setWeightKg(onlyDigits(t))}
                    placeholder="örn. 60"
                    placeholderTextColor="#B88C86"
                  />

                  <Text style={styles.label}>Aktivite</Text>
                  <View style={styles.wrap}>
                    <Chip text="Hareketsiz" active={activity === "sedentary"} onPress={() => setActivity("sedentary")} />
                    <Chip text="Hafif" active={activity === "light"} onPress={() => setActivity("light")} />
                    <Chip text="Orta" active={activity === "moderate"} onPress={() => setActivity("moderate")} />
                    <Chip text="Aktif" active={activity === "active"} onPress={() => setActivity("active")} />
                    <Chip text="Çok aktif" active={activity === "very_active"} onPress={() => setActivity("very_active")} />
                  </View>

                  <Text style={styles.label}>Hedef</Text>
                  <View style={styles.segmentRow}>
                    <SegmentButton text="Koruma" active={goal === "maintain"} onPress={() => setGoal("maintain")} />
                    <SegmentButton text="Kilo verme" active={goal === "lose"} onPress={() => setGoal("lose")} />
                    <SegmentButton text="Kilo alma" active={goal === "gain"} onPress={() => setGoal("gain")} />
                  </View>
                </View>

                <View style={styles.card}>
                  <Text style={styles.sectionTitle}>Sonuç</Text>

                  {!computed ? (
  <Text style={styles.muted}>
    Lütfen değerleri kontrol edin (yaş, boy, kilo geçerli aralıkta olmalı).
  </Text>
) : (
  <>
    <ResultRow
      label="BMR (bazal metabolizma)"
      value={`${computed.bmr} kcal`}
    />
    <ResultRow
      label="TDEE (günlük toplam ihtiyaç)"
      value={`${computed.tdee} kcal`}
    />
    <View style={styles.divider} />
    <ResultRow
      label="Önerilen günlük hedef"
      value={`${computed.recommended} kcal`}
      bold
    />
    <ResultRow
      label="BMI"
      value={`${computed.bmi} (${computed.bmiCategory})`}
    />
    <ResultRow
      label="Boyuna göre sağlıklı kilo aralığı"
      value={`${computed.healthyWeightMin} - ${computed.healthyWeightMax} kg`}
    />

    <Text style={styles.smallMuted}>{computed.weightNote}</Text>

    <Text style={styles.smallMuted}>
      Not: Tek bir “ideal kilo” yerine sağlıklı kilo aralığı gösterilir.
      Bu değerler genel tahmindir.
    </Text>

    <Pressable style={styles.primaryBtn} onPress={() => setMode("track")}>
      <Text style={styles.primaryBtnText}>Kaydet ve Takibe Geç</Text>
    </Pressable>
  </>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          <View style={styles.adContainer}>
            <AdBanner />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function SegmentButton({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.segmentBtn, active && styles.segmentBtnActive]}>
      <Text style={[styles.segmentText, active && styles.segmentTextActive]}>{text}</Text>
    </Pressable>
  );
}

function Chip({
  text,
  active,
  onPress,
}: {
  text: string;
  active?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{text}</Text>
    </Pressable>
  );
}

function SummaryBox({
  label,
  value,
  emphasize,
}: {
  label: string;
  value: string;
  emphasize?: boolean;
}) {
  return (
    <View style={[styles.summaryBox, emphasize && styles.summaryBoxWarn]}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, emphasize && { color: "#8B1E2D" }]}>{value}</Text>
    </View>
  );
}

function ResultRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <View style={styles.resultRow}>
      <Text style={[styles.resultLabel, bold && { fontWeight: "800" }]}>{label}</Text>
      <Text style={[styles.resultValue, bold && { fontWeight: "900" }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F3" },
  container: { padding: 16, paddingBottom: 30 },

  headerCard: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: "#FCE8E4",
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#4A2E2A", marginBottom: 6 },
  subtitle: { fontSize: 13, color: "#6B4A44", lineHeight: 18 },

  card: {
    padding: 14,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    marginBottom: 12,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 10,
  },
  muted: { fontSize: 13, color: "#6B4A44", opacity: 0.9 },
  smallMuted: {
    fontSize: 12,
    color: "#6B4A44",
    opacity: 0.9,
    marginTop: 10,
    lineHeight: 16,
  },
  infoText: { fontSize: 13, color: "#6B4A44", marginTop: 10 },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#F3B6B3",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    backgroundColor: "#FFFFFF",
    color: "#4A2E2A",
    marginBottom: 10,
  },

  twoColRow: { flexDirection: "row", gap: 10 },
  wrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 8,
  },

  segmentRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  segmentBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    backgroundColor: "#FFFFFF",
    alignItems: "center",
  },
  segmentBtnActive: {
    backgroundColor: "#F3B6D0",
    borderColor: "#F3B6D0",
  },
  segmentText: { fontSize: 14, fontWeight: "700", color: "#4A2E2A" },
  segmentTextActive: { color: "#FFFFFF" },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    backgroundColor: "#FFF7F3",
  },
  chipActive: { backgroundColor: "#FCE8E4" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#4A2E2A" },
  chipTextActive: { fontWeight: "800" },

  primaryBtn: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#F3B6B3",
    alignItems: "center",
  },
  primaryBtnText: { color: "#FFFFFF", fontWeight: "800", fontSize: 15 },

  secondaryBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: "#FFF7F3",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  secondaryBtnText: {
    color: "#4A2E2A",
    fontWeight: "800",
    fontSize: 13,
  },

  orText: {
    textAlign: "center",
    marginVertical: 6,
    color: "#6B4A44",
    fontWeight: "700",
  },

  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  summaryNumbersRow: { flexDirection: "row", gap: 10, marginTop: 12 },
  summaryBox: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#FFF7F3",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  summaryBoxWarn: {
    borderColor: "#8B1E2D",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6B4A44",
    fontWeight: "700",
    marginBottom: 4,
  },
  summaryValue: { fontSize: 14, color: "#4A2E2A", fontWeight: "900" },

  quickWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 10,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "#FCE8E4",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  quickChipText: { fontSize: 13, fontWeight: "800", color: "#4A2E2A" },
  quickChipSub: { fontSize: 12, color: "#6B4A44", marginTop: 2 },

  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  foodName: { fontSize: 15, fontWeight: "800", color: "#4A2E2A" },
  foodMeta: { fontSize: 12, color: "#6B4A44", marginTop: 3 },
  foodRight: { alignItems: "flex-end", gap: 6 },
  foodKcal: { fontSize: 14, fontWeight: "900", color: "#B0756F" },
  deleteText: { fontSize: 13, fontWeight: "800", color: "#8B1E2D" },

  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    paddingVertical: 6,
  },
  resultLabel: { fontSize: 13, color: "#6B4A44", flex: 1 },
  resultValue: { fontSize: 14, fontWeight: "800", color: "#4A2E2A" },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.08)",
    marginVertical: 8,
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
    backgroundColor: "#FFF7F3",
  },
});
