'use client';

import { useState, useRef } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import {
  User, Phone, Building2, ClipboardList, Calendar, Edit2,
  Camera, Video, Link2, Plus, Trash2, ExternalLink, X,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const MonthlyCalendar = dynamic(
  () => import('@/components/schedule/MonthlyCalendar').then((m) => m.MonthlyCalendar),
  { ssr: false },
);

// ─── Portfolio helper ─────────────────────────────────────────────────────────

interface PortfolioLink { url: string; title?: string }

function parseLinks(raw: string[]): PortfolioLink[] {
  return raw.map((s) => {
    try { return JSON.parse(s) as PortfolioLink; } catch { return { url: s }; }
  });
}

// ─── Portfolio section component ─────────────────────────────────────────────

function PortfolioSection({
  userId,
  rawLinks,
  readOnly,
  onMutate,
}: {
  userId: string;
  rawLinks: string[];
  readOnly?: boolean;
  onMutate: () => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [deletingUrl, setDeletingUrl] = useState<string | null>(null);

  const links = parseLinks(rawLinks);

  async function handleAdd() {
    if (!newUrl.trim()) { toast.error('URL kiriting'); return; }
    if (!/^https?:\/\/.+/.test(newUrl.trim())) {
      toast.error('URL http:// yoki https:// bilan boshlanishi kerak');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch(`/api/users/${userId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl.trim(), title: newTitle.trim() || undefined }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.message ?? 'Xato yuz berdi');
        return;
      }
      toast.success('Link qo\'shildi');
      setNewUrl(''); setNewTitle(''); setShowForm(false);
      onMutate();
    } catch { toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  async function handleDelete(url: string) {
    if (!confirm('Bu linkni o\'chirmoqchimisiz?')) return;
    setDeletingUrl(url);
    try {
      const res = await fetch(`/api/users/${userId}/portfolio`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) { toast.error('O\'chirishda xato'); return; }
      toast.success('Link o\'chirildi');
      onMutate();
    } catch { toast.error('Xato'); } finally { setDeletingUrl(null); }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Link2 size={16} /> Portfolio
        </h3>
        {!readOnly && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
          >
            <Plus size={13} /> Link
          </button>
        )}
      </div>

      {/* Inline add form */}
      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl space-y-2 border border-gray-100 dark:border-slate-600">
          <input
            type="text"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Syomka nomi (ixtiyoriy)"
            className="input-base text-sm py-2"
          />
          <input
            type="url"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="input-base text-sm py-2"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="btn-primary flex-1 text-sm py-2"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button
              onClick={() => { setShowForm(false); setNewUrl(''); setNewTitle(''); }}
              className="btn-secondary flex-1 text-sm py-2"
            >
              Bekor qilish
            </button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-5">
          <Link2 size={28} className="mx-auto text-gray-200 dark:text-slate-600 mb-2" />
          <p className="text-sm text-gray-400">
            Efirga ketgan syomka linklarini shu yerda yig'ib borasiz
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div
              key={link.url}
              className="flex items-start justify-between gap-2 group py-2 border-b border-gray-50 dark:border-slate-700 last:border-0"
            >
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 min-w-0 flex-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <ExternalLink size={13} className="flex-shrink-0 mt-0.5 text-gray-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {link.title || link.url}
                  </p>
                  {link.title && (
                    <p className="text-xs text-gray-400 truncate">{link.url}</p>
                  )}
                </div>
              </a>
              {!readOnly && (
                <button
                  onClick={() => handleDelete(link.url)}
                  disabled={deletingUrl === link.url}
                  className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Filming history section ──────────────────────────────────────────────────

function FilmingHistorySection({ myFilmings, filmingData, myFullName }: {
  myFilmings: any[];
  filmingData: any;
  myFullName: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
        <Video size={16} /> Mening suratga olish jadvallarim
      </h3>
      {!filmingData ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : myFilmings.length === 0 ? (
        <div className="text-center py-5">
          <Video size={28} className="mx-auto text-gray-200 dark:text-slate-600 mb-2" />
          <p className="text-sm text-gray-400">Hozircha suratga olish jadvaliga kiritilmagansiz</p>
        </div>
      ) : (
        <div className="space-y-1">
          {myFilmings.map((entry: any) => {
            const myOps = entry.operators?.filter((op: any) =>
              op.operatorNames?.includes(myFullName),
            ) ?? [];
            return myOps.map((op: any) => (
              <div
                key={`${entry.id}-${op.id}`}
                className="flex items-start justify-between py-2.5 border-b border-gray-50 dark:border-slate-700 last:border-0 gap-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full">
                      Kamera {op.cameraNumber || '?'}
                    </span>
                    {op.exitTime && (
                      <span className="text-xs text-gray-500 font-medium">{op.exitTime}</span>
                    )}
                  </div>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                    {op.eventLocation}
                  </p>
                  {op.eventDescription && (
                    <p className="text-xs text-gray-400 truncate mt-0.5">{op.eventDescription}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-0.5">
                  {format(new Date(entry.date + 'T00:00:00'), 'dd.MM.yyyy')}
                </span>
              </div>
            ));
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmployeeProfilePage() {
  const { data, mutate } = useSWR('/api/me', undefined);
  const { data: tasksData } = useSWR('/api/tasks', undefined);
  const { data: schedData } = useSWR('/api/schedules?from=2020-01-01&to=2030-12-31', undefined);

  const me = data?.data;
  const { data: filmingData } = useSWR(
    me?.fullName ? `/api/filming?operatorName=${encodeURIComponent(me.fullName)}` : null,
    undefined,
  );

  const tasks: any[] = tasksData?.data ?? [];
  const schedules: any[] = schedData?.data ?? [];
  const myFilmings: any[] = (filmingData?.data ?? []).slice(0, 10);

  const [editModal, setEditModal] = useState(false);
  const [phone, setPhone] = useState('');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const taskStats = {
    total: tasks.length,
    completed: tasks.filter((t) => t.status === 'COMPLETED').length,
    inProgress: tasks.filter((t) => t.status === 'IN_PROGRESS').length,
    pending: tasks.filter((t) => t.status === 'PENDING').length,
  };

  function openEdit() {
    setPhone(me?.phone ?? '');
    setAvatarPreview(null);
    setEditModal(true);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 96; canvas.height = 96;
        const ctx = canvas.getContext('2d')!;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        ctx.drawImage(img, sx, sy, size, size, 0, 0, 96, 96);
        setAvatarPreview(canvas.toDataURL('image/jpeg', 0.85));
      };
      img.src = ev.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  async function handleSave() {
    setSaving(true);
    try {
      const body: Record<string, unknown> = { phone: phone.trim() || null };
      if (avatarPreview) body.avatar = avatarPreview;

      const res = await fetch('/api/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success('Profil yangilandi');
        setEditModal(false);
        mutate();
      } else {
        const d = await res.json();
        toast.error(d.message ?? 'Xato yuz berdi');
      }
    } catch { toast.error('Xato yuz berdi'); } finally { setSaving(false); }
  }

  if (!me) return (
    <div className="space-y-4 max-w-2xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
      ))}
    </div>
  );

  const completionRate = taskStats.total > 0 ? Math.round((taskStats.completed / taskStats.total) * 100) : 0;

  return (
    <div className="space-y-6 max-w-2xl page-content">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Mening profilim</h1>
        <button onClick={openEdit} className="btn-secondary flex items-center gap-2">
          <Edit2 size={15} /> Tahrirlash
        </button>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-5 mb-6">
          <div className="relative flex-shrink-0">
            {me.avatar ? (
              <img src={me.avatar} alt={me.fullName} className="w-20 h-20 rounded-2xl object-cover" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-3xl flex items-center justify-center">
                {me.fullName[0]}
              </div>
            )}
            <button
              onClick={openEdit}
              className="absolute -bottom-1 -right-1 w-7 h-7 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center shadow-lg transition-colors"
            >
              <Camera size={13} />
            </button>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{me.fullName}</h2>
            <p className="text-gray-500">@{me.username}</p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full ${me.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
              {me.isActive ? 'Faol' : 'Nofaol'}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { icon: <User size={16} />, label: 'Lavozim', value: me.position ?? "Ko'rsatilmagan" },
            { icon: <Phone size={16} />, label: 'Telefon', value: me.phone ?? "Ko'rsatilmagan" },
            { icon: <Building2 size={16} />, label: "Bo'lim", value: me.department?.name ?? 'Tayinlanmagan' },
            { icon: <Calendar size={16} />, label: "Ro'yxatdan o'tgan", value: format(new Date(me.createdAt), 'dd.MM.yyyy') },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-slate-700 text-gray-400 flex items-center justify-center flex-shrink-0">
                {icon}
              </div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Portfolio section */}
      <PortfolioSection
        userId={me.id}
        rawLinks={me.portfolioLinks ?? []}
        onMutate={mutate}
      />

      {/* Task stats */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <ClipboardList size={16} /> Vazifa statistikasi
        </h3>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Jami', value: taskStats.total, color: 'text-gray-700 dark:text-gray-200' },
            { label: 'Kutilmoqda', value: taskStats.pending, color: 'text-amber-600' },
            { label: 'Jarayonda', value: taskStats.inProgress, color: 'text-blue-600' },
            { label: 'Bajarildi', value: taskStats.completed, color: 'text-green-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
        {taskStats.total > 0 && (
          <>
            <div className="mt-4 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all duration-700" style={{ width: `${completionRate}%` }} />
            </div>
            <p className="text-xs text-gray-400 mt-1">{completionRate}% bajarildi</p>
          </>
        )}
      </div>

      {/* Monthly calendar */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <MonthlyCalendar
          schedules={schedules.map((s: any) => ({
            date: typeof s.date === 'string' ? s.date : new Date(s.date).toISOString(),
            shiftType: s.shiftType,
            startTime: s.startTime,
            endTime: s.endTime,
          }))}
        />
      </div>

      {/* Upcoming schedules */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Calendar size={16} /> Keyingi jadvallar
        </h3>
        {schedules.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Jadval yo'q</p>
        ) : (
          <div className="space-y-2">
            {schedules.slice(0, 5).map((s: any) => (
              <div key={s.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {format(new Date(s.date), 'dd.MM.yyyy')} — {s.shiftType}
                </p>
                <span className="text-sm text-gray-500">{s.startTime}–{s.endTime}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filming history */}
      <FilmingHistorySection
        myFilmings={myFilmings}
        filmingData={filmingData}
        myFullName={me.fullName}
      />

      {/* Edit modal */}
      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profilni tahrirlash</h3>
              <button onClick={() => setEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="field-label">Profil rasmi</label>
                <div className="flex items-center gap-4">
                  {(avatarPreview ?? me.avatar) ? (
                    <img src={avatarPreview ?? me.avatar} alt="" className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-2xl flex items-center justify-center">
                      {me.fullName[0]}
                    </div>
                  )}
                  <div className="space-y-1">
                    <button type="button" onClick={() => fileRef.current?.click()} className="btn-secondary text-sm py-2 px-3 flex items-center gap-1.5">
                      <Camera size={14} /> Rasm tanlash
                    </button>
                    {(avatarPreview ?? me.avatar) && (
                      <button type="button" onClick={() => setAvatarPreview('')} className="text-xs text-red-500 hover:text-red-600 px-1">
                        Rasmni o'chirish
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
                </div>
              </div>

              <div>
                <label className="field-label">Telefon raqam</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
                  className="input-base"
                />
              </div>
            </div>

            <div className="px-5 sm:px-6 pb-5 sm:pb-6 flex gap-3 flex-shrink-0">
              <button onClick={() => setEditModal(false)} className="btn-secondary flex-1">Bekor</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
