'use client';

import useSWR from 'swr';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { uz } from 'date-fns/locale';
import { clsx } from 'clsx';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const TYPE_ICONS: Record<string, string> = { task: '📋', schedule: '📅', info: 'ℹ️', system: '⚙️' };

export default function NotificationsPage() {
  const { data, mutate } = useSWR('/api/notifications', fetcher, { refreshInterval: 15000 });
  const notifications = data?.data?.notifications ?? [];
  const unread = data?.data?.unreadCount ?? 0;

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read' }) });
    mutate();
  }

  async function markAll() {
    await fetch('/api/notifications/all', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'read-all' }) });
    mutate();
  }

  return (
    <div className="space-y-5 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bell size={20} /> Bildirishnomalar
            {unread > 0 && <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{unread}</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">{notifications.length} ta bildirishnoma</p>
        </div>
        {unread > 0 && (
          <button onClick={markAll} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <CheckCheck size={16} /> Barchasi o'qildi
          </button>
        )}
      </div>

      <div className="space-y-2">
        {!data && Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse" />
        ))}
        {notifications.map((n: any) => (
          <div
            key={n.id}
            className={clsx(
              'bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 flex items-start gap-3',
              !n.isRead && 'border-l-4 border-l-blue-500',
            )}
          >
            <span className="text-xl">{TYPE_ICONS[n.type] ?? '🔔'}</span>
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium', n.isRead ? 'text-gray-600 dark:text-gray-400' : 'text-gray-900 dark:text-white')}>{n.title}</p>
              <p className="text-sm text-gray-500 mt-0.5">{n.message}</p>
              <p className="text-xs text-gray-400 mt-1">
                {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: uz })}
              </p>
            </div>
            {!n.isRead && (
              <button onClick={() => markRead(n.id)} className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-blue-500">
                <Check size={15} />
              </button>
            )}
          </div>
        ))}
        {notifications.length === 0 && data && (
          <div className="text-center py-12 text-gray-400">
            <Bell size={40} className="mx-auto mb-3 opacity-30" />
            <p>Bildirishnomalar yo'q</p>
          </div>
        )}
      </div>
    </div>
  );
}
