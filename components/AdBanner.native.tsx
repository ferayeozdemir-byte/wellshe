// components/AdBanner.native.tsx
import React from "react";
import { StyleSheet, View } from "react-native";
import {
  BannerAd,
  BannerAdSize,
  TestIds,
} from "react-native-google-mobile-ads";

// 🔹 Geliştirme aşamasında Google'ın test ID'si
//    Production'da kendi gerçek banner unit ID'ni kullanacağız
const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-9133000462142645/6014393282"; // TODO: kendi banner unit ID'n

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    // İstersen biraz margin ekleyebilirsin:
    // marginTop: 8,
  },
});
