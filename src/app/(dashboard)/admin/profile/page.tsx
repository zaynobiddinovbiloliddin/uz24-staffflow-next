'use client';

import { useState, useRef } from 'react';
import useSWR from 'swr';
import { User, Phone, Building2, ClipboardList, Calendar, Edit2, Camera } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AdminProfilePage() {
  const { data, mutate } = useSWR('/api/me', undefined);
  const { data: tasksData } = useSWR('/api/tasks', undefined);

  const me = data?.data;
  const tasks: any[] = tasksData?.data ?? [];

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
      {Array.from({ length: 3 }).map((_, i) => (
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
            <span className="inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Bo'lim Admini
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

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <ClipboardList size={16} /> Bo'lim vazifalar statistikasi
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

      {editModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-sm flex flex-col max-h-[90vh] overflow-hidden modal-enter">
            <div className="flex items-center justify-between px-5 sm:px-6 pt-5 sm:pt-6 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Profilni tahrirlash</h3>
              <button onClick={() => setEditModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto min-h-0 px-5 sm:px-6 py-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Profil rasmi</label>
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
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Telefon raqam</label>
                <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998 90 123 45 67" className="input-base" />
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
