'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Search, Car } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const STATUS_LABELS: Record<string, string> = { AVAILABLE: 'Bo\'sh', IN_USE: 'Ishlatilmoqda', MAINTENANCE: 'Ta\'mirda' };
const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  IN_USE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  MAINTENANCE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};
const EMPTY = { name: '', plateNumber: '', type: '', status: 'AVAILABLE', fuelType: '', mileage: '', notes: '' };

export default function VehiclesPage() {
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
  const { data, mutate } = useSWR(`/api/vehicles?${params}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  const items: any[] = (data?.data ?? []).filter((v: any) => !search || v.name.toLowerCase().includes(search.toLowerCase()) || v.plateNumber.toLowerCase().includes(search.toLowerCase()));
  const users = usersData?.data ?? [];

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true); }
  function openEdit(v: any) { setEditing(v); setForm({ name: v.name, plateNumber: v.plateNumber, type: v.type, status: v.status, fuelType: v.fuelType ?? '', mileage: v.mileage?.toString() ?? '', notes: v.notes ?? '' }); setError(''); setModal(true); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const body = { ...form, mileage: form.mileage ? parseInt(form.mileage) : undefined };
      const url = editing ? `/api/vehicles/${editing.id}` : '/api/vehicles';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); return; }
      setModal(false); mutate();
    } catch { setError('Xato'); } finally { setSaving(false); }
  }

  function handleDelete(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `"${name}" transportini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
        mutate();
      },
    });
  }

  async function handleAssign() {
    await fetch(`/api/vehicles/${assignModal.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ assignedToId: assignUserId || null }) });
    setAssignModal(null); setAssignUserId(''); mutate();
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Transport</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} ta transport</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Yangi</button>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nom yoki raqam..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
          <option value="">Barcha holat</option>
          {Object.entries(STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!data && Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-36 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />)}
        {items.map((item: any) => (
          <div key={item.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 flex items-center justify-center"><Car size={18} /></div>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-xs text-gray-400">{item.plateNumber} · {item.type}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${STATUS_COLORS[item.status]}`}>{STATUS_LABELS[item.status]}</span>
            </div>
            {item.mileage && <p className="text-xs text-gray-400 mb-3">{item.mileage.toLocaleString()} km · {item.fuelType ?? ''}</p>}
            <div className="flex gap-2 pt-3 border-t border-gray-50 dark:border-slate-700">
              <button onClick={() => { setAssignModal(item); setAssignUserId(item.assignedToId ?? ''); }} className="flex-1 py-1.5 rounded-lg bg-gray-50 dark:bg-slate-700 hover:bg-gray-100 dark:hover:bg-slate-600 text-xs font-medium text-gray-600 dark:text-gray-300">Tayinlash</button>
              <button onClick={() => openEdit(item)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(item.id, item.name)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editing ? 'Tahrirlash' : 'Yangi transport'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-3">
              {[{ label: 'Nom *', key: 'name', placeholder: 'Nexia 3' }, { label: 'Davlat raqami *', key: 'plateNumber', placeholder: '01 A 001 AA' }, { label: 'Turi *', key: 'type', placeholder: 'Sedan, Jeep...' }, { label: 'Yoqilg\'i', key: 'fuelType', placeholder: 'Benzin, Gaz' }, { label: 'Probeg (km)', key: 'mileage', placeholder: '50000' }].map(({ label, key, placeholder }) => (
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
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Transport tayinlash</h3>
              <p className="text-sm text-gray-500 mt-0.5">{assignModal.name} — {assignModal.plateNumber}</p>
            </div>
            <div className="px-5 sm:px-6 py-4">
              <select value={assignUserId} onChange={(e) => setAssignUserId(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                <option value="">— Bo'shatish —</option>
                {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
              </select>
            </div>
            <div className="flex gap-3 px-5 sm:px-6 pb-5 sm:pb-6">
              <button onClick={() => setAssignModal(null)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleAssign} className="btn-primary flex-1">Saqlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
