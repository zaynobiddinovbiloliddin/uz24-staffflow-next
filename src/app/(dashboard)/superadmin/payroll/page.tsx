'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, CheckCircle, Trash2, DollarSign } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const now = new Date();
const EMPTY = { userId: '', month: now.getMonth() + 1, year: now.getFullYear(), baseSalary: '', bonus: '0', deductions: '0', notes: '' };

export default function PayrollPage() {
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear, setFilterYear] = useState(now.getFullYear());
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; variant?: 'danger' | 'success'; title?: string; confirmLabel?: string; onConfirm: () => void }>({ open: false, message: '', onConfirm: () => {} });

  const { data, mutate } = useSWR(`/api/payroll?month=${filterMonth}&year=${filterYear}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);
  const payrolls: any[] = data?.data ?? [];
  const users = (usersData?.data ?? []).filter((u: any) => u.role !== 'SUPERADMIN');

  const totalPaid = payrolls.filter((p) => p.status === 'PAID').reduce((s, p) => s + p.totalAmount, 0);
  const totalPending = payrolls.filter((p) => p.status === 'PENDING').reduce((s, p) => s + p.totalAmount, 0);

  async function handleSave() {
    setSaving(true); setError('');
    try {
      const body = { ...form, month: Number(form.month), year: Number(form.year), baseSalary: Number(form.baseSalary), bonus: Number(form.bonus), deductions: Number(form.deductions) };
      const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); return; }
      setModal(false); mutate();
    } catch { setError('Xato'); } finally { setSaving(false); }
  }

  function handlePay(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `${name} uchun maosh to'langan deb belgilansinmi?`,
      variant: 'success',
      title: "Maosh to'lash",
      confirmLabel: "To'lash",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        await fetch(`/api/payroll/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pay' }) });
        mutate();
      },
    });
  }

  function handleDelete(id: string) {
    setConfirmDlg({
      open: true,
      message: "Maosh yozuvini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
        mutate();
      },
    });
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maosh</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTHS[filterMonth - 1]} {filterYear}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => { setForm(EMPTY); setError(''); setModal(true); }} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg"><Plus size={16} /> Kiritish</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500">To'langan</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{totalPaid.toLocaleString()} so'm</p>
          <p className="text-xs text-gray-400">{payrolls.filter((p) => p.status === 'PAID').length} ta xodim</p>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <p className="text-sm text-gray-500">Kutilmoqda</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{totalPending.toLocaleString()} so'm</p>
          <p className="text-xs text-gray-400">{payrolls.filter((p) => p.status === 'PENDING').length} ta xodim</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Xodim</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Asosiy</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Bonus</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Chegirma</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Jami</th>
              <th className="text-center px-4 py-3 text-gray-500 font-medium">Holat</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {!data && Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={7} className="px-4 py-3"><div className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" /></td></tr>)}
            {payrolls.length === 0 && data && <tr><td colSpan={7} className="px-4 py-8 text-center text-sm text-gray-400">Bu oy uchun ma'lumot yo'q</td></tr>}
            {payrolls.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30">
                <td className="px-4 py-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{p.user?.fullName}</p>
                    <p className="text-xs text-gray-400">{p.user?.department?.name ?? '—'}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400 hidden md:table-cell">{p.baseSalary.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-green-600 hidden lg:table-cell">+{p.bonus.toLocaleString()}</td>
                <td className="px-4 py-3 text-right text-red-500 hidden lg:table-cell">-{p.deductions.toLocaleString()}</td>
                <td className="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{p.totalAmount.toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${p.status === 'PAID' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                    {p.status === 'PAID' ? 'To\'landi' : 'Kutilmoqda'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {p.status === 'PENDING' && (
                      <button onClick={() => handlePay(p.id, p.user?.fullName)} className="p-1.5 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 text-gray-400 hover:text-green-600"><CheckCircle size={14} /></button>
                    )}
                    <button onClick={() => handleDelete(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ConfirmModal
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        variant={confirmDlg.variant ?? 'danger'}
        confirmLabel={confirmDlg.confirmLabel}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Maosh kiritish</h3>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Xodim *</label>
                <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Tanlang —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Oy</label>
                  <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Yil</label>
                  <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>
              {[{ label: 'Asosiy maosh *', key: 'baseSalary', placeholder: '3000000' }, { label: 'Bonus', key: 'bonus', placeholder: '0' }, { label: 'Chegirma', key: 'deductions', placeholder: '0' }].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <div className="relative">
                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="number" value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} placeholder={placeholder} className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Izoh</label>
                <input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none" />
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
