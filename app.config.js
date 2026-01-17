module.exports = ({ config }) => ({
  ...config,

  runtimeVersion: "1.0.3",

  ios: {
    ...config.ios,
    config: {
      ...(config.ios?.config ?? {}),
      googleMobileAdsAppId: "ca-app-pub-3940256099942544~1458002511",
    },
  },

  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      googleMobileAdsAppId: "ca-app-pub-9133000462142645~5704575558",
    },
  },

  "react-native-google-mobile-ads": {
    android_app_id: "ca-app-pub-9133000462142645~5704575558",
    delay_app_measurement_init: true,
  },

  plugins: [
    "./plugins/withAndroidQueries",
    [
      "expo-build-properties",
      {
        android: {
          newArchEnabled: true,
        },
      },
    ],
    "expo-secure-store",
    "expo-notifications",
    [
      "@sentry/react-native/expo",
      {
        url: "https://sentry.io/",
        project: "react-native",
        organization: "wellshe",
      },
    ],
  ],
});
