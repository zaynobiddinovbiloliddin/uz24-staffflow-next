'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Users, ClipboardList, Building2, Calendar,
  Camera, Car, BarChart2, ShieldCheck,
  Bell, Settings, ChevronRight, X, TrendingUp, Video,
} from 'lucide-react';
import { clsx } from 'clsx';

type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';
type NavItem = { href: string; label: string; icon: React.ReactNode };

const SUPERADMIN_MENU: NavItem[] = [
  { href: '/superadmin/dashboard',  label: 'Bosh sahifa',       icon: <LayoutDashboard size={18} /> },
  { href: '/superadmin/users',      label: 'Xodimlar',           icon: <Users size={18} /> },
  { href: '/superadmin/tasks',      label: 'Vazifalar',          icon: <ClipboardList size={18} /> },
  { href: '/superadmin/departments',label: 'Bo\'limlar',         icon: <Building2 size={18} /> },
  { href: '/superadmin/schedules',  label: 'Ish jadvali',        icon: <Calendar size={18} /> },
  { href: '/superadmin/equipment',  label: 'Uskunalar',          icon: <Camera size={18} /> },
  { href: '/superadmin/vehicles',   label: 'Transport',          icon: <Car size={18} /> },
  { href: '/superadmin/filming',    label: 'Tasvir jadvali',     icon: <Video size={18} /> },
  { href: '/superadmin/statistics', label: 'Statistika',         icon: <TrendingUp size={18} /> },
  { href: '/superadmin/analytics',  label: 'Tahlil',             icon: <BarChart2 size={18} /> },
  { href: '/superadmin/audit-logs', label: 'Audit jurnal',       icon: <ShieldCheck size={18} /> },
  { href: '/superadmin/notifications', label: 'Bildirishnomalar', icon: <Bell size={18} /> },
  { href: '/superadmin/settings',   label: 'Sozlamalar',         icon: <Settings size={18} /> },
];

const ADMIN_MENU: NavItem[] = [
  { href: '/admin/dashboard',      label: 'Bosh sahifa',       icon: <LayoutDashboard size={18} /> },
  { href: '/admin/employees',      label: 'Xodimlar',           icon: <Users size={18} /> },
  { href: '/admin/tasks',          label: 'Vazifalar',          icon: <ClipboardList size={18} /> },
  { href: '/admin/schedules',      label: 'Ish jadvali',        icon: <Calendar size={18} /> },
  { href: '/admin/filming',        label: 'Tasvir jadvali',     icon: <Video size={18} /> },
  { href: '/admin/statistics',     label: 'Statistika',         icon: <TrendingUp size={18} /> },
  { href: '/admin/notifications',  label: 'Bildirishnomalar',   icon: <Bell size={18} /> },
  { href: '/admin/profile',        label: 'Profil',             icon: <Settings size={18} /> },
];

const EMPLOYEE_MENU: NavItem[] = [
  { href: '/employee/dashboard',     label: 'Bosh sahifa',       icon: <LayoutDashboard size={18} /> },
  { href: '/employee/tasks',         label: 'Mening vazifalarim', icon: <ClipboardList size={18} /> },
  { href: '/employee/schedule',      label: 'Mening jadvalim',    icon: <Calendar size={18} /> },
  { href: '/employee/filming',       label: 'Tasvir jadvali',     icon: <Video size={18} /> },
  { href: '/employee/statistics',    label: 'Statistika',         icon: <TrendingUp size={18} /> },
  { href: '/employee/notifications', label: 'Bildirishnomalar',   icon: <Bell size={18} /> },
  { href: '/employee/profile',       label: 'Profil',             icon: <Users size={18} /> },
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

export function Sidebar({
  role, isOpen, onClose,
}: {
  role: Role;
  isOpen: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const menu = MENUS[role];

  return (
    <aside
      className={clsx(
        'fixed lg:static inset-y-0 left-0 z-30 w-64 flex flex-col',
        'bg-slate-900 dark:bg-slate-950 border-r border-slate-800',
        'transition-transform duration-250 ease-in-out',
        isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0',
      )}
    >
      {/* Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center flex-shrink-0 overflow-hidden shadow-sm">
            <Image
              src="/logo.png"
              alt="O'zbekiston 24"
              width={36}
              height={36}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div className="min-w-0">
            <p className="text-white font-bold text-sm leading-tight truncate">O'zbekiston24</p>
            <p className="text-slate-400 text-xs mt-0.5 truncate">{ROLE_LABELS[role]}</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors flex-shrink-0"
          aria-label="Yopish"
        >
          <X size={16} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 px-3 scrollbar-hide">
        <ul className="space-y-0.5">
          {menu.map((item) => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  className={clsx(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                    active
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-900/50'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800',
                  )}
                >
                  <span className="flex-shrink-0">{item.icon}</span>
                  <span className="flex-1 truncate">{item.label}</span>
                  {active && <ChevronRight size={13} className="flex-shrink-0 opacity-70" />}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Image
            src="/logo.png"
            alt="O'zbekiston 24"
            width={20}
            height={20}
            className="opacity-40 object-contain"
          />
          <p className="text-xs text-slate-600">O'zbekiston 24 · v2.0</p>
        </div>
      </div>
    </aside>
  );
}
