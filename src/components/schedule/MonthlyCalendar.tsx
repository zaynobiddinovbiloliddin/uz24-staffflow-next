'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ScheduleEntry {
  date: string;
  shiftType: string;
  startTime: string;
  endTime: string;
}

interface Props {
  schedules: ScheduleEntry[];
}

const MONTH_NAMES = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const SHIFT_STYLES: Record<string, { bg: string; border: string; text: string; label: string }> = {
  Kunduzgi:       { bg: 'bg-blue-100 dark:bg-blue-900/30', border: 'border-blue-200 dark:border-blue-700', text: 'text-blue-700 dark:text-blue-300', label: 'Kunduzgi' },
  Kechki:         { bg: 'bg-purple-100 dark:bg-purple-900/30', border: 'border-purple-200 dark:border-purple-700', text: 'text-purple-700 dark:text-purple-300', label: 'Kechki' },
  Tungi:          { bg: 'bg-slate-100 dark:bg-slate-700', border: 'border-slate-200 dark:border-slate-600', text: 'text-slate-700 dark:text-slate-200', label: 'Tungi' },
  Qisqartirilgan: { bg: 'bg-green-100 dark:bg-green-900/30', border: 'border-green-200 dark:border-green-700', text: 'text-green-700 dark:text-green-300', label: "Qisqa" },
};

const DAY_NAMES = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export function MonthlyCalendar({ schedules }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstDayOfWeek = new Date(year, month - 1, 1).getDay();
  // Convert Sunday=0 to Monday=0
  const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

  const monthFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthTo = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const monthSchedules = schedules.filter((s) => {
    const d = s.date.slice(0, 10);
    return d >= monthFrom && d <= monthTo;
  });

  function getDay(d: number): ScheduleEntry | undefined {
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    return monthSchedules.find((s) => s.date.slice(0, 10) === dateStr);
  }

  // Stats
  const workDays = monthSchedules.length;
  const restDays = daysInMonth - workDays;
  const totalMinutes = monthSchedules.reduce((sum, s) => {
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    return sum + (eh * 60 + em) - (sh * 60 + sm);
  }, 0);
  const totalHours = Math.round(totalMinutes / 60);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Mening oylik kalendarim
        </h3>
        <div className="flex items-center gap-1">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-[110px] text-center">
            {MONTH_NAMES[month]} {year}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-500"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center border border-green-100 dark:border-green-800">
          <p className="text-xl font-bold text-green-700 dark:text-green-300">{workDays}</p>
          <p className="text-xs text-green-600 dark:text-green-400">Ish kunlari</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center border border-red-100 dark:border-red-800">
          <p className="text-xl font-bold text-red-600 dark:text-red-400">{restDays}</p>
          <p className="text-xs text-red-500 dark:text-red-400">Dam olish</p>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center border border-blue-100 dark:border-blue-800">
          <p className="text-xl font-bold text-blue-700 dark:text-blue-300">{totalHours}</p>
          <p className="text-xs text-blue-500 dark:text-blue-400">Ish soatlari</p>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(SHIFT_STYLES).map(([key, s]) => (
          <span key={key} className={`text-xs px-2 py-0.5 rounded border font-medium ${s.bg} ${s.border} ${s.text}`}>
            {s.label}
          </span>
        ))}
        <span className="text-xs px-2 py-0.5 rounded border bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-400">
          Dam olish
        </span>
      </div>

      {/* Calendar grid */}
      <div>
        <div className="grid grid-cols-7 mb-1">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-gray-400 py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} />;
            const sched = getDay(day);
            const isToday = day === today.getDate() && month === today.getMonth() + 1 && year === today.getFullYear();
            const style = sched ? (SHIFT_STYLES[sched.shiftType] ?? SHIFT_STYLES.Kunduzgi) : null;

            return (
              <div
                key={day}
                title={sched ? `${sched.startTime}–${sched.endTime} (${sched.shiftType})` : 'Dam olish'}
                className={`rounded-lg text-center py-1.5 text-xs border transition-colors cursor-default ${
                  isToday
                    ? 'ring-2 ring-blue-500 ring-offset-1'
                    : ''
                } ${
                  style
                    ? `${style.bg} ${style.border} ${style.text} font-semibold`
                    : 'bg-gray-50 dark:bg-slate-700/30 border-gray-100 dark:border-slate-700 text-gray-300 dark:text-slate-600'
                }`}
              >
                <div>{day}</div>
                {sched && <div className="text-[10px] opacity-75 leading-tight">{sched.startTime}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
