'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { ClipboardList, Users, Bell, ArrowRight, Clock, CheckCircle2, AlertCircle, CalendarCheck, Clapperboard } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';

const TodayFilmingCard = dynamic(
  () => import('@/components/dashboard/TodayFilmingCard').then((m) => m.TodayFilmingCard),
  { ssr: false },
);

const STATUS_MAP: Record<string, { label: string; cls: string }> = {
  COMPLETED:   { label: 'Bajarildi',     cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  IN_PROGRESS: { label: 'Jarayonda',     cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  PENDING:     { label: 'Kutilmoqda',    cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' },
  CANCELLED:   { label: 'Bekor qilindi', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' },
};

export default function AdminDashboard() {
  const { data: tasks }  = useSWR('/api/tasks',         fetcher, { refreshInterval: 30000 });
  const { data: users }  = useSWR('/api/users',         fetcher);
  const { data: notifs } = useSWR('/api/notifications', fetcher, { refreshInterval: 15000 });

  // Today's schedule count + filming for "Bugungi smena" stat
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const { data: todayScheds }  = useSWR(`/api/schedules?from=${todayStr}&to=${todayStr}`, fetcher, { refreshInterval: 60000 });
  const { data: todayFilming } = useSWR('/api/filming/today', fetcher, { refreshInterval: 60000 });

  const taskList  = tasks?.data ?? [];
  const userList  = users?.data ?? [];
  const unread: number = notifs?.data?.unreadCount ?? 0;
  const filmingEntry = todayFilming?.data;
  const filmingOpsCount = filmingEntry?.operators?.length ?? 0;

  const workingTodayCount = new Set(
    (todayScheds?.data ?? [])
      .filter((s: any) => !['Dam', 'Kasallik', "Ta'til", 'Otpusk', 'Dam olish'].includes(s.shiftType))
      .map((s: any) => s.userId)
  ).size;

  const stats = [
    {
      label: 'Jami vazifalar',
      value: taskList.length,
      icon: <ClipboardList size={20} />,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
      href: '/admin/tasks',
      badge: null,
    },
    {
      label: 'Jarayondagi',
      value: taskList.filter((t: any) => t.status === 'IN_PROGRESS').length,
      icon: <Clock size={20} />,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
      href: '/admin/tasks',
      badge: null,
    },
    {
      label: 'Xodimlar',
      value: userList.filter((u: any) => u.role === 'EMPLOYEE').length,
      icon: <Users size={20} />,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
      href: '/admin/employees',
      badge: null,
    },
    {
      label: "O'qilmagan",
      value: unread,
      icon: <Bell size={20} />,
      color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
      href: '/admin/notifications',
      badge: null,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Bo'lim ko'rinishi</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700
                       hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 block"
          >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}>{s.icon}</div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <ArrowRight size={12} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
            </div>
          </Link>
        ))}

        {/* Bugungi smena — 5th card with filming badge */}
        <Link
          href="/admin/schedules"
          className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700
                     hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 block"
        >
          <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
            <CalendarCheck size={20} />
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{workingTodayCount}</p>
          <div className="flex items-center justify-between mt-0.5">
            <p className="text-xs text-gray-500">Bugungi smena</p>
            <ArrowRight size={12} className="text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
          </div>
          {filmingOpsCount > 0 && (
            <div className="mt-2 flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 font-medium">
              <Clapperboard size={11} />
              <span>{filmingOpsCount} ta suratga olish</span>
            </div>
          )}
        </Link>
      </div>

      {/* Today's filming preview */}
      <TodayFilmingCard filmingHref="/admin/filming" canCreate={true} />

      {/* Task list */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">So'nggi vazifalar</h3>
          <Link href="/admin/tasks" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
            Barchasi <ArrowRight size={12} />
          </Link>
        </div>

        {!tasks && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-14 animate-pulse bg-gray-100 dark:bg-slate-700 rounded-lg" />)}
          </div>
        )}

        {tasks && taskList.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertCircle size={32} className="text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Hozircha vazifalar yo'q</p>
            <Link href="/admin/tasks" className="mt-2 text-xs text-blue-500 hover:underline">Vazifa qo'shish →</Link>
          </div>
        )}

        <div className="space-y-1">
          {taskList.slice(0, 5).map((t: any) => {
            const s = STATUS_MAP[t.status] ?? STATUS_MAP.PENDING;
            return (
              <Link
                key={t.id}
                href="/admin/tasks"
                className="flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors group"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {t.title}
                  </p>
                  {t.assignedTo && <p className="text-xs text-gray-400 mt-0.5">{t.assignedTo.fullName}</p>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full flex-shrink-0 ml-3 font-medium ${s.cls}`}>{s.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Notification banner */}
      {unread > 0 && (
        <Link
          href="/admin/notifications"
          className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
        >
          <Bell size={20} className="text-blue-500 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-blue-800 dark:text-blue-300">{unread} ta o'qilmagan bildirishnoma</p>
            <p className="text-xs text-blue-500">Ko'rish uchun bosing</p>
          </div>
          <ArrowRight size={16} className="text-blue-400 group-hover:translate-x-1 transition-transform" />
        </Link>
      )}
    </div>
  );
}
