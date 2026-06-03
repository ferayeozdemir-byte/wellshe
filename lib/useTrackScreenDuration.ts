// lib/useTrackScreenDuration.ts

import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useRef } from "react";
import { AppState, AppStateStatus } from "react-native";
import { trackEvent } from "./analytics";

type UseTrackScreenDurationParams = {
  screen_name: string;
  feature_name?: string;
  article_id?: string | null;
  article_title?: string | null;
  meta?: Record<string, unknown> | null;
  minDurationSeconds?: number;
};

export function useTrackScreenDuration({
  screen_name,
  feature_name = "screen_duration",
  article_id = null,
  article_title = null,
  meta = null,
  minDurationSeconds = 2,
}: UseTrackScreenDurationParams) {
  const startedAtRef = useRef<number | null>(null);
  const sentRef = useRef(false);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const sendDuration = useCallback(() => {
    if (sentRef.current) return;
    if (!startedAtRef.current) return;

    const durationSeconds = Math.round((Date.now() - startedAtRef.current) / 1000);

    if (durationSeconds < minDurationSeconds) return;

    sentRef.current = true;

    void trackEvent({
      event_name: "feature_used",
      screen_name,
      feature_name,
      article_id,
      article_title,
      meta: {
        ...(meta ?? {}),
        duration_seconds: durationSeconds,
      },
    });
  }, [
    article_id,
    article_title,
    feature_name,
    meta,
    minDurationSeconds,
    screen_name,
  ]);

  useFocusEffect(
    useCallback(() => {
      startedAtRef.current = Date.now();
      sentRef.current = false;

      const sub = AppState.addEventListener("change", (nextState) => {
        const previousState = appStateRef.current;
        appStateRef.current = nextState;

        if (
          previousState === "active" &&
          (nextState === "background" || nextState === "inactive")
        ) {
          sendDuration();
        }
      });

      return () => {
        sendDuration();
        sub.remove();
      };
    }, [sendDuration])
  );
}