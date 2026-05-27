'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Users } from 'lucide-react';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState('');
  const { data } = useSWR('/api/users?role=EMPLOYEE', fetcher);
  const users: any[] = (data?.data ?? []).filter((u: any) =>
    !search || u.fullName.toLowerCase().includes(search.toLowerCase()) || u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Xodimlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bo'limdagi xodimlar — {users.length} ta</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Xodim qidirish..." className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!data && Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-28 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />)}
        {users.length === 0 && data && (
          <div className="col-span-3 py-12 text-center"><Users size={32} className="mx-auto text-gray-300 mb-2" /><p className="text-sm text-gray-400">Xodimlar topilmadi</p></div>
        )}
        {users.map((user: any) => (
          <div key={user.id} className="bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-sm transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 font-bold flex items-center justify-center">{user.fullName[0]}</div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {user.isActive ? 'Faol' : 'Nofaol'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-gray-500">
              {user.position && <p>💼 {user.position}</p>}
              {user.phone && <p>📞 {user.phone}</p>}
              {user.department && <p>🏢 {user.department.name}</p>}
              <p>📋 {user._count?.assignedTasks ?? 0} ta vazifa</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
