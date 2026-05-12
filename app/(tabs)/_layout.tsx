// app/(tabs)/_layout.tsx

import { Tabs, useRouter } from "expo-router";
import * as SecureStore from "expo-secure-store";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const CONSENT_KEY = "privacyConsentAccepted";

export default function TabLayout() {
  const [showConsent, setShowConsent] = useState(false);
  const router = useRouter();

  useEffect(() => {
    checkConsent();
  }, []);

  async function checkConsent() {
    const accepted = await SecureStore.getItemAsync(CONSENT_KEY);
    if (!accepted) setShowConsent(true);
  }

  async function acceptConsent() {
    await SecureStore.setItemAsync(CONSENT_KEY, "true");
    setShowConsent(false);
  }

  return (
    <>
      {/* 🔒 Privacy Consent Modal */}
      <Modal visible={showConsent} transparent animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <ScrollView>
              <Text style={styles.modalTitle}>Gizlilik Bilgilendirmesi</Text>

              <Text style={styles.modalText}>
                WellShe; âdet döngüsü, su takibi ve kalori hesaplama amacıyla
                girilen yaş, boy ve kilo verilerini varsayılan olarak yalnızca cihazınızda saklar.
              </Text>

              <Text style={styles.modalText}>
                Reklam gösterebilmek ve uygulama hatalarını tespit edebilmek
                için Google AdMob, Meta SDK ve Sentry servisleri kullanılmaktadır.
              </Text>

              <Text style={styles.modalText}>
                Devam ederek Gizlilik Politikası’nı kabul etmiş olursunuz.
              </Text>

              <Pressable onPress={() => router.push("/privacy")}>
                <Text style={styles.linkText}>
                  Gizlilik Politikasını Görüntüle
                </Text>
              </Pressable>

              <Pressable style={styles.acceptButton} onPress={acceptConsent}>
                <Text style={styles.acceptButtonText}>Kabul Et</Text>
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 🔹 Normal Tab Layout */}
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { display: "none" },
          tabBarShowLabel: false,
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home" }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalBox: {
    backgroundColor: "#FFF7F3",
    borderRadius: 16,
    padding: 20,
    maxHeight: "80%",
    width: "100%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 14,
    color: "#5A3A35",
    marginBottom: 10,
    lineHeight: 20,
  },
  linkText: {
    fontSize: 14,
    color: "#B45F5F",
    textDecorationLine: "underline",
    marginBottom: 20,
  },
  acceptButton: {
    backgroundColor: "#B45F5F",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptButtonText: {
    color: "#FFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
