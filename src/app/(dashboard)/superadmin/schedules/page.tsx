'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Clock, FileDown, CalendarDays, LayoutGrid } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

const MonthlyGrid = dynamic(() => import('@/components/schedule/MonthlyGrid').then((m) => m.MonthlyGrid), { ssr: false });

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function exportFilming(schedules: any[], from: string) {
  if (!schedules.length) { const { toast: t } = await import('sonner'); t.error("Jadval yo'q"); return; }
  const { exportFilmingScheduleWord } = await import('@/lib/exportWord');
  const entries = schedules.map((s, i) => ({
    camera: i + 1,
    startTime: s.startTime,
    operator: s.user?.fullName ?? '—',
    location: s.note ?? s.shiftType ?? '—',
    reporters: '',
  }));
  await exportFilmingScheduleWord(entries, from);
}

async function exportWeek(schedules: any[], from: string, to: string) {
  if (!schedules.length) { const { toast: t } = await import('sonner'); t.error("Jadval yo'q"); return; }
  const { exportWeekScheduleWord } = await import('@/lib/exportWord');
  const groups = schedules.map((s) => ({
    date: format(new Date(s.date), 'dd.MM.yyyy'),
    groupName: s.shiftType ?? 'Kunduzgi',
    workers: [s.user?.fullName ?? '—'],
    startTime: s.startTime,
    endTime: s.endTime,
    note: s.note ?? '',
  }));
  await exportWeekScheduleWord(groups, `${from} — ${to}`);
}
const SHIFTS = ['Kunduzgi', 'Kechki', 'Tungi', 'Qisqartirilgan'];
const EMPTY = { userId: '', date: '', startTime: '09:00', endTime: '18:00', shiftType: 'Kunduzgi', note: '' };
const DAY_NAMES = ['Dush', 'Sesh', 'Chor', 'Pay', 'Juma', 'Shan', 'Yak'];
const SHIFT_COLORS: Record<string, string> = {
  Kunduzgi:      'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-700 dark:text-blue-300',
  Kechki:        'bg-purple-50 dark:bg-purple-900/20 border-purple-100 dark:border-purple-800 text-purple-700 dark:text-purple-300',
  Tungi:         'bg-slate-100 dark:bg-slate-700/50 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300',
  Qisqartirilgan:'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-800 text-green-700 dark:text-green-300',
};

