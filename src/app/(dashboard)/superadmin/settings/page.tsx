'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import useSWR from 'swr';
import { toast } from 'sonner';
import { Send, RefreshCw, CheckCircle, AlertCircle, Copy } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: meData } = useSWR('/api/me', fetcher);
  const me = meData?.data;

  const [sending, setSending] = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [detectedChats, setDetectedChats] = useState<any[]>([]);
  const [lastBackup, setLastBackup] = useState<string | null>(null);

  async function handleManualBackup() {
    setSending(true);
    try {
      const res = await fetch('/api/telegram/backup', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        setLastBackup(new Date().toLocaleString('uz-Latn-UZ'));
        toast.success(`Backup jo'natildi! ${data.summary ? `(${data.summary.users} xodim, ${data.summary.tasks} vazifa)` : ''}`);
      } else {
        toast.error(data.error ?? "Jo'natishda xato");
      }
    } catch {
      toast.error('Xato yuz berdi');
    } finally {
      setSending(false);
    }
  }

  async function handleDetectChatId() {
    setDetecting(true);
    setDetectedChats([]);
    try {
      const res = await fetch('/api/telegram/backup');
      const data = await res.json();
      if (data.chats?.length) {
        setDetectedChats(data.chats);
        toast.success(`${data.chats.length} ta chat topildi`);
      } else {
        toast.info(data.message ?? "Chat topilmadi. Botga /start yuboring.");
      }
    } catch {
      toast.error('Xato yuz berdi');
    } finally {
      setDetecting(false);
    }
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(String(text));
    toast.success('Nusxalandi!');
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizim va Telegram sozlamalari</p>
      </div>

      {/* Profile */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Profil ma'lumotlari</h3>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center flex-shrink-0">
            {me?.fullName?.[0] ?? session?.user?.name?.[0] ?? 'A'}
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">{me?.fullName ?? session?.user?.name}</p>
            <p className="text-sm text-gray-400">@{me?.username}</p>
            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
              {me?.role ?? 'SUPERADMIN'}
            </span>
          </div>
        </div>
      </div>

      {/* Telegram Backup */}
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

        {/* Status */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
          <CheckCircle size={15} className="text-blue-500 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-700 dark:text-blue-300">Bot ulangan: @Uz24AdminBot</p>
            {lastBackup && <p className="text-xs text-blue-500 mt-0.5">Oxirgi backup: {lastBackup}</p>}
          </div>
        </div>

        {/* Chat ID setup */}
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1.5">
              TELEGRAM_BACKUP_CHAT_ID
            </label>
            <p className="text-xs text-gray-400 mb-2">
              Botga xabar yuboring → "Chat ID topish" tugmasini bosing → Chat ID ni .env.local ga qo'shing
            </p>

            {/* Detect chat ID button */}
            <button
              onClick={handleDetectChatId}
              disabled={detecting}
              className="btn-secondary text-sm py-2 mb-3 w-full sm:w-auto flex items-center gap-2"
            >
              {detecting ? (
                <RefreshCw size={14} className="animate-spin" />
              ) : (
                <RefreshCw size={14} />
              )}
              Chat ID topish
            </button>

            {/* Detected chats */}
            {detectedChats.length > 0 && (
              <div className="space-y-2">
                {detectedChats.map((chat, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                    <div>
                      <p className="text-xs font-semibold text-gray-900 dark:text-white">{chat.title ?? 'Shaxsiy chat'}</p>
                      <p className="text-xs text-gray-400">{chat.type} · ID: <span className="font-mono font-bold text-blue-600">{chat.chat_id}</span></p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(String(chat.chat_id))}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-slate-600 text-gray-400 hover:text-blue-600 transition-colors"
                    >
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

        {/* Manual backup button */}
        <button
          onClick={handleManualBackup}
          disabled={sending}
          className="btn-primary w-full sm:w-auto"
        >
          {sending ? (
            <><RefreshCw size={15} className="animate-spin" /> Jo'natilmoqda...</>
          ) : (
            <><Send size={15} /> Hozir backup jo'natish</>
          )}
        </button>

        <p className="text-xs text-gray-400 mt-3 flex items-start gap-1.5">
          <AlertCircle size={11} className="flex-shrink-0 mt-0.5" />
          Vercel Pro rejasida har 30 daqiqada avtomatik ishlaydi. Bepul rejada — kuniga 1 marta.
        </p>
      </div>

      {/* System info */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tizim ma'lumotlari</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Loyiha', value: 'Uz24 StaffFlow' },
            { label: 'Versiya', value: 'v2.0 — Next.js 14 + Prisma' },
            { label: 'Database', value: 'PostgreSQL (Supabase)' },
            { label: 'Auth', value: 'NextAuth.js v4 (JWT)' },
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
