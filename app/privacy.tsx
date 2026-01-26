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
        <Text style={styles.paragraph}>Son güncelleme tarihi: 26 Ocak 2026</Text>

        <Text style={styles.paragraph}>
          WellShe, kadınların âdet döngüsü takibi ve günlük iyi olma hâlini
          desteklemek amacıyla tasarlanmış bir mobil uygulamadır. Bu politika,
          uygulama içinde işlenen verilerin nasıl kullanıldığını açıklar.
        </Text>

        {/* 1 - İşlenen Veriler */}
        <Text style={styles.subtitle}>1) İşlenen Veriler</Text>

        <Text style={styles.subtitleSmall}>Sağlık Verileri</Text>
        <Text style={styles.paragraph}>
          WellShe uygulaması aşağıdaki kişisel sağlık verilerini işler:{"\n\n"}
          • Âdet döngüsü tarih bilgileri{"\n"}
          • Günlük su tüketimi kayıtları{"\n"}
          • Zihin rahatlatma ve motivasyon tercihleri{"\n"}
          • Kalori hesaplama amacıyla girilen yaş, boy ve kilo bilgileri{"\n\n"}
          Bu veriler kişisel sağlık verisi kapsamında değerlendirilir.
          Tüm sağlık verileri yalnızca kullanıcının cihazında yerel olarak saklanır.
          Bu veriler sunucuya aktarılmaz ve üçüncü taraflarla paylaşılmaz.
        </Text>

        <Text style={styles.subtitleSmall}>Kullanıcı Tercih Verileri</Text>
        <Text style={styles.paragraph}>
          • Uygulama içinde girilen ad bilgisi{"\n"}
          • Bildirim tercihleri{"\n"}
          • Uygulama içi ayarlar{"\n\n"}
          Bu veriler yalnızca cihazda saklanır.
        </Text>

        {/* 2 - Üçüncü Taraf Servisler */}
        <Text style={styles.subtitle}>2) Üçüncü Taraf Servisler</Text>

        <Text style={styles.subtitleSmall}>Google AdMob</Text>
        <Text style={styles.paragraph}>
          • Reklam gösterim ve tıklama bilgileri{"\n"}
          • Google Reklam Kimliği (AD_ID) ve cihaz tanımlayıcıları{"\n\n"}
          Bu veriler reklamların gösterilmesi ve performans ölçümü amacıyla işlenir.
        </Text>

        <Text style={styles.subtitleSmall}>Sentry</Text>
        <Text style={styles.paragraph}>
          • Uygulama hataları{"\n"}
          • Çökme raporları{"\n"}
          • Teknik tanılama verileri{"\n\n"}
          Bu veriler uygulamanın stabilitesini artırmak amacıyla kullanılır.
        </Text>

        {/* 3 - Amaç */}
        <Text style={styles.subtitle}>3) Verilerin İşlenme Amaçları</Text>
        <Text style={styles.paragraph}>
          • Âdet döngüsü ve günlük takip özelliklerini sağlamak{"\n"}
          • Kalori ve su takibi hesaplamalarını sunmak{"\n"}
          • Hatırlatıcı bildirimler göndermek{"\n"}
          • Reklam göstermek ve reklam performansını ölçmek{"\n"}
          • Uygulama hatalarını tespit edip gidermek
        </Text>

        {/* 4 - Paylaşım */}
        <Text style={styles.subtitle}>4) Verilerin Paylaşımı</Text>
        <Text style={styles.paragraph}>
          Sağlık verileri üçüncü taraflarla paylaşılmaz.{"\n\n"}
          Anonim teknik veriler yalnızca:{"\n"}
          • Google AdMob{"\n"}
          • Sentry{"\n"}
          servisleriyle paylaşılır.
        </Text>

        {/* 5 - Güvenlik */}
        <Text style={styles.subtitle}>5) Veri Güvenliği</Text>
        <Text style={styles.paragraph}>
          • Tüm üçüncü taraf veri aktarımı şifreli bağlantı (HTTPS) ile yapılır.{"\n"}
          • Sağlık verileri cihaz dışına çıkarılmaz.
        </Text>

        {/* 6 - Silme */}
        <Text style={styles.subtitle}>6) Verilerin Silinmesi</Text>
        <Text style={styles.paragraph}>
          Kullanıcı aşağıdaki yollarla verilerini silebilir:{"\n\n"}
          • Uygulamayı cihazdan kaldırarak{"\n"}
          • Uygulama içindeki “Verilerimi sıfırla” seçeneğini kullanarak{"\n\n"}
          Cihazdan silinen sağlık verileri geri getirilemez.{"\n"}
          Üçüncü taraf servislerde tutulan anonim teknik kayıtlar ilgili servis sağlayıcıların saklama sürelerine tabidir.
        </Text>

        {/* 7 - KVKK */}
        <Text style={styles.subtitle}>7) KVKK Kapsamındaki Haklar</Text>
        <Text style={styles.paragraph}>
          KVKK kapsamında kullanıcılar:{"\n\n"}
          • Verilerinin işlenip işlenmediğini öğrenme{"\n"}
          • Gerekli hâllerde silinmesini talep etme{"\n\n"}
          haklarına sahiptir.
        </Text>

        {/* 8 - İletişim */}
        <Text style={styles.subtitle}>İletişim</Text>
        <Text style={styles.paragraph}>
          wellshee@gmail.com
        </Text>

        {/* Not */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Özetle: WellShe sizi izlemek için değil, sizi desteklemek için tasarlanmıştır. 🌸
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#4A2E2A",
    marginTop: 18,
    marginBottom: 6,
  },
  subtitleSmall: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4A2E2A",
    marginTop: 10,
    marginBottom: 4,
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
