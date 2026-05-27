'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Users, ClipboardList, Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

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

  const { data, mutate } = useSWR('/api/departments', fetcher);
  const allDepts = data?.data ?? [];
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
      if (!res.ok) { mutate(); setError(d.message); return; }
      setModal(false); mutate();
    } catch { mutate(); setError('Xato yuz berdi'); } finally { setSaving(false); }
  }

  function handleDelete(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `"${name}" bo'limini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...data, data: allDepts.filter((d: any) => d.id !== id) }, false);
        const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
        if (!res.ok) mutate();
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
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <Users size={14} />
                <span>{dept._count?.users ?? 0} xodim</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm text-gray-500">
                <ClipboardList size={14} />
                <span>{dept._count?.tasks ?? 0} vazifa</span>
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
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              {editing ? 'Bo\'limni tahrirlash' : 'Yangi bo\'lim'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Nom *</label>
                <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Bo'lim nomi" className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tavsif</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">Rang</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button key={c} onClick={() => setForm((f) => ({ ...f, color: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-transform ${form.color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-400">Bekor</button>
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
