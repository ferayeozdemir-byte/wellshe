// lib/audioMode.ts

import { Audio } from "expo-av";

let configured = false;

export async function configureAppAudioMode() {
  if (configured) return;

  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });

    configured = true;
  } catch (error) {
    console.log("[audio] configureAppAudioMode skipped:", error);
  }
}
