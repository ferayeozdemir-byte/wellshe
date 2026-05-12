import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Path } from "react-native-svg";

type Variant = "meditation" | "breath";

type Props = {
  variant?: Variant;
};

const THEMES = {
  meditation: {
    base: "#F8EFF5",
    topCircle: "rgba(215, 191, 231, 0.28)",
    softCircle: "rgba(214, 190, 233, 0.14)",
    outline: "rgba(202, 175, 221, 0.22)",
    scene: "rgba(223, 194, 235, 0.18)",
    mountain: "rgba(209, 177, 226, 0.24)",
    mountain2: "rgba(214, 186, 229, 0.14)",
    waterLine: "rgba(255,255,255,0.40)",
    botanical: "rgba(181, 141, 208, 0.42)",
  },
  breath: {
    base: "#F4F2EC",
    topCircle: "rgba(191, 212, 196, 0.28)",
    softCircle: "rgba(191, 212, 196, 0.14)",
    outline: "rgba(165, 191, 171, 0.22)",
    scene: "rgba(198, 220, 203, 0.18)",
    mountain: "rgba(172, 202, 180, 0.24)",
    mountain2: "rgba(184, 210, 191, 0.14)",
    waterLine: "rgba(255,255,255,0.42)",
    botanical: "rgba(117, 154, 127, 0.44)",
  },
};

function BottomBotanical({
  side,
  color,
}: {
  side: "left" | "right";
  color: string;
}) {
  const wrapStyle = side === "left" ? styles.botanicalLeft : styles.botanicalRight;

  return (
    <View pointerEvents="none" style={[styles.botanicalWrap, wrapStyle]}>
      <Svg width={90} height={170} viewBox="0 0 90 170">
        <Path
          d="M45 168 C42 140, 44 114, 48 84 C51 60, 58 35, 70 10"
          stroke={color}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <Path
          d="M49 102 C34 96, 25 84, 24 66 C37 70, 46 80, 49 102Z"
          stroke={color}
          strokeWidth={1.6}
          fill="none"
        />
        <Path
          d="M50 80 C62 76, 72 64, 75 48 C62 50, 54 61, 50 80Z"
          stroke={color}
          strokeWidth={1.6}
          fill="none"
        />
        <Path
          d="M46 130 C30 126, 19 116, 15 100 C30 102, 41 114, 46 130Z"
          stroke={color}
          strokeWidth={1.6}
          fill="none"
        />
        <Path
          d="M54 58 C61 51, 66 41, 67 30 C58 34, 54 44, 54 58Z"
          stroke={color}
          strokeWidth={1.4}
          fill="none"
        />
        <Path
          d="M60 28 C64 24, 67 18, 67 11 C62 13, 60 19, 60 28Z"
          stroke={color}
          strokeWidth={1.2}
          fill="none"
        />
      </Svg>
    </View>
  );
}

export default function PlayerBackground({
  variant = "meditation",
}: Props) {
  const theme = THEMES[variant];

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <View style={[styles.base, { backgroundColor: theme.base }]} />
      <View style={[styles.topCircle, { backgroundColor: theme.topCircle }]} />
      <View style={[styles.softCircle, { backgroundColor: theme.softCircle }]} />
      <View style={[styles.outlineCircle, { borderColor: theme.outline }]} />

      <View style={[styles.bottomScene, { backgroundColor: theme.scene }]}>
        <View style={[styles.mountainLeft, { backgroundColor: theme.mountain }]} />
        <View style={[styles.mountainRight, { backgroundColor: theme.mountain2 }]} />
        <View style={[styles.waterLine1, { backgroundColor: theme.waterLine }]} />
        <View style={[styles.waterLine2, { backgroundColor: theme.waterLine }]} />
        <View style={[styles.waterLine3, { backgroundColor: theme.waterLine }]} />
      </View>

      <BottomBotanical side="left" color={theme.botanical} />
      <BottomBotanical side="right" color={theme.botanical} />
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    ...StyleSheet.absoluteFillObject,
  },

  topCircle: {
    position: "absolute",
    top: 58,
    right: -56,
    width: 212,
    height: 212,
    borderRadius: 999,
  },

  softCircle: {
    position: "absolute",
    top: 420,
    right: -18,
    width: 90,
    height: 90,
    borderRadius: 999,
  },

  outlineCircle: {
    position: "absolute",
    top: 330,
    right: 24,
    width: 84,
    height: 84,
    borderRadius: 999,
    borderWidth: 1.2,
  },

  bottomScene: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 250,
    overflow: "hidden",
  },

  mountainLeft: {
    position: "absolute",
    left: -26,
    bottom: 154,
    width: 190,
    height: 58,
    borderTopLeftRadius: 120,
    borderTopRightRadius: 120,
  },

  mountainRight: {
    position: "absolute",
    right: -12,
    bottom: 152,
    width: 176,
    height: 56,
    borderTopLeftRadius: 110,
    borderTopRightRadius: 110,
  },

  waterLine1: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 116,
    height: 1,
  },

  waterLine2: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 98,
    height: 1,
    opacity: 0.75,
  },

  waterLine3: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 82,
    height: 1,
    opacity: 0.5,
  },

  botanicalWrap: {
    position: "absolute",
    bottom: 12,
    width: 90,
    height: 170,
  },

  botanicalLeft: {
    left: 12,
  },

  botanicalRight: {
    right: 12,
    transform: [{ scaleX: -1 }],
  },
});