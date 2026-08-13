// lib/cycle.ts

export type CyclePhase =
  | "menstruation"
  | "follicular"
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

  // Mevcut ovülasyon hesabı bu aşamada özellikle değiştirilmedi.
  const mid = Math.round(effectiveSettings.averageCycleLength / 2);

  const ovulation = new Date(lastStart);
  ovulation.setDate(ovulation.getDate() + mid);

  const ws = new Date(ovulation);
  ws.setDate(ws.getDate() - 2);

  const we = new Date(ovulation);
  we.setDate(we.getDate() + 2);

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
  const mid = Math.round(cycleLen / 2);

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
      title: "Regl Fazı",
      description:
        "Bedenin yenilenme ve arınma sürecinde. Enerjinin dalgalanması son derece normal.",
      suggestion:
        "Bugün kendine biraz daha nazik davranman, tempoyu düşürmen ve dinlenmeye alan açman iyi gelebilir.",
    };
  }

  // ovülasyon penceresi: mid ±2
  if (diffDays >= mid - 2 && diffDays <= mid + 2) {
    return {
      key: "ovulation",
      title: "Ovülasyon Fazı",
      description:
        "Enerjinin ve öz güveninin arttığı, sosyal olarak daha dışa dönük hissetmeye eğilimli olabileceğin bir fazdasın.",
      suggestion:
        "Görüşmeler, yaratıcı projeler, kendini ifade etmen gereken işler için bu dönemi değerlendirebilirsin.",
    };
  }

  if (diffDays >= periodLen && diffDays < mid - 2) {
    return {
      key: "follicular",
      title: "Folikül Fazı",
      description:
        "Regl sonrası enerjinin yavaş yavaş yükseldiği, zihinsel olarak daha açık ve meraklı hissettiğin bir dönemdesin.",
      suggestion:
        "Yeni şeyler öğrenmek, plan yapmak ve hafif tempolu egzersizlere başlamak için bu faz oldukça destekleyici.",
    };
  }

  if (diffDays > mid + 2 && diffDays < cycleLen) {
    return {
      key: "luteal",
      title: "Luteal Faz",
      description:
        "Bedenin yavaş yavaş içe dönmeye hazırlanıyor. Duygular hassaslaşabilir, enerji iniş çıkışları yaşayabilirsin.",
      suggestion:
        "Bu dönemde yapılacaklar listeni sadeleştirmen, sana iyi gelen rutinlere ağırlık vermen ve kendine karşı anlayışlı olman çok değerli.",
    };
  }

  return {
    key: "unknown",
    title: "Geçiş dönemi",
    description:
      "Bugün için net bir faz tanımı yapamıyoruz ama bu da döngünün doğal dalgalanmalarının bir parçası.",
    suggestion:
      "Bedeninin bugün nasıl hissettiğini gözlemlemen ve buna göre küçük ayarlamalar yapman en sağlıklı rehber olacaktır.",
  };
}
