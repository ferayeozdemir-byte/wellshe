// app/components/SponsorSplash.tsx

import React, { useEffect } from "react";
import {
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";

type SponsorSplashProps = {
  onDone: () => void;
};

export default function SponsorSplash({ onDone }: SponsorSplashProps) {
  // İstersen otomatik kapanma kalsın
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <View style={styles.backdrop}>
      <View style={styles.card}>
        <Text style={styles.tag}>Enerji sponsorumuz</Text>

        <Image
          source={require("../../assets/sponsors/global-solar.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.subtitle}>
          WellShe’nin sana her gün eşlik eden enerjisinde Global Solar’ın da
          payı var. ☀️
        </Text>

        <TouchableOpacity style={styles.button} onPress={onDone}>
          <Text style={styles.buttonText}>Devam et</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#00000040",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    width: "80%",
    maxWidth: 360,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 22,
    backgroundColor: "#FFF7F3",
    borderWidth: 1,
    borderColor: "#F3B6B3",
    alignItems: "center",
  },
  tag: {
    fontSize: 14,
    fontWeight: "600",
    color: "#B0756F",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  logo: {
    width: 180, // BURAYI büyütüp/küçültebilirsin
    height: 110,
    marginTop: 12,
    marginBottom: 8,
    alignSelf: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#5A3A35",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 14,
  },
  button: {
    marginTop: 4,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: "#F3B6B3",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});
