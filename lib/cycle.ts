// lib/cycle.ts

export type CyclePhase =
  | "menstruation"
  | "follicular"
  | "fertile"
  | "ovulation"
  | "luteal"
  | "unknown";

export type PeriodSettings = {
  averageCycleLength: number; // örn 28
  periodLength: number; // örn 5
};

export type PeriodLog = {
  startDate: string; // ISO: YYYY-MM-DD
};

export type CyclePhaseInfo = {
  key: CyclePhase;
  title: string;
  description: string;
  suggestion: string;
};

export type OvulationInfo = {
  ovulationDate: string | null; // ISO
  windowStart: string | null; // ISO
  windowEnd: string | null; // ISO
};

// --------------------
// Date helpers (SAFE)
// --------------------

export function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`; // YYYY-MM-DD
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split("-").map((x) => parseInt(x, 10));
  return new Date(y, m - 1, d); // local midnight
}

export function isValidISODate(str: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const dt = fromISODate(str);
  return toISODate(dt) === str;
}

export function formatDateTRFromISO(iso: string): string {
  if (!isValidISODate(iso)) return iso;
  const dt = fromISODate(iso);
  const d = String(dt.getDate()).padStart(2, "0");
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const y = dt.getFullYear();
  return `${d}.${m}.${y}`; // DD.MM.YYYY
}

export function parseTRDateToISO(tr: string): string | null {
  const match = /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/.exec(tr.trim());
  if (!match) return null;

  const [, dStr, mStr, yStr] = match;
  const d = parseInt(dStr, 10);
  const m = parseInt(mStr, 10);
  const y = parseInt(yStr, 10);

  const dt = new Date(y, m - 1, d);
  if (Number.isNaN(dt.getTime())) return null;

  // invalid dates guard (31.02 gibi)
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return null;
  }

  return toISODate(dt);
}

export function isFutureISODate(iso: string): boolean {
  if (!isValidISODate(iso)) return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const picked = fromISODate(iso);
  picked.setHours(0, 0, 0, 0);

  return picked.getTime() > today.getTime();
}

export function formatRangeTR(startIso: string, endIso: string): string {
  if (!isValidISODate(startIso) || !isValidISODate(endIso)) {
    return `${startIso} - ${endIso}`;
  }

  const s = fromISODate(startIso);
  const e = fromISODate(endIso);

  const sd = String(s.getDate()).padStart(2, "0");
  const sm = String(s.getMonth() + 1).padStart(2, "0");
  const sy = String(s.getFullYear());

  const ed = String(e.getDate()).padStart(2, "0");
  const em = String(e.getMonth() + 1).padStart(2, "0");
  const ey = String(e.getFullYear());

  const startShort = `${sd}.${sm}`;
  const endShort = `${ed}.${em}`;

  if (sy === ey) return `${startShort} - ${endShort} ${sy}`;
  return `${startShort}.${sy} - ${endShort}.${ey}`;
}

// --------------------
// Cycle math helpers
// --------------------

function diffInDaysLocal(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate()).getTime();
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate()).getTime();
  return Math.floor((b - a) / (1000 * 60 * 60 * 24));
}

/**
 * Regl kayıtlarını tarih açısından güvenli, sıralı ve tekrarsız hale getirir.
 * Mevcut kullanıcı verisini değiştirmez; yalnızca hesaplama için normalize eder.
 */
export function normalizePeriodLogs(logs: PeriodLog[]): PeriodLog[] {
  const seen = new Set<string>();

  return [...logs]
    .filter((log) => {
      const startDate = log?.startDate;
      if (!startDate || !isValidISODate(startDate) || seen.has(startDate)) {
        return false;
      }

      seen.add(startDate);
      return true;
    })
    .sort((a, b) => a.startDate.localeCompare(b.startDate));
}

/**
 * Period ekranında halihazırda kullanılan kişisel döngü öğrenme mantığının
 * ortak karşılığıdır. En az 3 regl başlangıcı ve 2 geçerli tamamlanmış aralık
 * olmadan kullanıcının başlangıç ayarını değiştirmez.
 */
export function getLearnedCycleLength(
  logs: PeriodLog[],
  fallback: number
): number {
  const normalized = normalizePeriodLogs(logs);

  if (normalized.length < 3) return fallback;

  const intervals: number[] = [];

  for (let i = 1; i < normalized.length; i++) {
    const prev = fromISODate(normalized[i - 1].startDate);
    const curr = fromISODate(normalized[i].startDate);
    const diff = diffInDaysLocal(prev, curr);

    // Period ekranındaki mevcut davranışla aynı sınırlar.
    if (diff >= 15 && diff <= 60) {
      intervals.push(diff);
    }
  }

  if (intervals.length < 2) return fallback;

  const recentIntervals = intervals.slice(-6);
  const average =
    recentIntervals.reduce((sum, value) => sum + value, 0) /
    recentIntervals.length;

  return Math.round(average);
}

/**
 * Ham kullanıcı ayarını, mevcut öğrenilmiş döngü süresiyle birleştirir.
 * periodLength aynen korunur; yalnızca averageCycleLength hesaplama için
 * kişiselleştirilebilir.
 */
export function getEffectivePeriodSettings(
  settings: PeriodSettings | null,
  logs: PeriodLog[],
  fallbackCycleLength = 28
): PeriodSettings | null {
  if (!settings) return null;

  return {
    ...settings,
    averageCycleLength: getLearnedCycleLength(
      logs,
      settings.averageCycleLength || fallbackCycleLength
    ),
  };
}

export function getNextPeriodStart(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): string | null {
  const normalizedLogs = normalizePeriodLogs(logs);
  const effectiveSettings = getEffectivePeriodSettings(settings, normalizedLogs);

  if (!effectiveSettings || normalizedLogs.length === 0) return null;

  const last = normalizedLogs[normalizedLogs.length - 1];
  const lastDate = fromISODate(last.startDate);
  lastDate.setDate(lastDate.getDate() + effectiveSettings.averageCycleLength);
  return toISODate(lastDate);
}

export function getOvulationInfo(
  logs: PeriodLog[],
  settings: PeriodSettings | null
): OvulationInfo {
  const normalizedLogs = normalizePeriodLogs(logs);
  const effectiveSettings = getEffectivePeriodSettings(settings, normalizedLogs);

  if (!effectiveSettings || normalizedLogs.length === 0) {
    return { ovulationDate: null, windowStart: null, windowEnd: null };
  }

  const last = normalizedLogs[normalizedLogs.length - 1];
  const lastStart = fromISODate(last.startDate);

  // Takvim-temelli yaklaşık hesap (ASRM calendar method):
  // tahmini ovülasyon döngü günü ≈ döngü uzunluğu - 14.
  // Bu bir tahmindir; gerçek ovülasyon zamanı döngüden döngüye değişebilir.
  const ovulationCycleDay = Math.max(
    1,
    effectiveSettings.averageCycleLength - 14
  );

  // Döngü günü 1 = regl başlangıç günü, bu yüzden tarih offset'i day - 1.
  const ovulation = new Date(lastStart);
  ovulation.setDate(ovulation.getDate() + ovulationCycleDay - 1);

  // WellShe için korumacı takvim tahmini:
  // ACOG kullanıcı rehberindeki gebelik olasılığı aralığını kapsar:
  // tahmini ovülasyondan önceki 5 gün + ovülasyon günü + sonraki 1 gün.
  // Bu aralık gerçek ovülasyonu doğrulamaz; yalnızca takvim-temelli tahmindir.
  const ws = new Date(ovulation);
  ws.setDate(ws.getDate() - 5);

  const we = new Date(ovulation);
  we.setDate(we.getDate() + 1);

  return {
    ovulationDate: toISODate(ovulation),
    windowStart: toISODate(ws),
    windowEnd: toISODate(we),
  };
}

export function getCyclePhaseInfo(
  logs: PeriodLog[],
  settings: PeriodSettings | null,
  now: Date = new Date()
): CyclePhaseInfo {
  const normalizedLogs = normalizePeriodLogs(logs);
  const effectiveSettings = getEffectivePeriodSettings(settings, normalizedLogs);

  if (!effectiveSettings || normalizedLogs.length === 0) {
    return {
      key: "unknown",
      title: "Faz hesaplanamıyor",
      description:
        "Son regl başlangıç tarihin ve döngü süren netleştiğinde faz bilgisi burada görünecek.",
      suggestion:
        "Regl başlangıcını kaydedip döngü süreni girdikten sonra bu alan çok daha anlamlı çalışmaya başlayacak.",
    };
  }

  const last = normalizedLogs[normalizedLogs.length - 1];
  const lastStartDate = fromISODate(last.startDate);
  const diffDays = diffInDaysLocal(lastStartDate, now);

  const cycleLen = effectiveSettings.averageCycleLength;
  const periodLen = effectiveSettings.periodLength;
  const ovulationInfo = getOvulationInfo(
    normalizedLogs,
    effectiveSettings
  );
  const ovulationOffset = ovulationInfo.ovulationDate
    ? diffInDaysLocal(
        lastStartDate,
        fromISODate(ovulationInfo.ovulationDate)
      )
    : null;
  const fertileStartOffset = ovulationInfo.windowStart
    ? diffInDaysLocal(
        lastStartDate,
        fromISODate(ovulationInfo.windowStart)
      )
    : null;
  const fertileEndOffset = ovulationInfo.windowEnd
    ? diffInDaysLocal(
        lastStartDate,
        fromISODate(ovulationInfo.windowEnd)
      )
    : null;

  // çok uç değerler
  if (diffDays < 0 || diffDays > cycleLen + 10) {
    return {
      key: "unknown",
      title: "Faz dışı aralık",
      description:
        "Son regl başlangıç tarihinle bugün arasındaki fark, beklenen döngü süresinin dışında görünüyor.",
      suggestion:
        "Son regl başlangıcını güncellersen bu alan güncel döngüne göre yeni fazı gösterecek.",
    };
  }

  if (diffDays >= 0 && diffDays < periodLen) {
    return {
      key: "menstruation",
      title: "Regl Dönemi",
      description:
        "Bu sırada rahim iç tabakası, kan ve doku olarak vücuttan atılır. Kanama süren ve bu günlerde nasıl hissettiğin her döngüde aynı olmayabilir.",
      suggestion:
        "Bugün bedeninin temposuna göre ilerle. Sana iyi geliyorsa dinlenmeye, sıcak bir duşa ya da hafif harekete biraz daha alan açabilirsin.",
    };
  }

  if (ovulationOffset !== null && diffDays === ovulationOffset) {
    return {
      key: "ovulation",
      title: "Tahmini Ovülasyon Günü",
      description:
        "Takvim hesabı bugün için tahmini ovülasyon gününü gösteriyor. Gerçek ovülasyon zamanı aynı kişide bile döngüden döngüye değişebilir.",
      suggestion:
        "Bu tarihi kesin bir gün gibi görmek yerine küçük bir yol işareti gibi düşün. Bugün de planlarını enerjine ve ihtiyacına göre şekillendirebilirsin.",
    };
  }

  if (
    fertileStartOffset !== null &&
    fertileEndOffset !== null &&
    ovulationOffset !== null &&
    diffDays >= fertileStartOffset &&
    diffDays <= fertileEndOffset
  ) {
    return {
      key: "fertile",
      title: "Tahmini Verimli Dönem",
      description:
        "Döngü kayıtların tahmini verimli günlere işaret ediyor. Bu aralık yalnızca takvim temelli bir tahmindir ve ovülasyonun gerçekleştiğini doğrulamaz.",
      suggestion:
        "Takvimdeki tarihleri kesin bir kural gibi görmek zorunda değilsin. Bedeninin ritmine alan açıp gününü sana iyi gelen şekilde sürdürebilirsin.",
    };
  }

  if (
    diffDays >= periodLen &&
    (fertileStartOffset === null || diffDays < fertileStartOffset)
  ) {
    return {
      key: "follicular",
      title: "Foliküler Dönem",
      description:
        "Bu süreçte yumurtalıklardaki foliküller gelişmeye devam eder ve hormon düzeyleri değişir. Foliküler faz ovülasyona kadar sürer.",
      suggestion:
        "Bugün enerjin neye izin veriyorsa ona göre ilerle. Yeni bir şeye başlamak istiyorsan küçük ve keyifli bir adım seçebilirsin.",
    };
  }

  if (
    fertileEndOffset !== null &&
    diffDays > fertileEndOffset &&
    diffDays < cycleLen
  ) {
    return {
      key: "luteal",
      title: "Luteal Dönem",
      description:
        "Ovülasyondan sonraki luteal fazda hormon düzeyleri yeniden değişir. Regl yaklaşırken fiziksel veya duygusal değişiklikler hissedebilirsin.",
      suggestion:
        "Gününü biraz daha esnek planlaman, ihtiyaç duyduğunda temponu azaltman ve sana keyif veren rutinlere dönmen iyi gelebilir.",
    };
  }

  return {
    key: "unknown",
    title: "Geçiş Dönemi",
    description:
      "Bugün için net bir dönem tanımı yapmak zor. Döngü tarihleri yalnızca yaklaşık bir çerçeve sunar.",
    suggestion:
      "Bugün için tek bir doğru tempo yok. Kendini nasıl hissediyorsan gününü ona göre şekillendirebilirsin.",
  };
}
