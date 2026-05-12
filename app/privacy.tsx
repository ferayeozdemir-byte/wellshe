// app/privacy.tsx

import { Stack } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

export default function PrivacyScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <Stack.Screen options={{ title: "Gizlilik ve KVKK" }} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Gizlilik ve Veri Politikası</Text>

        <Text style={styles.date}>
          Son güncelleme tarihi: 26 Ocak 2026
        </Text>

        <Text style={styles.paragraph}>
          WellShe, kadınların âdet döngüsü takibi ve günlük iyi olma hâlini
          desteklemek amacıyla tasarlanmış bir mobil uygulamadır. Bu politika,
          uygulama içinde işlenen verilerin nasıl kullanıldığını açıklar.
        </Text>

        {/* 1 */}
        <Text style={styles.sectionTitle}>1) İşlenen Veriler</Text>

        <Text style={styles.subTitle}>Sağlık Verileri</Text>

        <Text style={styles.paragraph}>
          WellShe uygulaması aşağıdaki sağlık verilerini işler:
        </Text>

        <Text style={styles.list}>
          • Âdet döngüsü tarih bilgileri{"\n"}
          • Günlük su tüketimi kayıtları{"\n"}
          • Zihin rahatlatma ve motivasyon tercihleri{"\n"}
          • Kalori hesaplama amacıyla girilen yaş, boy ve kilo bilgileri
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler kişisel sağlık verisi kapsamında değerlendirilir.
        </Text>

        <Text style={styles.paragraph}>
          Sağlık verileri varsayılan olarak yalnızca kullanıcının cihazında
          yerel olarak saklanır.
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler WellShe sunucularına aktarılmaz ve üçüncü taraf reklam
          veya analiz servisleriyle paylaşılmaz.
        </Text>

        <Text style={styles.subTitle}>Kullanıcı Tercih Verileri</Text>

        <Text style={styles.list}>
          • Uygulama içinde girilen ad bilgisi{"\n"}
          • Bildirim tercihleri{"\n"}
          • Uygulama içi ayarlar
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler yalnızca cihazda saklanır.
        </Text>

        {/* 2 */}
        <Text style={styles.sectionTitle}>2) Üçüncü Taraf Servisler</Text>

        <Text style={styles.subTitle}>Google AdMob</Text>

        <Text style={styles.list}>
          • Reklam gösterim ve tıklama bilgileri{"\n"}
          • Google Reklam Kimliği (AD_ID) ve cihaz tanımlayıcıları
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler reklamların gösterilmesi ve performans ölçümü amacıyla
          işlenir.
        </Text>

        <Text style={styles.subTitle}>Sentry</Text>

        <Text style={styles.list}>
          • Uygulama hataları{"\n"}
          • Çökme raporları{"\n"}
          • Teknik tanılama verileri
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler uygulamanın stabilitesini artırmak amacıyla kullanılır.
        </Text>

        <Text style={styles.subTitle}>
          Supabase (Analytics / Event Tracking)
        </Text>

        <Text style={styles.list}>
          • Uygulama içinde anonim kullanım istatistikleri toplanır{"\n"}
          • Ekran görüntüleme, özellik kullanımı ve içerik açma bilgileri
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler doğrudan kullanıcı kimliği, isim veya sağlık verileri ile
          ilişkilendirilmez.
        </Text>

        <Text style={styles.paragraph}>
          Kişisel veri veya sağlık verisi bu kapsamda işlenmez.
        </Text>

        <Text style={styles.paragraph}>
          Bu veriler yalnızca uygulama deneyimini iyileştirmek ve genel kullanım
          analizleri yapmak amacıyla kullanılır.
        </Text>

        <Text style={styles.subTitle}>Reklam ve Analiz Hizmetleri</Text>

        <Text style={styles.paragraph}>
          Google AdMob ve Meta/Facebook SDK gibi üçüncü taraf hizmetler;
          reklam performansını ölçmek, uygulama kullanımını analiz etmek ve
          daha alakalı reklam deneyimi sunmak amacıyla sınırlı teknik veriler
          toplayabilir.
        </Text>

        <Text style={styles.paragraph}>
          WellShe, reklam performansını ölçmek ve uygulama kullanım analizleri
          yapmak amacıyla Meta/Facebook SDK kullanır.
        </Text>

        <Text style={styles.subTitle}>Reklam Kimliği ve Takip İzni</Text>

        <Text style={styles.paragraph}>
          iOS cihazlarda reklam kimliği (IDFA) yalnızca kullanıcı izin verdiğinde
          kullanılabilir.
        </Text>

        <Text style={styles.paragraph}>
          Kullanıcı bu izni cihaz ayarlarından istediği zaman değiştirebilir.
        </Text>

        {/* 3 */}
        <Text style={styles.sectionTitle}>
          3) Verilerin İşlenme Amaçları
        </Text>

        <Text style={styles.list}>
          • Âdet döngüsü ve günlük takip özelliklerini sağlamak{"\n"}
          • Hatırlatıcı bildirimler göndermek{"\n"}
          • Reklam göstermek ve reklam performansını ölçmek{"\n"}
          • Uygulama kullanımını analiz etmek ve deneyimi iyileştirmek{"\n"}
          • Uygulama hatalarını tespit edip gidermek
        </Text>

        {/* 4 */}
        <Text style={styles.sectionTitle}>4) Verilerin Paylaşımı</Text>

        <Text style={styles.paragraph}>
          Sağlık verileri üçüncü taraflarla paylaşılmaz.
        </Text>

        <Text style={styles.paragraph}>
          Anonim teknik veriler yalnızca aşağıdaki servislerle paylaşılır:
        </Text>

        <Text style={styles.list}>
          • Google AdMob{"\n"}
          • Sentry{"\n"}
          • Supabase
        </Text>

        {/* 5 */}
        <Text style={styles.sectionTitle}>5) Veri Güvenliği</Text>

        <Text style={styles.list}>
          • Tüm üçüncü taraf veri aktarımı şifreli bağlantı (HTTPS) ile yapılır.
          {"\n"}
          • Sağlık verileri cihaz dışına çıkarılmaz.
        </Text>

        {/* 6 */}
        <Text style={styles.sectionTitle}>6) Verilerin Silinmesi</Text>

        <Text style={styles.paragraph}>
          Kullanıcı aşağıdaki yollarla verilerini silebilir:
        </Text>

        <Text style={styles.list}>
          • Uygulamayı cihazdan kaldırarak{"\n"}
          • Uygulama içindeki “Verilerimi sıfırla” seçeneğini kullanarak
        </Text>

        <Text style={styles.paragraph}>
          Cihazdan silinen sağlık verileri geri getirilemez.
        </Text>

        <Text style={styles.paragraph}>
          Üçüncü taraf servislerde tutulan anonim teknik kayıtlar ilgili servis
          sağlayıcıların saklama sürelerine tabidir.
        </Text>

        {/* 7 */}
        <Text style={styles.sectionTitle}>
          7) KVKK Kapsamındaki Haklar
        </Text>

        <Text style={styles.paragraph}>
          KVKK kapsamında kullanıcılar:
        </Text>

        <Text style={styles.list}>
          • Verilerinin işlenip işlenmediğini öğrenme{"\n"}
          • Gerekli hâllerde silinmesini talep etme
        </Text>

        <Text style={styles.paragraph}>haklarına sahiptir.</Text>

        {/* 8 */}
        <Text style={styles.sectionTitle}>8) İletişim</Text>

        <Text style={styles.paragraph}>
          welllshee@gmail.com
        </Text>

        {/* 9 */}
        <Text style={styles.sectionTitle}>9) Politika Güncellemeleri</Text>

        <Text style={styles.paragraph}>
          Yeni özellikler eklendiğinde bu politika güncellenir ve uygulama
          içinde duyurulur.
        </Text>

        {/* NOTE */}
        <View style={styles.noteBox}>
          <Text style={styles.noteText}>
            Özetle: WellShe sizi izlemek için değil, sizi desteklemek için
            tasarlanmıştır. 🌸
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
    padding: 18,
    paddingBottom: 34,
  },

  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A2E2A",
    marginBottom: 6,
  },

  date: {
    fontSize: 13,
    color: "#8B6B65",
    marginBottom: 18,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#4A2E2A",
    marginTop: 24,
    marginBottom: 10,
  },

  subTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#4A2E2A",
    marginTop: 14,
    marginBottom: 8,
  },

  paragraph: {
    fontSize: 14,
    lineHeight: 24,
    color: "#5A3A35",
    marginBottom: 10,
  },

  list: {
    fontSize: 14,
    lineHeight: 24,
    color: "#5A3A35",
    marginBottom: 12,
  },

  noteBox: {
    marginTop: 28,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "#FCE8E4",
    borderWidth: 1,
    borderColor: "#F3B6B3",
  },

  noteText: {
    fontSize: 14,
    lineHeight: 22,
    color: "#5A3A35",
    textAlign: "center",
  },
});