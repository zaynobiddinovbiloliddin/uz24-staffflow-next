'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { ClipboardList, Calendar, Bell, CheckCircle2, Clock, ArrowRight, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function EmployeeDashboard() {
  const { data: session } = useSession();
  const { data: tasks }     = useSWR('/api/tasks',         fetcher, { refreshInterval: 30000 });
  const { data: schedules } = useSWR('/api/schedules',     fetcher, { refreshInterval: 60000 });
  const { data: notifs }    = useSWR('/api/notifications', fetcher, { refreshInterval: 15000 });

  const myTasks     = tasks?.data ?? [];
  const mySchedules = schedules?.data ?? [];
  const unread: number = notifs?.data?.unreadCount ?? 0;

  const pending    = myTasks.filter((t: any) => t.status === 'PENDING').length;
  const inProgress = myTasks.filter((t: any) => t.status === 'IN_PROGRESS').length;
  const completed  = myTasks.filter((t: any) => t.status === 'COMPLETED').length;
  const cancelled  = myTasks.filter((t: any) => t.status === 'CANCELLED').length;

  const todaySchedule = mySchedules.filter((s: any) => {
    const d = new Date(s.date);
    return d.toDateString() === new Date().toDateString();
  });

  const stats = [
    { label: 'Kutilmoqda',     value: pending,    icon: <Clock size={18} />,       color: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',  href: '/employee/tasks?status=PENDING'    },
    { label: 'Jarayonda',      value: inProgress, icon: <ClipboardList size={18}/>, color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',      href: '/employee/tasks?status=IN_PROGRESS'},
    { label: 'Bajarildi',      value: completed,  icon: <CheckCircle2 size={18} />,color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',  href: '/employee/tasks?status=COMPLETED'  },
    { label: 'Bekor qilingan', value: cancelled,  icon: <XCircle size={18} />,     color: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',          href: '/employee/tasks?status=CANCELLED'  },
  ];

  const activeTasks = myTasks.filter((t: any) => ['PENDING', 'IN_PROGRESS'].includes(t.status));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          Xush kelibsiz, {session?.user.name?.split(' ')[0]}! 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
          {session?.user.position} · {session?.user.departmentName}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="group bg-white dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700
                       hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-md transition-all duration-200 block"
          >
            <div className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${s.color}`}>{s.icon}</div>
            <p className="text-xl font-bold text-gray-900 dark:text-white">{s.value}</p>
            <div className="flex items-center justify-between mt-0.5">
              <p className="text-xs text-gray-500">{s.label}</p>
              <ArrowRight size={11} className="text-gray-300 group-hover:text-blue-500 transition-colors" />
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Today's schedule */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar size={16} /> Bugungi jadval
            </h3>
            <Link href="/employee/schedule" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>

          {todaySchedule.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <Calendar size={28} className="text-gray-200 dark:text-slate-600 mb-2" />
              <p className="text-sm text-gray-400">Bugun uchun jadval yo'q</p>
              <Link href="/employee/schedule" className="mt-1.5 text-xs text-blue-500 hover:underline">
                Jadvalni ko'rish →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {todaySchedule.map((s: any) => (
                <Link
                  key={s.id}
                  href="/employee/schedule"
                  className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg
                             hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
                >
                  <div className="text-blue-600 dark:text-blue-400 font-mono text-sm font-medium">
                    {s.startTime} – {s.endTime}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.shiftType}</p>
                    {s.note && <p className="text-xs text-gray-500">{s.note}</p>}
                  </div>
                  <ArrowRight size={14} className="text-blue-300 group-hover:translate-x-0.5 transition-transform flex-shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Active tasks */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <ClipboardList size={16} /> Aktiv vazifalar
            </h3>
            <Link href="/employee/tasks" className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
              Barchasi <ArrowRight size={12} />
            </Link>
          </div>

          {!tasks ? (
            <div className="animate-pulse space-y-2">
              {[1, 2].map((i) => <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-lg" />)}
            </div>
          ) : activeTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-6 text-center">
              <CheckCircle2 size={28} className="text-green-300 mb-2" />
              <p className="text-sm text-gray-400">Barcha vazifalar bajarilgan!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeTasks.slice(0, 3).map((t: any) => (
                <Link
                  key={t.id}
                  href="/employee/tasks"
                  className="group flex items-start justify-between p-3 bg-gray-50 dark:bg-slate-700/50 rounded-lg
                             hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {t.title}
                    </p>
                    {t.deadline && (
                      <p className="text-xs text-gray-400 mt-0.5">Muddat: {format(new Date(t.deadline), 'dd.MM.yyyy')}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 font-medium ${
                    t.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  }`}>
                    {t.status === 'IN_PROGRESS' ? 'Jarayonda' : 'Kutilmoqda'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notification banner */}
      {unread > 0 && (
        <Link
          href="/employee/notifications"
          className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800
                     rounded-xl p-4 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
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