export default function SchedulesPage() {
  const today = new Date();
  const [weekStart, setWeekStart] = useState(startOfWeek(today, { weekStartsOn: 1 }));
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [view, setView] = useState<'week' | 'month'>('week');
  const [monthYear, setMonthYear] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const from = format(weekStart, 'yyyy-MM-dd');
  const to = format(addDays(weekStart, 6), 'yyyy-MM-dd');

  const monthFrom = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-01`;
  const lastDay = new Date(monthYear.year, monthYear.month, 0).getDate();
  const monthTo = `${monthYear.year}-${String(monthYear.month).padStart(2, '0')}-${lastDay}`;

  const { data, mutate } = useSWR(
    view === 'week' ? `/api/schedules?from=${from}&to=${to}` : `/api/schedules?from=${monthFrom}&to=${monthTo}`,
    fetcher,
  );
  const { data: usersData } = useSWR('/api/users', fetcher);
  const schedules: any[] = data?.data ?? [];
  const users = usersData?.data ?? [];
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  function openCreate(date?: Date) { setEditing(null); setForm({ ...EMPTY, date: date ? format(date, 'yyyy-MM-dd') : '' }); setError(''); setModal(true); }
  function openEdit(s: any) {
    setEditing(s);
    setForm({ userId: s.userId, date: format(new Date(s.date), 'yyyy-MM-dd'), startTime: s.startTime, endTime: s.endTime, shiftType: s.shiftType, note: s.note ?? '' });
    setError(''); setModal(true);
  }
  async function handleSave() {
    setSaving(true); setError('');
    try {
      const url = editing ? `/api/schedules/${editing.id}` : '/api/schedules';
      const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); toast.error(d.message); return; }
      setModal(false); mutate();
      toast.success(editing ? "Jadval yangilandi" : "Yangi jadval qo'shildi");
    } catch { setError('Xato'); toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }
  function handleDelete(id: string) {
    setConfirmDlg({
      open: true,
      message: "Ish jadvalini o'chirmoqchimisiz?",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        const res = await fetch(`/api/schedules/${id}`, { method: 'DELETE' });
        if (!res.ok) toast.error("O'chirishda xato"); else toast.success("Jadval o'chirildi");
        mutate();
      },
    });
  }

  const MONTH_NAMES = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Ish jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {view === 'week' ? `${from} — ${to}` : `${MONTH_NAMES[monthYear.month]} ${monthYear.year}`}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex rounded-lg border border-gray-200 dark:border-slate-700 overflow-hidden">
            <button
              onClick={() => setView('week')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'week' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <LayoutGrid size={14} /> Haftalik
            </button>
            <button
              onClick={() => setView('month')}
              className={`flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'month' ? 'bg-blue-600 text-white' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'}`}
            >
              <CalendarDays size={14} /> Oylik
            </button>
          </div>

          {view === 'week' ? (
            <>
              <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">← Oldingi</button>
              <button onClick={() => setWeekStart(startOfWeek(today, { weekStartsOn: 1 }))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Bugun</button>
              <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Keyingi →</button>
              <button onClick={() => exportFilming(schedules, from)} className="flex items-center gap-2 border border-blue-200 dark:border-blue-700 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 text-sm font-medium px-3 py-2 rounded-lg">
                <FileDown size={15} /> Tasvirga olish
              </button>
              <button onClick={() => exportWeek(schedules, from, to)} className="flex items-center gap-2 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 text-sm font-medium px-3 py-2 rounded-lg">
                <FileDown size={15} /> Haftalik Word
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setMonthYear((m) => m.month === 1 ? { year: m.year - 1, month: 12 } : { ...m, month: m.month - 1 })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">← Oldingi</button>
              <button onClick={() => setMonthYear({ year: today.getFullYear(), month: today.getMonth() + 1 })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Bu oy</button>
              <button onClick={() => setMonthYear((m) => m.month === 12 ? { year: m.year + 1, month: 1 } : { ...m, month: m.month + 1 })} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 text-sm hover:bg-gray-50 dark:hover:bg-slate-700">Keyingi →</button>
            </>
          )}
          <button onClick={() => openCreate()} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Qo'shish</button>
        </div>
      </div>

      {view === 'month' && (
        <MonthlyGrid schedules={schedules} users={users} year={monthYear.year} month={monthYear.month} />
      )}

      {view === 'week' && (<>
      <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
        <div className="grid grid-cols-7 gap-2 min-w-[560px]">
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
                    <div key={s.id} className={`border rounded p-1.5 text-xs ${SHIFT_COLORS[s.shiftType] ?? SHIFT_COLORS.Kunduzgi}`}>
                      <p className="font-medium truncate">{s.user?.fullName}</p>
                      <p className="opacity-75 text-xs">{s.startTime}–{s.endTime}</p>
                      <div className="flex gap-1 mt-0.5">
                        <button onClick={() => openEdit(s)} className="opacity-60 hover:opacity-100"><Edit2 size={10} /></button>
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
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-slate-700 text-sm font-medium text-gray-700 dark:text-gray-300">
          Jami: {schedules.length} ta yozuv
        </div>
        <div className="divide-y divide-gray-50 dark:divide-slate-700/50">
          {!data && Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse bg-gray-50 dark:bg-slate-700/30" />)}
          {schedules.length === 0 && data && <p className="px-4 py-8 text-center text-sm text-gray-400">Bu hafta jadval yo'q</p>}
          {schedules.map((s: any) => (
            <div key={s.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full text-sm font-semibold flex items-center justify-center border ${SHIFT_COLORS[s.shiftType] ?? SHIFT_COLORS.Kunduzgi}`}>{s.user?.fullName?.[0]}</div>
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
      </div>

      <ConfirmModal
        open={confirmDlg.open}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />
      </>)}

      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">{editing ? 'Jadval tahrirlash' : 'Yangi jadval'}</h3>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Xodim *</label>
                <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="select-base">
                  <option value="">— Tanlang —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sana *</label>
                <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-base" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Boshlanish</label>
                  <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tugash</label>
                  <input type="time" value={form.endTime} onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Smena turi</label>
                <select value={form.shiftType} onChange={(e) => setForm((f) => ({ ...f, shiftType: e.target.value }))} className="select-base">
                  {SHIFTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Izoh</label>
                <input value={form.note} onChange={(e) => setForm((f) => ({ ...f, note: e.target.value }))} className="input-base" />
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
    </div>
  );
}
