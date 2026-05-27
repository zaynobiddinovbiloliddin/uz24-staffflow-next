'use client';

import useSWR from 'swr';
import { User, Phone, Building2, ClipboardList, Calendar } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EmployeeProfilePage() {
  const { data } = useSWR('/api/me', fetcher);
  const { data: tasksData } = useSWR('/api/tasks', fetcher);
  const { data: schedData } = useSWR('/api/schedules', fetcher);

  const me = data?.data;
  const tasks: any[] = tasksData?.data ?? [];
  const schedules: any[] = schedData?.data ?? [];

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
  };

  if (!me) return (
    <div className="space-y-4">
      {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />)}
    </div>
  );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mening profilim</h1>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white font-bold text-2xl flex items-center justify-center flex-shrink-0">
            {me.fullName[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{me.fullName}</h2>
            <p className="text-gray-500">@{me.username}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${me.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
              {me.isActive ? 'Faol' : 'Nofaol'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: <User size={16} />, label: 'Lavozim', value: me.position ?? 'Ko\'rsatilmagan' },
            { icon: <Phone size={16} />, label: 'Telefon', value: me.phone ?? 'Ko\'rsatilmagan' },
            { icon: <Building2 size={16} />, label: 'Bo\'lim', value: me.department?.name ?? 'Tayinlanmagan' },
            { icon: <Calendar size={16} />, label: 'Ro\'yxatdan o\'tgan', value: format(new Date(me.createdAt), 'dd.MM.yyyy') },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-400 flex items-center justify-center flex-shrink-0">{icon}</div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><ClipboardList size={16} /> Vazifa statistikasi</h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Jami', value: taskStats.total, color: 'text-gray-700 dark:text-gray-200' },
            { label: 'Kutilmoqda', value: taskStats.pending, color: 'text-amber-600' },
            { label: 'Jarayonda', value: taskStats.inProgress, color: 'text-blue-600' },
            { label: 'Bajarildi', value: taskStats.completed, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {taskStats.total > 0 && (
          <div className="mt-4 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${Math.round((taskStats.completed / taskStats.total) * 100)}%` }} />
          </div>
        )}
        <p className="text-xs text-gray-400 mt-1">{taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0}% bajarildi</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2"><Calendar size={16} /> Keyingi jadvallar</h3>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Jadval yo'q</p>
        ) : (
          <div className="space-y-2">
            {schedules.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{format(new Date(s.date), 'dd.MM.yyyy')} — {s.shiftType}</p>
                </div>
                <span className="text-sm text-gray-500">{s.startTime}–{s.endTime}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
