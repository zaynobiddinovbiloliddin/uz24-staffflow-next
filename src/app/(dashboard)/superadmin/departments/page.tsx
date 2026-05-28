'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Users, ClipboardList, Loader2, X, ArrowRightLeft, CheckCircle2, Clock, AlertCircle, Circle } from 'lucide-react';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#84cc16'];
const EMPTY = { name: '', description: '', color: '#3b82f6' };

export default function DepartmentsPage() {
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [empDrawer, setEmpDrawer] = useState<{ open: boolean; dept: any }>({ open: false, dept: null });
  const [taskDrawer, setTaskDrawer] = useState<{ open: boolean; dept: any }>({ open: false, dept: null });
  const [movingId, setMovingId] = useState<string | null>(null);

  const { data, mutate } = useSWR('/api/departments', fetcher);
  const { data: usersData, mutate: mutateUsers } = useSWR('/api/users', fetcher);
  const taskDeptId = taskDrawer.open && taskDrawer.dept ? taskDrawer.dept.id : null;
  const { data: deptTasksData } = useSWR(taskDeptId ? `/api/tasks?departmentId=${taskDeptId}` : null, fetcher);
  const allDepts = data?.data ?? [];
  const allUsers: any[] = usersData?.data ?? [];
  const depts = allDepts;

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true); }
  function openEdit(d: any) {
    setEditing(d);
    setForm({ name: d.name, description: d.description ?? '', color: d.color });
    setError(''); setModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) { setError("Nom kiritilmadi"); return; }
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/departments/${editing.id}` : '/api/departments';
      const method = editing ? 'PUT' : 'POST';
      if (editing) mutate({ ...data, data: allDepts.map((d: any) => d.id === editing.id ? { ...d, ...form } : d) }, false);
      const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { mutate(); setError(d.message); toast.error(d.message); return; }
      setModal(false); mutate();
      toast.success(editing ? "Bo'lim yangilandi" : "Yangi bo'lim qo'shildi");
    } catch { mutate(); setError('Xato yuz berdi'); toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  async function handleChangeDept(userId: string, newDeptId: string, userName: string) {
    setMovingId(userId);
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'changeDept', departmentId: newDeptId || null }),
      });
      if (res.ok) {
        toast.success(`${userName} boshqa bo'limga o'tkazildi`);
        mutateUsers();
        mutate();
      } else {
        toast.error("O'tkazishda xato yuz berdi");
      }
    } catch { toast.error('Xato'); } finally { setMovingId(null); }
  }

  function handleDelete(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `"${name}" bo'limini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...data, data: allDepts.filter((d: any) => d.id !== id) }, false);
        const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (!res.ok) { mutate(); toast.error("O'chirishda xato"); }
        else { toast.success(`"${name}" bo'limi o'chirildi`); }
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Bo'limlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{depts.length} ta bo'lim</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yangi bo'lim
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!data && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse" />
        ))}
        {depts.map((dept: any) => (
          <div key={dept.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-lg" style={{ backgroundColor: dept.color }}>
                  {dept.name[0]}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{dept.name}</h3>
                  {dept.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{dept.description}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(dept)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                <button onClick={() => handleDelete(dept.id, dept.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
            <div className="flex gap-4 pt-3 border-t border-gray-50 dark:border-slate-700">
              <button
                onClick={() => setEmpDrawer({ open: true, dept })}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <Users size={14} />
                <span className="underline underline-offset-2 decoration-dashed">{dept._count?.users ?? 0} xodim</span>
              </button>
              <button
                onClick={() => setTaskDrawer({ open: true, dept })}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-blue-600 transition-colors"
              >
                <ClipboardList size={14} />
                <span className="underline underline-offset-2 decoration-dashed">{dept._count?.tasks ?? 0} vazifa</span>
              </button>
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

      {/* Employees drawer */}
      {empDrawer.open && empDrawer.dept && (() => {
        const deptEmployees = allUsers.filter((u: any) => u.departmentId === empDrawer.dept.id);
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[85vh] overflow-hidden modal-enter">
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: empDrawer.dept.color }}>
                    {empDrawer.dept.name[0]}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{empDrawer.dept.name}</h3>
                    <p className="text-xs text-gray-400">{deptEmployees.length} ta xodim</p>
                  </div>
                </div>
                <button onClick={() => setEmpDrawer({ open: false, dept: null })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4">
                {deptEmployees.length === 0 ? (
                  <div className="text-center py-10">
                    <Users size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-gray-400">Bu bo'limda xodimlar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {deptEmployees.map((u: any) => (
                      <div key={u.id} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-semibold flex items-center justify-center flex-shrink-0">
                          {u.fullName?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.fullName}</p>
                          <p className="text-xs text-gray-400">{u.position ?? u.role}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <ArrowRightLeft size={13} className="text-gray-300 dark:text-slate-500" />
                          <select
                            value={u.departmentId ?? ''}
                            disabled={movingId === u.id}
                            onChange={(e) => handleChangeDept(u.id, e.target.value, u.fullName)}
                            className="text-xs border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-700 dark:text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-500 max-w-[130px]"
                          >
                            <option value="">— Bo'limsiz —</option>
                            {depts.map((d: any) => (
                              <option key={d.id} value={d.id}>{d.name}</option>
                            ))}
                          </select>
                          {movingId === u.id && <Loader2 size={13} className="animate-spin text-blue-500" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                <button onClick={() => setEmpDrawer({ open: false, dept: null })} className="btn-secondary w-full">Yopish</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tasks drawer */}
      {taskDrawer.open && taskDrawer.dept && (() => {
        const TASK_STATUS: Record<string, { label: string; color: string; icon: any }> = {
          TODO:        { label: 'Bajarilmagan', color: 'text-gray-500',  icon: Circle },
          IN_PROGRESS: { label: 'Jarayonda',    color: 'text-blue-500',  icon: Clock },
          DONE:        { label: 'Bajarildi',    color: 'text-green-500', icon: CheckCircle2 },
          CANCELLED:   { label: 'Bekor qilindi', color: 'text-red-400',  icon: AlertCircle },
        };
        const PRIORITY_COLOR: Record<string, string> = {
          LOW: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-400',
          MEDIUM: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
          HIGH: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
          URGENT: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
        };
        const tasks: any[] = deptTasksData?.data ?? [];
        const loading = !deptTasksData;
        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
            <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[85vh] overflow-hidden modal-enter">
              <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: taskDrawer.dept.color }}>
                    <ClipboardList size={14} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white">{taskDrawer.dept.name}</h3>
                    <p className="text-xs text-gray-400">{loading ? '...' : `${tasks.length} ta vazifa`}</p>
                  </div>
                </div>
                <button onClick={() => setTaskDrawer({ open: false, dept: null })} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4">
                {loading ? (
                  <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div key={i} className="h-16 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : tasks.length === 0 ? (
                  <div className="text-center py-10">
                    <ClipboardList size={32} className="mx-auto text-gray-300 dark:text-slate-600 mb-2" />
                    <p className="text-sm text-gray-400">Bu bo'limda vazifalar yo'q</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {tasks.map((t: any) => {
                      const st = TASK_STATUS[t.status] ?? TASK_STATUS.TODO;
                      const Icon = st.icon;
                      return (
                        <div key={t.id} className="p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                          <div className="flex items-start gap-2">
                            <Icon size={15} className={`${st.color} flex-shrink-0 mt-0.5`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white leading-snug">{t.title}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${PRIORITY_COLOR[t.priority] ?? PRIORITY_COLOR.MEDIUM}`}>
                                  {t.priority}
                                </span>
                                {t.assignedTo?.fullName && (
                                  <span className="text-xs text-gray-400">→ {t.assignedTo.fullName}</span>
                                )}
                                {t.deadline && (
                                  <span className="text-xs text-gray-400">
                                    {new Date(t.deadline).toLocaleDateString('uz-Latn-UZ')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="px-5 sm:px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
                <button onClick={() => setTaskDrawer({ open: false, dept: null })} className="btn-secondary w-full">Yopish</button>
              </div>
            </div>
          </div>
        );
      })()}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">
                {editing ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim'}
              </h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Nom *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Bo'lim nomi" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="input-base resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Rang</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 sm:px-6 pb-5 sm:pb-6 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
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
