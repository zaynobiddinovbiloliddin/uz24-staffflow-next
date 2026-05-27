'use client';

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';

interface Props {
  data: Array<{ date: string; created: number; completed: number }>;
}

export default function BarChartWidget({ data }: Props) {
  if (!data.length) {
    return (
      <div className="h-[220px] flex items-center justify-center text-sm text-gray-400">
        Ma'lumot yo'q
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={14}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
        <XAxis dataKey="date" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={24} />
        <Tooltip
          contentStyle={{
            borderRadius: 10, border: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
            fontSize: 12,
          }}
        />
        <Bar dataKey="created"   name="Yaratildi" fill="#3b82f6" radius={[4, 4, 0, 0]} />
        <Bar dataKey="completed" name="Bajarildi" fill="#10b981" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
