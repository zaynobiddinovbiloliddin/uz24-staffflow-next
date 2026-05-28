'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Search, Plus, Edit2, Trash2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor qilindi',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED: 'bg-gray-100 text-gray-500',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori', URGENT: 'Shoshilinch' };
const PRIORITY_COLORS: Record<string, string> = { LOW: 'text-gray-400', MEDIUM: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-500' };
const EMPTY_FORM = { title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '', status: 'PENDING' };
const TABS = [
  { value: '',            label: 'Barchasi',       icon: '📋' },
  { value: 'PENDING',     label: 'Kutilmoqda',     icon: '🕐' },
  { value: 'IN_PROGRESS', label: 'Jarayonda',      icon: '⚡' },
  { value: 'COMPLETED',   label: 'Bajarildi',      icon: '✅' },
  { value: 'CANCELLED',   label: 'Bekor qilindi',  icon: '❌' },
];

export default function AdminTasksPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; id: string }>({ open: false, id: '' });

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (search) params.set('search', search);
  const { data, mutate } = useSWR(`/api/tasks?${params}`, undefined);
  const { data: usersData } = useSWR('/api/users?role=EMPLOYEE', undefined);
  const tasks: any[] = data?.data ?? [];
  const employees: any[] = usersData?.data ?? [];

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setError('');
    setModal(true);
  }
  function openEdit(t: any) {
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? '',
      priority: t.priority,
      deadline: t.deadline ? format(new Date(t.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      assignedToId: t.assignedToId ?? '',
      status: t.status,
    });
    setError('');
    setModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Sarlavha majburiy"); return; }
    setSaving(true); setError('');
    try {
      const body: any = {
        title: form.title.trim(),
        description: form.description || undefined,
        priority: form.priority,
        assignedToId: form.assignedToId || undefined,
        deadline: form.deadline ? new Date(form.deadline).toISOString() : undefined,
      };
      if (editing) body.status = form.status;

      const url = editing ? `/api/tasks/${editing.id}` : '/api/tasks';
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await res.json();
      if (!res.ok) { setError(d.message ?? 'Xato'); return; }
      toast.success(editing ? 'Vazifa yangilandi' : 'Yangi vazifa yaratildi');
      setModal(false);
      mutate();
    } catch { setError('Xato yuz berdi'); } finally { setSaving(false); }
  }

  async function handleDelete() {
    const id = confirmDlg.id;
    setConfirmDlg({ open: false, id: '' });
    const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      toast.success("Vazifa o'chirildi");
      mutate();
    } else {
      toast.error("O'chirishda xato");
    }
  }

  return (
    <div className="space-y-5 page-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Bo'lim vazifalari — {tasks.length} ta</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Yangi vazifa
        </button>
      </div>

      {/* Status tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
              statusFilter === value
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
            }`}
          >
            <span>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Vazifa qidirish..."
          className="input-base pl-9"
        />
      </div>

      <div className="space-y-3">
        {!data && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}
        {tasks.length === 0 && data && (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
            <p>Vazifalar topilmadi</p>
          </div>
        )}
        {tasks.map((task: any) => (
          <div key={task.id} className="list-row bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{task.title}</h3>
                {task.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>}
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                  {task.assignedTo && <span>👤 {task.assignedTo.fullName}</span>}
                  {task.deadline && (
                    <span className={new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' ? 'text-red-500 font-medium' : ''}>
                      <AlertCircle size={11} className="inline mr-0.5" />
                      {format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => setConfirmDlg({ open: true, id: task.id })}
                  className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmDlg.open}
        message="Vazifani o'chirishni tasdiqlaysizmi?"
        onConfirm={handleDelete}
        onCancel={() => setConfirmDlg({ open: false, id: '' })}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editing ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
              </h3>
              <button
                onClick={() => setModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400"
              >✕</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sarlavha *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm((f: any) => ({ ...f, title: e.target.value }))}
                  placeholder="Vazifa nomi"
                  className="input-base"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tavsif</label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f: any) => ({ ...f, description: e.target.value }))}
                  placeholder="Vazifa haqida qisqa tavsif..."
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Muhimlik</label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm((f: any) => ({ ...f, priority: e.target.value }))}
                    className="select-base"
                  >
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Muddat</label>
                  <input
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) => setForm((f: any) => ({ ...f, deadline: e.target.value }))}
                    className="input-base"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Xodim</label>
                <select
                  value={form.assignedToId}
                  onChange={(e) => setForm((f: any) => ({ ...f, assignedToId: e.target.value }))}
                  className="select-base"
                >
                  <option value="">— Tayinlanmagan —</option>
                  {employees.map((u: any) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>
              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Holat</label>
                  <select
                    value={form.status}
                    onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))}
                    className="select-base"
                  >
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )}
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                ) : editing ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
