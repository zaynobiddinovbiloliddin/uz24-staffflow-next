'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import useSWR from 'swr';
import {
  ArrowLeft, User, Phone, Building2, Calendar, ClipboardList,
  Video, Link2, Plus, Trash2, ExternalLink, Camera,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioLink { url: string; title?: string }

function parseLinks(raw: string[]): PortfolioLink[] {
  return (raw ?? []).map((s) => {
    try { return JSON.parse(s) as PortfolioLink; } catch { return { url: s }; }
  });
}

// ─── Portfolio section (admin-managed) ───────────────────────────────────────

function PortfolioSection({
  userId, rawLinks, onMutate,
}: {
  userId: string;
  rawLinks: string[];
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
      if (!res.ok) { const d = await res.json(); toast.error(d.message ?? 'Xato'); return; }
      toast.success("Link qo'shildi");
      setNewUrl(''); setNewTitle(''); setShowForm(false);
      onMutate();
    } catch { toast.error('Xato'); } finally { setSaving(false); }
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
      if (!res.ok) { toast.error("O'chirishda xato"); return; }
      toast.success("Link o'chirildi");
      onMutate();
    } catch { toast.error('Xato'); } finally { setDeletingUrl(null); }
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
          <Link2 size={16} /> Portfolio
          {links.length > 0 && (
            <span className="text-xs font-normal text-gray-400 ml-1">({links.length} ta)</span>
          )}
        </h3>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700"
          >
            <Plus size={13} /> Link qo'shish
          </button>
        )}
      </div>

      {showForm && (
        <div className="mb-4 p-3 bg-gray-50 dark:bg-slate-700/50 rounded-xl space-y-2 border border-gray-100 dark:border-slate-600">
          <input type="text" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Syomka nomi (ixtiyoriy)" className="input-base text-sm py-2" />
          <input type="url" value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
            placeholder="https://youtube.com/..."
            className="input-base text-sm py-2"
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }} />
          <div className="flex gap-2">
            <button onClick={handleAdd} disabled={saving} className="btn-primary flex-1 text-sm py-2">
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
            <button onClick={() => { setShowForm(false); setNewUrl(''); setNewTitle(''); }}
              className="btn-secondary flex-1 text-sm py-2">Bekor qilish</button>
          </div>
        </div>
      )}

      {links.length === 0 ? (
        <div className="text-center py-4">
          <Link2 size={24} className="mx-auto text-gray-200 dark:text-slate-600 mb-1.5" />
          <p className="text-sm text-gray-400">Portfolio linki yo'q</p>
        </div>
      ) : (
        <div className="space-y-2">
          {links.map((link) => (
            <div key={link.url} className="flex items-start justify-between gap-2 group py-2 border-b border-gray-50 dark:border-slate-700 last:border-0">
              <a href={link.url} target="_blank" rel="noopener noreferrer"
                className="flex items-start gap-2 min-w-0 flex-1 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                <ExternalLink size={13} className="flex-shrink-0 mt-0.5 text-gray-400" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight">
                    {link.title || link.url}
                  </p>
                  {link.title && <p className="text-xs text-gray-400 truncate">{link.url}</p>}
                </div>
              </a>
              <button onClick={() => handleDelete(link.url)} disabled={deletingUrl === link.url}
                className="flex-shrink-0 p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors opacity-0 group-hover:opacity-100">
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminEmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: userData, mutate: mutateUser } = useSWR(`/api/users/${id}`, fetcher);
  const employee = userData?.data;

  const { data: filmingData } = useSWR(
    employee?.fullName
      ? `/api/filming?operatorName=${encodeURIComponent(employee.fullName)}`
      : null,
    fetcher,
  );

  const today = new Date();
  const monthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
  const monthEnd = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()}`;
  const { data: schedData } = useSWR(
    id ? `/api/schedules?from=${monthStart}&to=${monthEnd}&userId=${id}` : null,
    fetcher,
  );

  const myFilmings: any[] = (filmingData?.data ?? []).slice(0, 10);
  const workDaysThisMonth = (schedData?.data ?? []).filter(
    (s: any) => !['Dam', 'Kasallik', "Ta'til", 'Otpusk', 'Dam olish'].includes(s.shiftType)
  ).length;

  if (!userData) return (
    <div className="space-y-4 max-w-2xl">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
      ))}
    </div>
  );

  return (
    <div className="space-y-5 max-w-2xl page-content">
      {/* Back nav */}
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
      >
        <ArrowLeft size={15} /> Xodimlar ro'yxatiga qaytish
      </button>

      {/* Profile card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-6">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-shrink-0">
            {employee.avatar ? (
              <img src={employee.avatar} alt={employee.fullName} className="w-16 h-16 rounded-2xl object-cover" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 text-white font-bold text-2xl flex items-center justify-center">
                {employee.fullName[0]}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-gray-900 dark:text-white truncate">{employee.fullName}</h1>
            <p className="text-sm text-gray-400">@{employee.username}</p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${employee.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                {employee.isActive ? 'Faol' : 'Nofaol'}
              </span>
              {workDaysThisMonth > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
                  Bu oy: {workDaysThisMonth} kun
                </span>
              )}
              {(employee.portfolioLinks?.length ?? 0) > 0 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400">
                  {employee.portfolioLinks.length} ta portfolio
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { icon: <User size={14} />, label: 'Lavozim', value: employee.position ?? "Ko'rsatilmagan" },
            { icon: <Phone size={14} />, label: 'Telefon', value: employee.phone ?? "Ko'rsatilmagan" },
            { icon: <Building2 size={14} />, label: "Bo'lim", value: employee.department?.name ?? 'Tayinlanmagan' },
            { icon: <Calendar size={14} />, label: "Qo'shilgan", value: format(new Date(employee.createdAt), 'dd.MM.yyyy') },
          ].map(({ icon, label, value }) => (
            <div key={label} className="flex items-center gap-2.5 p-3 rounded-lg bg-gray-50 dark:bg-slate-700/30">
              <div className="text-gray-400 flex-shrink-0">{icon}</div>
              <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Task stats */}
      {(employee._count?.assignedTasks ?? 0) > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
            <ClipboardList size={15} /> Faol vazifalar
          </h3>
          <p className="text-2xl font-bold text-blue-600">{employee._count.assignedTasks}</p>
        </div>
      )}

      {/* Portfolio */}
      <PortfolioSection
        userId={id}
        rawLinks={employee.portfolioLinks ?? []}
        onMutate={mutateUser}
      />

      {/* Filming history */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <Video size={16} /> Suratga olish tarixi
        </h3>
        {!filmingData ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-12 bg-gray-100 dark:bg-slate-700 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : myFilmings.length === 0 ? (
          <div className="text-center py-4">
            <Video size={24} className="mx-auto text-gray-200 dark:text-slate-600 mb-1.5" />
            <p className="text-sm text-gray-400">Suratga olish jadvaliga kiritilmagan</p>
          </div>
        ) : (
          <div className="space-y-1">
            {myFilmings.map((entry: any) => {
              const ops = entry.operators?.filter((op: any) =>
                op.operatorNames?.includes(employee.fullName)
              ) ?? [];
              return ops.map((op: any) => (
                <div key={`${entry.id}-${op.id}`}
                  className="flex items-start justify-between py-2 border-b border-gray-50 dark:border-slate-700 last:border-0 gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 rounded-full">
                        Kamera {op.cameraNumber || '?'}
                      </span>
                      {op.exitTime && <span className="text-xs text-gray-500">{op.exitTime}</span>}
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 truncate">{op.eventLocation}</p>
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0 mt-1">
                    {format(new Date(entry.date + 'T00:00:00'), 'dd.MM.yyyy')}
                  </span>
                </div>
              ));
            })}
          </div>
        )}
      </div>
    </div>
  );
}
