'use client';

import { useMemo } from 'react';
import { STATUS_CODES, StatusCode, computeMonthStats } from '@/lib/statistics';

interface Props {
  schedules: any[];
  users: any[];
  year: number;
  month: number;
}

const MONTH_NAMES = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

const DAY_SHORT = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];

export function MonthlyGrid({ schedules, users, year, month }: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();

  // Build per-user stats
  const userStats = useMemo(() => {
    return users.map((u) => {
      const userSchedules = schedules
        .filter((s) => s.userId === u.id)
        .map((s) => ({
          date: typeof s.date === 'string' ? s.date : new Date(s.date).toISOString(),
          shiftType: s.shiftType,
          startTime: s.startTime,
          endTime: s.endTime,
        }));
      return computeMonthStats(u.id, u.fullName, userSchedules, year, month);
    });
  }, [schedules, users, year, month]);

  // Day of week labels for the month
  const dayLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
  });

  // Summary stats
  const totalUsers = userStats.length;
  const avgWorkDays = totalUsers
    ? Math.round(userStats.reduce((s, u) => s + u.workDays, 0) / totalUsers)
    : 0;
  const topWorker = userStats.reduce(
    (best, u) => (u.workDays > (best?.workDays ?? -1) ? u : best),
    null as (typeof userStats)[0] | null,
  );

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-500 font-medium">Jami xodimlar</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalUsers}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-xs text-green-500 font-medium">O'rtacha ish kunlari</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{avgWorkDays}</p>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-4 border border-purple-100 dark:border-purple-800">
          <p className="text-xs text-purple-500 font-medium">Ko'p ishlagan</p>
          <p className="text-sm font-bold text-purple-700 dark:text-purple-300 truncate">
            {topWorker?.fullName ?? '—'}
          </p>
          {topWorker && (
            <p className="text-xs text-purple-400">{topWorker.workDays} kun</p>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(STATUS_CODES) as [StatusCode, (typeof STATUS_CODES)[StatusCode]][]).map(
          ([code, info]) => (
            <div
              key={code}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
              style={{ background: info.bg, borderColor: info.border, color: info.color }}
            >
              <span className="font-bold">{code}</span>
              <span>=</span>
              <span>{info.label}</span>
            </div>
          ),
        )}
      </div>

      {/* Monthly grid table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 font-semibold text-sm text-gray-700 dark:text-gray-300">
          {MONTH_NAMES[month]} {year} — Oylik jadval
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-900 text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 min-w-[140px]">
                  Xodim
                </th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th
                    key={i + 1}
                    className="px-1 py-1 text-center font-medium text-gray-500 dark:text-gray-400 min-w-[28px]"
                  >
                    <div>{i + 1}</div>
                    <div className="text-gray-400 text-[10px]">{dayLabels[i]}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20">I</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-600 dark:text-gray-400 bg-red-50 dark:bg-red-900/20">D</th>
                <th className="px-2 py-2 text-center font-semibold text-gray-600 dark:text-gray-400">Soat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {userStats.map((u) => (
                <tr key={u.userId} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-2 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px]">
                    {u.fullName}
                  </td>
                  {u.statuses.map((s) => {
                    const info = STATUS_CODES[s.code];
                    return (
                      <td
                        key={s.date}
                        title={`${s.date}: ${info.label}`}
                        className="text-center px-0.5 py-1"
                      >
                        <span
                          className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold"
                          style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}
                        >
                          {s.code}
                        </span>
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-2 font-bold text-green-600">{u.workDays}</td>
                  <td className="text-center px-2 py-2 font-bold text-red-400">{u.restDays}</td>
                  <td className="text-center px-2 py-2 text-gray-500">{u.totalHours}h</td>
                </tr>
              ))}
              {userStats.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 4} className="text-center py-8 text-gray-400">
                    Xodimlar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-user stats block */}
      {userStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Har bir xodim statistikasi
          </h3>
          <div className="space-y-3">
            {userStats.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-3 flex-wrap bg-gray-50 dark:bg-slate-700/30 rounded-lg px-3 py-2"
              >
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200 min-w-[140px]">
                  {u.fullName}
                </p>
                <div className="flex flex-wrap gap-2 text-xs">
                  {[
                    { label: 'Ish', value: u.workDays, bg: '#dcfce7', color: '#166534' },
                    { label: 'Dam', value: u.restDays, bg: '#fee2e2', color: '#991b1b' },
                    u.travelDays > 0 && { label: 'Safar', value: u.travelDays, bg: '#d1fae5', color: '#065f46' },
                    u.sickDays > 0 && { label: 'Kasal', value: u.sickDays, bg: '#fef3c7', color: '#92400e' },
                    u.leaveDays > 0 && { label: 'Otpusk', value: u.leaveDays, bg: '#dbeafe', color: '#1e40af' },
                  ]
                    .filter(Boolean)
                    .map((stat: any) => (
                      <span
                        key={stat.label}
                        className="px-2 py-0.5 rounded font-semibold"
                        style={{ background: stat.bg, color: stat.color }}
                      >
                        {stat.label}: {stat.value}
                      </span>
                    ))}
                  <span className="px-2 py-0.5 rounded font-semibold bg-gray-100 dark:bg-slate-600 text-gray-600 dark:text-gray-300">
                    {u.totalHours} soat
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
