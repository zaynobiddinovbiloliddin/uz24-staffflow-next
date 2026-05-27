'use client';

import Link from 'next/link';
import { Menu, Bell, LogOut, Sun, Moon, ChevronDown, User, Settings } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import useSWR from 'swr';
import { clsx } from 'clsx';
import type { Session } from 'next-auth';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ROLE_COLORS: Record<string, string> = {
  SUPERADMIN: 'bg-red-500',
  ADMIN:      'bg-blue-500',
  EMPLOYEE:   'bg-green-500',
};

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'SuperAdmin',
  ADMIN:      'Admin',
  EMPLOYEE:   'Xodim',
};

const NOTIF_HREF: Record<string, string> = {
  SUPERADMIN: '/superadmin/notifications',
  ADMIN:      '/admin/notifications',
  EMPLOYEE:   '/employee/notifications',
};

const PROFILE_HREF: Record<string, string> = {
  SUPERADMIN: '/superadmin/settings',
  ADMIN:      '/admin/notifications',
  EMPLOYEE:   '/employee/profile',
};

export function TopBar({ user, onMenuClick }: { user: Session['user']; onMenuClick: () => void }) {
  const [dark, setDark]         = useState(false);
  const [showUser, setShowUser] = useState(false);

  const { data } = useSWR('/api/notifications?unread=true', fetcher, { refreshInterval: 30000 });
  const unread: number = data?.data?.unreadCount ?? 0;

  useEffect(() => {
    const saved = localStorage.getItem('theme') === 'dark';
    setDark(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  function toggleDark() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
  }

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 flex items-center px-4 gap-4">
      {/* Mobile menu toggle */}
      <button
        onClick={onMenuClick}
        className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
        aria-label="Menyu"
      >
        <Menu size={20} className="text-gray-600 dark:text-gray-400" />
      </button>

      <div className="flex-1" />

      <div className="flex items-center gap-1">
        {/* Dark mode toggle */}
        <button
          onClick={toggleDark}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label={dark ? "Kunduzgi rejim" : "Tungi rejim"}
          title={dark ? "Kunduzgi rejim" : "Tungi rejim"}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Notifications */}
        <Link
          href={NOTIF_HREF[user.role] ?? '/'}
          className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500 dark:text-gray-400 transition-colors"
          aria-label="Bildirishnomalar"
          title="Bildirishnomalar"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </Link>

        {/* User menu */}
        <div className="relative">
          <button
            onClick={() => setShowUser((v) => !v)}
            className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Foydalanuvchi menyu"
          >
            <div className={clsx(
              'w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0',
              ROLE_COLORS[user.role]
            )}>
              {user.name?.[0]?.toUpperCase() ?? 'U'}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-sm font-medium text-gray-900 dark:text-white leading-none">{user.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{ROLE_LABELS[user.role]}</p>
            </div>
            <ChevronDown
              size={14}
              className={clsx('text-gray-400 transition-transform duration-200', showUser && 'rotate-180')}
            />
          </button>

          {showUser && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowUser(false)} />
              <div className="absolute right-0 top-full mt-2 z-20 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-gray-200 dark:border-slate-700 overflow-hidden dropdown-menu">
                {/* User info */}
                <div className="px-4 py-3 bg-gray-50 dark:bg-slate-700/50 border-b border-gray-100 dark:border-slate-700">
                  <div className="flex items-center gap-2.5">
                    <div className={clsx('w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0', ROLE_COLORS[user.role])}>
                      {user.name?.[0]?.toUpperCase() ?? 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user.name}</p>
                      {user.position && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.position}</p>}
                      {user.departmentName && <p className="text-xs text-blue-500 truncate">{user.departmentName}</p>}
                    </div>
                  </div>
                </div>

                {/* Menu items */}
                <div className="py-1">
                  <Link
                    href={PROFILE_HREF[user.role] ?? '/'}
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    {user.role === 'SUPERADMIN' ? <Settings size={15} /> : <User size={15} />}
                    {user.role === 'SUPERADMIN' ? 'Sozlamalar' : 'Mening profilim'}
                  </Link>

                  <Link
                    href={NOTIF_HREF[user.role] ?? '/'}
                    onClick={() => setShowUser(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Bell size={15} />
                    <span>Bildirishnomalar</span>
                    {unread > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        {unread > 9 ? '9+' : unread}
                      </span>
                    )}
                  </Link>

                  <div className="border-t border-gray-100 dark:border-slate-700 my-1" />

                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut size={15} />
                    Tizimdan chiqish
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
