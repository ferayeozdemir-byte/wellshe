const assert = require("node:assert/strict");

const {
  getEffectivePeriodSettings,
  getNextPeriodStart,
  getOvulationInfo,
} = require("../.cycle-test-dist/cycle.js");

const start = "2026-08-19";
const periodLength = 5;

const cases = [
  {
    cycleLength: 24,
    ovulationDate: "2026-08-28",
    windowStart: "2026-08-23",
    windowEnd: "2026-08-29",
  },
  {
    cycleLength: 28,
    ovulationDate: "2026-09-01",
    windowStart: "2026-08-27",
    windowEnd: "2026-09-02",
  },
  {
    cycleLength: 32,
    ovulationDate: "2026-09-05",
    windowStart: "2026-08-31",
    windowEnd: "2026-09-06",
  },
  {
    cycleLength: 35,
    ovulationDate: "2026-09-08",
    windowStart: "2026-09-03",
    windowEnd: "2026-09-09",
  },
];

for (const item of cases) {
  const info = getOvulationInfo(
    [{ startDate: start }],
    {
      averageCycleLength: item.cycleLength,
      periodLength,
    }
  );

  assert.deepEqual(
    info,
    {
      ovulationDate: item.ovulationDate,
      windowStart: item.windowStart,
      windowEnd: item.windowEnd,
    },
    `${item.cycleLength} günlük döngü tahmini değişti`
  );
}

// Kişiselleşme testi:
// Kullanıcı ayarı 28 kalsa bile gerçek iki aralık 32 günse,
// 3 başlangıç kaydından sonra effective cycle 32 olmalı.
const learnedLogs = [
  { startDate: "2026-05-01" },
  { startDate: "2026-06-02" },
  { startDate: "2026-07-04" },
];

const learnedSettings = getEffectivePeriodSettings(
  { averageCycleLength: 28, periodLength: 5 },
  learnedLogs
);

assert.equal(
  learnedSettings.averageCycleLength,
  32,
  "Uygulama 32 günlük gerçek döngü ortalamasını öğrenemedi"
);

assert.equal(
  getNextPeriodStart(
    learnedLogs,
    { averageCycleLength: 28, periodLength: 5 }
  ),
  "2026-08-05",
  "Öğrenilmiş döngü sonraki regl tahminine yansımadı"
);

assert.deepEqual(
  getOvulationInfo(
    learnedLogs,
    { averageCycleLength: 28, periodLength: 5 }
  ),
  {
    ovulationDate: "2026-07-21",
    windowStart: "2026-07-16",
    windowEnd: "2026-07-22",
  },
  "Öğrenilmiş 32 günlük döngü ovülasyon/verimli dönem tahminine yansımadı"
);

console.log("✅ Cycle regression tests passed.");
