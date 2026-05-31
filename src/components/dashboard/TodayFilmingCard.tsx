'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { Clapperboard, FileDown, Plus, ArrowRight } from 'lucide-react';
import { fetcher } from '@/lib/fetcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface FilmingOperator {
  id: string;
  cameraNumber: string;
  exitTime: string;
  operatorNames: string[];
  eventLocation: string;
  eventDescription: string | null;
  equipment: string;
  sortOrder: number;
}

interface FilmingEntry {
  id: string;
  date: string;
  title: string;
  approvedBy: string;
  operators: FilmingOperator[];
}

const UZ_MONTHS = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return `${d.getDate()} ${UZ_MONTHS[d.getMonth() + 1]} ${d.getFullYear()}`;
}

const MAX_VISIBLE = 4;

// ─── Component ────────────────────────────────────────────────────────────────

export function TodayFilmingCard({
  filmingHref,
  userFullName,
  canCreate = false,
}: {
  filmingHref: string;
  userFullName?: string;
  canCreate?: boolean;
}) {
  const { data } = useSWR('/api/filming/today', fetcher, { refreshInterval: 60000 });
  const entry: FilmingEntry | null = data?.data ?? null;
  const isLoading = !data;

  // For employee view: filter only their rows
  const allRows    = entry?.operators ?? [];
  const rows       = userFullName
    ? allRows.filter((op) => op.operatorNames.includes(userFullName))
    : allRows;
  const visible    = rows.slice(0, MAX_VISIBLE);
  const hiddenMore = rows.length - MAX_VISIBLE;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
          <div className="h-4 w-52 bg-gray-100 dark:bg-slate-700 rounded animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-9 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── No entry today ─────────────────────────────────────────────────────────
  if (!entry) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
          <Clapperboard size={16} className="text-blue-400" /> Bugungi tasvirga olish jadvali
        </h3>
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Clapperboard size={28} className="text-gray-200 dark:text-slate-600 mb-2" />
          <p className="text-sm text-gray-400">Bugun uchun tasvirga olish jadvali kiritilmagan.</p>
          {canCreate && (
            <Link
              href={filmingHref}
              className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1.5 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
            >
              <Plus size={13} /> Jadval yaratish
            </Link>
          )}
        </div>
      </div>
    );
  }

  // ── Entry exists but employee has no rows ──────────────────────────────────
  if (userFullName && rows.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clapperboard size={16} className="text-blue-400" /> Bugungi tasvirga olish jadvali
          </h3>
          <Link href={filmingHref} className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium">
            Batafsil <ArrowRight size={11} />
          </Link>
        </div>
        <div className="flex flex-col items-center justify-center py-5 text-center">
          <Clapperboard size={24} className="text-gray-200 dark:text-slate-600 mb-1.5" />
          <p className="text-sm text-gray-400">Bugun sizga tasvirga olish vazifasi yo'q</p>
        </div>
      </div>
    );
  }

  // ── Has rows — show table ──────────────────────────────────────────���───────
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between px-5 pt-4 pb-3 gap-3 flex-wrap">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <Clapperboard size={16} className="text-blue-500" />
            Bugungi tasvirga olish jadvali
            <span className="text-xs font-normal bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-full">
              {rows.length} ta qator
            </span>
          </h3>
          <p className="text-xs text-gray-400 mt-0.5">
            {fmtDate(entry.date)} · Tasdiqlovchi: <span className="font-medium text-gray-600 dark:text-gray-300">{entry.approvedBy}</span>
          </p>
        </div>
        <Link
          href={filmingHref}
          className="text-xs text-blue-500 hover:text-blue-600 flex items-center gap-1 font-medium whitespace-nowrap"
        >
          Batafsil <ArrowRight size={11} />
        </Link>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[400px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-slate-700/50 border-y border-gray-100 dark:border-slate-700">
              <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400 w-[15%]">
                Kamera
              </th>
              <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400 w-[20%]">
                Vaqt
              </th>
              <th className="hidden sm:table-cell text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400 w-[25%]">
                Operatorlar
              </th>
              <th className="text-left px-3 py-2 font-semibold text-gray-500 dark:text-gray-400">
                Joy
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-slate-700/40">
            {visible.map((op) => (
              <tr key={op.id} className="hover:bg-blue-50/20 dark:hover:bg-slate-700/20">
                <td className="px-3 py-2.5 font-bold text-blue-600 dark:text-blue-400">
                  {op.cameraNumber || '—'}
                </td>
                <td className="px-3 py-2.5 font-medium text-gray-700 dark:text-gray-300 tabular-nums">
                  {op.exitTime || '—'}
                </td>
                <td className="hidden sm:table-cell px-3 py-2.5 text-gray-500 dark:text-gray-400">
                  <div className="max-w-[160px] truncate">
                    {op.operatorNames.length > 0 ? op.operatorNames.join(', ') : '—'}
                  </div>
                </td>
                <td className="px-3 py-2.5 text-gray-600 dark:text-gray-300">
                  <div className="max-w-[200px] truncate" title={op.eventLocation}>
                    {op.eventLocation || '—'}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-50 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/20">
        <span className="text-xs text-gray-400">
          {hiddenMore > 0 ? `va yana ${hiddenMore} ta qator...` : ''}
        </span>
        <a
          href={`/api/filming/${entry.id}/export`}
          className="flex items-center gap-1.5 text-xs font-medium text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300 transition-colors"
        >
          <FileDown size={13} /> Word yuklab olish
        </a>
      </div>
    </div>
  );
}
