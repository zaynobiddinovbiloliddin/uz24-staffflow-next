'use client';

import useSWR from 'swr';
import { Users, ClipboardList, Building2, Camera, Car, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AnalyticsPage() {
  const { data: ov } = useSWR('/api/analytics?type=overview', fetcher, { refreshInterval: 30000 });
  const { data: chart } = useSWR('/api/analytics?type=tasks-chart', fetcher, { refreshInterval: 60000 });
  const { data: depts } = useSWR('/api/analytics?type=departments', fetcher, { refreshInterval: 60000 });

  const overview = ov?.data;
  const chartData = chart?.data ?? [];
  const deptData = depts?.data ?? [];

  const taskPieData = overview ? [
    { name: 'Bajarildi', value: overview.tasks.completed, color: '#10b981' },
    { name: 'Jarayonda', value: overview.tasks.inProgress, color: '#3b82f6' },
    { name: 'Kutilmoqda', value: overview.tasks.pending, color: '#f59e0b' },
  ] : [];

  const kpis = [
    { title: 'Faol xodimlar', value: overview?.users.active ?? '—', sub: `Jami: ${overview?.users.total ?? 0}`, icon: <Users size={20} />, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30' },
    { title: 'Jami vazifalar', value: overview?.tasks.total ?? '—', sub: `Bajarildi: ${overview?.tasks.completed ?? 0}`, icon: <ClipboardList size={20} />, color: 'text-green-600 bg-green-100 dark:bg-green-900/30' },
    { title: 'Bo\'limlar', value: overview?.departments ?? '—', sub: 'Faol bo\'limlar', icon: <Building2 size={20} />, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30' },
    { title: 'Uskunalar', value: overview?.equipment.available ?? '—', sub: `Jami: ${overview?.equipment.total ?? 0}`, icon: <Camera size={20} />, color: 'text-orange-600 bg-orange-100 dark:bg-orange-900/30' },
    { title: 'Transport', value: overview?.vehicles.available ?? '—', sub: `Jami: ${overview?.vehicles.total ?? 0}`, icon: <Car size={20} />, color: 'text-cyan-600 bg-cyan-100 dark:bg-cyan-900/30' },
    { title: 'Jarayondagi', value: overview?.tasks.inProgress ?? '—', sub: 'Aktiv vazifalar', icon: <TrendingUp size={20} />, color: 'text-red-600 bg-red-100 dark:bg-red-900/30' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tahlil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizim statistikasi va ko'rsatkichlari</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {kpis.map((k) => (
          <div key={k.title} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-500 font-medium">{k.title}</p>
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${k.color}`}>{k.icon}</div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{k.value}</p>
            <p className="text-xs text-gray-400 mt-1">{k.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">So'nggi 7 kun — vazifalar</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="created" name="Yaratildi" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="completed" name="Bajarildi" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Vazifalar holati</h3>
          {taskPieData.some((d) => d.value > 0) ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={taskPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {taskPieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                </Pie>
                <Legend />
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-[220px] flex items-center justify-center text-gray-400 text-sm">Ma'lumot yo'q</div>
          )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Bo'limlar bo'yicha</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700">
                <th className="text-left py-2 text-gray-500 font-medium">Bo'lim</th>
                <th className="text-center py-2 text-gray-500 font-medium">Xodimlar</th>
                <th className="text-center py-2 text-gray-500 font-medium">Vazifalar</th>
                <th className="text-center py-2 text-gray-500 font-medium">Bajarilgan</th>
                <th className="text-left py-2 text-gray-500 font-medium w-32">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {deptData.map((d: any) => {
                const pct = d.tasks > 0 ? Math.round((d.completed / d.tasks) * 100) : 0;
                return (
                  <tr key={d.name}>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: d.color }} />
                        <span className="font-medium text-gray-800 dark:text-gray-200">{d.name}</span>
                      </div>
                    </td>
                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">{d.employees}</td>
                    <td className="py-3 text-center text-gray-600 dark:text-gray-400">{d.tasks}</td>
                    <td className="py-3 text-center text-green-600">{d.completed}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-400 w-8">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
