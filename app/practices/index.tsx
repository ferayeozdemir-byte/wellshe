// app/practices/index.tsx

import { trackEvent } from "@/lib/analytics";
import { useTrackScreenDuration } from "@/lib/useTrackScreenDuration";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import AdBanner from "../../components/AdBanner";
import SpiritualBackground from "../components/practices/SpiritualBackground";

function PracticeBannerAd() {
  return (
    <View style={styles.adContainer}>
      <AdBanner />
    </View>
  );
}

export default function PracticesHomeScreen() {
  const router = useRouter();

  useEffect(() => {
    void trackEvent({
      event_name: "screen_view",
      screen_name: "practices",
      feature_name: "practice_home_open",
    });
  }, []);

  useTrackScreenDuration({
    screen_name: "practices",
    feature_name: "practice_home_duration",
  });

  const handlePracticeKindPress = (kind: "breath" | "meditation") => {
    void trackEvent({
      event_name: "feature_used",
      screen_name: "practices",
      feature_name: "practice_kind_click",
      meta: {
        kind,
      },
    });

    router.push({
      pathname: "/practices/[kind]",
      params: { kind },
    });
  };

  return (
    <>
      <Stack.Screen options={{ title: "Pratikler" }} />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.page}>
          <SpiritualBackground variant="meditation" />

          <ScrollView contentContainerStyle={styles.container}>
          <Text style={styles.eyebrow}>KENDİNE KÜÇÜK BİR ALAN AÇ</Text>
          <Text style={styles.title}>Bugün neye ihtiyacın var?</Text>
          <Text style={styles.subtitle}>
            İhtiyacına göre nefes egzersizleri ya da meditasyon pratikleri
            arasından seçim yapabilirsin.
          </Text>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.breathCard,
              pressed ? styles.cardPressed : null,
            ]}
            onPress={() => handlePracticeKindPress("breath")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="leaf-outline" size={26} color="#6F55AA" />
            </View>

            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Nefes Egzersizi</Text>
              <Text style={styles.cardText}>
                Zihnini sakinleştirmek, bedenini yavaşlatmak ve kısa bir mola
                vermek için nefes pratiklerini keşfet.
              </Text>
              <Text style={styles.cardLink}>Pratikleri gör →</Text>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.card,
              styles.meditationCard,
              pressed ? styles.cardPressed : null,
            ]}
            onPress={() => handlePracticeKindPress("meditation")}
          >
            <View style={styles.iconWrap}>
              <Ionicons name="moon-outline" size={26} color="#6F55AA" />
            </View>

            <View style={styles.cardTextWrap}>
              <Text style={styles.cardTitle}>Meditasyon</Text>
              <Text style={styles.cardText}>
                Odağını toplamak, gevşemek ve iç sesini biraz daha net duymak
                için meditasyon içeriklerine geç.
              </Text>
              <Text style={styles.cardLink}>Pratikleri gör →</Text>
            </View>
          </Pressable>
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

  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderRadius: 22,
    borderWidth: 1,
    padding: 18,
    marginBottom: 16,
    backgroundColor: "#FFFFFF",
    shadowColor: "#B98FA3",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },

  breathCard: {
    borderColor: "#D9E7D8",
    backgroundColor: "#F4FAF3",
  },

  meditationCard: {
    borderColor: "#E7D9EE",
    backgroundColor: "#FAF3FB",
  },

  cardPressed: {
    opacity: 0.92,
  },

  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
    borderWidth: 1,
    borderColor: "#E9DDF5",
  },

  cardTextWrap: {
    flex: 1,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#4A3B63",
    marginBottom: 8,
  },

  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5E556A",
    marginBottom: 12,
  },

  cardLink: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6F55AA",
  },

  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
});