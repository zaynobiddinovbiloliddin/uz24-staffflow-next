'use client';

import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';

export function DashboardShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: Session;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    setSidebarOpen(false);
  }, []);

  // Prevent body scroll when sidebar open on mobile
  useEffect(() => {
    if (sidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  // Lock main scroll whenever any .modal-backdrop is in the DOM
  useEffect(() => {
    const main = document.querySelector('main.page-content') as HTMLElement | null;
    if (!main) return;
    const sync = () => {
      main.style.overflowY = document.querySelector('.modal-backdrop') ? 'hidden' : '';
    };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      observer.disconnect();
      main.style.overflowY = '';
    };
  }, []);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-slate-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden modal-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar
        role={session.user.role}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar
          user={session.user}
          onMenuClick={() => setSidebarOpen(true)}
        />
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-3 sm:p-4 lg:p-6 page-content">
          {children}
        </main>
      </div>
    </div>
  );
}
