// components/SponsorSplash.tsx
import React, { useEffect } from "react";
import { Dimensions, Image, StyleSheet, Text, View } from "react-native";

const { width } = Dimensions.get("window");
const FONT_SIZE = width < 380 ? 16 : 18; // küçük ekranlarda 16, diğerlerinde 18

type SponsorSplashProps = {
  onDone: () => void;
  durationMs?: number; // istersen sonra 2000 yerine 2500 ms yapabil
};

export default function SponsorSplash({
  onDone,
  durationMs = 2000,
}: SponsorSplashProps) {
  useEffect(() => {
    const id = setTimeout(onDone, durationMs);
    return () => clearTimeout(id);
  }, [onDone, durationMs]);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enerji Sponsorumuz</Text>

      <Image
        source={require("../assets/sponsors/global-solar.png")}
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
  },
  label: {
    fontSize: FONT_SIZE,
    color: "#444",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  logo: {
    width: "45%",   // 🔥 her ekranda orantılı
    aspectRatio: 3.2, // logo geniş/ince, yaklaşık oran
  },
});
