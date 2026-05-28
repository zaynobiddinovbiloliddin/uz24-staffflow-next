'use client';

import { useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import { ClipboardList, AlertCircle, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

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
  LOW: 'text-gray-400', MEDIUM: 'text-blue-500', HIGH: 'text-orange-500', URGENT: 'text-red-500',
};
const PRIORITY_LABELS: Record<string, string> = {
  LOW: 'Past', MEDIUM: "O'rta", HIGH: 'Yuqori', URGENT: 'Shoshilinch',
};

const TABS = [
  { value: '',          label: 'Barchasi',       icon: '📋' },
  { value: 'PENDING',   label: 'Kutilmoqda',      icon: '🕐' },
  { value: 'IN_PROGRESS', label: 'Jarayonda',     icon: '⚡' },
  { value: 'COMPLETED', label: 'Bajarildi',        icon: '✅' },
  { value: 'CANCELLED', label: 'Bekor qilingan',  icon: '❌' },
];

function TasksContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialStatus = searchParams.get('status') ?? '';
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [updateModal, setUpdateModal]   = useState<any>(null);
  const [newStatus,   setNewStatus]     = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [saving,       setSaving]       = useState(false);

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  const { data, mutate } = useSWR(`/api/tasks?${params}`, undefined);
  const tasks: any[] = data?.data ?? [];

  const counts = {
    all:       (data?.data ?? []).length,
    pending:   tasks.filter((t: any) => t.status === 'PENDING').length,
    inProgress:tasks.filter((t: any) => t.status === 'IN_PROGRESS').length,
    completed: tasks.filter((t: any) => t.status === 'COMPLETED').length,
    cancelled: tasks.filter((t: any) => t.status === 'CANCELLED').length,
  };

  function handleTabClick(value: string) {
    setStatusFilter(value);
    const url = value ? `/employee/tasks?status=${value}` : '/employee/tasks';
    router.replace(url, { scroll: false });
  }

  async function handleUpdate() {
    if (!newStatus || !updateModal) return;
    if (newStatus === 'CANCELLED' && !cancelReason.trim()) {
      toast.error('Bekor qilish sababini kiriting');
      return;
    }
    setSaving(true);
    try {
      const body: any = { status: newStatus };
      if (newStatus === 'CANCELLED') body.cancelReason = cancelReason.trim();

      const res = await fetch(`/api/tasks/${updateModal.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const labels: Record<string, string> = {
          IN_PROGRESS: 'Vazifa olindi ✅',
          COMPLETED:   'Vazifa bajarildi 🎉',
          CANCELLED:   'Vazifa bekor qilindi',
        };
        toast.success(labels[newStatus] ?? 'Holat yangilandi');
        setUpdateModal(null);
        setCancelReason('');
        mutate();
      } else {
        toast.error('Yangilashda xato');
      }
    } catch { toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  return (
    <div className="space-y-5 page-content">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mening vazifalarim</h1>
        <p className="text-sm text-gray-500 mt-0.5">Jami {tasks.length} ta vazifa</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {TABS.map(({ value, label, icon }) => {
          const isActive = statusFilter === value;
          return (
            <button
              key={value}
              onClick={() => handleTabClick(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-slate-600'
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* Task list */}
      <div className="space-y-3">
        {!data && Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}

        {tasks.length === 0 && data && (
          <div className="text-center py-12 text-gray-400">
            <ClipboardList size={40} className="mx-auto mb-3 opacity-30" />
            <p>Vazifalar yo'q</p>
          </div>
        )}

        {tasks.map((task: any) => (
          <div
            key={task.id}
            className={`list-row bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 ${
              task.status === 'CANCELLED' ? 'opacity-80' : ''
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[task.status]}`}>
                    {STATUS_LABELS[task.status]}
                  </span>
                  <span className={`text-xs font-semibold ${PRIORITY_COLORS[task.priority]}`}>
                    {PRIORITY_LABELS[task.priority]}
                  </span>
                </div>
                <h3 className={`font-semibold text-gray-900 dark:text-white ${task.status === 'CANCELLED' ? 'line-through text-gray-400 dark:text-gray-500' : ''}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-sm text-gray-500 mt-0.5">{task.description}</p>
                )}

                {/* Cancel reason */}
                {task.status === 'CANCELLED' && task.cancelReason && (
                  <div className="mt-2 flex items-start gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg px-3 py-2">
                    <XCircle size={14} className="text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-600 dark:text-red-400">
                      <span className="font-semibold">Sabab:</span> {task.cancelReason}
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 flex-wrap">
                  {task.department && <span>🏢 {task.department.name}</span>}
                  {task.deadline && (
                    <span className={
                      new Date(task.deadline) < new Date() && task.status !== 'COMPLETED' && task.status !== 'CANCELLED'
                        ? 'text-red-500 font-medium' : ''
                    }>
                      <AlertCircle size={11} className="inline mr-0.5" />
                      {format(new Date(task.deadline), 'dd.MM.yyyy')}
                    </span>
                  )}
                </div>
              </div>

              {task.status !== 'COMPLETED' && task.status !== 'CANCELLED' && (
                <button
                  onClick={() => { setUpdateModal(task); setNewStatus(task.status); setCancelReason(''); }}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                >
                  Yangilash
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Update modal */}
      {updateModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{updateModal.title}</h3>
              <p className="text-sm text-gray-500 mt-0.5">Vazifa holatini yangilang</p>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-3 overscroll-contain">
              <select
                value={newStatus}
                onChange={(e) => { setNewStatus(e.target.value); if (e.target.value !== 'CANCELLED') setCancelReason(''); }}
                className="select-base"
              >
                {Object.entries(STATUS_LABELS).map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>

              {/* Cancel reason — only when CANCELLED is selected */}
              {newStatus === 'CANCELLED' && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Bekor qilish sababi <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    placeholder="Nima sababdan bekor qilinyapti..."
                    rows={3}
                    maxLength={500}
                    className="input-base resize-none"
                  />
                  <p className="text-xs text-gray-400 mt-1 text-right">{cancelReason.length}/500</p>
                </div>
              )}
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3 flex-shrink-0">
              <button onClick={() => setUpdateModal(null)} className="btn-secondary flex-1">Bekor</button>
              <button
                onClick={handleUpdate}
                disabled={saving}
                className={`flex-1 btn-primary ${newStatus === 'CANCELLED' ? 'bg-red-600 hover:bg-red-700' : ''}`}
              >
                {saving ? (
                  <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                ) : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EmployeeTasksPage() {
  return (
    <Suspense fallback={<div className="space-y-4">{Array.from({length:3}).map((_,i)=><div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse"/>)}</div>}>
      <TasksContent />
    </Suspense>
  );
}
