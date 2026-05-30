'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { ChevronLeft, ChevronRight, Shield } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  TOGGLE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PAY: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  ASSIGN: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
};

export default function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');

  const params = new URLSearchParams({ page: String(page), limit: '30' });
  if (entity) params.set('entity', entity);
  if (action) params.set('action', action);

  const { data } = useSWR(`/api/audit-logs?${params}`, fetcher);
  const logs = data?.data?.logs ?? [];
  const total = data?.data?.total ?? 0;
  const pages = data?.data?.pages ?? 1;

  const entities = ['User', 'Task', 'Department', 'Schedule', 'Equipment', 'Vehicle'];
  const actions = ['CREATE', 'UPDATE', 'DELETE', 'TOGGLE', 'ASSIGN'];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Audit Jurnal</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizimda barcha o'zgarishlar tarixi · Jami {total} ta</p>
      </div>

      <div className="flex gap-3 flex-wrap">
        <select value={entity} onChange={(e) => { setEntity(e.target.value); setPage(1); }} className="select-base w-auto">
          <option value="">Barcha ob'ektlar</option>
          {entities.map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <select value={action} onChange={(e) => { setAction(e.target.value); setPage(1); }} className="select-base w-auto">
          <option value="">Barcha amallar</option>
          {actions.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {!data && Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-14 px-4 animate-pulse flex items-center gap-3"><div className="h-4 w-16 bg-gray-100 dark:bg-slate-700 rounded" /><div className="h-4 flex-1 bg-gray-100 dark:bg-slate-700 rounded" /></div>)}
          {logs.length === 0 && data && <div className="px-4 py-10 text-center"><Shield size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Audit yozuvlari yo'q</p></div>}
          {logs.map((log: any) => (
            <div key={log.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/50 dark:hover:bg-slate-700/30">
              <div className="flex-shrink-0 mt-0.5">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${ACTION_COLORS[log.action] ?? 'bg-gray-100 text-gray-500'}`}>{log.action}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{log.user?.fullName}</span>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500 bg-gray-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">{log.entity}</span>
                </div>
                {log.details && <p className="text-xs text-gray-500 mt-0.5 truncate">{log.details}</p>}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">{format(new Date(log.createdAt), 'dd.MM HH:mm')}</span>
            </div>
          ))}
        </div>
      </div>

      {pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{page}-sahifa / {pages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"><ChevronLeft size={16} /></button>
            <button onClick={() => setPage((p) => Math.min(pages, p + 1))} disabled={page >= pages} className="p-2 rounded-lg border border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40"><ChevronRight size={16} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
