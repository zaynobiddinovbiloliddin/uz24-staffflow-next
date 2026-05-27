'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Search, Edit2, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { format } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_LABELS: Record<string, string> = { PENDING: 'Kutilmoqda', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor qilindi' };
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500', MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600', URGENT: 'bg-red-100 text-red-600',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Past', MEDIUM: 'O\'rta', HIGH: 'Yuqori', URGENT: 'Shoshilinch' };

const EMPTY = { title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '', departmentId: '' };

export default function TasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (search) params.set('search', search);

  const { data, mutate } = useSWR(`/api/tasks?${params}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  const { data: deptsData } = useSWR('/api/departments', fetcher);

  const allTasks = data?.data ?? [];
  const tasks = allTasks;
  const users = usersData?.data ?? [];
  const depts = deptsData?.data ?? [];

  function openCreate() {
    setEditing(null); setForm(EMPTY); setError(''); setModal(true);
  }

  function openEdit(task: any) {
    setEditing(task);
    setForm({
      title: task.title, description: task.description ?? '', priority: task.priority,
      deadline: task.deadline ? task.deadline.slice(0, 16) : '',
      assignedToId: task.assignedToId ?? '', departmentId: task.departmentId ?? '',
    });
    setError(''); setModal(true);
  }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/tasks/${editing.id}` : '/api/tasks';
      const method = editing ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (body.deadline) body.deadline = new Date(body.deadline).toISOString();
      else delete body.deadline;
      if (!body.assignedToId) delete body.assignedToId;
      if (!body.departmentId) delete body.departmentId;

      if (editing) mutate({ ...data, data: allTasks.map((t: any) => t.id === editing.id ? { ...t, ...form } : t) }, false);

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { mutate(); setError(d.message); return; }
      setModal(false); mutate();
    } catch { mutate(); setError('Xato'); } finally { setSaving(false); }
  }

  function handleDelete(id: string, title: string) {
    setConfirmDlg({
      open: true,
      message: `"${title}" vazifasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...data, data: allTasks.filter((t: any) => t.id !== id) }, false);
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) mutate();
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{tasks.length} ta vazifa</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
          <Plus size={16} /> Yangi vazifa
        </button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
          <option value="">Barcha holatlar</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="space-y-3">
        {!data && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse" />
        ))}
        {tasks.map((task: any) => (
          <div key={task.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>{STATUS_LABELS[task.status]}</span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>{PRIORITY_LABELS[task.priority]}</span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mt-1.5 truncate">{task.title}</h3>
                {task.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  {task.assignedTo && <span>👤 {task.assignedTo.fullName}</span>}
                  {task.department && <span>🏢 {task.department.name}</span>}
                  {task.deadline && (
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500' : ''}>
                      <AlertCircle size={12} className="inline mr-0.5" />
                      {format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => openEdit(task)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(task.id, task.title)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmDlg.open}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{editing ? 'Vazifani tahrirlash' : 'Yangi vazifa'}</h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sarlavha *</label>
                <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={3} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Muhimlik</label>
                  <select value={form.priority} onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Muddat</label>
                  <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tayinlash</label>
                <select value={form.assignedToId} onChange={(e) => setForm((f) => ({ ...f, assignedToId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                  <option value="">— Tanlang —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bo'lim</label>
                <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                  <option value="">— Tanlang —</option>
                  {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
