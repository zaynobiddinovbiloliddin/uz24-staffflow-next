'use client';

import { useMemo } from 'react';
import { FileDown } from 'lucide-react';
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

  const dayLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    return DAY_SHORT[d.getDay() === 0 ? 6 : d.getDay() - 1];
  });

  // ── Summary stats ────────────────────────────────────────────────────────
  const totalUsers   = userStats.length;
  const avgWorkDays  = totalUsers
    ? Math.round(userStats.reduce((s, u) => s + u.workDays, 0) / totalUsers)
    : 0;
  const dayOffCount  = userStats.filter((u) => u.restDays > 0).length;
  const travelCount  = userStats.filter((u) => u.travelDays > 0).length;

  function handleExcelDownload() {
    window.location.href = `/api/schedules/monthly-stats/export?year=${year}&month=${month}`;
  }

  // ── Skeleton if no users yet ──────────────────────────────────────────────
  if (!users.length && !schedules.length) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="h-64 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Header with export ──────────────────────────────────────────── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          {MONTH_NAMES[month]} {year} — Oylik jadval
        </h2>
        <button
          onClick={handleExcelDownload}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
        >
          <FileDown size={15} /> Excel yuklab olish
        </button>
      </div>

      {/* ── 4 Summary cards ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-100 dark:border-blue-800">
          <p className="text-xs text-blue-500 font-medium">Jami xodimlar</p>
          <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">{totalUsers}</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-100 dark:border-green-800">
          <p className="text-xs text-green-500 font-medium">O'rtacha ish kunlari</p>
          <p className="text-2xl font-bold text-green-700 dark:text-green-300">{avgWorkDays}</p>
          <p className="text-xs text-green-400 mt-0.5">kun</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-100 dark:border-red-800">
          <p className="text-xs text-red-500 font-medium">Dam olganlar</p>
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{dayOffCount}</p>
          <p className="text-xs text-red-400 mt-0.5">xodim</p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-4 border border-indigo-100 dark:border-indigo-800">
          <p className="text-xs text-indigo-500 font-medium">Komandirovkada</p>
          <p className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">{travelCount}</p>
          <p className="text-xs text-indigo-400 mt-0.5">xodim</p>
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
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
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border bg-gray-50 dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-400">
          <span>(bo'sh)</span>
          <span>=</span>
          <span>Belgilanmagan</span>
        </div>
      </div>

      {/* ── Monthly grid table ───────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                {/* Name column — always visible */}
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-900 text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 min-w-[140px] border-r border-gray-100 dark:border-slate-700">
                  Xodim
                </th>
                {/* Day columns — hidden on mobile (< md) */}
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th
                    key={i + 1}
                    className="hidden md:table-cell px-0.5 py-1 text-center font-medium text-gray-500 dark:text-gray-400 min-w-[28px]"
                  >
                    <div>{i + 1}</div>
                    <div className="text-gray-400 text-[10px]">{dayLabels[i]}</div>
                  </th>
                ))}
                {/* Stats columns — always visible */}
                <th className="px-2 py-2 text-center font-semibold text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 min-w-[40px]">
                  Jami
                </th>
                <th className="px-2 py-2 text-center font-semibold text-gray-500 dark:text-gray-400 min-w-[44px]">
                  Soat
                </th>
                <th className="px-2 py-2 text-center font-semibold text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 min-w-[36px]">
                  Dam
                </th>
                <th className="px-2 py-2 text-center font-semibold text-yellow-600 dark:text-yellow-400 min-w-[36px]">
                  Kas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {userStats.map((u) => (
                <tr key={u.userId} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-2 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[140px] border-r border-gray-50 dark:border-slate-700">
                    {u.fullName}
                  </td>
                  {u.statuses.map((s) => {
                    const info = s.code ? STATUS_CODES[s.code] : null;
                    return (
                      <td
                        key={s.date}
                        title={s.code ? `${s.date}: ${info?.label}` : s.date}
                        className="hidden md:table-cell text-center px-0.5 py-1"
                      >
                        {s.code && info ? (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold"
                            style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}
                          >
                            {s.code}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded text-[10px] text-gray-100 dark:text-slate-700">
                            ·
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-2 font-bold text-green-600 dark:text-green-400">{u.workDays}</td>
                  <td className="text-center px-2 py-2 text-gray-500 dark:text-gray-400">{u.totalHours}s</td>
                  <td className="text-center px-2 py-2 font-bold text-red-500 dark:text-red-400">
                    {u.restDays > 0 ? u.restDays : <span className="text-gray-200 dark:text-slate-600">·</span>}
                  </td>
                  <td className="text-center px-2 py-2 text-yellow-600 dark:text-yellow-400">
                    {u.sickDays > 0 ? u.sickDays : <span className="text-gray-200 dark:text-slate-600">·</span>}
                  </td>
                </tr>
              ))}
              {userStats.length === 0 && (
                <tr>
                  <td colSpan={daysInMonth + 5} className="text-center py-10 text-gray-400">
                    Bu oy uchun jadval ma'lumotlari yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Mobile hint ──────────────────────────────────────────────────── */}
      <p className="md:hidden text-xs text-gray-400 dark:text-slate-500 text-center">
        Kunlik holat jadvalini ko'rish uchun katta ekranda oching
      </p>

      {/* ── Per-user stats block ──────────────────────────────────────────── */}
      {userStats.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            Xodimlar statistikasi
          </h3>
          <div className="space-y-2">
            {userStats.map((u) => (
              <div
                key={u.userId}
                className="flex items-center gap-3 flex-wrap bg-gray-50 dark:bg-slate-700/30 rounded-lg px-3 py-2"
              >
                <p className="font-medium text-sm text-gray-800 dark:text-gray-200 min-w-[140px] truncate">
                  {u.fullName}
                </p>
                <div className="flex flex-wrap gap-1.5 text-xs">
                  <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#dcfce7', color: '#166534' }}>
                    Ish: {u.workDays}
                  </span>
                  <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#fee2e2', color: '#991b1b' }}>
                    Dam: {u.restDays}
                  </span>
                  {u.sickDays > 0 && (
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#fef9c3', color: '#854d0e' }}>
                      Kasal: {u.sickDays}
                    </span>
                  )}
                  {u.travelDays > 0 && (
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#dbeafe', color: '#1e40af' }}>
                      Komandirovka: {u.travelDays}
                    </span>
                  )}
                  {u.vacationDays > 0 && (
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#ede9fe', color: '#6d28d9' }}>
                      Ta'til: {u.vacationDays}
                    </span>
                  )}
                  {u.otherDays > 0 && (
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#cffafe', color: '#0e7490' }}>
                      Zahira: {u.otherDays}
                    </span>
                  )}
                  {u.leaveDays > 0 && (
                    <span className="px-2 py-0.5 rounded font-semibold" style={{ background: '#ffedd5', color: '#c2410c' }}>
                      Ortiqcha: {u.leaveDays}
                    </span>
                  )}
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
