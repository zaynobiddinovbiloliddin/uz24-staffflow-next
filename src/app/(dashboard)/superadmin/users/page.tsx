'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import ConfirmModal from '@/components/ui/ConfirmModal';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_LABELS: Record<string, string> = { SUPERADMIN: 'SuperAdmin', ADMIN: 'Admin', EMPLOYEE: 'Xodim' };
const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  ADMIN:      'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  EMPLOYEE:   'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

const EMPTY = { fullName: '', username: '', password: '', role: 'EMPLOYEE', position: '', phone: '', departmentId: '' };

export default function UsersPage() {
  const [search,     setSearch]     = useState('');
  const [modal,      setModal]      = useState(false);
  const [editing,    setEditing]    = useState<any>(null);
  const [form,       setForm]       = useState(EMPTY);
  const [saving,     setSaving]     = useState(false);
  const [error,      setError]      = useState('');
  const [busy,       setBusy]       = useState<Set<string>>(new Set()); // per-row loading
  const [confirmDlg, setConfirmDlg] = useState<{ open: boolean; message: string; onConfirm: () => void }>
                                       ({ open: false, message: '', onConfirm: () => {} });

  const { data: usersData, mutate } = useSWR('/api/users', fetcher);
  const { data: deptsData }         = useSWR('/api/departments', fetcher);

  const allUsers = usersData?.data ?? [];
  const users = allUsers.filter((u: any) =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );
  const depts = deptsData?.data ?? [];

  function markBusy(id: string, on: boolean) {
    setBusy((prev) => {
      const next = new Set(prev);
      on ? next.add(id) : next.delete(id);
      return next;
    });
  }

  function openCreate() { setEditing(null); setForm(EMPTY); setError(''); setModal(true); }
  function openEdit(user: any) {
    setEditing(user);
    setForm({ fullName: user.fullName, username: user.username, password: '', role: user.role, position: user.position ?? '', phone: user.phone ?? '', departmentId: user.departmentId ?? '' });
    setError('');
    setModal(true);
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    try {
      const url    = editing ? `/api/users/${editing.id}` : '/api/users';
      const method = editing ? 'PUT' : 'POST';
      const body   = { ...form };
      if (editing && !body.password) delete (body as any).password;

      // Optimistic: update/add in cache immediately
      if (editing) {
        mutate({ ...usersData, data: allUsers.map((u: any) => u.id === editing.id ? { ...u, ...form } : u) }, false);
      }

      const res  = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) {
        mutate(); // revert on error
        setError(data.message);
        return;
      }

      setModal(false);
      mutate(); // sync with server
    } catch {
      mutate();
      setError('Xato yuz berdi');
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
        // Optimistic: remove from list immediately
        mutate({ ...usersData, data: allUsers.filter((u: any) => u.id !== id) }, false);
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
        if (!res.ok) mutate(); // revert on error
      },
    });
  }

  async function handleToggle(id: string) {
    if (busy.has(id)) return;
    markBusy(id, true);
    // Optimistic: flip isActive immediately
    mutate({ ...usersData, data: allUsers.map((u: any) => u.id === id ? { ...u, isActive: !u.isActive } : u) }, false);
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle' }) });
      if (!res.ok) mutate(); // revert on error
    } catch {
      mutate(); // revert on error
    } finally {
      markBusy(id, false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} ta foydalanuvchi</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
          <Plus size={16} /> Yangi
        </button>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki username bo'yicha qidirish..."
          className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50 dark:bg-slate-900/50">
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Xodim</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden md:table-cell">Lavozim</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden lg:table-cell">Bo'lim</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium">Rol</th>
              <th className="text-left px-4 py-3 text-gray-500 font-medium hidden sm:table-cell">Holat</th>
              <th className="text-right px-4 py-3 text-gray-500 font-medium">Amal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
            {!usersData && Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={6} className="px-4 py-3">
                  <div className="h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
                </td>
              </tr>
            ))}
            {users.map((user: any) => (
              <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-slate-700/30 transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-semibold text-sm flex items-center justify-center flex-shrink-0">
                      {user.fullName[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{user.fullName}</p>
                      <p className="text-xs text-gray-400">@{user.username}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden md:table-cell">{user.position ?? '—'}</td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400 hidden lg:table-cell">{user.department?.name ?? '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                </td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${user.isActive
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-gray-100 text-gray-500 dark:bg-slate-700 dark:text-gray-400'}`}>
                    {user.isActive ? 'Faol' : 'Nofaol'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {/* Toggle */}
                    <button
                      onClick={() => handleToggle(user.id)}
                      disabled={busy.has(user.id)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
                      title={user.isActive ? 'Bloklash' : 'Faollashtirish'}
                    >
                      {busy.has(user.id)
                        ? <Loader2 size={16} className="animate-spin text-blue-500" />
                        : user.isActive
                          ? <ToggleRight size={16} className="text-green-500" />
                          : <ToggleLeft size={16} />
                      }
                    </button>
                    {/* Edit */}
                    <button
                      onClick={() => openEdit(user)}
                      className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Tahrirlash"
                    >
                      <Edit2 size={15} />
                    </button>
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(user.id, user.fullName)}
                      className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
                      title="O'chirish"
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

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">
              {editing ? 'Tahrirlash' : 'Yangi foydalanuvchi'}
            </h3>

            <div className="space-y-3">
              {[
                { label: "To'liq ism *",                                    key: 'fullName',  type: 'text',     placeholder: 'Ism Familiya' },
                { label: 'Username *',                                       key: 'username',  type: 'text',     placeholder: 'username' },
                { label: editing ? "Parol (o'zgartirish uchun)" : 'Parol *', key: 'password',  type: 'password', placeholder: '••••••' },
                { label: 'Lavozim',                                          key: 'position',  type: 'text',     placeholder: 'Operator' },
                { label: 'Telefon',                                          key: 'phone',     type: 'text',     placeholder: '+998901234567' },
              ].map(({ label, key, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
                  <input
                    type={type}
                    value={(form as any)[key]}
                    onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Rol *</label>
                <select value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="EMPLOYEE">Xodim</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPERADMIN">SuperAdmin</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Bo'lim</label>
                <select value={form.departmentId} onChange={(e) => setForm((f) => ({ ...f, departmentId: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">— Tanlang —</option>
                  {depts.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            {error && <p className="mt-3 text-sm text-red-500">{error}</p>}

            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors">
                Bekor
              </button>
              <button onClick={handleSave} disabled={saving}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium transition-colors flex items-center justify-center gap-2">
                {saving && <Loader2 size={14} className="animate-spin" />}
                {saving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmModal
        open={confirmDlg.open}
        message={confirmDlg.message}
        onConfirm={confirmDlg.onConfirm}
        onCancel={() => setConfirmDlg((d) => ({ ...d, open: false }))}
      />
    </div>
  );
}
