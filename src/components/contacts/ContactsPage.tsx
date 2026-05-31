'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import { Phone, Car, MessageCircle, Plus, Edit2, Trash2, Search, BookUser, X } from 'lucide-react';
import { toast } from 'sonner';
import { fetcher } from '@/lib/fetcher';

const ConfirmModal = dynamic(() => import('@/components/ui/ConfirmModal'), { ssr: false });

// ─── Types ────────────────────────────────────────────────────────────────────

type ContactType = 'DRIVER' | 'REPORTER' | 'TECHNICIAN' | 'OTHER';

interface Contact {
  id: string;
  type: ContactType;
  fullName: string;
  phone: string;
  vehicleInfo?: string | null;
  telegramUsername?: string | null;
  notes?: string | null;
}

interface ContactForm {
  type: ContactType;
  fullName: string;
  phone: string;
  vehicleInfo: string;
  telegramUsername: string;
  notes: string;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<ContactType, {
  label: string;
  cls: string;
  iconBg: string;
  iconColor: string;
}> = {
  DRIVER: {
    label: 'Haydovchi',
    cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-700',
    iconBg: '#dbeafe', iconColor: '#1e40af',
  },
  REPORTER: {
    label: 'Muxbir',
    cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-700',
    iconBg: '#dcfce7', iconColor: '#166534',
  },
  TECHNICIAN: {
    label: 'Texnik',
    cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200 dark:border-orange-700',
    iconBg: '#ffedd5', iconColor: '#c2410c',
  },
  OTHER: {
    label: 'Boshqa',
    cls: 'bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300 border-gray-200 dark:border-slate-600',
    iconBg: '#f3f4f6', iconColor: '#4b5563',
  },
};

const TABS: { key: ContactType | 'ALL'; label: string }[] = [
  { key: 'ALL',        label: 'Hammasi'      },
  { key: 'DRIVER',     label: 'Haydovchilar' },
  { key: 'REPORTER',   label: 'Muxbirlar'    },
  { key: 'TECHNICIAN', label: 'Texniklar'    },
  { key: 'OTHER',      label: 'Boshqa'       },
];

const EMPTY_FORM: ContactForm = {
  type: 'DRIVER',
  fullName: '',
  phone: '',
  vehicleInfo: '',
  telegramUsername: '',
  notes: '',
};

// ─── Main Component ───────────────────────────────────────────────────────────

export function ContactsPage({ canEdit }: { canEdit: boolean }) {
  const [activeTab, setActiveTab] = useState<ContactType | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState(false);
  const [editContact, setEditContact] = useState<Contact | null>(null);
  const [form, setForm] = useState<ContactForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState<{ open: boolean; id: string; name: string }>({
    open: false, id: '', name: '',
  });

  const { data, mutate } = useSWR('/api/contacts', fetcher);
  const isLoading = !data;
  const contacts: Contact[] = data?.data ?? [];

  // ── Client-side filtering ────────────────────────────────────────────────

  const filtered = useMemo(() => {
    let list = contacts;
    if (activeTab !== 'ALL') list = list.filter((c) => c.type === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.fullName.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
      );
    }
    return list;
  }, [contacts, activeTab, search]);

  // ── Tab counts ────────────────────────────────────────────────────────────

  const counts = useMemo(() => {
    const map: Record<string, number> = { ALL: contacts.length };
    for (const c of contacts) map[c.type] = (map[c.type] ?? 0) + 1;
    return map;
  }, [contacts]);

  // ── Open create ───────────────────────────────────────────────────────────

  function openCreate() {
    setEditContact(null);
    setForm({
      ...EMPTY_FORM,
      type: activeTab !== 'ALL' ? activeTab : 'DRIVER',
    });
    setModal(true);
  }

  // ── Open edit ─────────────────────────────────────────────────────────────

  function openEdit(c: Contact) {
    setEditContact(c);
    setForm({
      type: c.type,
      fullName: c.fullName,
      phone: c.phone,
      vehicleInfo: c.vehicleInfo ?? '',
      telegramUsername: c.telegramUsername ? `@${c.telegramUsername}` : '',
      notes: c.notes ?? '',
    });
    setModal(true);
  }

  // ── Save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    if (!form.fullName.trim()) { toast.error('Ism familiya kiriting'); return; }
    if (!form.phone.trim())    { toast.error('Telefon raqam kiriting'); return; }

