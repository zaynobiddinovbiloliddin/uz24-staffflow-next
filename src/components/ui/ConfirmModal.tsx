'use client';

import { useEffect } from 'react';
import { AlertTriangle, CheckCircle, Trash2, X } from 'lucide-react';

type Variant = 'danger' | 'warning' | 'success';

interface ConfirmModalProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger: {
    icon: <Trash2 size={22} />,
    iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
    btn: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    defaultTitle: 'O\'chirishni tasdiqlang',
    defaultConfirm: 'O\'chirish',
  },
  warning: {
    icon: <AlertTriangle size={22} />,
    iconBg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
    btn: 'bg-amber-500 hover:bg-amber-600 focus:ring-amber-400',
    defaultTitle: 'Tasdiqlash',
    defaultConfirm: 'Davom etish',
  },
  success: {
    icon: <CheckCircle size={22} />,
    iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
    btn: 'bg-green-600 hover:bg-green-700 focus:ring-green-500',
    defaultTitle: 'Tasdiqlash',
    defaultConfirm: 'Tasdiqlash',
  },
};

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Bekor qilish',
  variant = 'danger',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const styles = VARIANT_STYLES[variant];

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
      if (e.key === 'Enter') onConfirm();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onConfirm, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Modal */}
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 modal-content">
        {/* Close button */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
        >
          <X size={16} />
        </button>

        {/* Icon + Content */}
        <div className="flex flex-col items-center text-center">
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${styles.iconBg}`}>
            {styles.icon}
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {title ?? styles.defaultTitle}
          </h3>

          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            {message}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 px-4 rounded-xl border border-gray-200 dark:border-slate-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.btn}`}
          >
            {confirmLabel ?? styles.defaultConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
