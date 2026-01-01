// components/AdBanner.native.tsx
import React from "react";
import { StyleSheet, View } from "react-native";

export default function AdBanner() {
  // 👉 Geçici çözüm:
  // Şimdilik gerçek AdMob banner'ı göstermiyoruz.
  // Sadece altta boş bir alan dönüyor.
  return <View style={styles.container} />;
}

const styles = StyleSheet.create({
  container: {
    // İstersen buraya sabit bir yükseklik verebilirsin
    // height: 0, // tamamen gizlemek için
    alignItems: "center",
  },
});
