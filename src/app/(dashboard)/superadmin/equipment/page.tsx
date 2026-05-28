'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Search, Camera, Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const STATUS_LABELS: Record<string, string> = { AVAILABLE: 'Bo\'sh', IN_USE: 'Ishlatilmoqda', MAINTENANCE: 'Ta\'mirda', BROKEN: 'Buzilgan' };
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_USE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MAINTENANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  BROKEN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};
const EMPTY = { name: '', type: '', serialNumber: '', status: 'AVAILABLE', condition: '', notes: '' };

export default function EquipmentPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });
  const [assignModal, setAssignModal] = useState<any>(null);
  const [assignUserId, setAssignUserId] = useState('');

  const params = new URLSearchParams();
  if (statusFilter) params.set('status', statusFilter);
  const { data, mutate } = useSWR(`/api/equipment?${params}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  const [busyAssign, setBusyAssign] = useState(false);
  const allItems: any[] = data?.data ?? [];
  const items = allItems.filter((e: any) => !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.type.toLowerCase().includes(search.toLowerCase()));
  const users = usersData?.data ?? [];

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true); }
  function openEdit(e: any) { setEditing(e); setForm({ name: e.name, type: e.type, serialNumber: e.serialNumber ?? '', status: e.status, condition: e.condition ?? '', notes: e.notes ?? '' }); setError(''); setModal(true); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/equipment/${editing.id}` : '/api/equipment';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); return; }
      setModal(false); mutate();
    } catch { setError('Xato'); } finally { setSaving(false); }
  }

  function handleDelete(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `"${name}" uskunasini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...data, data: allItems.filter((e: any) => e.id !== id) }, false);
        const res = await fetch(`/api/equipment/${id}`, { method: 'DELETE' });
        if (!res.ok) mutate();
      },
    });
  }

  async function handleAssign() {
    setBusyAssign(true);
    const assignedUser = users.find((u: any) => u.id === assignUserId);
    const newStatus = assignUserId ? 'IN_USE' : 'AVAILABLE';
    mutate({ ...data, data: allItems.map((e: any) => e.id === assignModal.id ? { ...e, assignedToId: assignUserId || null, assignedTo: assignedUser || null, status: newStatus } : e) }, false);
    setAssignModal(null); setAssignUserId('');
    const res = await fetch(`/api/equipment/${assignModal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedToId: assignUserId || null }) });
    if (!res.ok) mutate();
    setBusyAssign(false);
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Uskunalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} ta uskuna</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Yangi</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Qidirish..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
          <option value="">Barcha holat</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Mobile cards */}
      <div className="sm:hidden space-y-3">
        {!data && Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}
        {items.map((item: any) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center flex-shrink-0">
                <Camera size={16} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{item.type}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full flex-shrink-0 ${STATUS_COLORS[item.status]}`}>
                {STATUS_LABELS[item.status]}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 flex-wrap">
              {item.serialNumber && <span>S/N: {item.serialNumber}</span>}
              {item.assignedTo && <span>👤 {item.assignedTo.fullName}</span>}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => { setAssignModal(item); setAssignUserId(item.assignedToId ?? ''); }}
                className="flex-1 py-2 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-400 text-xs font-medium hover:bg-gray-200 dark:hover:bg-slate-600 transition-colors"
              >
                Tayinlash
              </button>
              <button onClick={() => openEdit(item)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600 transition-colors">
                <Edit2 size={15} />
              </button>
              <button onClick={() => handleDelete(item.id, item.name)} className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Uskuna</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Turi</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Serial</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Holat</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {!data && Array.from({ length: 5 }).map((_, i) => <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>)}
            {items.map((item: any) => (
              <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/30 text-orange-600 flex items-center justify-center"><Camera size={14} /></div>
                    <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{item.type}</td>
                <td className="px-4 py-3 text-gray-400 text-xs hidden lg:table-cell">{item.serialNumber ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => { setAssignModal(item); setAssignUserId(item.assignedToId ?? ''); }} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-green-600 text-xs font-medium px-2">Tayinlash</button>
                    <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                    <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmDlg.open}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editing ? 'Tahrirlash' : 'Yangi uskuna'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-3">
              {[{ label: 'Nom *', key: 'name', placeholder: 'Kamera nomi' }, { label: 'Turi *', key: 'type', placeholder: 'Kamera, Mikrofon...' }, { label: 'Serial raqam', key: 'serialNumber', placeholder: 'SN-001' }, { label: 'Holati', key: 'condition', placeholder: 'Yaxshi' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Holat</label>
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                  {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Izoh</label>
                <textarea value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} rows={2} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none resize-none" />
              </div>
              {error && <p className="text-sm text-red-500">{error}</p>}
            </div>
            <div className="flex gap-3 px-5 sm:px-6 pb-5 sm:pb-6 pt-3 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}

      {assignModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Uskuna tayinlash</h3>
              <p className="text-sm text-gray-500 mt-0.5">{assignModal.name}</p>
            </div>
            <div className="px-5 sm:px-6 py-4">
              <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Bo'shatish —</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div className="flex gap-3 px-5 sm:px-6 pb-5 sm:pb-6">
              <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleAssign} disabled={busyAssign} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {busyAssign && <Loader2 size={14} className="animate-spin" />}
                Saqlash
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
