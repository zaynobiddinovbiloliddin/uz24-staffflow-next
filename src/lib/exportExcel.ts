import * as XLSX from 'xlsx';

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
