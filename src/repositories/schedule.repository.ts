import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user: { select: { id: true, fullName: true, position: true, avatar: true } },
} as const;

export interface ScheduleFilter {
  userId?: string;
  from?: string;
  to?: string;
}

export const scheduleRepo = {
  async list(filter: ScheduleFilter = {}) {
    return prisma.schedule.findMany({
      where: {
        ...(filter.userId && { userId: filter.userId }),
        ...((filter.from || filter.to) && {
          date: {
            ...(filter.from ? { gte: new Date(filter.from) } : {}),
            ...(filter.to   ? { lte: new Date(`${filter.to}T23:59:59Z`) } : {}),
          },
        }),
      },
      include: INCLUDE,
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });
  },

  async findById(id: string) {
    return prisma.schedule.findUnique({ where: { id }, include: INCLUDE });
  },

  async create(data: { userId: string; date: Date; startTime: string; endTime: string; shiftType: string; note?: string }) {
    return prisma.schedule.create({ data, include: INCLUDE });
  },

  async update(id: string, data: { userId?: string; date?: Date; startTime?: string; endTime?: string; shiftType?: string; note?: string }) {
    return prisma.schedule.update({ where: { id }, data, include: INCLUDE });
  },

  async delete(id: string) {
    return prisma.schedule.delete({ where: { id } });
  },
};
