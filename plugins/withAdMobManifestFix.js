// plugins/withAdMobManifestFix.js
const { withAndroidManifest } = require("@expo/config-plugins");

function ensureArray(v) {
  return Array.isArray(v) ? v : v ? [v] : [];
}

module.exports = function withAdMobManifestFix(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults;

    // Ensure xmlns:tools exists
    manifest.manifest.$ = manifest.manifest.$ || {};
    manifest.manifest.$["xmlns:tools"] =
      manifest.manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";

    const app = manifest.manifest.application?.[0];
    if (!app) return config;

    app["meta-data"] = ensureArray(app["meta-data"]);

    const upsertMetaData = (name, value) => {
      let node = app["meta-data"].find((m) => m?.$?.["android:name"] === name);
      if (!node) {
        node = { $: {} };
        app["meta-data"].push(node);
      }

      node.$["android:name"] = name;
      node.$["android:value"] = value;

      // Stronger conflict override
      node.$["tools:replace"] = "android:value";
      node.$["tools:node"] = "replace";
    };

    upsertMetaData(
      "com.google.android.gms.ads.APPLICATION_ID",
      "ca-app-pub-9133000462142645~5704575558"
    );
    upsertMetaData(
      "com.google.android.gms.ads.DELAY_APP_MEASUREMENT_INIT",
      "true"
    );

    return config;
  });
};
