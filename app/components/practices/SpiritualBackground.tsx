import React from "react";
import { StyleSheet, View } from "react-native";

type Variant = "meditation" | "breath";

type Props = {
  variant?: Variant;
};

const THEMES = {
  meditation: {
    base: "#F8F2F7",
    topCircle: "rgba(214, 190, 233, 0.24)",
    softCircle: "rgba(214, 190, 233, 0.10)",
    outline: "rgba(196, 169, 220, 0.20)",
  },
  breath: {
    base: "#F5F4EF",
    topCircle: "rgba(191, 212, 196, 0.24)",
    softCircle: "rgba(191, 212, 196, 0.10)",
    outline: "rgba(165, 191, 171, 0.20)",
  },
};

export default function SpiritualBackground({
  variant = "meditation",
}: Props) {
  const theme = THEMES[variant];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.base, { backgroundColor: theme.base }]} />
      <View style={[styles.topCircle, { backgroundColor: theme.topCircle }]} />
      <View style={[styles.softCircle, { backgroundColor: theme.softCircle }]} />
      <View style={[styles.outlineCircle, { borderColor: theme.outline }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
  },

  topCircle: {
    position: "absolute",
    top: 60,
    right: -58,
    width: 208,
    height: 208,
    borderRadius: 999,
  },

  softCircle: {
    position: "absolute",
    top: 430,
    right: -20,
    width: 86,
    height: 86,
    borderRadius: 999,
  },

  outlineCircle: {
    position: "absolute",
    top: 320,
    right: 28,
    width: 82,
    height: 82,
    borderRadius: 999,
    borderWidth: 1.2,
  },
});