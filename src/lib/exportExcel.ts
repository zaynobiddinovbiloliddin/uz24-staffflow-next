import * as XLSX from 'xlsx';

const MONTH_NAMES = ['', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

export function exportMonthlyStatusExcel(
  grid: Array<{ id: string; fullName: string; position?: string; department?: { name: string } | null; days: Array<{ day: number; code: string }>; workDays: number; restDays: number }>,
  users: any[],
  month: number,
  year: number,
  daysInMonth: number,
  singleUserName?: string,
) {
  const monthName = MONTH_NAMES[month];
  const filename = singleUserName
    ? `${singleUserName}_${monthName}_${year}`
    : `Oylik_jadval_${monthName}_${year}`;

  const dayHeaders = Array.from({ length: daysInMonth }, (_, i) => String(i + 1));
  const headers = ['№', 'Ism Familiya', "Bo'limi", 'Lavozimi', ...dayHeaders, 'Jami ish', 'Dam olish'];

  const rows = grid.map((u, idx) => {
    const dept = (u as any).department?.name ?? '—';
    const pos = u.position ?? '—';
    const dayCells = u.days.map((d) => d.code);
    return [idx + 1, u.fullName, dept, pos, ...dayCells, u.workDays, u.restDays];
  });

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([
    [`${monthName} ${year} — Oylik ish jadvali`],
    [],
    headers,
    ...rows,
  ]);

  ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }];
  ws['!cols'] = [
    { wch: 4 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
    ...dayHeaders.map(() => ({ wch: 4 })),
    { wch: 8 }, { wch: 8 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, monthName);
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export interface UserExportRow {
  fullName: string;
  position: string;
  department: string;
  phone: string;
  telegram: string;
  status: string;
  portfolio: string;
}

export function exportUsersExcel(users: UserExportRow[], filename = 'xodimlar') {
  const headers = [
    'Ism Familiya',
    'Lavozimi',
    "Bo'limi",
    'Telefon',
    'Telegram',
    'Faoliyat holati',
    'Portfolio linklari',
  ];

  const rows = users.map((u) => [
    u.fullName,
    u.position || '—',
    u.department || '—',
    u.phone || '—',
    u.telegram || '—',
    u.status,
    u.portfolio || '—',
  ]);

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

  // Column widths
  ws['!cols'] = [
    { wch: 25 }, { wch: 20 }, { wch: 20 },
    { wch: 18 }, { wch: 18 }, { wch: 15 }, { wch: 30 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Xodimlar');
  XLSX.writeFile(wb, `${filename}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
