import AsyncStorage from "@react-native-async-storage/async-storage";

export const CYCLE_DATA_V1_KEY = "wellshe_cycle_data_v1";

export type CyclePredictionSnapshot = {
  generatedAt: string;
  basedOnPeriodStartDate: string;
  predictedStartDate: string;
  averageCycleLengthUsed: number;
  periodLengthUsed: number;
  algorithmVersion: "period-prediction-v1";
};

export type CycleDataV1 = {
  schemaVersion: 1;
  createdAt: string;
  updatedAt: string;
  settings: {
    averageCycleLength: number;
    periodLength: number;
  } | null;
  periods: Array<{
    startDate: string;
    endDate?: string;
  }>;
  dailyLogs: Record<string, any>;
  predictionHistory: CyclePredictionSnapshot[];
};

type SyncCycleDataInput = {
  settings: CycleDataV1["settings"];
  periods: CycleDataV1["periods"];
  dailyLogs: CycleDataV1["dailyLogs"];
  predictionSnapshot?: CyclePredictionSnapshot | null;
  clearPredictionHistory?: boolean;
};

function safeParse(raw: string | null): CycleDataV1 | null {
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as CycleDataV1;
    if (parsed?.schemaVersion !== 1) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function loadCycleDataV1(): Promise<CycleDataV1 | null> {
  const raw = await AsyncStorage.getItem(CYCLE_DATA_V1_KEY);
  return safeParse(raw);
}

function isSamePrediction(
  a: CyclePredictionSnapshot,
  b: CyclePredictionSnapshot
) {
  return (
    a.basedOnPeriodStartDate === b.basedOnPeriodStartDate &&
    a.predictedStartDate === b.predictedStartDate &&
    a.averageCycleLengthUsed === b.averageCycleLengthUsed &&
    a.periodLengthUsed === b.periodLengthUsed &&
    a.algorithmVersion === b.algorithmVersion
  );
}

export async function syncCycleDataV1({
  settings,
  periods,
  dailyLogs,
  predictionSnapshot,
  clearPredictionHistory = false,
}: SyncCycleDataInput): Promise<CycleDataV1> {
  const now = new Date().toISOString();
  const existing = await loadCycleDataV1();

  const predictionHistory = clearPredictionHistory
    ? []
    : [...(existing?.predictionHistory ?? [])];

  if (
    predictionSnapshot &&
    !predictionHistory.some((item) =>
      isSamePrediction(item, predictionSnapshot)
    )
  ) {
    predictionHistory.push(predictionSnapshot);
  }

  const next: CycleDataV1 = {
    schemaVersion: 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    settings,
    periods: periods.map((period) => ({ ...period })),
    dailyLogs: JSON.parse(JSON.stringify(dailyLogs ?? {})),
    predictionHistory,
  };

  await AsyncStorage.setItem(CYCLE_DATA_V1_KEY, JSON.stringify(next));
  return next;
}
