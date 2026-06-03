import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import * as Sentry from "@sentry/react-native";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { requestTrackingPermissionsAsync } from "expo-tracking-transparency";
import { useEffect } from "react";
import { Platform } from "react-native";
import { AppEventsLogger, Settings } from "react-native-fbsdk-next";
import "react-native-get-random-values";
import "react-native-reanimated";
import "react-native-url-polyfill/auto";

import { useColorScheme } from "@/hooks/use-color-scheme";
import { trackEvent } from "@/lib/analytics";
import { configureAppAudioMode } from "@/lib/audioMode";

Sentry.init({
  dsn: "https://b9b25e0d18f0a763b6e541c9926b981f@o4510652162310144.ingest.de.sentry.io/4510652201238608",
  sendDefaultPii: true,
  enableLogs: true,
});

async function initMetaSdk() {
  try {
    Settings.setAutoLogAppEventsEnabled(true);
    Settings.setAdvertiserIDCollectionEnabled(true);

    if (Platform.OS === "ios") {
      const { status } = await requestTrackingPermissionsAsync();

      Settings.initializeSDK();

      await Settings.setAdvertiserTrackingEnabled(status === "granted");
    } else {
      Settings.initializeSDK();
      await Settings.setAdvertiserTrackingEnabled(true);
    }

    AppEventsLogger.logEvent("wellshe_app_open");
  } catch (error) {
    Sentry.captureException(error);
  }
}

export default Sentry.wrap(function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    void configureAppAudioMode();

    void initMetaSdk();

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