    setSaving(true);
    try {
      const url    = editContact ? `/api/contacts/${editContact.id}` : '/api/contacts';
      const method = editContact ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: form.type,
          fullName: form.fullName.trim(),
          phone: form.phone.trim(),
          vehicleInfo: form.vehicleInfo.trim() || null,
          telegramUsername: form.telegramUsername.trim().replace(/^@/, '') || null,
          notes: form.notes.trim() || null,
        }),
      });
      if (!res.ok) {
        const d = await res.json();
        toast.error(d.message ?? 'Xato yuz berdi');
        return;
      }
      toast.success(editContact ? 'Kontakt yangilandi' : "Kontakt qo'shildi");
      setModal(false);
      mutate();
    } catch {
      toast.error('Server bilan bog\'lanishda xato');
    } finally {
      setSaving(false);
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDelete() {
    const { id, name } = confirmDel;
    setConfirmDel({ open: false, id: '', name: '' });
    const res = await fetch(`/api/contacts/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      toast.success(`${name} o'chirildi`);
      mutate();
    } else {
      toast.error("O'chirishda xato yuz berdi");
    }
  }

  // ── Skeleton ──────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-8 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse w-64" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 w-24 bg-gray-100 dark:bg-slate-700 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 bg-gray-100 dark:bg-slate-700 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      {/* Page header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Kontaktlar</h1>
          <p className="text-sm text-gray-500 mt-0.5">Haydovchilar, muxbirlar va texniklar ro'yxati</p>
        </div>
        {canEdit && (
          <button onClick={openCreate} className="btn-primary flex items-center gap-2">
            <Plus size={15} /> Kontakt qo'shish
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Ism yoki telefon bo'yicha qidiring..."
          className="input-base pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 flex-wrap">
        {TABS.map((tab) => {
          const count = counts[tab.key] ?? 0;
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all ${
                active
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-slate-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Contact cards grid */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BookUser size={40} className="opacity-20 mb-3" />
          <p className="text-sm font-medium">
            {search ? 'Qidiruv natijasi topilmadi' : 'Hozircha kontaktlar yo\'q. Birinchi kontaktni qo\'shing.'}
          </p>
          {canEdit && !search && (
            <button onClick={openCreate} className="mt-4 btn-primary text-sm py-2 px-4">
              <Plus size={14} /> Kontakt qo'shish
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContactCard
              key={c.id}
              contact={c}
              canEdit={canEdit}
              onEdit={() => openEdit(c)}
              onDelete={() => setConfirmDel({ open: true, id: c.id, name: c.fullName })}
            />
          ))}
        </div>
      )}

      {/* Confirm delete */}
      <ConfirmModal
        open={confirmDel.open}
        message={`Haqiqatan ham "${confirmDel.name}" ni o'chirmoqchimisiz?`}
        onConfirm={handleDelete}
        onCancel={() => setConfirmDel({ open: false, id: '', name: '' })}
      />

      {/* Add/Edit modal */}
      {modal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-sm modal-backdrop">
          <div className="bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md flex flex-col max-h-[92vh] overflow-hidden modal-enter">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100 dark:border-slate-700 flex-shrink-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editContact ? 'Kontaktni tahrirlash' : 'Yangi kontakt'}
              </h3>
              <button
                onClick={() => setModal(false)}
                className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-6 py-4 space-y-4">
              {/* Type */}
              <div>
                <label className="field-label">Kontakt turi *</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as ContactType }))}
                  className="select-base"
                >
                  <option value="DRIVER">Haydovchi</option>
                  <option value="REPORTER">Muxbir</option>
                  <option value="TECHNICIAN">Texnik</option>
                  <option value="OTHER">Boshqa</option>
                </select>
              </div>

              {/* Full name */}
              <div>
                <label className="field-label">Ism familiya *</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Hamidov Bahodir"
                  className="input-base"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="field-label">Telefon raqam *</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+998 90 123 45 67"
                  className="input-base"
                />
              </div>

              {/* Vehicle info — only for DRIVER */}
              {form.type === 'DRIVER' && (
                <div>
                  <label className="field-label">Mashina ma'lumoti</label>
                  <input
                    type="text"
                    value={form.vehicleInfo}
                    onChange={(e) => setForm((f) => ({ ...f, vehicleInfo: e.target.value }))}
                    placeholder="142 Caddy, 01A 123 BC"
                    className="input-base"
                  />
                </div>
              )}

              {/* Telegram */}
              <div>
                <label className="field-label">Telegram username</label>
                <input
                  type="text"
                  value={form.telegramUsername}
                  onChange={(e) => setForm((f) => ({ ...f, telegramUsername: e.target.value }))}
                  placeholder="@username"
                  className="input-base"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="field-label">Izoh</label>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Qo'shimcha ma'lumot..."
                  className="input-base resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3 px-6 py-4 border-t border-gray-100 dark:border-slate-700 flex-shrink-0">
              <button onClick={() => setModal(false)} className="btn-secondary flex-1">
                Bekor qilish
              </button>
              <button onClick={handleSave} disabled={saving} className="btn-primary flex-1">
                {saving
                  ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saqlanmoqda...</>
                  : 'Saqlash'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Contact Card ─────────────────────────────────────────────────────────────

function ContactCard({
  contact, canEdit, onEdit, onDelete,
}: {
  contact: Contact;
  canEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const cfg = TYPE_CONFIG[contact.type];

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md transition-shadow group">
      {/* Card header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="w-11 h-11 rounded-xl font-bold text-lg flex items-center justify-center flex-shrink-0"
            style={{ background: cfg.iconBg, color: cfg.iconColor }}
          >
            {contact.fullName[0]?.toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 dark:text-white truncate text-sm leading-tight">
              {contact.fullName}
            </p>
            <span className={`inline-block mt-1 text-xs font-medium px-2 py-0.5 rounded-full border ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
        </div>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 ml-2">
            <button
              onClick={onEdit}
              className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-400 hover:text-blue-600 transition-colors"
              title="Tahrirlash"
            >
              <Edit2 size={13} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 transition-colors"
              title="O'chirish"
            >
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>

      {/* Contact details */}
      <div className="space-y-1.5">
        <a
          href={`tel:${contact.phone}`}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          <Phone size={13} className="flex-shrink-0 text-gray-400" />
          <span className="font-medium">{contact.phone}</span>
        </a>

        {contact.type === 'DRIVER' && contact.vehicleInfo && (
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
            <Car size={13} className="flex-shrink-0 text-gray-400" />
            <span>{contact.vehicleInfo}</span>
          </div>
        )}

        {contact.telegramUsername && (
          <a
            href={`https://t.me/${contact.telegramUsername}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <MessageCircle size={13} className="flex-shrink-0" />
            <span>@{contact.telegramUsername}</span>
          </a>
        )}

        {contact.notes && (
          <p className="text-xs text-gray-400 dark:text-slate-500 line-clamp-2 pt-1 border-t border-gray-50 dark:border-slate-700">
            {contact.notes}
          </p>
        )}
      </div>
    </div>
  );
}
