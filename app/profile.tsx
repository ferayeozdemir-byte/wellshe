// app/profile.tsx

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Linking,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from "react-native";
import AdBanner from "../components/AdBanner";

const EMAIL_KEY = "userEmail";
const NAME_KEY = "userName";

// ✅ Web linkleri
const INSTAGRAM_WEB =
  "https://www.instagram.com/wellshe_1?igsh=MTNwbmM1bjgwODRiZw==";
const TIKTOK_WEB = "https://www.tiktok.com/@well_she?lang=tr-TR";
const LINKEDIN_WEB =
  "https://www.linkedin.com/company/wellshe/?viewAsMember=true";

// ✅ App scheme (uygulama kuruluysa buraya gider, değilse web'e düşer)
const INSTAGRAM_APP = "instagram://user?username=wellshe_1";
const TIKTOK_APP = "tiktok://user?username=well_she";
// LinkedIn deep link her cihazda stabil değil; yine de deneyip web'e düşüreceğiz:
const LINKEDIN_APP = "linkedin://company/wellshe";

// Paket adına göre mağaza linkleri
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.feraye.wellshe";
const APP_STORE_URL =
  "https://apps.apple.com/app/id1234567890"; // hazır olunca gerçek ID ile değiş

// ✅ Genel güvenli açma (social için alert baskılayabilmek üzere güncellendi)
async function openExternal(
  url: string,
  fallbackMessage: string,
  options?: { suppressAlert?: boolean }
) {
  const suppressAlert = options?.suppressAlert ?? false;

  try {
    const isHttp =
      url.startsWith("http://") ||
      url.startsWith("https://") ||
      url.startsWith("mailto:");

    // 🌐 Web & mailto linklerinde canOpenURL kontrolü yapma, direkt aç
    if (isHttp) {
      await Linking.openURL(url);
      return true;
    }

    // 📱 Özel app scheme'leri için önce canOpenURL kontrolü
    const can = await Linking.canOpenURL(url);
    if (!can) {
      if (!suppressAlert && fallbackMessage) {
        Alert.alert("Açılamadı", fallbackMessage);
      }
      return false;
    }

    await Linking.openURL(url);
    return true;
  } catch (e) {
    console.log("openExternal error:", e);
    if (!suppressAlert && fallbackMessage) {
      Alert.alert("Açılamadı", fallbackMessage);
    }
    return false;
  }
}

// ✅ Sosyal medya: önce app scheme (sessiz), olmazsa web (alert sadece web de açılmazsa)
async function openSocial(appUrl: string, webUrl: string, label: string) {
  // 1) Uygulama linkini dene ama hata verirse uyarı gösterme
  const openedApp = await openExternal(appUrl, "", { suppressAlert: true });

  // 2) App açılamadıysa web linkine düş
  if (!openedApp) {
    await openExternal(
      webUrl,
      `${label} bağlantısını şu an açamıyoruz.`
    );
  }
}

