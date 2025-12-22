// app/(tabs)/_layout.tsx

import { Tabs } from "expo-router";
import React from "react";

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        // ✅ Alt bar tamamen kapansın
        tabBarStyle: { display: "none" },

        // Bazı cihazlarda güvenlik için
        tabBarShowLabel: false,
      }}
    >
      {/* Home */}
      <Tabs.Screen name="index" options={{ title: "Home" }} />

      {/* Explore route kalsın ama erişilmesin (istersen dosyasını sonra silebilirsin) */}
      <Tabs.Screen
        name="explore"
        options={{
          href: null, // ✅ tab’da görünmez + linklenmez
        }}
      />
    </Tabs>
  );
}
