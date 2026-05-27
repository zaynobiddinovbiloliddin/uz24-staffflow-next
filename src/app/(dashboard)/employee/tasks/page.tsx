'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { ClipboardList, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STATUS_LABELS: Record<string, string> = { PENDING: 'Kutilmoqda', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor' };
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-500',
};
const PRIORITY_COLORS: Record<string, string> = { LOW: 'text-gray-400', MEDIUM: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-500' };
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Past', MEDIUM: 'O\'rta', HIGH: 'Yuqori', URGENT: 'Shoshilinch' };

export default function EmployeeTasksPage() {
  const [statusFilter, setStatusFilter] = useState('');
  const [updateModal, setUpdateModal] = useState<any>(null);
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  const { data, mutate } = useSWR(`/api/tasks?${params}`, fetcher);
  const tasks: any[] = data?.data ?? [];

  const counts = {
    all: tasks.length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
  };

  async function handleUpdate() {
    if (!newStatus || !updateModal) return;
    setSaving(true);
    await fetch(`/api/tasks/${updateModal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    setSaving(false); setUpdateModal(null); mutate();
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mening vazifalarim</h1>
        <p className="text-sm text-gray-500 mt-0.5">Jami {counts.all} ta vazifa</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[{ label: 'Kutilmoqda', count: counts.pending, color: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-900/20' },
          { label: 'Jarayonda', count: counts.inProgress, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
          { label: 'Bajarildi', count: counts.completed, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' }].map((stat) => (
          <div key={stat.label} className={`${stat.bg} rounded-xl p-4 text-center`}>
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-2 flex-wrap">
        {[{ value: '', label: 'Barchasi' }, ...Object.entries(STATUS_LABELS).map(([v, l]) => ({ value: v, label: l }))].map(({ value, label }) => (
          <button key={value} onClick={() => setStatusFilter(value)} className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${statusFilter === value ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'}`}>{label}</button>
        ))}
      </div>

      <div className="space-y-3">
        {!data && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />)}
        {tasks.length === 0 && data && (
          <div className="text-center py-12 text-gray-400"><ClipboardList size={40} className="mx-auto mb-3 opacity-30" /><p>Vazifalar yo'q</p></div>
        )}
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                  <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {task.department && <span>🏢 {task.department.name}</span>}
                  {task.deadline && (
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500 font-medium' : ''}>
                      <AlertCircle size={11} className="inline mr-0.5" />{format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <button onClick={() => { setUpdateModal(task); setNewStatus(task.status); }} className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100">
                  Yangilash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{updateModal.title}</h3>
            <p className="text-sm text-gray-500 mb-4">Vazifa holatini yangilang</p>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none mb-4">
              {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <div className="flex gap-3">
              <button onClick={() => setUpdateModal(null)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600">Bekor</button>
              <button onClick={handleUpdate} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
