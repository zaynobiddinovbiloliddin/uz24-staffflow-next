'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Plus, CheckCircle, Trash2, DollarSign, X, Loader2, TrendingUp } from 'lucide-react';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());
const MONTHS = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
const now = new Date();
const EMPTY = { userId: '', month: now.getMonth() + 1, year: now.getFullYear(), baseSalary: '', bonus: '0', deductions: '0', notes: '' };

// ── Pul formatlash: 3520000 → "3 520 000" ────────────────────────────────────
function fmt(n: unknown): string {
  const num = Math.round(Number(n) || 0);
  return new Intl.NumberFormat('ru-RU').format(num);
}

export default function PayrollPage() {
  const [filterMonth, setFilterMonth] = useState(now.getMonth() + 1);
  const [filterYear,  setFilterYear]  = useState(now.getFullYear());
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [saving,      setSaving]      = useState(false);
  const [error,       setError]       = useState('');
  const [confirmDlg,  setConfirmDlg]  = useState<{
    open: boolean; message: string; variant?: 'danger' | 'success';
    title?: string; confirmLabel?: string; onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const { data, mutate } = useSWR(`/api/payroll?month=${filterMonth}&year=${filterYear}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);

  const payrolls: any[] = data?.data ?? [];
  const users = (usersData?.data ?? []).filter((u: any) => u.role !== 'SUPERADMIN');

  // Number() — string concatenation xatoligini oldini oladi
  const paidList    = payrolls.filter((p) => p.status === 'PAID');
  const pendingList = payrolls.filter((p) => p.status === 'PENDING');
  const totalPaid    = paidList.reduce((s, p)    => s + Number(p.totalAmount), 0);
  const totalPending = pendingList.reduce((s, p) => s + Number(p.totalAmount), 0);
  const totalBudget  = totalPaid + totalPending;
  const paidPct      = totalBudget > 0 ? Math.round((totalPaid / totalBudget) * 100) : 0;

  async function handleSave() {
    if (!form.userId) { setError('Xodimni tanlang'); return; }
    if (!form.baseSalary || Number(form.baseSalary) <= 0) { setError('Asosiy maosh kiritilmadi'); return; }
    setSaving(true); setError('');
    try {
      const body = {
        ...form,
        month:      Number(form.month),
        year:       Number(form.year),
        baseSalary: Number(form.baseSalary),
        bonus:      Number(form.bonus),
        deductions: Number(form.deductions),
      };
      const res = await fetch('/api/payroll', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const d = await res.json();
      if (!res.ok) { setError(d.message); toast.error(d.message); return; }
      setModal(false); mutate();
      toast.success('Maosh muvaffaqiyatli kiritildi');
    } catch { setError('Xato'); toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  function handlePay(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `${name} uchun maosh to'langan deb belgilansinmi?`,
      variant: 'success', title: "Maosh to'lash", confirmLabel: "To'lash",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        await fetch(`/api/payroll/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'pay' }) });
        mutate(); toast.success(`${name} — maosh to'landi ✓`);
      },
    });
  }

  function handleDelete(id: string) {
    setConfirmDlg({
      open: true,
      message: "Maosh yozuvini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.",
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        const res = await fetch(`/api/payroll/${id}`, { method: 'DELETE' });
        if (!res.ok) toast.error("O'chirishda xato"); else toast.success("Maosh yozuvi o'chirildi");
        mutate();
      },
    });
  }

  const years = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1];

  return (
    <div className="space-y-5 page-content">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Maosh</h1>
          <p className="text-sm text-gray-500 mt-0.5">{MONTHS[filterMonth - 1]} {filterYear}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={filterMonth} onChange={(e) => setFilterMonth(Number(e.target.value))} className="select-base w-auto">
            {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
          <select value={filterYear} onChange={(e) => setFilterYear(Number(e.target.value))} className="select-base w-auto">
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={() => { setForm(EMPTY); setError(''); setModal(true); }} className="btn-primary">
            <Plus size={16} /> Kiritish
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* To'langan */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">To'langan</p>
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle size={18} className="text-emerald-600 dark:text-emerald-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 leading-tight">
            {fmt(totalPaid)} <span className="text-base font-semibold">so'm</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{paidList.length} ta xodim to'landi</p>
        </div>

        {/* Kutilmoqda */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Kutilmoqda</p>
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <DollarSign size={18} className="text-amber-600 dark:text-amber-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 leading-tight">
            {fmt(totalPending)} <span className="text-base font-semibold">so'm</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">{pendingList.length} ta xodim kutmoqda</p>
        </div>

        {/* Jami + Progress */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Jami byudjet</p>
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <TrendingUp size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white leading-tight">
            {fmt(totalBudget)} <span className="text-base font-semibold text-gray-500">so'm</span>
          </p>
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>To'lov holati</span>
              <span className="font-semibold text-emerald-600">{paidPct}%</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-700"
                style={{ width: `${paidPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Skeleton */}
      {!data && (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      )}

      {/* Empty */}
      {payrolls.length === 0 && data && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 py-12 text-center">
          <DollarSign size={32} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-400">Bu oy uchun maosh ma'lumoti yo'q</p>
          <p className="text-xs text-gray-300 mt-1">Yuqoridagi "Kiritish" tugmasini bosing</p>
        </div>
      )}

      {/* Mobile cards (sm:hidden) */}
      {payrolls.length > 0 && (
        <div className="sm:hidden space-y-3">
          {payrolls.map((p: any) => (
            <div key={p.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{p.user?.fullName}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{p.user?.department?.name ?? '—'}</p>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  p.status === 'PAID'
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {p.status === 'PAID' ? '✓ To\'landi' : '○ Kutilmoqda'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div>
                  <p className="text-gray-400">Asosiy maosh</p>
                  <p className="font-medium text-gray-700 dark:text-gray-300 mt-0.5">{fmt(p.baseSalary)} so'm</p>
                </div>
                {Number(p.bonus) > 0 && (
                  <div>
                    <p className="text-gray-400">Bonus</p>
                    <p className="font-medium text-emerald-600 mt-0.5">+{fmt(p.bonus)} so'm</p>
                  </div>
                )}
                {Number(p.deductions) > 0 && (
                  <div>
                    <p className="text-gray-400">Chegirma</p>
                    <p className="font-medium text-red-500 mt-0.5">−{fmt(p.deductions)} so'm</p>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-slate-700">
                <div>
                  <p className="text-xs text-gray-400">Jami</p>
                  <p className="font-bold text-gray-900 dark:text-white">{fmt(p.totalAmount)} <span className="text-xs font-normal text-gray-400">so'm</span></p>
                </div>
                <div className="flex gap-1">
                  {p.status === 'PENDING' && (
                    <button onClick={() => handlePay(p.id, p.user?.fullName)} className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors">
                      <CheckCircle size={16} />
                    </button>
                  )}
                  <button onClick={() => handleDelete(p.id)} className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Desktop table (hidden on mobile) */}
      {payrolls.length > 0 && (
        <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50">
                  <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Xodim</th>
                  <th className="text-right px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Asosiy maosh</th>
                  <th className="text-right px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Bonus</th>
                  <th className="text-right px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Chegirma</th>
                  <th className="text-right px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Jami</th>
                  <th className="text-center px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Holat</th>
                  <th className="px-4 py-3.5 w-20" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {payrolls.map((p: any) => (
                  <tr key={p.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors list-row">
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-gray-900 dark:text-white">{p.user?.fullName}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{p.user?.department?.name ?? '—'}</p>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-medium text-gray-700 dark:text-gray-300">{fmt(p.baseSalary)} so'm</span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {Number(p.bonus) > 0 ? (
                        <span className="font-medium text-emerald-600 dark:text-emerald-400">+{fmt(p.bonus)} so'm</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {Number(p.deductions) > 0 ? (
                        <span className="font-medium text-red-500 dark:text-red-400">−{fmt(p.deductions)} so'm</span>
                      ) : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <span className="font-bold text-gray-900 dark:text-white text-base">
                        {fmt(p.totalAmount)} <span className="text-xs font-semibold text-gray-400">so'm</span>
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-center">
                      <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                        p.status === 'PAID'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                      }`}>
                        {p.status === 'PAID' ? '✓ To\'landi' : '○ Kutilmoqda'}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-0.5">
                        {p.status === 'PENDING' && (
                          <button onClick={() => handlePay(p.id, p.user?.fullName)} title="To'lash" className="p-2 rounded-xl hover:bg-emerald-50 dark:hover:bg-emerald-900/20 text-gray-400 hover:text-emerald-600 transition-colors">
                            <CheckCircle size={15} />
                          </button>
                        )}
                        <button onClick={() => handleDelete(p.id)} title="O'chirish" className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDlg.open}
        title={confirmDlg.title}
        message={confirmDlg.message}
        variant={confirmDlg.variant ?? 'danger'}
        confirmLabel={confirmDlg.confirmLabel}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {/* Modal — header + scrollable body + fixed footer */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[90vh] overflow-hidden modal-enter">

            {/* Header — always visible */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Maosh kiritish</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors">
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-5 space-y-4 overscroll-contain">
              {/* Xodim */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Xodim <span className="text-red-500">*</span>
                </label>
                <select value={form.userId} onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))} className="select-base">
                  <option value="">— Xodimni tanlang —</option>
                  {users.map((u: any) => <option key={u.id} value={u.id}>{u.fullName} ({u.department?.name ?? 'Bo\'limsiz'})</option>)}
                </select>
              </div>

              {/* Oy / Yil */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Oy</label>
                  <select value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: Number(e.target.value) }))} className="select-base">
                    {MONTHS.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Yil</label>
                  <select value={form.year} onChange={(e) => setForm((f) => ({ ...f, year: Number(e.target.value) }))} className="select-base">
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
              </div>

              {/* Asosiy maosh */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Asosiy maosh <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    value={form.baseSalary}
                    onChange={(e) => setForm((f) => ({ ...f, baseSalary: e.target.value }))}
                    placeholder="3 000 000"
                    min="0"
                    className="input-base pl-10"
                  />
                </div>
                {form.baseSalary && Number(form.baseSalary) > 0 && (
                  <p className="text-xs text-blue-500 mt-1">≈ {fmt(Number(form.baseSalary))} so'm</p>
                )}
              </div>

              {/* Bonus va Chegirma */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Bonus <span className="text-emerald-500">+</span>
                  </label>
                  <input
                    type="number"
                    value={form.bonus}
                    onChange={(e) => setForm((f) => ({ ...f, bonus: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                    Chegirma <span className="text-red-500">−</span>
                  </label>
                  <input
                    type="number"
                    value={form.deductions}
                    onChange={(e) => setForm((f) => ({ ...f, deductions: e.target.value }))}
                    placeholder="0"
                    min="0"
                    className="input-base"
                  />
                </div>
              </div>

              {/* Jami preview */}
              {form.baseSalary && Number(form.baseSalary) > 0 && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Jami to'lov:</span>
                    <span className="font-bold text-blue-700 dark:text-blue-300">
                      {fmt(Number(form.baseSalary) + Number(form.bonus) - Number(form.deductions))} so'm
                    </span>
                  </div>
                </div>
              )}

              {/* Izoh */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Izoh</label>
                <input
                  type="text"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  className="input-base"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <span className="text-red-500 text-xs font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Footer — always visible */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 rounded-b-2xl">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <Loader2 size={15} className="animate-spin" /> : null}
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
