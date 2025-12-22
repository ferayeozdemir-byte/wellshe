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
          WellShe, kullanıcının günlük yaşamını, döngü takibini ve iyi olma
          hâlini desteklemek için tasarlanmış kişisel bir yardımcı uygulamadır.
          Uygulama, şu anki sürümünde verilerinizi yalnızca cihazınızda
          saklar; haricî bir sunucuya, buluta veya üçüncü parti servise
          göndermez.
        </Text>

        <Text style={styles.subtitle}>Hangi veriler saklanır?</Text>
        <Text style={styles.paragraph}>
          • Uygulama içinde girdiğiniz ad bilginiz{"\n"}
          • Regl döngüsü ile ilgili girdiğiniz tarih ve ayar bilgileri{"\n"}
          • Uygulamayı kullanırken yaptığınız tercihler (bildirim tercihleri vb.)
        </Text>

        <Text style={styles.subtitle}>Veriler nerede tutulur?</Text>
        <Text style={styles.paragraph}>
          Bu veriler yalnızca cihazınızda saklanır. Şu anda WellShe; kendi
          sunucularına, üçüncü parti bir backend&apos;e veya analitik
          sağlayıcısına veri göndermez.
        </Text>

        <Text style={styles.subtitle}>Verilerin işlenme amacı</Text>
        <Text style={styles.paragraph}>
          Verileriniz yalnızca uygulama deneyiminizi kişiselleştirmek için
          kullanılır. Örneğin:
          {"\n"}• Adınız, uygulama içi selamlama ve profil ekranı için
          kullanılır.{"\n"}• Regl döngüsü verileriniz, faz bilgilendirmeleri ve
          tahmini sonraki regl tarihinin hesaplanması için kullanılır.
        </Text>

        <Text style={styles.subtitle}>Verilerin paylaşımı</Text>
        <Text style={styles.paragraph}>
          Verileriniz üçüncü kişilerle paylaşılmaz, satılmaz ve reklam
          amaçlı kullanılmaz. Verileriniz sadece cihazınızda kalır ve yalnızca
          sizin erişiminizdedir.
        </Text>

        <Text style={styles.subtitle}>Verilerin silinmesi</Text>
        <Text style={styles.paragraph}>
          Uygulamayı cihazınızdan kaldırdığınızda WellShe tarafından
          saklanan tüm yerel veriler de silinir. İleride ek bir &quot;verileri
          sıfırla&quot; fonksiyonu eklendiğinde uygulama içinden de tüm
          verilerinizi tek dokunuşla silebileceksiniz.
        </Text>

        <Text style={styles.subtitle}>KVKK kapsamında haklarınız</Text>
        <Text style={styles.paragraph}>
          Türkiye Cumhuriyeti Kişisel Verilerin Korunması Kanunu (KVKK)
          kapsamında; kişisel verilerinizin işlenip işlenmediğini öğrenme,
          yanlış veya eksik işlendiğini düşünüyorsanız düzeltilmesini talep
          etme ve gerekli hâllerde verilerinizin silinmesini talep etme hakkına
          sahipsiniz. WellShe mevcut sürümünde verilerinizi yalnızca cihazınızda
          tuttuğundan bu haklarınızı kullanmanın en pratik yolu uygulamayı
          kaldırmak veya ileride eklenmesi durumunda &quot;verileri sıfırla&quot;
          özelliğini kullanmaktır.
        </Text>

        <Text style={styles.subtitle}>Gelecekteki güncellemeler</Text>
        <Text style={styles.paragraph}>
          İleride uygulamaya sunucu taraflı özellikler (bulut senkronizasyonu,
          üyelik sistemi, analitik vb.) eklenmesi durumunda bu gizlilik
          politikası güncellenecek ve sizden açıkça onay alınacaktır.
        </Text>

        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Özetle: WellShe seni izleyen değil, seni destekleyen bir yardımcı
            olarak tasarlandı. Verilerin yalnızca senin cihazında ve senin
            kontrolündedir. 🌸
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