// 🔹 Profil ekranı için banner wrapper (diğer sayfalarla aynı mimari)
function ProfileBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedName = await SecureStore.getItemAsync(NAME_KEY);
        const storedEmail = await AsyncStorage.getItem(EMAIL_KEY);

        if (storedName) setName(storedName);
        if (storedEmail) setEmail(storedEmail);
      } catch (e) {
        console.log("Profil yüklenirken hata:", e);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (!trimmedName) {
      Alert.alert("Uyarı", "Lütfen adını boş bırakma.");
      return;
    }

    if (trimmedEmail && !trimmedEmail.includes("@")) {
      Alert.alert("Uyarı", "Lütfen geçerli bir e-posta adresi gir.");
      return;
    }

    try {
      setIsSaving(true);
      await SecureStore.setItemAsync(NAME_KEY, trimmedName);

      if (trimmedEmail) {
        await AsyncStorage.setItem(EMAIL_KEY, trimmedEmail);
      } else {
        await AsyncStorage.removeItem(EMAIL_KEY);
      }

      Alert.alert("Kaydedildi", "Profil bilgilerin güncellendi. 🌸", [
        { text: "Tamam", onPress: () => router.back() },
      ]);
    } catch (e) {
      console.log("Profil kaydedilirken hata:", e);
      Alert.alert("Hata", "Bilgiler kaydedilirken bir sorun oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  // 🔗 Sosyal medya aksiyonları
  const handleInstagram = () =>
    openSocial(INSTAGRAM_APP, INSTAGRAM_WEB, "Instagram");

  const handleTikTok = () =>
    openSocial(TIKTOK_APP, TIKTOK_WEB, "TikTok");

  const handleLinkedIn = () =>
    openSocial(LINKEDIN_APP, LINKEDIN_WEB, "LinkedIn");

  const handleRateOnPlayStore = () =>
    openExternal(PLAY_STORE_URL, "Google Play bağlantısını şu an açamıyoruz.");

  const handleRateOnAppStore = () =>
    openExternal(APP_STORE_URL, "App Store bağlantısını şu an açamıyoruz.");

  // 📧 Mail gönder
  const handleSendMail = async () => {
    const subject = "WellShe Hakkında Geri Bildirim";
    const body =
      "Merhaba WellShe ekibi,\n\nUygulama hakkında paylaşmak istediğim düşüncelerim:\n\n";

    const mailto = `mailto:welllshee@gmail.com?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;

    await openExternal(mailto, "E-posta uygulamasını şu anda açamıyoruz.");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.page}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.title}>Profilim</Text>

          <Text style={styles.subtitle}>
            Buradan ismini güncelleyebilir, istersen e-posta adresini
            ekleyebilirsin.
          </Text>

          {/* ✅ PROFİL KARTI */}
          <View style={styles.profileCard}>
            <Text style={styles.profileCardTitle}>Bilgilerim</Text>

            <View style={styles.field}>
              <Text style={styles.label}>Adın</Text>
              <TextInput
                style={styles.input}
                placeholder="Adını yaz"
                placeholderTextColor="#b88c86"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>E-posta (isteğe bağlı)</Text>
              <TextInput
                style={styles.input}
                placeholder="ornek@mail.com"
                placeholderTextColor="#b88c86"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <TouchableOpacity
              style={[styles.button, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <Text style={styles.buttonText}>
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🔹 FAVORİLER */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>İçeriklerim</Text>

            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push("/favorites")}
            >
              <Text style={styles.cardTitle}>Favorilerim</Text>
              <Text style={styles.cardText}>
                Beğendiğin içerikleri burada toplu olarak görebilirsin.
              </Text>
            </TouchableOpacity>
          </View>

          {/* 🔹 SOSYAL */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>WellShe ile bağlantıda kal ✨</Text>
            <Text style={styles.sectionDescription}>
              Güncellemeler, mini ipuçları ve yeni içerikler için sosyal medyada
              da buluşalım.
            </Text>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleInstagram}
              >
                <Ionicons name="logo-instagram" size={20} color="#B0756F" />
                <Text style={styles.socialText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleTikTok}
              >
                <Ionicons name="logo-tiktok" size={20} color="#B0756F" />
                <Text style={styles.socialText}>TikTok</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialButton}
                onPress={handleLinkedIn}
              >
                <Ionicons name="logo-linkedin" size={20} color="#B0756F" />
                <Text style={styles.socialText}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🔹 PUANLA */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              WellShe’ye küçük bir yıldız bırak 🌟
            </Text>
            <Text style={styles.sectionDescription}>
              Uygulamayı beğendiysen mağazada vereceğin her puan çok şey değiştirir.
            </Text>

            <View style={styles.rateRow}>
              <TouchableOpacity
                style={[styles.rateButton, { backgroundColor: "#F3B6B3" }]}
                onPress={handleRateOnPlayStore}
              >
                <Text style={styles.rateButtonText}>Google Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.rateButton, { backgroundColor: "#B0756F" }]}
                onPress={handleRateOnAppStore}
              >
                <Text style={styles.rateButtonText}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* 🔹 BİZE YAZ */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Bana yaz 💌</Text>
            <Text style={styles.sectionDescription}>
              WellShe ile ilgili yorumun, sorun, teklifin veya önerin mi var? Bana
              yaz!
            </Text>

            <TouchableOpacity style={styles.mailButton} onPress={handleSendMail}>
              <Text style={styles.mailButtonText}>E-posta gönder</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.back()}
          >
            <Text style={styles.secondaryButtonText}>Geri dön</Text>
          </TouchableOpacity>

          {/* 🔹 GİZLİLİK */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gizlilik</Text>

            <Pressable
              style={styles.card}
              onPress={() => router.push("/privacy")}
            >
              <Text style={styles.cardTitle}>Gizlilik & KVKK</Text>
              <Text style={styles.cardText}>
                Verilerin sadece senin cihazında saklanır. Detaylar için dokun.
              </Text>
            </Pressable>
          </View>

        </ScrollView>

        {/* 🔹 Alt bant reklam */}
        <ProfileBannerAd />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#FFF7F3" },
  page: { flex: 1 },

  container: { padding: 16, paddingBottom: 32 },

  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 8,
  },
  subtitle: { fontSize: 14, color: "#6B4A44", marginBottom: 14 },

  section: { marginBottom: 24 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4A2E2A",
    marginBottom: 8,
  },
  sectionDescription: { fontSize: 13, color: "#6B4A44", marginBottom: 10 },

  profileCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#F3B6B3",
    padding: 14,
    marginBottom: 22,
  },
  profileCardTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 10,
  },

  card: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#B0756F",
    marginBottom: 4,
  },
  cardText: { fontSize: 14, color: "#4A2E2A" },

  socialRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
  },
  socialButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignItems: "center",
    justifyContent: "center",
  },
  socialText: {
    marginTop: 6,
    fontSize: 12,
    color: "#4A2E2A",
    fontWeight: "600",
  },

  rateRow: { flexDirection: "row", gap: 10 },
  rateButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  rateButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  mailButton: {
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3B6B3",
    alignItems: "center",
    justifyContent: "center",
  },
  mailButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },

  field: { marginBottom: 12 },
  label: {
    fontSize: 14,
    fontWeight: "600",
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
    backgroundColor: "#FFF7F3",
    color: "#4A2E2A",
  },
  button: {
    backgroundColor: "#F3B6B3",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 4,
  },
  buttonText: { color: "#FFFFFF", fontSize: 16, fontWeight: "600" },

  secondaryButton: { paddingVertical: 10, alignItems: "center", marginTop: 8 },
  secondaryButtonText: {
    fontSize: 14,
    color: "#B0756F",
    textDecorationLine: "underline",
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
});
