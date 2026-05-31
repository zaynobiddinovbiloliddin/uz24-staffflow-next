// Status codes: I=Ishda, D=Dam, S=Kasallik, K=Komandirovka, B=Ta'til, T=Zahira, O=Ortiqcha
export const STATUS_CODES = {
  I: { label: 'Ishda',             color: '#166534', bg: '#dcfce7', border: '#86efac' },
  D: { label: 'Dam olish',         color: '#dc2626', bg: '#fee2e2', border: '#fca5a5' },
  S: { label: "Kasallik/Sog'liq",  color: '#854d0e', bg: '#fef9c3', border: '#fef08a' },
  K: { label: 'Komandirovka',      color: '#1e40af', bg: '#dbeafe', border: '#93c5fd' },
  B: { label: "Ta'til",            color: '#6d28d9', bg: '#ede9fe', border: '#c4b5fd' },
  T: { label: 'Zahira',            color: '#0e7490', bg: '#cffafe', border: '#67e8f9' },
  O: { label: 'Ortiqcha smena',    color: '#c2410c', bg: '#ffedd5', border: '#fdba74' },
} as const;

export type StatusCode = keyof typeof STATUS_CODES;

// Excel cell fill colors (ARGB format for xlsx library)
export const EXCEL_COLORS: Record<StatusCode, string> = {
  I: 'FF22c55e',
  D: 'FFef4444',
  S: 'FFeab308',
  K: 'FF3b82f6',
  B: 'FFa855f7',
  T: 'FF06b6d4',
  O: 'FFf97316',
};

export interface DailyStatus {
  date: string;
  // null = no record for this day (should show empty cell, NOT "D")
  code: StatusCode | null;
}

export interface UserMonthStats {
  userId: string;
  fullName: string;
  workDays: number;     // I — Ishda
  restDays: number;     // D — Dam olish (explicitly set)
  sickDays: number;     // S — Kasallik
  travelDays: number;   // K — Komandirovka
  vacationDays: number; // B — Ta'til
  otherDays: number;    // T — Zahira
  leaveDays: number;    // O — Ortiqcha smena
  totalHours: number;
  statuses: DailyStatus[];
}

// Map Schedule.shiftType string to StatusCode
// Returns null when no shiftType (no record = empty, not "D")
export function shiftToStatusCode(shiftType: string | null): StatusCode | null {
  if (!shiftType) return null;
  const t = shiftType.trim();
  if (t === 'Kasallik') return 'S';
  if (t === 'Komandirovka' || t === 'Safar') return 'K';
  if (t === "Ta'til" || t === "Mehnat ta'til") return 'B';
  if (t === 'Zahira' || t === 'Rezerv') return 'T';
  if (t === 'Otpusk' || t === 'Ortiqcha') return 'O';
  if (t === 'Dam' || t === 'Dam olish') return 'D';
  return 'I'; // Kunduzgi, Kechki, Tungi, Qisqartirilgan — all are work
}

export function computeMonthStats(
  userId: string,
  fullName: string,
  schedules: Array<{ date: string; shiftType: string; startTime: string; endTime: string }>,
  year: number,
  month: number,
): UserMonthStats {
  const daysInMonth = new Date(year, month, 0).getDate();
  const statuses: DailyStatus[] = [];

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const sched = schedules.find((s) => s.date.startsWith(dateStr));
    // FIX: null when no record (was 'D' before — caused ALL empty days to show as "Dam olish")
    const code: StatusCode | null = sched ? shiftToStatusCode(sched.shiftType) : null;
    statuses.push({ date: dateStr, code });
  }

  let workDays = 0, restDays = 0, sickDays = 0, travelDays = 0;
  let vacationDays = 0, otherDays = 0, leaveDays = 0, totalMinutes = 0;

  for (const s of statuses) {
    if (!s.code) continue; // null = no record, skip counting
    if      (s.code === 'I') workDays++;
    else if (s.code === 'D') restDays++;
    else if (s.code === 'S') sickDays++;
    else if (s.code === 'K') travelDays++;
    else if (s.code === 'B') vacationDays++;
    else if (s.code === 'T') otherDays++;
    else if (s.code === 'O') leaveDays++;
  }

  for (const sch of schedules) {
    const [sh, sm] = sch.startTime.split(':').map(Number);
    const [eh, em] = sch.endTime.split(':').map(Number);
    const mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins > 0) totalMinutes += mins;
  }

  return {
    userId, fullName,
    workDays, restDays, sickDays, travelDays,
    vacationDays, otherDays, leaveDays,
    totalHours: Math.round(totalMinutes / 60),
    statuses,
  };
}
