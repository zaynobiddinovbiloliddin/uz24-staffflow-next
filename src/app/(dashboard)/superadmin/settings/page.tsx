'use client';

import { useSession } from 'next-auth/react';
import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function SettingsPage() {
  const { data: session } = useSession();
  const { data: meData } = useSWR('/api/me', fetcher);
  const me = meData?.data;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Sozlamalar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Tizim ma'lumotlari</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Profil ma'lumotlari</h3>
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-blue-600 text-white font-bold text-xl flex items-center justify-center">
              {me?.fullName?.[0] ?? session?.user?.name?.[0] ?? 'A'}
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{me?.fullName ?? session?.user?.name}</p>
              <p className="text-sm text-gray-400">@{me?.username}</p>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">{me?.role ?? 'SUPERADMIN'}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tizim ma'lumotlari</h3>
        <div className="space-y-3 text-sm">
          {[
            { label: 'Loyiha', value: 'Uz24 StaffFlow' },
            { label: 'Versiya', value: 'v2.0 — Next.js + Prisma' },
            { label: 'Database', value: 'SQLite (mahalliy)' },
            { label: 'Auth', value: 'NextAuth.js v4 (JWT)' },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <span className="text-gray-500">{label}</span>
              <span className="font-medium text-gray-800 dark:text-gray-200">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-800 dark:text-amber-300">Production uchun</p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
          Database ni SQLite dan PostgreSQL ga (Neon/Supabase) ko'chirish kerak.
          <code className="ml-1 bg-amber-100 dark:bg-amber-900/50 px-1 rounded">DATABASE_URL</code> ni .env faylida yangilang.
        </p>
      </div>
    </div>
  );
}
