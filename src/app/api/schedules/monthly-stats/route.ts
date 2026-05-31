import { requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';
import { computeMonthStats } from '@/lib/statistics';

export async function GET(req: Request) {
  try {
    await requireAdminOrAbove();

    const { searchParams } = new URL(req.url);
    const year  = parseInt(searchParams.get('year')  ?? String(new Date().getFullYear()), 10);
    const month = parseInt(searchParams.get('month') ?? String(new Date().getMonth() + 1), 10);

    if (isNaN(year) || isNaN(month) || month < 1 || month > 12) {
      return apiResponse.validationError('Yil va oy to\'g\'ri bo\'lishi kerak');
    }

    const start = new Date(year, month - 1, 1);
    const end   = new Date(year, month,     0);
    const daysInMonth = end.getDate();

    const [users, schedules] = await Promise.all([
      prisma.user.findMany({
        where: { isActive: true },
        include: { department: { select: { name: true } } },
        orderBy: { fullName: 'asc' },
      }),
      prisma.schedule.findMany({
        where: { date: { gte: start, lte: new Date(`${year}-${String(month).padStart(2,'0')}-${String(daysInMonth).padStart(2,'0')}T23:59:59Z`) } },
        orderBy: { date: 'asc' },
      }),
    ]);

    const data = users.map((u) => {
      const userScheds = schedules
        .filter((s) => s.userId === u.id)
        .map((s) => ({
          date: typeof s.date === 'string' ? s.date : (s.date as Date).toISOString(),
          shiftType: s.shiftType,
          startTime: s.startTime,
          endTime: s.endTime,
        }));

      const ms = computeMonthStats(u.id, u.fullName, userScheds, year, month);

      return {
        userId: u.id,
        fullName: u.fullName,
        department: u.department?.name ?? '—',
        position: u.position ?? '—',
        stats: {
          totalWorkDays: ms.workDays,
          totalHours: ms.totalHours,
          dayOff: ms.restDays,
          sick: ms.sickDays,
          businessTrip: ms.travelDays,
          vacation: ms.vacationDays,
          reserve: ms.otherDays,
          balance: ms.leaveDays,
          totalDays: daysInMonth,
        },
        days: ms.statuses.map((s) => ({ date: s.date, shiftType: s.code })),
      };
    });

    return apiResponse.success(data);
  } catch (e) {
    return handleError(e);
  }
}
