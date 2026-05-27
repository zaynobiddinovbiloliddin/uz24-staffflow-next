'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Edit2, Trash2, Clock } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { format, startOfWeek, addDays } from 'date-fns';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const SHIFTS = ['Kunduzgi', 'Kechki', 'Tungi', 'Qisqartirilgan'];
const EMPTY = { userId: '', date: '', startTime: '09:00', endTime: '18:00', shiftType: 'Kunduzgi', note: '' };
const DAY_NAMES = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];

export default function AdminSchedulesPage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');
  const { data, mutate } = useSWR(`/api/schedules?from=${from}&to=${to}`, fetcher);
  const { data: usersData } = useSWR('/api/users?role=EMPLOYEE', fetcher);
  const schedules: any[] = data?.data ?? [];
  const users = usersData?.data ?? [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function openCreate(date?: Date) { setEditing(null); setForm({ ...EMPTY, date: date ? format(date, 'yyyy-MM-dd') : '' }); setError(''); setModal(true); }
  function openEdit(s: any) { setEditing(s); setForm({ userId: s.userId, date: format(new Date(s.date), 'yyyy-MM-dd'), startTime: s.startTime, endTime: s.endTime, shiftType: s.shiftType, note: s.note ?? '' }); setError(''); setModal(true); }

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/schedules/${editing.id}` : '/api/schedules';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); return; }
      setModal(false); mutate();
    } catch { setError('Xato'); } finally { setSaving(false); }
  }

  function handleDelete(id: string) {
    setConfirmDlg({
      open: true,
      message: "Ish jadvalini o'chirmoqchimisiz?",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
        mutate();
      },
    });
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ish jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5">{from} — {to}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">← Oldingi</button>
          <button onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Bugun</button>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Keyingi →</button>
          <button onClick={() => openCreate()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Qo'shish</button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, idx) => {
          const dayKey = format(day, 'yyyy-MM-dd');
          const daySched = schedules.filter((s) => format(new Date(s.date), 'yyyy-MM-dd') === dayKey);
          const isToday = dayKey === format(today, 'yyyy-MM-dd');
          return (
            <div key={dayKey} className="min-h-[100px]">
              <div className={`text-center py-2 rounded-lg text-xs font-semibold mb-1 ${isToday ? 'bg-blue-600 text-white' : 'bg-gray-50 dark:bg-slate-800 text-gray-600 dark:text-gray-400'}`}>
                <div>{DAY_NAMES[idx]}</div>
                <div className="text-base font-bold">{format(day, 'd')}</div>
              </div>
              <div className="space-y-1">
                {daySched.map((s: any) => (
                  <div key={s.id} className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded p-1.5 text-xs">
                    <p className="font-medium text-blue-700 dark:text-blue-300 truncate">{s.user?.fullName}</p>
                    <p className="text-blue-500">{s.startTime}–{s.endTime}</p>
                    <div className="flex gap-1 mt-0.5">
                      <button onClick={() => openEdit(s)} className="text-blue-400 hover:text-blue-600"><Edit2 size={10} /></button>
                      <button onClick={() => handleDelete(s.id)} className="text-red-400 hover:text-red-600"><Trash2 size={10} /></button>
                    </div>
                  </div>
                ))}
                <button onClick={() => openCreate(day)} className="w-full py-1 rounded border border-dashed border-gray-200 dark:border-slate-700 text-gray-300 hover:border-blue-300 hover:text-blue-400 transition-colors">
                  <Plus size={11} className="mx-auto" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 divide-y divide-gray-50 dark:divide-slate-700/50 overflow-hidden">
        {schedules.length === 0 && data && <p className="px-4 py-8 text-center text-sm text-gray-400">Bu hafta jadval yo'q</p>}
        {schedules.map((s: any) => (
          <div key={s.id} className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 text-sm font-semibold flex items-center justify-center">{s.user?.fullName?.[0]}</div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{s.user?.fullName}</p>
                <p className="text-xs text-gray-400">{format(new Date(s.date), 'dd.MM.yyyy')} — {s.shiftType}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-sm text-gray-500 hidden sm:flex"><Clock size={13} />{s.startTime}–{s.endTime}</div>
              <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
              <button onClick={() => handleDelete(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
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
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">{editing ? 'Jadval tahrirlash' : 'Yangi jadval'}</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Xodim *</label>
                <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Tanlang —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Sana *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Boshlanish</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Tugash</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Smena turi</label>
                <select value={form.shiftType} onChange={(e) => setForm((f) => ({ ...f, shiftType: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                  {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm text-gray-600 dark:text-gray-400">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium">{saving ? 'Saqlanmoqda...' : 'Saqlash'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
