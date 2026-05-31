import * as XLSX from 'xlsx';
import { requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { computeMonthStats, EXCEL_COLORS, type StatusCode } from '@/lib/statistics';

const UZ_MONTHS = [
  '', 'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
  'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr',
];

// Helper: set cell in worksheet
function sc(
  ws: XLSX.WorkSheet,
  row: number,
  col: number,
  value: string | number,
  style?: Record<string, unknown>,
) {
  const addr = XLSX.utils.encode_cell({ r: row, c: col });
  ws[addr] = { v: value, t: typeof value === 'number' ? 'n' : 's', s: style ?? {} };
}

// Style presets
const HEADER_STYLE = {
  fill: { patternType: 'solid', fgColor: { rgb: 'FF1E40AF' } },
  font: { bold: true, color: { rgb: 'FFFFFFFF' }, sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center', wrapText: true },
  border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
};
const TITLE_STYLE = {
  font: { bold: true, sz: 12 },
  alignment: { horizontal: 'center', vertical: 'center' },
};
const TOTAL_STYLE = {
  font: { bold: true, sz: 9 },
  alignment: { horizontal: 'center', vertical: 'center' },
  fill: { patternType: 'solid', fgColor: { rgb: 'FFE2E8F0' } },
  border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
};
const CELL_BORDER = {
  border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
};
function dayCellStyle(code: StatusCode) {
  return {
    fill: { patternType: 'solid', fgColor: { rgb: EXCEL_COLORS[code] ?? 'FFFFFFFF' } },
    font: { bold: true, sz: 8, color: { rgb: 'FFFFFFFF' } },
    alignment: { horizontal: 'center', vertical: 'center' },
    border: { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } },
  };
}

export async function GET(req: Request) {
  try {
    const session = await requireAdminOrAbove();

    const { searchParams } = new URL(req.url);
    const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return apiResponse.validationError('Yil va oy to\'g\'ri bo\'lishi kerak');
    }

    const daysInMonth = new Date(year, month, 0).getDate();
    const start = new Date(year, month - 1, 1);
    const endStr = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}T23:59:59Z`;

    const [users, schedules] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        include: { department: { select: { name: true } } },
        orderBy: { fullName: 'asc' },
      }),
      prisma.schedule.findMany({
        where: { date: { gte: start, lte: new Date(endStr) } },
        orderBy: { date: 'asc' },
      }),
    ]);

    // Build user stats
    const userStats = users.map((u) => {
      const userScheds = schedules
        .filter((s) => s.userId === u.id)
        .map((s) => ({
          date: typeof s.date === 'string' ? s.date : (s.date as Date).toISOString(),
          shiftType: s.shiftType,
          startTime: s.startTime,
          endTime: s.endTime,
        }));
      return {
        u,
        ms: computeMonthStats(u.id, u.fullName, userScheds, year, month),
      };
    });

    // Column layout:
    // 0=№, 1=Xodim, 2=Bo'lim, 3..3+dim-1=days, 3+dim=Jami, +1=Soat, +2=Dam, +3=Kasallik, +4=Safar, +5=Ta'til
    const FIXED = 3;
    const SUMM  = 6;
    const totalCols = FIXED + daysInMonth + SUMM;
    const lastCol   = totalCols - 1;

    const ws: XLSX.WorkSheet = {};

    // ── Row 0: Title ──────────────────────────────────────────────────────
    sc(ws, 0, 0, `O'zbekiston 24 — Oylik ish grafigi — ${UZ_MONTHS[month]} ${year}`, TITLE_STYLE);

    // ── Row 2: Headers ────────────────────────────────────────────────────
    const HDR_ROW = 2;
    sc(ws, HDR_ROW, 0, '№',      HEADER_STYLE);
    sc(ws, HDR_ROW, 1, 'Xodim',  HEADER_STYLE);
    sc(ws, HDR_ROW, 2, "Bo'lim", HEADER_STYLE);
    for (let d = 1; d <= daysInMonth; d++) {
      sc(ws, HDR_ROW, FIXED + d - 1, d, HEADER_STYLE);
    }
    sc(ws, HDR_ROW, FIXED + daysInMonth + 0, 'Jami kun',  HEADER_STYLE);
    sc(ws, HDR_ROW, FIXED + daysInMonth + 1, 'Jami soat', HEADER_STYLE);
    sc(ws, HDR_ROW, FIXED + daysInMonth + 2, 'Dam',       HEADER_STYLE);
    sc(ws, HDR_ROW, FIXED + daysInMonth + 3, 'Kasallik',  HEADER_STYLE);
    sc(ws, HDR_ROW, FIXED + daysInMonth + 4, 'Safar',     HEADER_STYLE);
    sc(ws, HDR_ROW, FIXED + daysInMonth + 5, "Ta'til",    HEADER_STYLE);

    // ── Data rows ──────────────────────────────────────────────────────────
    let totWorkDays = 0, totHours = 0, totDam = 0, totKas = 0, totSafar = 0, totTatil = 0;

    userStats.forEach(({ u, ms }, idx) => {
      const ROW = HDR_ROW + 1 + idx;
      const nameStyle = { ...CELL_BORDER, font: { sz: 9 }, alignment: { vertical: 'center' } };
      const numStyle  = { ...CELL_BORDER, font: { bold: true, sz: 9 }, alignment: { horizontal: 'center', vertical: 'center' } };
      const emptyStyle = { ...CELL_BORDER, alignment: { horizontal: 'center', vertical: 'center' } };

      sc(ws, ROW, 0, idx + 1, { ...numStyle });
      sc(ws, ROW, 1, u.fullName, nameStyle);
      sc(ws, ROW, 2, u.department?.name ?? '—', { ...CELL_BORDER, font: { sz: 9 }, alignment: { vertical: 'center' } });

      for (let d = 1; d <= daysInMonth; d++) {
        const colIdx = FIXED + d - 1;
        const dayStatus = ms.statuses[d - 1];
        // null = no record (empty cell), non-null = show colored code
        if (dayStatus?.code) {
          sc(ws, ROW, colIdx, dayStatus.code, dayCellStyle(dayStatus.code as StatusCode));
        } else {
          sc(ws, ROW, colIdx, '', emptyStyle);
        }
      }

      // Summary cols
      sc(ws, ROW, FIXED + daysInMonth + 0, ms.workDays,    { ...numStyle, font: { bold: true, sz: 9, color: { rgb: 'FF166534' } } });
      sc(ws, ROW, FIXED + daysInMonth + 1, ms.totalHours,  numStyle);
      sc(ws, ROW, FIXED + daysInMonth + 2, ms.restDays,    { ...numStyle, font: { bold: true, sz: 9, color: { rgb: 'FFdc2626' } } });
      sc(ws, ROW, FIXED + daysInMonth + 3, ms.sickDays,    numStyle);
      sc(ws, ROW, FIXED + daysInMonth + 4, ms.travelDays,  numStyle);
      sc(ws, ROW, FIXED + daysInMonth + 5, ms.vacationDays, numStyle);

      totWorkDays += ms.workDays;
      totHours    += ms.totalHours;
      totDam      += ms.restDays;
      totKas      += ms.sickDays;
      totSafar    += ms.travelDays;
      totTatil    += ms.vacationDays;
    });

    // ── Totals row ─────────────────────────────────────────────────────────
    const TOTAL_ROW = HDR_ROW + 1 + userStats.length;
    sc(ws, TOTAL_ROW, 0, 'Jami', TOTAL_STYLE);
    sc(ws, TOTAL_ROW, 1, '', TOTAL_STYLE);
    sc(ws, TOTAL_ROW, 2, '', TOTAL_STYLE);
    for (let d = 0; d < daysInMonth; d++) sc(ws, TOTAL_ROW, FIXED + d, '', TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 0, totWorkDays, TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 1, totHours,    TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 2, totDam,      TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 3, totKas,      TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 4, totSafar,    TOTAL_STYLE);
    sc(ws, TOTAL_ROW, FIXED + daysInMonth + 5, totTatil,    TOTAL_STYLE);

    // ── Sheet metadata ─────────────────────────────────────────────────────
    ws['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: TOTAL_ROW, c: lastCol } });

    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: lastCol } }];

    ws['!cols'] = [
      { wch: 5 },  // №
      { wch: 25 }, // Xodim
      { wch: 20 }, // Bo'lim
      ...Array.from({ length: daysInMonth }, () => ({ wch: 4 })),
      { wch: 12 }, // Jami kun
      { wch: 12 }, // Jami soat
      { wch: 12 }, // Dam
      { wch: 12 }, // Kasallik
      { wch: 12 }, // Safar
      { wch: 12 }, // Ta'til
    ];

    ws['!rows'] = [
      { hpt: 28 }, // Title row
      { hpt: 6  }, // Empty row
      { hpt: 32 }, // Header row
      ...Array.from({ length: userStats.length + 1 }, () => ({ hpt: 20 })),
    ];

    const sheetName = `Oylik grafik ${month} ${year}`;
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));

    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer', cellStyles: true }) as Buffer;

    const mm = String(month).padStart(2, '0');
    const filename = `oylik-grafik-${year}-${mm}.xlsx`;

    await logAudit(
      session.user.id,
      'EXPORT',
      'Schedule',
      undefined,
      `Oylik grafik Excel yuklab olindi: ${UZ_MONTHS[month]} ${year}`,
    );

    return new Response(new Uint8Array(buf), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
