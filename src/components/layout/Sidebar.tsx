'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, Building2, Calendar,
  Camera, Car, DollarSign, FileText, BarChart2, ShieldCheck,
  Bell, Settings, ChevronRight, Tv, X, MessageCircle,
} from 'lucide-react';
import { clsx } from 'clsx';
type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';

type NavItem = { href: string; label: string; icon: React.ReactNode };

const SUPERADMIN_MENU: NavItem[] = [
  { href: '/superadmin/dashboard', label: 'Bosh sahifa', icon: <LayoutDashboard size={18} /> },
  { href: '/superadmin/users', label: 'Foydalanuvchilar', icon: <Users size={18} /> },
  { href: '/superadmin/tasks', label: 'Vazifalar', icon: <ClipboardList size={18} /> },
  { href: '/superadmin/departments', label: 'Bo\'limlar', icon: <Building2 size={18} /> },
  { href: '/superadmin/schedules', label: 'Jadvallar', icon: <Calendar size={18} /> },
  { href: '/superadmin/equipment', label: 'Uskunalar', icon: <Camera size={18} /> },
  { href: '/superadmin/vehicles', label: 'Transport', icon: <Car size={18} /> },
  { href: '/superadmin/payroll', label: 'Maosh', icon: <DollarSign size={18} /> },
  { href: '/superadmin/analytics', label: 'Tahlil', icon: <BarChart2 size={18} /> },
  { href: '/superadmin/audit-logs', label: 'Audit jurnal', icon: <ShieldCheck size={18} /> },
  { href: '/superadmin/notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
  { href: '/superadmin/settings', label: 'Sozlamalar', icon: <Settings size={18} /> },
];

const ADMIN_MENU: NavItem[] = [
  { href: '/admin/dashboard', label: 'Bosh sahifa', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/employees', label: 'Xodimlar', icon: <Users size={18} /> },
  { href: '/admin/tasks', label: 'Vazifalar', icon: <ClipboardList size={18} /> },
  { href: '/admin/schedules', label: 'Jadvallar', icon: <Calendar size={18} /> },
  { href: '/admin/notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
];

const EMPLOYEE_MENU: NavItem[] = [
  { href: '/employee/dashboard', label: 'Bosh sahifa', icon: <LayoutDashboard size={18} /> },
  { href: '/employee/tasks', label: 'Mening vazifalarim', icon: <ClipboardList size={18} /> },
  { href: '/employee/schedule', label: 'Mening jadvalim', icon: <Calendar size={18} /> },
  { href: '/employee/notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
  { href: '/employee/profile', label: 'Profil', icon: <Users size={18} /> },
];

const MENUS: Record<Role, NavItem[]> = {
  SUPERADMIN: SUPERADMIN_MENU,
  ADMIN: ADMIN_MENU,
  EMPLOYEE: EMPLOYEE_MENU,
};

const ROLE_LABELS: Record<Role, string> = {
  SUPERADMIN: 'Bosh Admin',
  ADMIN: 'Bo\'lim Admini',
  EMPLOYEE: 'Xodim',
};

export function Sidebar({ role, isOpen, onClose }: { role: Role; isOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const menu = MENUS[role];

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col bg-slate-900 dark:bg-slate-950 border-r border-slate-800 transition-transform duration-200 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Tv size={16} className="text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm leading-none">Uz24 StaffFlow</p>
            <p className="text-slate-400 text-xs mt-0.5">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-hide">
        <ul className="space-y-0.5">
          {menu.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )}
                >
                  {item.icon}
                  <span className="flex-1">{item.label}</span>
                  {active && <ChevronRight size={14} />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-slate-800">
        <div className="text-xs text-slate-600 text-center">v2.0 — Next.js + Prisma</div>
      </div>
    </aside>
  );
}
