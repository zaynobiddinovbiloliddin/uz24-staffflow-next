'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import { Plus, Edit2, Trash2, FileDown, Video, X } from 'lucide-react';
import { toast } from 'sonner';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Props {
  canEdit: boolean;
}

const EMPTY_FORM = {
  date: format(new Date(), 'yyyy-MM-dd'),
  cameraNo: 1,
  startTime: '09:00',
  location: '',
  topic: '',
  reporters: '',
  equipment: "HD jamlanmasi, mikrofon, chiroq, avtotransport",
  operatorIds: [] as string[],
};

export function FilmingPage({ canEdit }: Props) {
  const today = new Date();
  const [selectedDate, setSelectedDate] = useState(format(today, 'yyyy-MM-dd'));
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const { data, mutate } = useSWR(`/api/filming?date=${selectedDate}`, fetcher);
  const { data: usersData } = useSWR('/api/users', fetcher);

  const entries: any[] = data?.data ?? [];
  const users: any[] = usersData?.data?.filter((u: any) => u.isActive) ?? [];

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, date: selectedDate, cameraNo: entries.length + 1 });
    setModal(true);
  }

  function openEdit(e: any) {
    setEditing(e);
    setForm({
      date: e.date?.slice(0, 10) ?? selectedDate,
      cameraNo: e.cameraNo,
      startTime: e.startTime,
      location: e.location,
      topic: e.topic,
      reporters: e.reporters ?? '',
      equipment: e.equipment ?? '',
      operatorIds: e.operators?.map((o: any) => o.userId) ?? [],
    });
    setModal(true);
  }

  async function handleSave() {
    if (!form.location || !form.topic) { toast.error('Joy va mavzuni kiriting'); return; }
    setSaving(true);
    try {
      const url = editing ? `/api/filming/${editing.id}` : '/api/filming';
      const method = editing ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, cameraNo: Number(form.cameraNo) }),
      });
      if (!res.ok) { const d = await res.json(); toast.error(d.message ?? 'Xato'); return; }
      toast.success(editing ? 'Yangilandi' : "Qo'shildi");
      setModal(false);
      mutate();
    } catch { toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("O'chirmoqchimisiz?")) return;
    const res = await fetch(`/api/filming/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) { toast.success("O'chirildi"); mutate(); }
    else toast.error("O'chirishda xato");
  }

  async function handleWordExport() {
    if (!entries.length) { toast.error('Eksport uchun ma\'lumot yo\'q'); return; }
    const { exportFilmingScheduleWord } = await import('@/lib/exportWord');
    const filmEntries = entries.map((e) => ({
      camera: e.cameraNo,
      startTime: e.startTime,
      operator: e.operators?.map((o: any) => o.user?.fullName).join(', ') || '—',
      location: `${e.location} — ${e.topic}`,
      reporters: e.reporters || '—',
    }));
    await exportFilmingScheduleWord(filmEntries, format(new Date(selectedDate), 'dd.MM.yyyy'));
    toast.success('Word fayl yuklandi');
  }

  const dateLabel = selectedDate ? format(new Date(selectedDate + 'T00:00:00'), 'dd.MM.yyyy') : '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tasvirga olish jadvali</h1>
          <p className="text-sm text-gray-500 mt-0.5 font-medium text-red-500">
            Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="input-base w-auto"
          />
          <button onClick={handleWordExport} className="flex items-center gap-2 border border-blue-200 dark:border-blue-700 text-blue-600 bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 text-sm font-medium px-3 py-2 rounded-lg">
            <FileDown size={15} /> Word
          </button>
          {canEdit && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg">
              <Plus size={15} /> Qo'shish
            </button>
          )}
        </div>
      </div>

      {/* TASDIQLAYMAN bloki */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Tasvirga olish jadvali</h2>
            <p className="text-sm text-gray-500">Sana: {dateLabel}</p>
          </div>
          <div className="text-right text-sm text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-slate-600 rounded-lg p-3">
            <p className="font-bold">TASDIQLAYMAN</p>
            <p>"O'zbekiston 24" ijodiy birlashmasi" DM</p>
            <p>Direktori ___________ M. Safarov</p>
            <p className="mt-1 text-gray-400">"___" ____________ {new Date().getFullYear()} y.</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800">
                <th className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300 w-16">Kamera</th>
                <th className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300 w-24">Chiqish vaqti</th>
                <th className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300">Operator va texnik xodim</th>
                <th className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300">Tadbir joyi va mavzusi</th>
                <th className="text-left px-4 py-3 font-semibold text-blue-700 dark:text-blue-300">Muxbirlar</th>
                {canEdit && <th className="px-4 py-3 w-20" />}
              </tr>
            </thead>
            <tbody>
              {!data && (
                <tr><td colSpan={6} className="px-4 py-8 text-center">
                  <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse mx-auto w-48" />
                </td></tr>
              )}
              {data && entries.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-400">
                  <Video size={32} className="mx-auto mb-2 opacity-30" />
                  Bu kun uchun tasvirga olish jadvali yo'q
                </td></tr>
              )}
              {entries.map((e: any) => (
                <>
                  <tr key={e.id} className="border-b border-gray-50 dark:border-slate-700 hover:bg-blue-50/20">
                    <td className="px-4 py-3 font-bold text-blue-600">{e.cameraNo}</td>
                    <td className="px-4 py-3 font-medium">{e.startTime}</td>
                    <td className="px-4 py-3">
                      {e.operators?.length
                        ? e.operators.map((o: any) => o.user?.fullName).join(', ')
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800 dark:text-gray-200">{e.topic}</p>
                      <p className="text-xs text-gray-400">{e.location}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-500">{e.reporters || '—'}</td>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => openEdit(e)} className="p-1.5 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600"><Edit2 size={14} /></button>
                          <button onClick={() => handleDelete(e.id)} className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                  <tr key={`eq-${e.id}`} className="border-b border-gray-100 dark:border-slate-700">
                    <td colSpan={canEdit ? 6 : 5} className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10">
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">Kerakli jihoz va texnika: </span>
                      <span className="text-xs text-gray-500">{e.equipment || 'HD jamlanmasi, mikrofon, chiroq, avtotransport'}</span>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg flex flex-col max-h-[92vh] overflow-hidden">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editing ? 'Tahrirlash' : 'Yangi yozuv'}</h3>
              <button onClick={() => setModal(false)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"><X size={18} /></button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Sana *</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} className="input-base" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Kamera raqami *</label>
                  <input type="number" min={1} value={form.cameraNo} onChange={(e) => setForm((f) => ({ ...f, cameraNo: Number(e.target.value) }))} className="input-base" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Chiqish vaqti *</label>
                <input type="time" value={form.startTime} onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))} className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tadbir joyi *</label>
                <input type="text" value={form.location} onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))} placeholder="Masalan: Navoiy ko'chasi 3" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Tadbir mavzusi *</label>
                <textarea rows={2} value={form.topic} onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))} placeholder="Masalan: Milliy bayram tadbiri" className="input-base resize-none" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Operatorlar (bir nechtasini tanlang)</label>
                <div className="border border-gray-200 dark:border-slate-600 rounded-xl max-h-36 overflow-y-auto p-2 space-y-1">
                  {users.map((u) => (
                    <label key={u.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 cursor-pointer">
                      <input type="checkbox" checked={form.operatorIds.includes(u.id)}
                        onChange={(e) => setForm((f) => ({
                          ...f,
                          operatorIds: e.target.checked ? [...f.operatorIds, u.id] : f.operatorIds.filter((id) => id !== u.id),
                        }))}
                        className="rounded" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{u.fullName}</span>
                      {u.position && <span className="text-xs text-gray-400">· {u.position}</span>}
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Muxbirlar</label>
                <input type="text" value={form.reporters} onChange={(e) => setForm((f) => ({ ...f, reporters: e.target.value }))} placeholder="Muxbirlar ismi" className="input-base" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Kerakli jihoz va texnika</label>
                <input type="text" value={form.equipment} onChange={(e) => setForm((f) => ({ ...f, equipment: e.target.value }))} className="input-base" />
              </div>
            </div>
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
