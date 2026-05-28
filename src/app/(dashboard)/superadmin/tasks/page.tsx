'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Plus, Search, Edit2, Trash2, AlertCircle, Loader2, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Kutilmoqda', IN_PROGRESS: 'Jarayonda', COMPLETED: 'Bajarildi', CANCELLED: 'Bekor qilingan',
};
const STATUS_COLORS: Record<string, string> = {
  PENDING:    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  IN_PROGRESS:'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  COMPLETED:  'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  CANCELLED:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};
const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-gray-100 text-gray-500', MEDIUM: 'bg-blue-100 text-blue-600',
  HIGH: 'bg-orange-100 text-orange-600', URGENT: 'bg-red-100 text-red-600',
};
const PRIORITY_LABELS: Record<string, string> = { LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori', URGENT: 'Shoshilinch' };

const TABS = [
  { value: '',           label: 'Barchasi',        icon: '📋' },
  { value: 'PENDING',    label: 'Kutilmoqda',       icon: '🕐' },
  { value: 'IN_PROGRESS',label: 'Jarayonda',        icon: '⚡' },
  { value: 'COMPLETED',  label: 'Bajarildi',        icon: '✅' },
  { value: 'CANCELLED',  label: 'Bekor qilingan',   icon: '❌' },
];

const EMPTY = { title: '', description: '', priority: 'MEDIUM', deadline: '', assignedToId: '', departmentId: '', status: 'PENDING' };

function TasksContent() {
  const searchParams = useSearchParams();
  const router       = useRouter();

  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') ?? '');
  const [search,   setSearch]   = useState('');
  const [modal,    setModal]    = useState(false);
  const [editing,  setEditing]  = useState<any>(null);
  const [form,     setForm]     = useState<any>(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>(
    { open: false, message: '', onConfirm: () => {} }
  );

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  if (search)       params.set('search', search);

  const { data, mutate }      = useSWR(`/api/tasks?${params}`, undefined);
  const { data: usersData }   = useSWR('/api/users', undefined);
  const { data: deptsData }   = useSWR('/api/departments', undefined);

  const allTasks = data?.data ?? [];
  const users    = usersData?.data ?? [];
  const depts    = deptsData?.data ?? [];

  function handleTabClick(value: string) {
    setStatusFilter(value);
    const url = value ? `/superadmin/tasks?status=${value}` : '/superadmin/tasks';
    router.replace(url, { scroll: false });
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY); setError(''); setModal(true);
  }
  function openEdit(task: any) {
    setEditing(task);
    setForm({
      title: task.title, description: task.description ?? '', priority: task.priority,
      deadline: task.deadline ? format(new Date(task.deadline), "yyyy-MM-dd'T'HH:mm") : '',
      assignedToId: task.assignedToId ?? '', departmentId: task.departmentId ?? '',
      status: task.status,
    });
    setError(''); setModal(true);
  }

  async function handleSave() {
    if (!form.title.trim()) { setError("Sarlavha kiritilmadi"); return; }
    setSaving(true); setError('');
    try {
      const url    = editing ? `/api/tasks/${editing.id}` : '/api/tasks';
      const method = editing ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (body.deadline) body.deadline = new Date(body.deadline).toISOString();
      else delete body.deadline;
      if (!body.assignedToId) delete body.assignedToId;
      if (!body.departmentId) delete body.departmentId;
      if (!editing)           delete body.status;

      if (editing) mutate({ ...data, data: allTasks.map((t: any) => t.id === editing.id ? { ...t, ...form } : t) }, false);

      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d   = await res.json();
      if (!res.ok) { mutate(); setError(d.message); toast.error(d.message); return; }
      setModal(false); mutate();
      toast.success(editing ? 'Vazifa yangilandi' : "Yangi vazifa qo'shildi");
    } catch { mutate(); setError('Xato'); toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  function handleDelete(id: string, title: string) {
    setConfirmDlg({
      open: true,
      message: `"${title}" vazifasini o'chirishni tasdiqlaysizmi?`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...data, data: allTasks.filter((t: any) => t.id !== id) }, false);
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (!res.ok) { mutate(); toast.error("O'chirishda xato"); }
        else         { toast.success(`"${title}" o'chirildi`); }
      },
    });
  }

  return (
    <div className="space-y-5 page-content">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Vazifalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{allTasks.length} ta vazifa</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> Yangi vazifa
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ value, label, icon }) => (
          <button
            key={value}
            onClick={() => handleTabClick(value)}
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

      {/* List */}
      <div className="space-y-3">
        {!data && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}

        {allTasks.length === 0 && data && (
          <div className="text-center py-12 text-gray-400">
            <AlertCircle size={36} className="mx-auto mb-3 opacity-30" />
            <p>Vazifalar topilmadi</p>
          </div>
        )}

        {allTasks.map((task: any) => (
          <div
            key={task.id}
            className={`list-row bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow ${
              task.status === 'CANCELLED' ? 'opacity-80' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <h3 className={`font-semibold text-gray-900 dark:text-white truncate ${task.status === 'CANCELLED' ? 'line-through text-gray-400' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{task.description}</p>
                )}

                {/* Cancel reason */}
                {task.status === 'CANCELLED' && task.cancelReason && (
                  <div className="mt-2 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                    <XCircle size={13} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-semibold">Bekor qilish sababi:</span> {task.cancelReason}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                  {task.assignedTo && <span>👤 {task.assignedTo.fullName}</span>}
                  {task.department && <span>🏢 {task.department.name}</span>}
                  {task.deadline && (
                    <span className={new Date(task.deadline) < new Date() && !['COMPLETED','CANCELLED'].includes(task.status) ? 'text-red-500 font-medium' : ''}>
                      <AlertCircle size={12} className="inline mr-0.5" />
                      {format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button
                  onClick={() => openEdit(task)}
                  className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={() => handleDelete(task.id, task.title)}
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
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {/* Create/Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92vh] overflow-hidden modal-enter">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Vazifani tahrirlash' : 'Yangi vazifa'}
              </h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sarlavha *</label>
                <input
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
                  rows={3}
                  className="input-base resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Muhimlik</label>
                  <select value={form.priority} onChange={(e) => setForm((f: any) => ({ ...f, priority: e.target.value }))} className="select-base">
                    {Object.entries(PRIORITY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Muddat</label>
                  <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((f: any) => ({ ...f, deadline: e.target.value }))} className="input-base" />
                </div>
              </div>
              {editing && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Holat</label>
                  <select value={form.status} onChange={(e) => setForm((f: any) => ({ ...f, status: e.target.value }))} className="select-base">
                    {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Xodim</label>
                <select value={form.assignedToId} onChange={(e) => setForm((f: any) => ({ ...f, assignedToId: e.target.value }))} className="select-base">
                  <option value="">— Tayinlanmagan —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Bo'lim</label>
                <select value={form.departmentId} onChange={(e) => setForm((f: any) => ({ ...f, departmentId: e.target.value }))} className="select-base">
                  <option value="">— Tanlang —</option>
                  {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              {error && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-xl px-4 py-3">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex gap-3 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <><Loader2 size={14} className="animate-spin" /> Saqlanmoqda...</> : editing ? 'Saqlash' : "Qo'shish"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TasksPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{Array.from({length:4}).map((_,i)=><div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-xl border animate-pulse"/>)}</div>}>
      <TasksContent />
    </Suspense>
  );
}
