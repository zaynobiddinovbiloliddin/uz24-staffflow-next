export const STATUS_CODES = {
  I: { label: 'Ishda',          color: '#22c55e', bg: '#dcfce7', border: '#86efac' },
  D: { label: 'Dam olish',      color: '#ef4444', bg: '#fee2e2', border: '#fca5a5' },
  S: { label: 'Safar',          color: '#059669', bg: '#d1fae5', border: '#6ee7b7' },
  K: { label: 'Kasallik',       color: '#f59e0b', bg: '#fef3c7', border: '#fde68a' },
  T: { label: "Ta'til",         color: '#8b5cf6', bg: '#ede9fe', border: '#c4b5fd' },
  B: { label: 'Boshqa',         color: '#6b7280', bg: '#f3f4f6', border: '#d1d5db' },
  O: { label: 'Otpusk',         color: '#3b82f6', bg: '#dbeafe', border: '#93c5fd' },
} as const;

export type StatusCode = keyof typeof STATUS_CODES;

export interface DailyStatus {
  date: string;
  code: StatusCode;
}

export interface UserMonthStats {
  userId: string;
  fullName: string;
  workDays: number;
  restDays: number;
  travelDays: number;
  sickDays: number;
  vacationDays: number;
  otherDays: number;
  leaveDays: number;
  totalHours: number;
  statuses: DailyStatus[];
}

// Derive status code from schedule shift type
export function shiftToStatusCode(shiftType: string | null): StatusCode {
  if (!shiftType) return 'D';
  if (shiftType === 'Safar') return 'S';
  if (shiftType === 'Kasallik') return 'K';
  if (shiftType === "Ta'til") return 'T';
  if (shiftType === 'Otpusk') return 'O';
  if (shiftType === 'Dam') return 'D';
  return 'I';
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
    const code = sched ? shiftToStatusCode(sched.shiftType) : 'D';
    statuses.push({ date: dateStr, code });
  }

  let workDays = 0, restDays = 0, travelDays = 0, sickDays = 0;
  let vacationDays = 0, otherDays = 0, leaveDays = 0, totalMinutes = 0;

  for (const s of statuses) {
    if (s.code === 'I') workDays++;
    else if (s.code === 'D') restDays++;
    else if (s.code === 'S') travelDays++;
    else if (s.code === 'K') sickDays++;
    else if (s.code === 'T') vacationDays++;
    else if (s.code === 'B') otherDays++;
    else if (s.code === 'O') leaveDays++;
  }

  for (const sch of schedules) {
    const [sh, sm] = sch.startTime.split(':').map(Number);
    const [eh, em] = sch.endTime.split(':').map(Number);
    totalMinutes += (eh * 60 + em) - (sh * 60 + sm);
  }

  return {
    userId, fullName,
    workDays, restDays, travelDays, sickDays,
    vacationDays, otherDays, leaveDays,
    totalHours: Math.round(totalMinutes / 60),
    statuses,
  };
}
