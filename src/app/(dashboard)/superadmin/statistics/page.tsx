'use client';

import dynamic from 'next/dynamic';

const StatisticsPage = dynamic(
  () => import('@/components/statistics/StatisticsPage').then((m) => m.StatisticsPage),
  { ssr: false },
);

export default function SuperAdminStatisticsPage() {
  return <StatisticsPage role="SUPERADMIN" />;
}
