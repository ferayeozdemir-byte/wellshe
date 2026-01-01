import React from "react";
import { StyleSheet, View } from "react-native";
import {
    BannerAd,
    BannerAdSize,
    TestIds,
} from "react-native-google-mobile-ads";

const BANNER_AD_UNIT_ID: string = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-9133000462142645/6014393282";

export default function AdBanner() {
  return (
    <View style={styles.adContainer}>
      <BannerAd
        unitId={BANNER_AD_UNIT_ID}
        size={BannerAdSize.ADAPTIVE_BANNER}
        requestOptions={{
          requestNonPersonalizedAdsOnly: true,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  adContainer: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: "center",
  },
});
