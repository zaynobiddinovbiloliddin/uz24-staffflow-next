'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { toast } from 'sonner';
import {
  Send, RefreshCw, CheckCircle, AlertCircle, Copy,
  Edit2, X, Save, Eye, EyeOff, Camera, Loader2,
} from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

async function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const SIZE = 96;
      const canvas = document.createElement('canvas');
      canvas.width = SIZE; canvas.height = SIZE;
      const ctx = canvas.getContext('2d')!;
      const s = Math.min(img.width, img.height);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, SIZE, SIZE);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = url;
  });
}

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: meData, mutate: mutateMe } = useSWR('/api/me', fetcher);
  const me = meData?.data;

  // Telegram state
  const [sending,       setSending]       = useState(false);
  const [detecting,     setDetecting]     = useState(false);
  const [detectedChats, setDetectedChats] = useState<any[]>([]);
  const [lastBackup,    setLastBackup]    = useState<string | null>(null);

  // Profile edit state
  const [editMode,     setEditMode]     = useState(false);
  const [profSaving,   setProfSaving]   = useState(false);
  const [profError,    setProfError]    = useState('');
  const [showNewPass,  setShowNewPass]  = useState(false);
  const [profForm,     setProfForm]     = useState({
    fullName: '', username: '', phone: '', newPassword: '', avatar: '',
  });

  function openEdit() {
    setProfForm({
      fullName:    me?.fullName ?? '',
      username:    me?.username ?? '',
      phone:       me?.phone ?? '',
      newPassword: '',
      avatar:      me?.avatar ?? '',
    });
    setProfError('');
    setShowNewPass(false);
    setEditMode(true);
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast.error('Rasm 5 MB dan oshmasligi kerak'); return; }
    try {
      const base64 = await resizeAvatar(file);
      setProfForm((f) => ({ ...f, avatar: base64 }));
    } catch { toast.error("Rasmni o'qishda xato"); }
    e.target.value = '';
  }

  async function handleProfileSave() {
    if (!profForm.fullName.trim()) { setProfError("To'liq ism kiritilmadi"); return; }
    if (!profForm.username.trim()) { setProfError('Username kiritilmadi'); return; }
    if (profForm.newPassword && profForm.newPassword.length < 6) {
      setProfError('Yangi parol kamida 6 ta belgi'); return;
    }

    setProfSaving(true); setProfError('');
    try {
      const body: Record<string, string> = {
        fullName: profForm.fullName.trim(),
        username: profForm.username.trim().toLowerCase(),
        phone:    profForm.phone.trim(),
      };
      if (profForm.newPassword)        body.newPassword = profForm.newPassword;
      if (profForm.avatar)             body.avatar      = profForm.avatar;

      const res  = await fetch('/api/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();

      if (!res.ok) { setProfError(data.message ?? 'Xato yuz berdi'); return; }

      await mutateMe();
      setEditMode(false);
      toast.success("Profil muvaffaqiyatli yangilandi");
    } catch { setProfError('Xato yuz berdi'); }
    finally { setProfSaving(false); }
  }

  async function handleManualBackup() {
    setSending(true);
    try {
      const res  = await fetch('/api/telegram/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastBackup(new Date().toLocaleString('uz-Latn-UZ'));
        toast.success(`Backup jo'natildi! ${data.summary ? `(${data.summary.users} xodim, ${data.summary.tasks} vazifa)` : ''}`);
      } else { toast.error(data.error ?? "Jo'natishda xato"); }
    } catch { toast.error('Xato yuz berdi'); }
    finally { setSending(false); }
  }

  async function handleDetectChatId() {
    setDetecting(true); setDetectedChats([]);
    try {
      const res  = await fetch('/api/telegram/backup');
      const data = await res.json();
      if (data.chats?.length) {
        setDetectedChats(data.chats);
        toast.success(`${data.chats.length} ta chat topildi`);
      } else { toast.info(data.message ?? "Chat topilmadi. Botga /start yuboring."); }
    } catch { toast.error('Xato yuz berdi'); }
    finally { setDetecting(false); }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(String(text));
    toast.success('Nusxalandi!');
  }

  const displayName   = me?.fullName   ?? session?.user?.name ?? '';
  const displayAvatar = editMode ? profForm.avatar : (me?.avatar ?? '');

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Profil va Telegram sozlamalari</p>
      </div>

      {/* ── Profile card ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Profil ma'lumotlari</h3>
          {!editMode && (
            <button
              onClick={openEdit}
              className="flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20"
            >
              <Edit2 size={13} /> Tahrirlash
            </button>
          )}
        </div>

        {!editMode ? (
          /* ── View mode ── */
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 ring-2 ring-gray-100 dark:ring-slate-700">
              {me?.avatar ? (
                <img src={me.avatar} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
                  {displayName[0]?.toUpperCase() ?? 'A'}
                </div>
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{displayName}</p>
              <p className="text-sm text-gray-400">@{me?.username}</p>
              {me?.phone && <p className="text-xs text-gray-400 mt-0.5">{me.phone}</p>}
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 mt-1 inline-block">
                {me?.role ?? 'SUPERADMIN'}
              </span>
            </div>
          </div>
        ) : (
          /* ── Edit mode ── */
          <div className="space-y-4">
            {/* Avatar */}
            <div className="flex justify-center">
              <label className="relative cursor-pointer group">
                <div className="w-20 h-20 rounded-full overflow-hidden ring-4 ring-blue-100 dark:ring-blue-900/30 bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                  {displayAvatar ? (
                    <img src={displayAvatar} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white font-bold text-2xl">
                      {profForm.fullName?.[0]?.toUpperCase() ?? 'A'}
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center shadow-md group-hover:bg-blue-700 transition-colors border-2 border-white dark:border-slate-800">
                  <Camera size={13} className="text-white" />
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
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
                value={profForm.fullName}
                onChange={(e) => setProfForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="Ism Familiya"
                className="input-base"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Username (Login) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={profForm.username}
                onChange={(e) => setProfForm((f) => ({ ...f, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') }))}
                placeholder="username"
                className="input-base"
              />
              <p className="text-xs text-gray-400 mt-1">Faqat kichik harf, raqam va _ belgisi</p>
            </div>

            {/* Telefon */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">Telefon</label>
              <input
                type="tel"
                value={profForm.phone}
                onChange={(e) => setProfForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+998901234567"
                className="input-base"
              />
            </div>

            {/* Yangi parol */}
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
                Yangi parol <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
              </label>
              <div className="relative">
                <input
                  type={showNewPass ? 'text' : 'password'}
                  value={profForm.newPassword}
                  onChange={(e) => setProfForm((f) => ({ ...f, newPassword: e.target.value }))}
                  placeholder="Kamida 6 belgi"
                  className="input-base pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPass((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Bo'sh qoldirsangiz parol o'zgarmaydi</p>
            </div>

            {/* Error */}
            {profError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                <span className="text-red-500 text-xs font-medium">{profError}</span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-1">
              <button
                onClick={() => setEditMode(false)}
                className="btn-secondary flex-1 flex items-center justify-center gap-2"
              >
                <X size={15} /> Bekor
              </button>
              <button
                onClick={handleProfileSave}
                disabled={profSaving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {profSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {profSaving ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Telegram Backup ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <Send size={16} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Telegram Backup</h3>
            <p className="text-xs text-gray-400">@Uz24AdminBot — har 30 daqiqada avtomatik</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <CheckCircle size={15} className="text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Bot ulangan: @Uz24AdminBot</p>
            {lastBackup && <p className="text-xs text-blue-500 mt-0.5">Oxirgi backup: {lastBackup}</p>}
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              TELEGRAM_BACKUP_CHAT_ID
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Botga xabar yuboring → "Chat ID topish" tugmasini bosing → Chat ID ni .env.local ga qo'shing
            </p>
            <button
              onClick={handleDetectChatId}
              disabled={detecting}
              className="btn-secondary text-sm py-2 mb-3 w-full sm:w-auto flex items-center gap-2"
            >
              <RefreshCw size={14} className={detecting ? 'animate-spin' : ''} />
              Chat ID topish
            </button>
            {detectedChats.length > 0 && (
              <div className="space-y-2">
                {detectedChats.map((chat, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{chat.title ?? 'Shaxsiy chat'}</p>
                      <p className="text-xs text-gray-400">{chat.type} · ID: <span className="font-mono font-bold text-blue-600">{chat.chat_id}</span></p>
                    </div>
                    <button onClick={() => copyToClipboard(String(chat.chat_id))} className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-blue-600 transition-colors">
                      <Copy size={14} />
                    </button>
                  </div>
                ))}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Keyin .env.local ga qo'shing:</p>
                  <code className="text-xs text-amber-600 dark:text-amber-400 block mt-1">
                    TELEGRAM_BACKUP_CHAT_ID=&quot;[yuqoridagi ID]&quot;
                  </code>
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={handleManualBackup} disabled={sending} className="btn-primary w-full sm:w-auto">
          {sending
            ? <><RefreshCw size={15} className="animate-spin" /> Jo'natilmoqda...</>
            : <><Send size={15} /> Hozir backup jo'natish</>
          }
        </button>

        <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          Vercel Pro rejasida har 30 daqiqada avtomatik ishlaydi. Bepul rejada — kuniga 1 marta.
        </p>
      </div>

      {/* ── System info ── */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tizim ma'lumotlari</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Loyiha',   value: "O'zbekiston24" },
            { label: 'Versiya',  value: 'v2.0 — Next.js 14 + Prisma' },
            { label: 'Database', value: 'PostgreSQL (Supabase)' },
            { label: 'Auth',     value: 'NextAuth.js v4 (JWT)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
