// app/privacy.tsx

import { Stack } from "expo-router";
import React from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Gizlilik ve KVKK" }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Gizlilik ve Veri Politikası</Text>

        <Text style={styles.paragraph}>
          WellShe; kadınların günlük yaşamını, döngü takibini ve iyi olma hâlini
          desteklemek amacıyla tasarlanmış bir mobil uygulamadır. Uygulama;
          reklam gösterebilmek ve hata/çökme sorunlarını tespit edebilmek için
          bazı anonim teknik verileri işler.
        </Text>

        <Text style={styles.subtitle}>Hangi veriler cihazda saklanır?</Text>
        <Text style={styles.paragraph}>
          • Uygulama içinde girilen ad bilgisi{"\n"}
          • Regl döngüsü ile ilgili tarih ve ayar bilgileri{"\n"}
          • Bildirim tercihleri{"\n"}
          • Su sayacı ve benzeri kullanım verileri
        </Text>

        <Text style={styles.subtitle}>
          Hangi veriler üçüncü taraf servislerle işlenebilir?
        </Text>

        <Text style={styles.paragraph}>
          Reklam (Google AdMob):{"\n"}
          • Reklam gösterim ve tıklama bilgileri{"\n"}
          • Google Reklam Kimliği (AD_ID) ve cihaz tanımlayıcıları{"\n\n"}
          Hata ve çökme raporları (Sentry):{"\n"}
          • Uygulama hataları, çökme kayıtları ve teknik tanılama verileri
        </Text>

        <Text style={styles.subtitle}>Veriler neden işlenir?</Text>
        <Text style={styles.paragraph}>
          • Reklam göstermek ve reklam performansını ölçmek{"\n"}
          • Uygulama hatalarını tespit edip gidermek{"\n"}
          • Uygulama performansını ve stabilitesini artırmak
        </Text>

        <Text style={styles.subtitle}>Veriler kimlerle paylaşılır?</Text>
        <Text style={styles.paragraph}>
          Anonim teknik veriler yalnızca aşağıdaki servislerle paylaşılır:{"\n"}
          • Google AdMob{"\n"}
          • Sentry
        </Text>

        <Text style={styles.subtitle}>Verilerin silinmesi</Text>
        <Text style={styles.paragraph}>
          Uygulamayı cihazınızdan kaldırdığınızda cihazda saklanan yerel veriler
          silinir. Üçüncü taraf servislerde tutulan anonim teknik kayıtlar ilgili
          servis sağlayıcıların saklama politikalarına tabidir.
        </Text>

        <Text style={styles.subtitle}>KVKK kapsamındaki haklarınız</Text>
        <Text style={styles.paragraph}>
          KVKK kapsamında verilerinizin işlenip işlenmediğini öğrenme ve gerekli
          hâllerde silinmesini talep etme haklarına sahipsiniz.
        </Text>

        <Text style={styles.subtitle}>İletişim</Text>
        <Text style={styles.paragraph}>
          wellshee@gmail.com
        </Text>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Özetle: WellShe sizi izlemek için değil, sizi desteklemek için
            tasarlanmıştır. 🌸
          </Text>
        </View>

        <Text style={styles.paragraph}>
          Son güncelleme: 10 Ocak 2026
        </Text>
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
    padding: 16,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A2E2A",
    marginTop: 16,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    color: "#5A3A35",
    lineHeight: 20,
  },
  noteBox: {
    marginTop: 20,
    padding: 14,
    borderRadius: 14,
    backgroundColor: "#FCE8E4",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },
  noteText: {
    fontSize: 14,
    color: "#5A3A35",
  },
});
