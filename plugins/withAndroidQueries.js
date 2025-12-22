// plugins/withAndroidQueries.js
const { withAndroidManifest } = require("@expo/config-plugins");

module.exports = function withAndroidQueries(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;

    if (!manifest.queries) manifest.queries = [{}];
    const q = manifest.queries[0];

    // packages
    q.package = q.package ?? [];
    const addPackage = (name) => {
      if (!q.package.some((p) => p.$?.["android:name"] === name)) {
        q.package.push({ $: { "android:name": name } });
      }
    };

    // TikTok / Instagram / X (Twitter) / Facebook / YouTube / Gmail (varsa)
    addPackage("com.zhiliaoapp.musically"); // TikTok
    addPackage("com.instagram.android");   // Instagram
    addPackage("com.twitter.android");     // X
    addPackage("com.facebook.katana");     // Facebook
    addPackage("com.google.android.youtube"); // YouTube
    addPackage("com.google.android.gm");   // Gmail

    // intents (mailto, https)
    q.intent = q.intent ?? [];
    const addIntent = (action, scheme) => {
      const exists = q.intent.some((i) => {
        const a = i.action?.[0]?.$?.["android:name"] === action;
        const d = i.data?.[0]?.$?.["android:scheme"] === scheme;
        return a && d;
      });
      if (!exists) {
        q.intent.push({
          action: [{ $: { "android:name": action } }],
          data: [{ $: { "android:scheme": scheme } }],
        });
      }
    };

    addIntent("android.intent.action.VIEW", "https");
    addIntent("android.intent.action.VIEW", "http");
    addIntent("android.intent.action.SENDTO", "mailto");

    return config;
  });
};
