'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Edit2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STATUS_LABELS: Record<string, string> = { PENDING: 'Kutilmoqda', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor' };
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700', IN_PROGRESS: 'bg-blue-100 text-blue-700',
  COMPLETED: 'bg-green-100 text-green-700', CANCELLED: 'bg-gray-100 text-gray-500',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Past', MEDIUM: 'O\'rta', HIGH: 'Yuqori', URGENT: 'Shoshilinch' };

export default function AdminTasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editModal, setEditModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (search) params.set('search', search);
  const { data, mutate } = useSWR(`/api/tasks?${params}`, fetcher);
  const tasks: any[] = data?.data ?? [];

  async function handleUpdateStatus() {
    if (!newStatus || !editModal) return;
    setSaving(true);
    await fetch(`/api/tasks/${editModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setSaving(false); setEditModal(null); mutate();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bo'lim vazifalari — {tasks.length} ta</p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
          <option value="">Barchasi</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {!data && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />)}
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                  <span className="text-xs text-gray-400">{PRIORITY_LABELS[task.priority]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {task.assignedTo && <span>👤 {task.assignedTo.fullName}</span>}
                  {task.deadline && (
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500' : ''}>
                      <AlertCircle size={11} className="inline mr-0.5" />{format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <button onClick={() => { setEditModal(task); setNewStatus(task.status); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 flex-shrink-0"><Edit2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{editModal.title}</h3>
            <p className="text-sm text-gray-500 mb-4">Holatni o'zgartirish</p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none mb-4">
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setEditModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600">Bekor</button>
              <button onClick={handleUpdateStatus} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
