import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  Linking,
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
import AdBanner from "../components/AdBanner";

const NAME_KEY = "userName";

const INSTAGRAM_WEB =
  "https://www.instagram.com/wellshe_1?igsh=MTNwbmM1bjgwODRiZw==";
const TIKTOK_WEB = "https://www.tiktok.com/@well_she?lang=tr-TR";
const LINKEDIN_WEB =
  "https://www.linkedin.com/company/wellshe/?viewAsMember=true";

const INSTAGRAM_APP = "instagram://user?username=wellshe_1";
const TIKTOK_APP = "tiktok://user?username=well_she";
const LINKEDIN_APP = "linkedin://company/wellshe";

const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.feraye.wellshe";

const APP_STORE_WEB_URL =
  "https://apps.apple.com/us/app/wellshe/id6759724666";
const APP_STORE_IOS_URL =
  "itms-apps://apps.apple.com/us/app/wellshe/id6759724666";

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
      url.startsWith("mailto:") ||
      url.startsWith("itms-apps://");

    if (isHttp) {
      await Linking.openURL(url);
      return true;
    }

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

async function openSocial(appUrl: string, webUrl: string, label: string) {
  const openedApp = await openExternal(appUrl, "", { suppressAlert: true });

  if (!openedApp) {
    await openExternal(webUrl, `${label} bağlantısını şu an açamıyoruz.`);
  }
}

function ProfileBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

function DecorativeLeaf({
  style,
  rotate = "0deg",
}: {
  style?: any;
  rotate?: string;
}) {
  return (
    <View style={[styles.leafBranch, style, { transform: [{ rotate }] }]}>
      <View style={[styles.leafItem, styles.leafOne]} />
      <View style={[styles.leafItem, styles.leafTwo]} />
      <View style={[styles.leafItem, styles.leafThree]} />
      <View style={[styles.leafItem, styles.leafFour]} />
    </View>
  );
}

