'use client';

import useSWR from 'swr';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const DAY_NAMES = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
const SHIFT_COLORS: Record<string, string> = {
  Kunduzgi: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  Kechki: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  Tungi: 'bg-slate-50 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
  Qisqartirilgan: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300',
};

export default function EmployeeSchedulePage() {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(addDays(weekStart, 27), 'yyyy-MM-dd');

  const { data } = useSWR(`/api/schedules?from=${from}&to=${to}`, fetcher);
  const schedules: any[] = data?.data ?? [];

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const todaySchedule = schedules.filter((s) => isSameDay(new Date(s.date), today));
  const upcomingSchedules = schedules.filter((s) => new Date(s.date) > today).slice(0, 10);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mening jadvalim</h1>
        <p className="text-sm text-gray-500 mt-0.5">{format(today, 'dd MMMM yyyy')}</p>
      </div>

      {todaySchedule.length > 0 && (
        <div className="bg-blue-600 rounded-xl p-5 text-white">
          <p className="text-blue-200 text-sm mb-3">Bugungi smena</p>
          {todaySchedule.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between">
              <div>
                <p className="text-xl font-bold">{s.startTime} — {s.endTime}</p>
                <p className="text-blue-200 mt-1">{s.shiftType} smena{s.note ? ` · ${s.note}` : ''}</p>
              </div>
              <div className="text-4xl">🕐</div>
            </div>
          ))}
        </div>
      )}

      {todaySchedule.length === 0 && data && (
        <div className="bg-gray-50 dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 text-center">
          <Calendar size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">Bugun smena yo'q</p>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300">
          Bu hafta
        </div>
        <div className="overflow-x-auto">
          <div className="grid grid-cols-7 min-w-[420px]">
            {weekDays.map((day, idx) => {
              const daySched = schedules.filter((s) => isSameDay(new Date(s.date), day));
              const isToday = isSameDay(day, today);
              return (
                <div key={idx} className={`p-2 border-r border-gray-50 dark:border-slate-700 last:border-0 ${isToday ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                  <p className={`text-xs font-semibold text-center mb-2 ${isToday ? 'text-blue-600' : 'text-gray-500'}`}>
                    <span className="block">{DAY_NAMES[idx].slice(0, 3)}</span>
                    <span className={`block text-base ${isToday ? 'text-blue-600' : 'text-gray-800 dark:text-gray-200'}`}>{format(day, 'd')}</span>
                  </p>
                  {daySched.map((s: any) => (
                    <div key={s.id} className={`text-xs px-1.5 py-1 rounded border mb-1 ${SHIFT_COLORS[s.shiftType] ?? SHIFT_COLORS.Kunduzgi}`}>
                      <p className="font-medium">{s.startTime}</p>
                      <p className="opacity-70">—{s.endTime}</p>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {upcomingSchedules.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300">Keyingi smenalar</div>
          <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {upcomingSchedules.map((s: any) => (
              <div key={s.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 font-bold text-sm">{format(new Date(s.date), 'd')}</div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(s.date), 'dd MMMM')}</p>
                    <p className="text-xs text-gray-400">{s.shiftType} smena</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-sm text-gray-500"><Clock size={13} />{s.startTime}–{s.endTime}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
