import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from "react";
import "react-native-get-random-values";
import 'react-native-reanimated';
import "react-native-url-polyfill/auto";

import { useColorScheme } from '@/hooks/use-color-scheme';
import { trackEvent } from "@/lib/analytics";
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://b9b25e0d18f0a763b6e541c9926b981f@o4510652162310144.ingest.de.sentry.io/4510652201238608',
  sendDefaultPii: true,
  enableLogs: true,
});

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void trackEvent({
      event_name: "app_open",
      screen_name: "root",
    });
  }, []);

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerBackButtonDisplayMode: "minimal" }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
});