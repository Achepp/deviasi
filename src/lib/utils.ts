import { HasilTimbangan, WeighingCalculation } from "@/types";

/**
 * Returns formatted timestamp in Asia/Jakarta (WIB) timezone
 */
export function getJakartaTimestamp(date: Date = new Date()): string {
  // Asia/Jakarta is UTC+7
  const options: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };

  const formatter = new Intl.DateTimeFormat("en-CA", options);
  const parts = formatter.formatToParts(date);
  
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || "";
  
  const year = getPart("year");
  const month = getPart("month");
  const day = getPart("day");
  const hour = getPart("hour");
  const minute = getPart("minute");
  const second = getPart("second");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

/**
 * Generates unique session ID in format WT-YYYYMMDD-XXXX
 */
export function generateSessionId(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const randomChars = Math.random().toString(36).substring(2, 6).toUpperCase();
  const timeOffset = String(now.getTime()).slice(-4);
  return `WT-${year}${month}${day}-${randomChars}${timeOffset}`;
}

/**
 * Extracts and calculates statistics for a weighing session
 * (1-15 weighings, ignores null/empty values, does not treat empty as 0)
 */
export function calculateWeighingStats(session: Partial<HasilTimbangan>): WeighingCalculation {
  const lower = Number(session.lower ?? 0);
  const upper = Number(session.upper ?? 0);
  
  const values: { index: number; value: number; inRange: boolean }[] = [];

  for (let i = 1; i <= 15; i++) {
    const key = `timbang_${i}` as keyof HasilTimbangan;
    const val = session[key];
    
    if (val !== undefined && val !== null && val !== "" && !isNaN(Number(val))) {
      const numVal = Number(val);
      const inRange = numVal >= lower && numVal <= upper;
      values.push({
        index: i,
        value: numVal,
        inRange,
      });
    }
  }

  const count = values.length;
  if (count === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      inRangeCount: 0,
      outRangeCount: 0,
      values: [],
    };
  }

  const sum = values.reduce((acc, curr) => acc + curr.value, 0);
  const average = Number((sum / count).toFixed(2));
  const min = Math.min(...values.map((v) => v.value));
  const max = Math.max(...values.map((v) => v.value));
  const inRangeCount = values.filter((v) => v.inRange).length;
  const outRangeCount = count - inRangeCount;

  return {
    count,
    average,
    min,
    max,
    inRangeCount,
    outRangeCount,
    values,
  };
}

/**
 * Convert sessions to CSV data
 */
export function convertSessionsToCSV(sessions: HasilTimbangan[]): string {
  const headers = [
    "ID",
    "Operator_ID",
    "Operator",
    "Nama_Produk",
    "Batch",
    "No_Mesin",
    "No_Timbangan",
    "Metode_Kemas",
    "Lower",
    "Upper",
    "Jam",
    "Jml_Timbang",
    "Rata_Rata",
    "Status_Rentang",
    ...Array.from({ length: 15 }, (_, i) => `Timbang_${i + 1}`),
  ];

  const rows = sessions.map((s) => {
    const stats = calculateWeighingStats(s);
    const statusRentang = stats.outRangeCount === 0 ? "Dalam Batas" : `${stats.outRangeCount} Di Luar Batas`;
    
    const weighValues = Array.from({ length: 15 }, (_, i) => {
      const key = `timbang_${i + 1}` as keyof HasilTimbangan;
      const v = s[key];
      return v !== null && v !== undefined && v !== "" ? String(v) : "";
    });

    return [
      `"${s.id}"`,
      `"${s.operator_id}"`,
      `"${s.operator}"`,
      `"${s.nama_produk}"`,
      `"${s.batch}"`,
      `"${s.no_mesin}"`,
      `"${s.no_timbangan}"`,
      `"${s.metode_kemas}"`,
      s.lower,
      s.upper,
      `"${s.jam}"`,
      stats.count,
      stats.average,
      `"${statusRentang}"`,
      ...weighValues,
    ].join(",");
  });

  return [headers.join(","), ...rows].join("\r\n");
}
