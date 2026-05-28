'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import {
  Users, ClipboardList, Building2, Camera, Car, TrendingUp,
  BarChart2, CheckCircle2, Clock, XCircle, ArrowRight,
} from 'lucide-react';
import { SkeletonStatCard, SkeletonChart } from '@/components/ui/Skeleton';

// ── Lazy-load recharts (saves ~300 KB from initial bundle) ──────────────────
const BarChartWidget = dynamic(() => import('@/components/charts/BarChartWidget'), {
  loading: () => <SkeletonChart />,
  ssr: false,
});

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// ── KPI Card ────────────────────────────────────────────────────────────────
const COLOR_MAP: Record<string, string> = {
  blue:   'bg-blue-500/10 text-blue-600 dark:text-blue-400',
  green:  'bg-green-500/10 text-green-600 dark:text-green-400',
  purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
  orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
  red:    'bg-red-500/10 text-red-600 dark:text-red-400',
  cyan:   'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400',
};

function KPI({ title, value, sub, icon, color, href }: {
  title: string; value: number | string; sub: string;
  icon: React.ReactNode; color: string; href: string;
}) {
  return (
    <Link
      href={href}
      className="group bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700
                 hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-px
                 transition-all duration-200 block"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${COLOR_MAP[color]}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
      <div className="flex items-center justify-between mt-1">
        <p className="text-xs text-gray-400">{sub}</p>
        <ArrowRight size={12} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all duration-200" />
      </div>
    </Link>
  );
}

// ── Page ────────────────────────────────────────────────────────────────────
export default function SuperDashboard() {
  const { data: ov, isLoading } = useSWR('/api/analytics?type=overview',    fetcher, { refreshInterval: 30000 });
  const { data: chart }         = useSWR('/api/analytics?type=tasks-chart', fetcher, { refreshInterval: 60000 });
  const { data: depts }         = useSWR('/api/analytics?type=departments', fetcher, { refreshInterval: 60000 });

  const overview  = ov?.data;
  const chartData = chart?.data ?? [];
  const deptData  = depts?.data ?? [];

  return (
    <div className="space-y-6 page-content">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bosh sahifa</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Tizim umumiy ko'rinishi</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonStatCard key={i} />)
        ) : (
          <>
            <KPI title="Faol xodimlar"    value={overview?.users.active ?? 0}        sub={`Jami: ${overview?.users.total ?? 0} ta`}       icon={<Users size={20} />}        color="blue"   href="/superadmin/users" />
            <KPI title="Barcha vazifalar" value={overview?.tasks.total ?? 0}         sub={`Bajarildi: ${overview?.tasks.completed ?? 0}`} icon={<ClipboardList size={20} />} color="green"  href="/superadmin/tasks" />
            <KPI title="Bo'limlar"        value={overview?.departments ?? 0}         sub="Faol bo'limlar"                                 icon={<Building2 size={20} />}     color="purple" href="/superadmin/departments" />
            <KPI title="Uskunalar"        value={overview?.equipment.available ?? 0} sub={`Jami: ${overview?.equipment.total ?? 0}`}      icon={<Camera size={20} />}        color="orange" href="/superadmin/equipment" />
            <KPI title="Transport"        value={overview?.vehicles.available ?? 0}  sub={`Jami: ${overview?.vehicles.total ?? 0}`}       icon={<Car size={20} />}           color="cyan"   href="/superadmin/vehicles" />
            <KPI title="Jarayondagi"      value={overview?.tasks.inProgress ?? 0}    sub="Aktiv vazifalar"                                icon={<TrendingUp size={20} />}    color="red"    href="/superadmin/tasks" />
          </>
        )}
      </div>

      {/* Task status bars */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { label: 'Bajarildi',  count: overview?.tasks.completed ?? 0,  total: overview?.tasks.total || 1, color: 'bg-green-500', icon: <CheckCircle2 size={14} className="text-green-500" />, href: '/superadmin/tasks?status=COMPLETED'   },
          { label: 'Jarayonda',  count: overview?.tasks.inProgress ?? 0, total: overview?.tasks.total || 1, color: 'bg-blue-500',  icon: <Clock size={14} className="text-blue-500" />,       href: '/superadmin/tasks?status=IN_PROGRESS' },
          { label: 'Kutilmoqda', count: overview?.tasks.pending ?? 0,    total: overview?.tasks.total || 1, color: 'bg-amber-500', icon: <XCircle size={14} className="text-amber-500" />,    href: '/superadmin/tasks?status=PENDING'     },
        ].map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700
                       hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md hover:-translate-y-px
                       transition-all duration-200 block"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-300">{s.icon} {s.label}</div>
              <span className="text-lg font-bold text-gray-900 dark:text-white">{s.count}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${s.color} rounded-full transition-all duration-700 ease-out`}
                style={{ width: `${Math.round((s.count / s.total) * 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">{Math.round((s.count / s.total) * 100)}%</p>
              <ArrowRight size={11} className="text-gray-300 group-hover:text-blue-500 transition-colors duration-200" />
            </div>
          </Link>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar chart */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <BarChart2 size={16} /> So'nggi 7 kun — vazifalar
            </h3>
            <Link href="/superadmin/analytics" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors duration-150">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>
          <BarChartWidget data={chartData} />
        </div>

        {/* Departments */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-5 border border-gray-100 dark:border-slate-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 size={16} /> Bo'limlar bo'yicha
            </h3>
            <Link href="/superadmin/departments" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium transition-colors duration-150">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>

          {!depts ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between">
                    <div className="h-3.5 w-32 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                    <div className="h-3 w-20 bg-gray-200 dark:bg-slate-700 rounded animate-pulse" />
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full animate-pulse" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {deptData.slice(0, 5).map((d: any) => (
                <Link
                  key={d.name}
                  href="/superadmin/departments"
                  className="group block hover:bg-gray-50 dark:hover:bg-slate-700/50 rounded-lg p-1.5 -mx-1.5 transition-colors duration-150"
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-600 dark:text-gray-300 truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-150">{d.name}</span>
                    <span className="text-gray-500 text-xs flex-shrink-0 ml-2">{d.employees} xodim · {d.tasks} vazifa</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{ width: `${d.tasks ? Math.round((d.completed / d.tasks) * 100) : 0}%`, backgroundColor: d.color }}
                    />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
