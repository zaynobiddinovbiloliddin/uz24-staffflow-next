'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight,
  Loader2, Eye, EyeOff, Camera, X,
} from 'lucide-react';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'SuperAdmin',
  ADMIN: 'Admin',
  EMPLOYEE: 'Xodim',
};
const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ADMIN:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EMPLOYEE:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const EMPTY = {
  fullName: '', username: '', password: '', role: 'EMPLOYEE',
  position: '', phone: '', departmentId: '', avatar: '',
};

// Rasmni 96x96px ga siqadi, base64 qaytaradi
async function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 96;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE;
      canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      ctx.drawImage(img, sx, sy, s, s, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function UsersPage() {
  const [search,       setSearch]       = useState('');
  const [modal,        setModal]        = useState(false);
  const [editing,      setEditing]      = useState<any>(null);
  const [form,         setForm]         = useState(EMPTY);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy,         setBusy]         = useState<Set<string>>(new Set());
  const [confirmDlg,   setConfirmDlg]   = useState<{
    open: boolean; message: string; onConfirm: () => void;
  }>({ open: false, message: '', onConfirm: () => {} });

  const { data: usersData, mutate } = useSWR('/api/users', fetcher);
  const { data: deptsData }         = useSWR('/api/departments', fetcher);

  const allUsers = usersData?.data ?? [];
  const users = allUsers.filter((u: any) =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase()),
  );
  const depts = deptsData?.data ?? [];

  function markBusy(id: string, on: boolean) {
    setBusy((prev) => { const next = new Set(prev); on ? next.add(id) : next.delete(id); return next; });
  }

  function openCreate() {
    setEditing(null); setForm(EMPTY); setError(''); setShowPassword(false); setModal(true);
  }
  function openEdit(user: any) {
    setEditing(user);
    setForm({
      fullName: user.fullName, username: user.username, password: '',
      role: user.role, position: user.position ?? '', phone: user.phone ?? '',
      departmentId: user.departmentId ?? '', avatar: user.avatar ?? '',
    });
    setError(''); setShowPassword(false); setModal(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm 5 MB dan oshmasligi kerak'); return; }
    try {
      const base64 = await resizeAvatar(file);
      setForm((f) => ({ ...f, avatar: base64 }));
    } catch {
      toast.error('Rasmni o\'qishda xato');
    }
    e.target.value = '';
  }

  async function handleSave() {
    if (!form.fullName.trim())               { setError("To'liq ism kiritilmadi"); return; }
    if (!editing && !form.username.trim())   { setError('Username kiritilmadi'); return; }
    if (!editing && !form.password.trim())   { setError('Parol kiritilmadi'); return; }

    setSaving(true); setError('');
    try {
      const url    = editing ? `/api/users/${editing.id}` : '/api/users';
      const method = editing ? 'PUT' : 'POST';
      const body: any = { ...form };
      if (editing && !body.password) delete body.password;
      if (!body.departmentId) delete body.departmentId;
      if (!body.avatar) delete body.avatar;

      if (editing) {
        mutate(
          { ...usersData, data: allUsers.map((u: any) => u.id === editing.id ? { ...u, ...form } : u) },
          false,
        );
      }

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) {
        mutate();
        setError(data.message);
        toast.error(data.message);
        return;
      }

      setModal(false);
      mutate();
      toast.success(editing ? "O'zgarishlar saqlandi" : "Yangi foydalanuvchi qo'shildi");
    } catch {
      mutate();
      setError('Xato yuz berdi');
      toast.error('Xato yuz berdi');
    } finally {
      setSaving(false);
    }
  }

  function handleDelete(id: string, name: string) {
    setConfirmDlg({
      open: true,
      message: `"${name}" foydalanuvchini o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.`,
      onConfirm: async () => {
        setConfirmDlg((d) => ({ ...d, open: false }));
        mutate({ ...usersData, data: allUsers.filter((u: any) => u.id !== id) }, false);
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!res.ok) { mutate(); toast.error("O'chirishda xato yuz berdi"); }
        else         { toast.success(`"${name}" muvaffaqiyatli o'chirildi`); }
      },
    });
  }

  async function handleToggle(id: string) {
    if (busy.has(id)) return;
    markBusy(id, true);
    const user = allUsers.find((u: any) => u.id === id);
    mutate({ ...usersData, data: allUsers.map((u: any) => u.id === id ? { ...u, isActive: !u.isActive } : u) }, false);
    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle' }),
      });
      if (!res.ok) { mutate(); toast.error('Xato yuz berdi'); }
      else { toast.success(user?.isActive ? `"${user?.fullName}" bloklandi` : `"${user?.fullName}" faollashtirildi`); }
    } catch {
      mutate(); toast.error('Xato yuz berdi');
    } finally {
      markBusy(id, false);
    }
  }

  return (
    <div className="space-y-5 page-content">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} ta foydalanuvchi</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Yangi
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki username bo'yicha qidirish..."
          className="input-base pl-10"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Skeleton ── */}
      {!usersData && (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 animate-pulse" />
          ))}
        </div>
      )}

      {/* ── Empty ── */}
      {usersData && users.length === 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 px-4 py-12 text-center">
          <Search size={32} className="mx-auto mb-2 text-gray-300" />
          <p className="text-sm text-gray-400">Foydalanuvchi topilmadi</p>
        </div>
      )}

      {/* ── Mobile: card list (< sm) ── */}
      {usersData && users.length > 0 && (
        <div className="sm:hidden space-y-2">
          {users.map((user: any) => (
            <div key={user.id} className="list-row bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-3">
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100 dark:ring-slate-700">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.fullName[0]}
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm leading-tight truncate">{user.fullName}</p>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <p className="text-xs text-gray-400">@{user.username}</p>
                    {user.position && <p className="text-xs text-gray-400 truncate">· {user.position}</p>}
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                    }`}>
                      {user.isActive ? 'Faol' : 'Nofaol'}
                    </span>
                  </div>
                  {user.department && (
                    <p className="text-xs text-gray-400 mt-0.5 truncate">🏢 {user.department.name}</p>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggle(user.id)}
                    disabled={busy.has(user.id)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                  >
                    {busy.has(user.id)
                      ? <Loader2 size={16} className="animate-spin text-blue-500" />
                      : user.isActive
                        ? <ToggleRight size={18} className="text-emerald-500" />
                        : <ToggleLeft size={18} />
                    }
                  </button>
                  <button
                    onClick={() => openEdit(user)}
                    className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(user.id, user.fullName)}
                    className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Desktop: table (sm+) ── */}
      {usersData && users.length > 0 && (
        <div className="hidden sm:block bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/80 dark:bg-slate-900/50">
                <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Xodim</th>
                <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide hidden md:table-cell">Lavozim</th>
                <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide hidden lg:table-cell">Bo'lim</th>
                <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Rol</th>
                <th className="text-left px-4 py-3.5 text-gray-500 dark:text-gray-400 font-semibold text-xs uppercase tracking-wide">Holat</th>
                <th className="px-4 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
              {users.map((user: any) => (
                <tr key={user.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-700/30 list-row">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-gray-100 dark:ring-slate-700">
                        {user.avatar ? (
                          <img src={user.avatar} alt={user.fullName} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                            {user.fullName[0]}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white leading-tight">{user.fullName}</p>
                        <p className="text-xs text-gray-400 mt-0.5">@{user.username}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 hidden md:table-cell">{user.position ?? '—'}</td>
                  <td className="px-4 py-3.5 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{user.department?.name ?? '—'}</td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                      {ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      user.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'
                    }`}>
                      {user.isActive ? '● Faol' : '○ Nofaol'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <button
                        onClick={() => handleToggle(user.id)}
                        disabled={busy.has(user.id)}
                        title={user.isActive ? 'Bloklash' : 'Faollashtirish'}
                        className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                      >
                        {busy.has(user.id)
                          ? <Loader2 size={16} className="animate-spin text-blue-500" />
                          : user.isActive
                            ? <ToggleRight size={17} className="text-emerald-500" />
                            : <ToggleLeft size={17} />
                        }
                      </button>
                      <button
                        onClick={() => openEdit(user)}
                        title="Tahrirlash"
                        className="p-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.fullName)}
                        title="O'chirish"
                        className="p-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        open={confirmDlg.open}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />

      {/* Edit/Create Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md modal-enter flex flex-col max-h-[92vh] overflow-hidden">
            {/* Header — always visible */}
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editing ? 'Tahrirlash' : 'Yangi foydalanuvchi'}
              </h3>
              <button
                onClick={() => setModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Body — scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0 overscroll-contain px-6 py-5 space-y-4">
              {/* Avatar Upload */}
              <div className="flex justify-center">
                <label className="relative cursor-pointer group">
                  <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/30 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                    {form.avatar ? (
                      <img src={form.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white font-bold text-2xl">
                        {form.fullName?.[0]?.toUpperCase() ?? '?'}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors border-2 border-white dark:border-slate-800">
                    <Camera size={13} className="text-white" />
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                </label>
              </div>
              <p className="text-center text-xs text-gray-400">Rasmga bosing yoki tanlang (max 5 MB)</p>

              {/* To'liq ism */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  To'liq ism <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Ism Familiya"
                  className="input-base"
                />
              </div>

              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.username}
                  onChange={(e) => !editing && setForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                  placeholder="username"
                  disabled={!!editing}
                  className={`input-base ${editing ? 'opacity-60 cursor-not-allowed bg-gray-50 dark:bg-slate-800' : ''}`}
                />
                {editing && <p className="text-xs text-gray-400 mt-1">Username o'zgartirib bo'lmaydi</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  {editing ? 'Parol (o\'zgartirish uchun)' : <>Parol <span className="text-red-500">*</span></>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                    placeholder={editing ? "Yangi parol kiriting (ixtiyoriy)" : "Kamida 6 belgi"}
                    className="input-base pr-11"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                    title={showPassword ? 'Parolni yashirish' : 'Parolni ko\'rsatish'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {showPassword && form.password && (
                  <p className="text-xs text-blue-500 mt-1 font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-lg">
                    {form.password}
                  </p>
                )}
              </div>

              {/* Lavozim va Telefon */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Lavozim</label>
                  <input
                    type="text"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                    placeholder="Operator"
                    className="input-base"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Telefon</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    placeholder="+998901234567"
                    className="input-base"
                  />
                </div>
              </div>

              {/* Rol */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                  Rol <span className="text-red-500">*</span>
                </label>
                <select
                  value={form.role}
                  onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="select-base"
                >
                  <option value="EMPLOYEE">👤 Xodim</option>
                  <option value="ADMIN">🔹 Admin</option>
                  <option value="SUPERADMIN">⭐ SuperAdmin</option>
                </select>
              </div>

              {/* Bo'lim */}
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Bo'lim</label>
                <select
                  value={form.departmentId}
                  onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                  className="select-base"
                >
                  <option value="">— Bo'limni tanlang —</option>
                  {depts.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <span className="text-red-500 text-xs font-medium">{error}</span>
                </div>
              )}
            </div>

            {/* Footer — always visible */}
            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800 rounded-b-2xl">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">
                Bekor
              </button>
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
