'use client';

import { usePathname } from 'next/navigation';
import { Construction } from 'lucide-react';

const PAGE_NAMES: Record<string, string> = {
  departments: 'Bo\'limlar',
  schedules: 'Jadvallar',
  equipment: 'Uskunalar',
  vehicles: 'Transport',
  payroll: 'Maosh',
  analytics: 'Tahlil',
  'audit-logs': 'Audit jurnal',
  settings: 'Sozlamalar',
  employees: 'Xodimlar',
  reports: 'Hisobotlar',
  schedule: 'Jadvalim',
  profile: 'Profil',
};

export default function ComingSoon() {
  const pathname = usePathname();
  const segment = pathname.split('/').pop() ?? '';
  const name = PAGE_NAMES[segment] ?? segment;

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center">
      <div className="w-16 h-16 rounded-2xl bg-amber-100 dark:bg-amber-900/20 flex items-center justify-center mb-4">
        <Construction size={28} className="text-amber-500" />
      </div>
      <h2 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h2>
      <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-xs">
        Bu sahifa tez orada tayyor bo'ladi. API backend to'liq ishlayapti.
      </p>
      <div className="mt-4 px-4 py-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg">
        ✅ API: /api/{segment} — tayyor
      </div>
    </div>
  );
}
