import { prisma } from '@/lib/prisma';
import { ForbiddenError } from '@/lib/errors';
import { withCache } from '@/lib/cache';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const analyticsService = {
  // ─── Overview ──────────────────────────────────────────────────────────────
  async overview(actor: Actor) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    return withCache('analytics:overview', 30_000, async () => {
      const [
        totalUsers, activeUsers,
        totalTasks, completedTasks, inProgressTasks, pendingTasks,
        totalDepts,
        availableEq, totalEq,
        availableVeh, totalVeh,
      ] = await prisma.$transaction([
        prisma.user.count({ where: { role: { not: 'SUPERADMIN' } } }),
        prisma.user.count({ where: { isActive: true, role: { not: 'SUPERADMIN' } } }),
        prisma.task.count(),
        prisma.task.count({ where: { status: 'COMPLETED' } }),
        prisma.task.count({ where: { status: 'IN_PROGRESS' } }),
        prisma.task.count({ where: { status: 'PENDING' } }),
        prisma.department.count(),
        prisma.equipment.count({ where: { status: 'AVAILABLE' } }),
        prisma.equipment.count(),
        prisma.vehicle.count({ where: { status: 'AVAILABLE' } }),
        prisma.vehicle.count(),
      ]);

      return {
        users:       { total: totalUsers, active: activeUsers, inactive: totalUsers - activeUsers },
        tasks:       { total: totalTasks, completed: completedTasks, inProgress: inProgressTasks, pending: pendingTasks },
        departments: totalDepts,
        equipment:   { total: totalEq, available: availableEq },
        vehicles:    { total: totalVeh, available: availableVeh },
      };
    });
  },

  // ─── Tasks Chart (was 14 queries → now 2) ──────────────────────────────────
  async tasksChart(_actor: Actor) {
    return withCache('analytics:tasks-chart', 60_000, async () => {
      const since = new Date();
      since.setDate(since.getDate() - 6);
      since.setHours(0, 0, 0, 0);

      type DayCount = { day: Date; count: bigint };
      const [createdRows, completedRows] = await prisma.$transaction([
        prisma.$queryRaw<DayCount[]>`
          SELECT DATE("createdAt") as day, COUNT(*)::bigint as count
          FROM "Task"
          WHERE "createdAt" >= ${since}
          GROUP BY DATE("createdAt")
        `,
        prisma.$queryRaw<DayCount[]>`
          SELECT DATE("updatedAt") as day, COUNT(*)::bigint as count
          FROM "Task"
          WHERE status = 'COMPLETED' AND "updatedAt" >= ${since}
          GROUP BY DATE("updatedAt")
        `,
      ]);

      const createdMap  = new Map(createdRows.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));
      const completedMap = new Map(completedRows.map(r => [r.day.toISOString().slice(0, 10), Number(r.count)]));

      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        const key = d.toISOString().slice(0, 10);
        return {
          date:      d.toLocaleDateString('uz', { month: 'short', day: 'numeric' }),
          created:   createdMap.get(key) ?? 0,
          completed: completedMap.get(key) ?? 0,
        };
      });
    });
  },

  // ─── Departments (was N+1 → now 2 queries) ─────────────────────────────────
  async departments(_actor: Actor) {
    return withCache('analytics:departments', 60_000, async () => {
      const [depts, completedCounts] = await Promise.all([
        prisma.department.findMany({
          include: { _count: { select: { users: true, tasks: true } } },
        }),
        prisma.task.groupBy({
          by: ['departmentId'],
          where: { status: 'COMPLETED', departmentId: { not: null } },
          _count: { _all: true },
        }),
      ]);

      const completedMap = new Map(completedCounts.map((c) => [c.departmentId!, c._count._all]));

      return depts.map((d) => ({
        name:      d.name,
        color:     d.color,
        employees: d._count.users,
        tasks:     d._count.tasks,
        completed: completedMap.get(d.id) ?? 0,
      }));
    });
  },
};
