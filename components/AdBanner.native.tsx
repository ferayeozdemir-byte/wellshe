// components/AdBanner.native.tsx
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

const ANDROID_BANNER_UNIT_ID = "ca-app-pub-9133000462142645/6014393282";
const IOS_BANNER_UNIT_ID = "ca-app-pub-9133000462142645/9060661704";

const BANNER_AD_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : Platform.select({
      ios: IOS_BANNER_UNIT_ID,
      android: ANDROID_BANNER_UNIT_ID,
      default: ANDROID_BANNER_UNIT_ID,
    });

export default function AdBanner() {
  return (
    <View style={styles.container}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID!}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={{ requestNonPersonalizedAdsOnly: true }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});