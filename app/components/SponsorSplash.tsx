// app/components/SponsorSplash.tsx

import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

type SponsorSplashProps = {
  onDone: () => void;
};

export default function SponsorSplash({ onDone }: SponsorSplashProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2000);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={styles.container}>
      <Text style={styles.tag}>Enerji sponsorumuz</Text>

      <Image
        source={require("../../assets/sponsors/global-solar.png")}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.subtitle}>
        WellShe’nin sana her gün eşlik eden enerjisinde Global Solar’ın da payı
        var. ☀️
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFF7F3", // istersen #FFFFFF yapabiliriz
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 28,
  },
  tag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B0756F",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 14,
  },
  logo: {
    width: 280,
    height: 160,
    marginBottom: 14,
    maxWidth: "85%",
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#5A3A35",
    textAlign: "center",
    marginTop: 4,
    lineHeight: 20,
  },
});
