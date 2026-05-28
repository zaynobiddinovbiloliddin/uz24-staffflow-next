'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { Search, Users, Phone, Building2, ClipboardList } from 'lucide-react';

export default function AdminEmployeesPage() {
  const [search, setSearch] = useState('');
  const { data } = useSWR('/api/users?role=EMPLOYEE', undefined);
  const users: any[] = (data?.data ?? []).filter((u: any) =>
    !search ||
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 page-content">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Xodimlar</h1>
        <p className="text-sm text-gray-500 mt-0.5">Bo'limdagi xodimlar — {users.length} ta</p>
      </div>

      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Xodim qidirish..."
          className="input-base pl-9"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {!data && Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-36 bg-white dark:bg-slate-800 rounded-xl border animate-pulse" />
        ))}
        {users.length === 0 && data && (
          <div className="col-span-3 py-12 text-center">
            <Users size={32} className="mx-auto text-gray-300 mb-2" />
            <p className="text-sm text-gray-400">Xodimlar topilmadi</p>
          </div>
        )}
        {users.map((user: any) => (
          <div
            key={user.id}
            className="list-row bg-white dark:bg-slate-800 rounded-xl border border-gray-100 dark:border-slate-700 p-4 hover:shadow-md transition-all duration-200"
          >
            <div className="flex items-center gap-3 mb-3">
              {user.avatar ? (
                <img src={user.avatar} alt={user.fullName} className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white font-bold text-lg flex items-center justify-center flex-shrink-0">
                  {user.fullName[0]}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-white truncate">{user.fullName}</p>
                <p className="text-xs text-gray-400">@{user.username}</p>
              </div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${user.isActive ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-500'}`}>
                {user.isActive ? 'Faol' : 'Nofaol'}
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-500">
              {user.position && (
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-400">💼</span>
                  <span>{user.position}</span>
                </div>
              )}
              {user.phone && (
                <div className="flex items-center gap-1.5">
                  <Phone size={11} className="text-gray-400 flex-shrink-0" />
                  <span>{user.phone}</span>
                </div>
              )}
              {user.department && (
                <div className="flex items-center gap-1.5">
                  <Building2 size={11} className="text-gray-400 flex-shrink-0" />
                  <span>{user.department.name}</span>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <ClipboardList size={11} className="text-gray-400 flex-shrink-0" />
                <span>{user._count?.assignedTasks ?? 0} ta faol vazifa</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