export default function ProfileScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const storedName = await SecureStore.getItemAsync(NAME_KEY);
        if (storedName) setName(storedName);
      } catch (e) {
        console.log("Profil yüklenirken hata:", e);
      }
    };

    loadProfile();
  }, []);

  const handleSave = async () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert("Uyarı", "Lütfen adını boş bırakma.");
      return;
    }

    try {
      setIsSaving(true);
      await SecureStore.setItemAsync(NAME_KEY, trimmedName);
      Alert.alert("Kaydedildi", "Profil bilgilerin güncellendi. 🌸");
    } catch (e) {
      console.log("Profil kaydedilirken hata:", e);
      Alert.alert("Hata", "Bilgiler kaydedilirken bir sorun oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleInstagram = () =>
    openSocial(INSTAGRAM_APP, INSTAGRAM_WEB, "Instagram");

  const handleTikTok = () => openSocial(TIKTOK_APP, TIKTOK_WEB, "TikTok");

  const handleLinkedIn = () =>
    openSocial(LINKEDIN_APP, LINKEDIN_WEB, "LinkedIn");

  const handleRateOnPlayStore = () =>
    openExternal(PLAY_STORE_URL, "Google Play bağlantısını şu an açamıyoruz.");

  const handleRateOnAppStore = async () => {
    try {
      if (Platform.OS === "ios") {
        await Linking.openURL(APP_STORE_IOS_URL);
        return;
      }

      await Linking.openURL(APP_STORE_WEB_URL);
    } catch {
      try {
        await Linking.openURL(APP_STORE_WEB_URL);
      } catch {
        Alert.alert(
          "Açılamadı",
          "App Store bağlantısını şu an açamıyoruz."
        );
      }
    }
  };

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
        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.bgTopRightBlob} />
          <View style={styles.bgTopRightBlob2} />
          <View style={styles.heroCurve} />

          <DecorativeLeaf style={styles.leftLeaf} rotate="-12deg" />
          <DecorativeLeaf style={styles.rightLeafTop} rotate="16deg" />
          <DecorativeLeaf style={styles.rightLeafBottom} rotate="18deg" />

          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="arrow-back" size={22} color="#6A433F" />
            </TouchableOpacity>

            <Text style={styles.screenTitle}>Profil</Text>

            <View style={styles.topSpacer} />
          </View>

          <View style={styles.hero}>
            <View style={styles.heroBadgeOuter}>
              <Image
                source={require("../assets/images/profile/profile-badge.png")}
                style={styles.heroBadgeImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.sparkleWrap}>
              <Ionicons name="sparkles-outline" size={14} color="#E5B0A9" />
              <Ionicons name="sparkles" size={10} color="#D99C97" />
              <Ionicons name="sparkles-outline" size={14} color="#E5B0A9" />
            </View>

            <Text style={styles.heroText}>
              İyi hissetmek, kendinle kurduğun bağla başlar.
            </Text>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Ionicons name="leaf-outline" size={15} color="#D9A39C" />
              <View style={styles.dividerLine} />
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="person-outline" size={22} color="#B86D67" />
              </View>
              <Text style={styles.sectionHeading}>Bilgilerim</Text>
            </View>

            <View style={styles.fieldBlock}>
              <Text style={styles.fieldLabel}>Adın</Text>

              <View style={styles.inputWrap}>
                <View style={styles.inputIconCircle}>
                  <Ionicons name="person-outline" size={18} color="#B86D67" />
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Adını yaz"
                  placeholderTextColor="#B8938E"
                  value={name}
                  onChangeText={setName}
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, isSaving && { opacity: 0.7 }]}
              onPress={handleSave}
              disabled={isSaving}
            >
              <View style={styles.saveButtonGlow} />
              <Text style={styles.saveButtonText}>
                {isSaving ? "Kaydediliyor..." : "Kaydet"}
              </Text>
              <Ionicons
                name="sparkles"
                size={16}
                color="#FFF7F5"
                style={styles.saveSparkle}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconCircle}>
                <Ionicons name="heart-outline" size={22} color="#B86D67" />
              </View>
              <Text style={styles.sectionHeading}>İçeriklerim</Text>
            </View>

            <TouchableOpacity
              style={styles.favoritesCard}
              onPress={() => router.push("/favorites")}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.favoritesTitle}>Favorilerim</Text>
                <Text style={styles.favoritesText}>
                  Beğendiğin içerikleri burada toplu olarak görebilirsin.
                </Text>
              </View>

              <View style={styles.chevronCircle}>
                <Ionicons name="chevron-forward" size={22} color="#7A554F" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.blockTitle}>WellShe ile bağlantıda kal</Text>
              <TouchableOpacity
                onPress={() =>
                  Alert.alert(
                    "Bağlantıda kal",
                    "Güncellemeler, mini ipuçları ve yeni içerikler için sosyal medya hesaplarımızı takip edebilirsin."
                  )
                }
              >
                <View style={styles.infoCircle}>
                  <Ionicons
                    name="help-circle-outline"
                    size={24}
                    color="#8B625C"
                  />
                </View>
              </TouchableOpacity>
            </View>

            <Text style={styles.blockDescription}>
              Güncellemeler, mini ipuçları ve yeni içerikler için sosyal medyada
              da buluşalım.
            </Text>

            <View style={styles.socialRow}>
              <TouchableOpacity
                style={styles.socialCard}
                onPress={handleInstagram}
              >
                <View style={styles.socialIconCircle}>
                  <Ionicons name="logo-instagram" size={28} color="#B86D67" />
                </View>
                <Text style={styles.socialLabel}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialCard}
                onPress={handleTikTok}
              >
                <View style={styles.socialIconCircle}>
                  <Ionicons name="logo-tiktok" size={26} color="#B86D67" />
                </View>
                <Text style={styles.socialLabel}>TikTok</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.socialCard}
                onPress={handleLinkedIn}
              >
                <View style={styles.socialIconCircle}>
                  <Ionicons name="logo-linkedin" size={26} color="#B86D67" />
                </View>
                <Text style={styles.socialLabel}>LinkedIn</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <View style={styles.sectionTitleRow}>
              <Text style={styles.blockTitle}>WellShe’ye küçük bir yıldız bırak</Text>
              <View style={styles.starDecorWrap}>
                <Ionicons name="sparkles-outline" size={16} color="#E8A8A3" />
                <Ionicons name="star" size={26} color="#E7A59F" />
                <Ionicons name="sparkles-outline" size={14} color="#E8A8A3" />
              </View>
            </View>

            <Text style={styles.blockDescription}>
              Uygulamayı beğendiysen mağazada vereceğin her puan çok şey değiştirir.
            </Text>

            <View style={styles.storeRow}>
              <TouchableOpacity
                style={[styles.storeButton, styles.playButton]}
                onPress={handleRateOnPlayStore}
              >
                <Ionicons name="logo-google-playstore" size={20} color="#FFF" />
                <Text style={styles.storeButtonText}>Google Play</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.storeButton, styles.appStoreButton]}
                onPress={handleRateOnAppStore}
              >
                <Ionicons name="logo-apple" size={22} color="#FFF" />
                <Text style={styles.storeButtonText}>App Store</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.blockTitle}>Bana yaz</Text>
            <Text style={styles.blockDescription}>
              WellShe ile ilgili yorumun, sorun, teklifin veya önerin mi var? Bana
              yaz.
            </Text>

            <TouchableOpacity style={styles.mailButton} onPress={handleSendMail}>
              <Text style={styles.mailButtonText}>E-posta gönder</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.blockTitle}>Gizlilik</Text>
            <Text style={styles.blockDescription}>
              Verilerin sadece senin cihazında saklanır. Detaylar için aşağıdan
              ulaşabilirsin.
            </Text>

            <Pressable
              style={styles.privacyCard}
              onPress={() => router.push("/privacy")}
            >
              <View style={styles.privacyLeft}>
                <View style={styles.sectionIconCircle}>
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color="#B86D67"
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <Text style={styles.favoritesTitle}>Gizlilik & KVKK</Text>
                  <Text style={styles.favoritesText}>
                    Uygulamadaki gizlilik yaklaşımını ve detayları görüntüle.
                  </Text>
                </View>
              </View>

              <Ionicons name="chevron-forward" size={22} color="#7A554F" />
            </Pressable>
          </View>
        </ScrollView>

        <ProfileBannerAd />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFF8F6",
  },

  page: {
    flex: 1,
    backgroundColor: "#FFF8F6",
  },

  container: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 30,
  },

  topBar: {
    minHeight: 56,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
  },

  backButton: {
    position: "absolute",
    left: 0,
    top: 4,
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "rgba(255,255,255,0.85)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D8B1AC",
    shadowOpacity: 0.18,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },

  topSpacer: {
    width: 62,
    height: 62,
  },

  screenTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#533431",
  },

  hero: {
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  heroBadgeOuter: {
    width: 148,
    height: 148,
    borderRadius: 74,
    backgroundColor: "rgba(255,255,255,0.72)",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#D7ACA6",
    shadowOpacity: 0.18,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
    marginBottom: 12,
  },

  heroBadgeImage: {
    width: 132,
    height: 132,
  },

  sparkleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 6,
  },

  heroText: {
    fontSize: 18,
    color: "#6A433F",
    textAlign: "center",
    fontWeight: "500",
    lineHeight: 26,
    paddingHorizontal: 18,
  },

  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },

  dividerLine: {
    width: 68,
    height: 1.5,
    backgroundColor: "#E8C2BC",
    borderRadius: 999,
  },

  sectionCard: {
    backgroundColor: "rgba(255,255,255,0.78)",
    borderWidth: 1,
    borderColor: "#EDC8C2",
    borderRadius: 26,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#E0B8B1",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 2,
  },

  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  sectionIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#F9E7E3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  sectionHeading: {
    fontSize: 20,
    fontWeight: "700",
    color: "#5A3732",
  },

  fieldBlock: {
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#8B625C",
    marginBottom: 8,
    marginLeft: 6,
  },

  inputWrap: {
    borderWidth: 1.5,
    borderColor: "#EDC8C2",
    borderRadius: 20,
    backgroundColor: "rgba(255,250,249,0.95)",
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
  },

  inputIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#F9E7E3",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },

  input: {
    flex: 1,
    fontSize: 17,
    color: "#5A3732",
    paddingVertical: 12,
  },

  saveButton: {
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 4,
    backgroundColor: "#D98D89",
    overflow: "hidden",
    position: "relative",
  },

  saveButtonGlow: {
    position: "absolute",
    right: -20,
    top: -14,
    width: 170,
    height: 90,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.12)",
  },

  saveButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },

  saveSparkle: {
    position: "absolute",
    right: 20,
    bottom: 16,
  },

  favoritesCard: {
    borderWidth: 1.2,
    borderColor: "#EFD4D0",
    borderRadius: 22,
    backgroundColor: "rgba(255,248,247,0.9)",
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
  },

  favoritesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5A3732",
    marginBottom: 4,
  },

  favoritesText: {
    fontSize: 14,
    color: "#77504A",
    lineHeight: 20,
  },

  chevronCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: "rgba(255,255,255,0.92)",
    borderWidth: 1,
    borderColor: "#F0D3CE",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 14,
  },

  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 6,
  },

  blockTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#5A3732",
    flex: 1,
    paddingRight: 10,
  },

  blockDescription: {
    fontSize: 14,
    color: "#7B5752",
    lineHeight: 21,
    marginBottom: 14,
  },

  infoCircle: {
    alignItems: "center",
    justifyContent: "center",
  },

  socialRow: {
    flexDirection: "row",
    gap: 12,
  },

  socialCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1.2,
    borderColor: "#F0D3CE",
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 8,
  },

  socialIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#F9E7E3",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },

  socialLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#5A3732",
  },

  starDecorWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginTop: 1,
  },

  storeRow: {
    flexDirection: "row",
    gap: 12,
  },

  storeButton: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    gap: 8,
  },

  playButton: {
    backgroundColor: "#D98D89",
  },

  appStoreButton: {
    backgroundColor: "#B97A76",
  },

  storeButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
  },

  mailButton: {
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "#F1B0AA",
    alignItems: "center",
    justifyContent: "center",
  },

  mailButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },

  privacyCard: {
    borderWidth: 1.2,
    borderColor: "#F0D3CE",
    borderRadius: 20,
    backgroundColor: "rgba(255,248,247,0.9)",
    padding: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  privacyLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
    backgroundColor: "#FFF8F6",
  },

  bgTopRightBlob: {
    position: "absolute",
    top: -30,
    right: -20,
    width: 170,
    height: 170,
    borderRadius: 999,
    backgroundColor: "rgba(241, 202, 196, 0.38)",
  },

  bgTopRightBlob2: {
    position: "absolute",
    top: 18,
    right: 38,
    width: 110,
    height: 110,
    borderRadius: 999,
    backgroundColor: "rgba(247, 221, 216, 0.45)",
  },

  heroCurve: {
    position: "absolute",
    top: 220,
    left: -40,
    right: -40,
    height: 170,
    backgroundColor: "rgba(255,255,255,0.5)",
    borderTopLeftRadius: 220,
    borderTopRightRadius: 220,
  },

  leftLeaf: {
    position: "absolute",
    top: 132,
    left: -8,
  },

  rightLeafTop: {
    position: "absolute",
    top: 520,
    right: 0,
  },

  rightLeafBottom: {
    position: "absolute",
    top: 760,
    right: 0,
  },

  leafBranch: {
    width: 76,
    height: 170,
    position: "absolute",
  },

  leafItem: {
    position: "absolute",
    width: 14,
    height: 34,
    borderRadius: 20,
    backgroundColor: "rgba(228, 176, 168, 0.52)",
  },

  leafOne: {
    left: 20,
    top: 10,
    transform: [{ rotate: "-42deg" }],
  },

  leafTwo: {
    left: 38,
    top: 30,
    transform: [{ rotate: "30deg" }],
  },

  leafThree: {
    left: 18,
    top: 56,
    transform: [{ rotate: "-38deg" }],
  },

  leafFour: {
    left: 36,
    top: 78,
    transform: [{ rotate: "28deg" }],
  },
});