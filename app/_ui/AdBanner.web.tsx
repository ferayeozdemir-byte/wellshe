// app/_ui/AdBanner.web.tsx

import React from "react";
import { View } from "react-native";

// Web'de AdMob yok → boş placeholder
export default function AdBanner() {
  return <View style={{ height: 0 }} />;
}
