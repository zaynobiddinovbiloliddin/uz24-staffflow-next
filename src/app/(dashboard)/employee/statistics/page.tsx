'use client';

import dynamic from 'next/dynamic';
import useSWR from 'swr';

const StatisticsPage = dynamic(
  () => import('@/components/statistics/StatisticsPage').then((m) => m.StatisticsPage),
  { ssr: false },
);

export default function EmployeeStatisticsPage() {
  const { data } = useSWR('/api/me', (url) => fetch(url).then((r) => r.json()));
  const me = data?.data;

  if (!me) return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-white dark:bg-slate-800 rounded-xl animate-pulse" />)}
    </div>
  );

  return <StatisticsPage role="EMPLOYEE" currentUserId={me.id} currentUserName={me.fullName} />;
}
