'use client';

import { useState, useMemo } from 'react';
import useSWR from 'swr';
import { Download, Users, CheckCircle, Moon, Plane } from 'lucide-react';
import { STATUS_CODES, StatusCode, shiftToStatusCode } from '@/lib/statistics';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const MONTH_NAMES = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

interface Props {
  role: 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';
  currentUserId?: string;
  currentUserName?: string;
}

export function StatisticsPage({ role, currentUserId, currentUserName }: Props) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);

  const daysInMonth = new Date(year, month, 0).getDate();
  const monthFrom = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthTo = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

  const statusUrl = role === 'EMPLOYEE'
    ? `/api/daily-status?userId=${currentUserId}&from=${monthFrom}&to=${monthTo}`
    : `/api/daily-status?from=${monthFrom}&to=${monthTo}`;

  const scheduleUrl = role === 'EMPLOYEE'
    ? `/api/schedules?userId=${currentUserId}&from=${monthFrom}&to=${monthTo}`
    : `/api/schedules?from=${monthFrom}&to=${monthTo}`;

  const { data: statusData } = useSWR(statusUrl, fetcher);
  const { data: schedData } = useSWR(scheduleUrl, fetcher);
  const { data: usersData } = useSWR(role !== 'EMPLOYEE' ? '/api/users' : null, fetcher);

  const statuses: any[] = statusData?.data ?? [];
  const schedules: any[] = schedData?.data ?? [];
  const allUsers: any[] = usersData?.data ?? [];

  // Build user list
  const users = useMemo(() => {
    if (role === 'EMPLOYEE') {
      return [{ id: currentUserId, fullName: currentUserName, position: '', department: null }];
    }
    return allUsers.filter((u) => u.isActive);
  }, [role, allUsers, currentUserId, currentUserName]);

  // Build grid data: for each user, each day has a status
  const grid = useMemo(() => {
    return users.map((u) => {
      const days: { day: number; code: StatusCode | null; fromSchedule: boolean }[] = [];
      for (let d = 1; d <= daysInMonth; d++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        const ds = statuses.find((s) => s.userId === u.id && s.date?.slice(0, 10) === dateStr);
        if (ds) {
          // DailyStatus yozuvi bor — to'g'ridan-to'g'ri ishlatamiz
          days.push({ day: d, code: ds.status as StatusCode, fromSchedule: false });
        } else {
          // Schedule.shiftType bo'yicha aniqlash (was: always 'I' if any schedule exists)
          const sched = schedules.find((s) => s.userId === u.id && s.date?.slice(0, 10) === dateStr);
          const code: StatusCode | null = sched ? (shiftToStatusCode(sched.shiftType) ?? 'I') : null;
          days.push({ day: d, code, fromSchedule: true });
        }
      }
      const workDays   = days.filter((d) => d.code === 'I').length;
      const restDays   = days.filter((d) => d.code === 'D').length;
      const travelDays = days.filter((d) => d.code === 'S').length;
      return { ...u, days, workDays, restDays, travelDays };
    });
  }, [users, statuses, schedules, daysInMonth, year, month]);

  // Summary cards
  const todayStr = today.toISOString().slice(0, 10);
  const todayGrid = grid.map((u) => {
    const todayDay = today.getDate();
    return u.days.find((d: any) => d.day === todayDay)?.code ?? 'D';
  });
  const workingToday = todayGrid.filter((c) => c === 'I').length;
  const restToday = todayGrid.filter((c) => c === 'D').length;
  const travelToday = todayGrid.filter((c) => c === 'S').length;

  async function handleExcel() {
    const { exportMonthlyStatusExcel } = await import('@/lib/exportExcel');
    exportMonthlyStatusExcel(grid, users, month, year, daysInMonth, role === 'EMPLOYEE' ? currentUserName : undefined);
  }

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  const dayLabels = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month - 1, i + 1);
    const dow = d.getDay();
    return ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'][dow];
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Statistika</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTH_NAMES[month]} {year}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={prevMonth} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">← Oldingi</button>
          <button onClick={() => { setYear(today.getFullYear()); setMonth(today.getMonth() + 1); }} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Bu oy</button>
          <button onClick={nextMonth} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Keyingi →</button>
          <button onClick={handleExcel} className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
            <Download size={15} />
            {role === 'EMPLOYEE' ? 'Mening jadvalim' : 'Excel yuklab olish'}
          </button>
        </div>
      </div>

      {/* Summary cards (admin only) */}
      {role !== 'EMPLOYEE' && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Jami xodimlar', value: users.length, icon: <Users size={18} />, color: 'blue' },
            { label: 'Bugun ishlaydi', value: workingToday, icon: <CheckCircle size={18} />, color: 'green' },
            { label: 'Bugun dam oladi', value: restToday, icon: <Moon size={18} />, color: 'red' },
            { label: 'Safardaliklar', value: travelToday, icon: <Plane size={18} />, color: 'purple' },
          ].map((card) => (
            <div key={card.label} className={`bg-${card.color}-50 dark:bg-${card.color}-900/20 rounded-xl p-4 border border-${card.color}-100 dark:border-${card.color}-800`}>
              <div className={`text-${card.color}-500 mb-2`}>{card.icon}</div>
              <p className={`text-2xl font-bold text-${card.color}-700 dark:text-${card.color}-300`}>{card.value}</p>
              <p className={`text-xs text-${card.color}-500 mt-0.5`}>{card.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-2">
        {(Object.entries(STATUS_CODES) as [StatusCode, typeof STATUS_CODES[StatusCode]][]).map(([code, info]) => (
          <span key={code} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border"
            style={{ background: info.bg, borderColor: info.border, color: info.color }}>
            <span className="font-bold">{code}</span> = {info.label}
          </span>
        ))}
      </div>

      {/* Monthly grid */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-sm font-semibold text-gray-700 dark:text-gray-300">
          {MONTH_NAMES[month]} {year} — Oylik jadval ({users.length} xodim)
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 dark:bg-slate-900/50">
                <th className="sticky left-0 z-10 bg-gray-50 dark:bg-slate-900 text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 min-w-[40px]">№</th>
                <th className="sticky left-[40px] z-10 bg-gray-50 dark:bg-slate-900 text-left px-3 py-2 font-semibold text-gray-600 dark:text-gray-400 min-w-[150px]">Xodim</th>
                {Array.from({ length: daysInMonth }, (_, i) => (
                  <th key={i + 1} className={`px-1 py-1 text-center font-medium min-w-[26px] ${dayLabels[i] === 'Ya' || dayLabels[i] === 'Sh' ? 'text-red-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    <div className="font-bold">{i + 1}</div>
                    <div className="text-[10px] opacity-70">{dayLabels[i]}</div>
                  </th>
                ))}
                <th className="px-2 py-2 text-center font-bold text-green-600 bg-green-50 dark:bg-green-900/20 min-w-[40px]">Ish</th>
                <th className="px-2 py-2 text-center font-bold text-red-500 bg-red-50 dark:bg-red-900/20 min-w-[40px]">Dam</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {grid.map((u, idx) => (
                <tr key={u.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30">
                  <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-3 py-1.5 text-gray-400 text-center">{idx + 1}</td>
                  <td className="sticky left-[40px] z-10 bg-white dark:bg-slate-800 px-3 py-1.5 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[150px]">
                    <div className="truncate">{u.fullName}</div>
                    {u.position && <div className="text-[10px] text-gray-400 truncate">{u.position}</div>}
                  </td>
                  {u.days.map((d: any) => {
                    const info = d.code ? STATUS_CODES[d.code as StatusCode] : null;
                    const isWeekend = ['Ya', 'Sh'].includes(dayLabels[d.day - 1]);
                    return (
                      <td key={d.day} className="text-center p-0.5">
                        {info ? (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] font-bold ${isWeekend && d.code === 'D' ? 'opacity-50' : ''}`}
                            style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}
                            title={`${u.fullName} — ${d.day}-${MONTH_NAMES[month]}: ${info.label}`}
                          >
                            {d.code}
                          </span>
                        ) : (
                          <span
                            className={`inline-flex items-center justify-center w-6 h-6 rounded text-[10px] ${isWeekend ? 'text-red-200 dark:text-red-900' : 'text-gray-100 dark:text-slate-700'}`}
                            title={`${u.fullName} — ${d.day}-${MONTH_NAMES[month]}: belgilanmagan`}
                          >
                            {isWeekend ? 'D' : '·'}
                          </span>
                        )}
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-1.5 font-bold text-green-600 bg-green-50/50 dark:bg-green-900/10">{u.workDays}</td>
                  <td className="text-center px-2 py-1.5 font-bold text-red-500 bg-red-50/50 dark:bg-red-900/10">{u.restDays}</td>
                </tr>
              ))}
              {grid.length === 0 && (
                <tr><td colSpan={daysInMonth + 4} className="text-center py-8 text-gray-400">Ma'lumot yo'q</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Per-user stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Batafsil statistika</h3>
        <div className="space-y-2">
          {grid.map((u) => {
            const counts: Record<StatusCode, number> = { I: 0, D: 0, S: 0, K: 0, T: 0, B: 0, O: 0 };
            u.days.forEach((d: any) => { if (d.code) { const c = d.code as StatusCode; counts[c] = (counts[c] || 0) + 1; } });
            return (
              <div key={u.id} className="flex items-center gap-3 flex-wrap bg-gray-50 dark:bg-slate-700/30 rounded-lg px-3 py-2">
                <span className="font-medium text-sm text-gray-800 dark:text-gray-200 min-w-[140px] truncate">{u.fullName}</span>
                <div className="flex flex-wrap gap-1.5">
                  {(Object.entries(counts) as [StatusCode, number][]).filter(([, v]) => v > 0).map(([code, count]) => {
                    const info = STATUS_CODES[code];
                    return (
                      <span key={code} className="px-2 py-0.5 rounded text-xs font-semibold"
                        style={{ background: info.bg, color: info.color, border: `1px solid ${info.border}` }}>
                        {info.label}: {count}
                      </span>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
