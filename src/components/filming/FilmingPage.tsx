'use client';

import { useState, useRef, useEffect, useId } from 'react';
import useSWR from 'swr';
import { format } from 'date-fns';
import {
  Plus, Trash2, FileDown, Video, ArrowLeft, ChevronUp,
  ChevronDown, Edit2, CheckSquare, Square,
} from 'lucide-react';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';

// ─── Types ──────────────────────────────────────────────────────────────────

interface FilmingOperator {
  id: string;
  cameraNumber: string;
  exitTime: string;
  operatorNames: string[];
  eventLocation: string;
  eventDescription: string | null;
  reporterNames: string[];
  equipment: string;
  sortOrder: number;
}

interface FilmingEntry {
  id: string;
  date: string;
  title: string;
  approvedBy: string;
  createdBy: { id: string; fullName: string };
  operators: FilmingOperator[];
}

interface OperatorRowForm {
  _key: string;
  cameraNumber: string;
  exitTime: string;
  operatorNames: string[];
  eventLocation: string;
  eventDescription: string;
  reporterText: string;
  equipment: string;
}

interface UserOption {
  id: string;
  fullName: string;
  position?: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const DEFAULT_EQUIPMENT = 'HD jamlanmasi, mikrofon, chiroq, avtotransport';
const today = format(new Date(), 'yyyy-MM-dd');

function emptyRow(idx: number): OperatorRowForm {
  return {
    _key: `new-${Date.now()}-${idx}`,
    cameraNumber: '',
    exitTime: '',
    operatorNames: [],
    eventLocation: '',
    eventDescription: '',
    reporterText: '',
    equipment: DEFAULT_EQUIPMENT,
  };
}

function toFormRows(ops: FilmingOperator[]): OperatorRowForm[] {
  return ops.map((op) => ({
    _key: op.id,
    cameraNumber: op.cameraNumber,
    exitTime: op.exitTime,
    operatorNames: op.operatorNames,
    eventLocation: op.eventLocation,
    eventDescription: op.eventDescription ?? '',
    reporterText: op.reporterNames.join(', '),
    equipment: op.equipment,
  }));
}

// ─── OperatorRow multi-select dropdown ───────────────────────────────────────

function OperatorSelect({
  selected,
  users,
  onChange,
}: {
  selected: string[];
  users: UserOption[];
  onChange: (names: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  function toggle(name: string) {
    onChange(selected.includes(name) ? selected.filter((n) => n !== name) : [...selected, name]);
  }

  const label = selected.length === 0
    ? 'Operator tanlang'
    : `${selected.length} xodim tanlandi`;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="input-base flex items-center justify-between gap-2 text-left"
      >
        <span className={selected.length === 0 ? 'text-gray-400 dark:text-slate-500' : ''}>
          {label}
        </span>
        <span className="text-gray-400 text-xs">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 left-0 right-0 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-600 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {users.length === 0 && (
            <p className="px-3 py-4 text-xs text-gray-400 text-center">Xodimlar yo'q</p>
          )}
          {users.map((u) => {
            const checked = selected.includes(u.fullName);
            return (
              <button
                key={u.id}
                type="button"
                onClick={() => toggle(u.fullName)}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-gray-50 dark:hover:bg-slate-700 text-left transition-colors"
              >
                {checked
                  ? <CheckSquare size={15} className="text-blue-600 flex-shrink-0" />
                  : <Square size={15} className="text-gray-300 dark:text-slate-500 flex-shrink-0" />}
                <span className="text-sm text-gray-800 dark:text-gray-200 flex-1 truncate">{u.fullName}</span>
                {u.position && (
                  <span className="text-xs text-gray-400 flex-shrink-0">{u.position}</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Single row form card ─────────────────────────────────────────────────────

function RowCard({
  row,
  idx,
  total,
  users,
  reporterContacts,
  onChange,
  onDelete,
  onMove,
}: {
  row: OperatorRowForm;
  idx: number;
  total: number;
  users: UserOption[];
  reporterContacts: Array<{ id: string; fullName: string; phone: string }>;
  onChange: (patch: Partial<OperatorRowForm>) => void;
  onDelete: () => void;
  onMove: (dir: 'up' | 'down') => void;
}) {
  return (
    <div className="border border-gray-200 dark:border-slate-600 rounded-xl p-4 space-y-3 bg-gray-50 dark:bg-slate-700/30">
      {/* Row header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
          #{idx + 1} qator
        </span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={idx === 0}
            onClick={() => onMove('up')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-600"
          >
            <ChevronUp size={14} />
          </button>
          <button
            type="button"
            disabled={idx === total - 1}
            onClick={() => onMove('down')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-white disabled:opacity-30 hover:bg-gray-100 dark:hover:bg-slate-600"
          >
            <ChevronDown size={14} />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Kamera + Chiqish vaqti */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="field-label">Kamera raqami</label>
          <input
            type="text"
            value={row.cameraNumber}
            onChange={(e) => onChange({ cameraNumber: e.target.value })}
            placeholder="1"
            className="input-base"
          />
        </div>
        <div>
          <label className="field-label">Chiqish vaqti</label>
          <input
            type="text"
            value={row.exitTime}
            onChange={(e) => onChange({ exitTime: e.target.value })}
            placeholder="09:00 yoki 09:00-13:00"
            className="input-base"
          />
        </div>
      </div>

      {/* Operators */}
      <div>
        <label className="field-label">Operator va texnik xodimlar</label>
        <OperatorSelect
          selected={row.operatorNames}
          users={users}
          onChange={(names) => onChange({ operatorNames: names })}
        />
        {row.operatorNames.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {row.operatorNames.map((n) => (
              <span
                key={n}
                className="text-xs bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded-full"
              >
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="field-label">Tadbir joyi *</label>
        <input
          type="text"
          value={row.eventLocation}
          onChange={(e) => onChange({ eventLocation: e.target.value })}
          placeholder="Masalan: Navoiy ko'chasi 3"
          className="input-base"
        />
      </div>

      {/* Description */}
      <div>
        <label className="field-label">Tadbir mavzusi</label>
        <textarea
          rows={2}
          value={row.eventDescription}
          onChange={(e) => onChange({ eventDescription: e.target.value })}
          placeholder="Masalan: Milliy bayram tadbiri"
          className="input-base resize-none"
        />
      </div>

      {/* Reporters */}
      <div>
        <label className="field-label">Muxbirlar</label>
        {reporterContacts.length > 0 && (
          <div className="mb-1.5 flex flex-wrap gap-1">
            {reporterContacts.map((c) => {
              const existingNames = row.reporterText.split(',').map((s) => s.trim()).filter(Boolean);
              const isSelected = existingNames.includes(c.fullName);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    const names = row.reporterText.split(',').map((s) => s.trim()).filter(Boolean);
                    if (isSelected) {
                      onChange({ reporterText: names.filter((n) => n !== c.fullName).join(', ') });
                    } else {
                      onChange({ reporterText: [...names, c.fullName].join(', ') });
                    }
                  }}
                  className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                    isSelected
                      ? 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-300'
                      : 'bg-white dark:bg-slate-700 border-gray-200 dark:border-slate-600 text-gray-600 dark:text-gray-300 hover:border-green-300 hover:text-green-700'
                  }`}
                >
                  {isSelected ? '✓ ' : ''}{c.fullName}
                </button>
              );
            })}
          </div>
        )}
        <input
          type="text"
          value={row.reporterText}
          onChange={(e) => onChange({ reporterText: e.target.value })}
          placeholder={reporterContacts.length > 0 ? 'Yoki qo\'lda kiriting...' : 'A. Karimov, B. Hasanov'}
          className="input-base"
        />
      </div>

      {/* Equipment */}
      <div>
        <label className="field-label">Kerakli jihoz va texnika</label>
        <input
          type="text"
          value={row.equipment}
          onChange={(e) => onChange({ equipment: e.target.value })}
          className="input-base"
        />
      </div>
    </div>
  );
}

// ─── Schedule view table ──────────────────────────────────────────────────────

function ScheduleViewTable({ entry, canEdit, onEdit }: {
  entry: FilmingEntry;
  canEdit: boolean;
  onEdit: () => void;
}) {
  function handleDownload() {
    window.location.href = `/api/filming/${entry.id}/export`;
  }

  return (
    <div className="space-y-4">
      {/* Entry header */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-5">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{entry.title}</h2>
            <p className="text-sm text-gray-500 mt-0.5">
              {format(new Date(entry.date + 'T00:00:00'), 'dd.MM.yyyy')} ·{' '}
              <span className="text-xs">{entry.operators.length} qator</span>
            </p>
          </div>
          <div className="text-right text-xs text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-slate-600 rounded-lg px-3 py-2">
            <p className="font-bold text-gray-700 dark:text-gray-300">TASDIQLAYMAN</p>
            <p>"O'zbekiston 24" ijodiy</p>
            <p>birlashmasi" DM direktori</p>
            <p className="font-medium text-gray-700 dark:text-gray-300">
              __________{entry.approvedBy}
            </p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <p className="text-xs font-semibold text-red-500 px-1">
        Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.
      </p>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[600px]">
            <thead>
              <tr className="bg-gray-100 dark:bg-slate-700 border-b border-gray-200 dark:border-slate-600">
                {['Kamera', 'Chiqish vaqti', 'Operator va texnik xodim', "Tadbir joyi va mavzusi", 'Muxbirlar'].map((h) => (
                  <th key={h} className="text-left px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-300">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {entry.operators.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-gray-400 text-xs">
                    Qatorlar yo'q
                  </td>
                </tr>
              )}
              {entry.operators.map((op) => (
                <>
                  <tr key={op.id} className="border-b border-gray-50 dark:border-slate-700">
                    <td className="px-3 py-2.5 font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                      {op.cameraNumber || '—'}
                    </td>
                    <td className="px-3 py-2.5 font-medium whitespace-nowrap">{op.exitTime || '—'}</td>
                    <td className="px-3 py-2.5">
                      {op.operatorNames.length > 0
                        ? op.operatorNames.map((n) => (
                            <div key={n} className="text-xs">{n}</div>
                          ))
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-gray-800 dark:text-gray-200 text-xs">{op.eventLocation}</p>
                      {op.eventDescription && (
                        <p className="text-xs text-gray-400 mt-0.5">{op.eventDescription}</p>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">
                      {op.reporterNames.length > 0
                        ? op.reporterNames.join(', ')
                        : '—'}
                    </td>
                  </tr>
                  <tr key={`eq-${op.id}`} className="border-b border-gray-100 dark:border-slate-700">
                    <td colSpan={5} className="px-3 py-1.5 bg-blue-50/70 dark:bg-blue-900/10">
                      <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                        Kerakli jihoz va texnika:{' '}
                      </span>
                      <span className="text-xs text-gray-500">{op.equipment}</span>
                    </td>
                  </tr>
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-3 flex-wrap">
        <button
          onClick={handleDownload}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors"
        >
          <FileDown size={15} /> Word yuklab olish
        </button>
        {canEdit && (
          <button onClick={onEdit} className="btn-secondary flex items-center gap-2">
            <Edit2 size={14} /> Tahrirlash
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function FilmingPage({ canEdit }: { canEdit: boolean }) {
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<'view' | 'create' | 'edit'>('view');
  const [showDetail, setShowDetail] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formDate, setFormDate] = useState(today);
  const [formApproved, setFormApproved] = useState('M. Safarov');
  const [rows, setRows] = useState<OperatorRowForm[]>([emptyRow(0)]);

  const { data: entriesData, mutate } = useSWR(
    `/api/filming?month=${filterMonth}`,
    fetcher,
  );
  const { data: usersData } = useSWR('/api/users', fetcher);
  const { data: reporterContactsData } = useSWR('/api/contacts?type=REPORTER', fetcher);

  const entries: FilmingEntry[] = entriesData?.data ?? [];
  const users: UserOption[] = (usersData?.data ?? []).filter((u: any) => u.isActive);
  const reporterContacts: Array<{ id: string; fullName: string; phone: string }> =
    reporterContactsData?.data ?? [];
  const isLoading = !entriesData;

  const selectedEntry = entries.find((e) => e.id === selectedId) ?? null;

  // ── Row operations ───────────────────────────────────────────────────────

  function addRow() {
    setRows((r) => [...r, emptyRow(r.length)]);
  }

  function updateRow(idx: number, patch: Partial<OperatorRowForm>) {
    setRows((r) => r.map((row, i) => (i === idx ? { ...row, ...patch } : row)));
  }

  function deleteRow(idx: number) {
    setRows((r) => r.filter((_, i) => i !== idx));
  }

  function moveRow(idx: number, dir: 'up' | 'down') {
    setRows((r) => {
      const next = [...r];
      const swap = dir === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return next;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
  }

  // ── Open create form ─────────────────────────────────────────────────────

  function openCreate() {
    setFormDate(today);
    setFormApproved('M. Safarov');
    setRows([emptyRow(0)]);
    setSelectedId(null);
    setMode('create');
    setShowDetail(true);
  }

  // ── Open edit form ───────────────────────────────────────────────────────

  function openEdit() {
    if (!selectedEntry) return;
    setFormDate(selectedEntry.date.slice(0, 10));
    setFormApproved(selectedEntry.approvedBy);
    setRows(toFormRows(selectedEntry.operators));
    setMode('edit');
  }

  // ── Select entry ─────────────────────────────────────────────────────────

  function selectEntry(id: string) {
    setSelectedId(id);
    setMode('view');
    setShowDetail(true);
  }

  // ── Cancel edit/create ───────────────────────────────────────────────────

  function cancelForm() {
    if (selectedEntry) {
      setMode('view');
    } else {
      setShowDetail(false);
      setMode('view');
    }
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!formDate) { toast.error('Sanani kiriting'); return; }
    if (rows.length === 0) { toast.error("Kamida bitta qator qo'shing"); return; }
    const emptyLoc = rows.find((r) => !r.eventLocation.trim());
    if (emptyLoc) { toast.error('Tadbir joyini kiriting'); return; }

    setSaving(true);
    try {
      const body = {
        date: formDate,
        approvedBy: formApproved,
        operators: rows.map((r, idx) => ({
          cameraNumber: r.cameraNumber,
          exitTime: r.exitTime,
          operatorNames: r.operatorNames,
          eventLocation: r.eventLocation,
          eventDescription: r.eventDescription || null,
          reporterNames: r.reporterText.split(',').map((s) => s.trim()).filter(Boolean),
          equipment: r.equipment || DEFAULT_EQUIPMENT,
          sortOrder: idx,
        })),
      };

      const isEdit = mode === 'edit' && selectedEntry;
      const url = isEdit ? `/api/filming/${selectedEntry.id}` : '/api/filming';
      const method = isEdit ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d = await res.json();
        toast.error(d.message ?? 'Xato yuz berdi');
        return;
      }

      const saved = await res.json();
      toast.success(isEdit ? 'Jadval yangilandi' : 'Jadval saqlandi');
      await mutate();

      const savedId = saved.data?.id;
      if (savedId) {
        setSelectedId(savedId);
        setMode('view');
      }
    } catch {
      toast.error('Server bilan bog\'lanishda xato');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ───────────────────────────────────────────────────────────────

  async function handleDelete() {
    if (!selectedEntry) return;
    if (!confirm(`"${format(new Date(selectedEntry.date + 'T00:00:00'), 'dd.MM.yyyy')}" jadvalini o'chirmoqchimisiz?`)) return;

    const res = await fetch(`/api/filming/${selectedEntry.id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      toast.success("Jadval o'chirildi");
      setSelectedId(null);
      setMode('view');
      setShowDetail(false);
      mutate();
    } else {
      toast.error("O'chirishda xato yuz berdi");
    }
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  // Skeleton loader for list
  const ListSkeleton = () => (
    <div className="space-y-2 p-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-14 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  // Left panel — entry list
  const ListPanel = (
    <div className="flex flex-col h-full min-h-0">
      <div className="px-3 pt-3 pb-2 flex-shrink-0">
        <input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="input-base text-sm"
        />
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        {isLoading && <ListSkeleton />}
        {!isLoading && entries.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Video size={32} className="opacity-30 mb-2" />
            <p className="text-xs">Bu oy uchun jadval yo'q</p>
          </div>
        )}
        <ul className="p-2 space-y-1">
          {entries.map((e) => {
            const dateStr = e.date.slice(0, 10);
            const isToday = dateStr === today;
            const isSelected = e.id === selectedId;
            return (
              <li key={e.id}>
                <button
                  onClick={() => selectEntry(e.id)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl transition-all text-sm ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm'
                      : isToday
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/30'
                      : 'hover:bg-gray-100 dark:hover:bg-slate-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">
                      {format(new Date(dateStr + 'T00:00:00'), 'dd.MM.yyyy')}
                    </span>
                    {isToday && !isSelected && (
                      <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded-full">bugun</span>
                    )}
                  </div>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'}`}>
                    {e.operators.length} qator
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {canEdit && (
        <div className="p-3 flex-shrink-0 border-t border-gray-100 dark:border-slate-700">
          <button onClick={openCreate} className="btn-primary w-full flex items-center justify-center gap-2 text-sm">
            <Plus size={15} /> Yangi jadval
          </button>
        </div>
      )}
    </div>
  );

  // Right panel — detail / form
  const DetailPanel = (
    <div className="flex-1 min-h-0 overflow-y-auto p-4">
      {/* Mobile back button */}
      <button
        onClick={() => { setShowDetail(false); setMode('view'); }}
        className="md:hidden flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 mb-4"
      >
        <ArrowLeft size={15} /> Orqaga
      </button>

      {/* CREATE / EDIT form */}
      {(mode === 'create' || mode === 'edit') && (
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-white">
              {mode === 'create' ? 'Yangi jadval' : 'Jadvalni tahrirlash'}
            </h3>
            {mode === 'edit' && canEdit && (
              <button
                onClick={handleDelete}
                className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1"
              >
                <Trash2 size={13} /> O'chirish
              </button>
            )}
          </div>

          {/* Date + Approved */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="field-label">Sana *</label>
              <input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="input-base"
              />
            </div>
            <div>
              <label className="field-label">Tasdiqlovchi</label>
              <input
                type="text"
                value={formApproved}
                onChange={(e) => setFormApproved(e.target.value)}
                placeholder="M. Safarov"
                className="input-base"
              />
            </div>
          </div>

          {/* Dynamic rows */}
          <div className="space-y-3">
            {rows.map((row, idx) => (
              <RowCard
                key={row._key}
                row={row}
                idx={idx}
                total={rows.length}
                users={users}
                reporterContacts={reporterContacts}
                onChange={(patch) => updateRow(idx, patch)}
                onDelete={() => deleteRow(idx)}
                onMove={(dir) => moveRow(idx, dir)}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={addRow}
            className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-slate-600 rounded-xl text-sm text-gray-400 dark:text-slate-500 hover:border-blue-400 hover:text-blue-500 transition-colors flex items-center justify-center gap-2"
          >
            <Plus size={15} /> Qator qo'shish
          </button>

          {/* Save / Cancel */}
          <div className="flex gap-3">
            <button onClick={cancelForm} className="btn-secondary flex-1">Bekor</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
              {saving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                : 'Saqlash'}
            </button>
          </div>
        </div>
      )}

      {/* VIEW mode */}
      {mode === 'view' && selectedEntry && (
        <ScheduleViewTable
          entry={selectedEntry}
          canEdit={canEdit}
          onEdit={openEdit}
        />
      )}

      {/* Empty state */}
      {mode === 'view' && !selectedEntry && (
        <div className="flex flex-col items-center justify-center h-full py-20 text-gray-400">
          <Video size={40} className="opacity-20 mb-3" />
          <p className="text-sm font-medium">Jadval tanlang</p>
          <p className="text-xs mt-1">Yoki yangi jadval yarating</p>
          {canEdit && (
            <button onClick={openCreate} className="mt-4 btn-primary text-sm py-2 px-4">
              <Plus size={14} /> Yangi jadval
            </button>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex flex-col h-full space-y-0 -mt-1">
      {/* Page header */}
      <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Tasvirga olish jadvali</h1>
          <p className="text-xs text-red-500 font-medium mt-0.5">
            Muhim eslatma! Tasvirga olish ishlari yakunlanishi bilan, material tayyorlashga kirishish shart.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntry && mode === 'view' && (
            <button
              onClick={() => window.location.href = `/api/filming/${selectedEntry.id}/export`}
              className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-3 py-2 rounded-xl transition-colors"
            >
              <FileDown size={15} /> Word yuklab olish
            </button>
          )}
          {canEdit && mode === 'view' && (
            <button onClick={openCreate} className="btn-primary text-sm py-2">
              <Plus size={15} /> Yangi jadval
            </button>
          )}
        </div>
      </div>

      {/* Two-panel layout */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 overflow-hidden flex min-h-0" style={{ minHeight: '500px' }}>
        {/* Left panel — always visible on desktop, hidden on mobile when detail shown */}
        <div className={`
          flex-shrink-0 w-full md:w-72 border-r border-gray-100 dark:border-slate-700
          ${showDetail ? 'hidden md:flex md:flex-col' : 'flex flex-col'}
        `}>
          {ListPanel}
        </div>

        {/* Right panel — always visible on desktop, shown on mobile when detail shown */}
        <div className={`
          flex-1 min-w-0
          ${showDetail ? 'flex flex-col' : 'hidden md:flex md:flex-col'}
        `}>
          {DetailPanel}
        </div>
      </div>
    </div>
  );
}
