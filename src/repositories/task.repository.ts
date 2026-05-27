import { prisma } from '@/lib/prisma';

const INCLUDE = {
  assignedTo: { select: { id: true, fullName: true, avatar: true, position: true } },
  createdBy:  { select: { id: true, fullName: true } },
  department: { select: { id: true, name: true, color: true } },
} as const;

export interface TaskFilter {
  status?: string;
  priority?: string;
  search?: string;
  assignedToId?: string;
  departmentId?: string;
}

export const taskRepo = {
  async list(filter: TaskFilter = {}) {
    return prisma.task.findMany({
      where: {
        ...(filter.status        && { status: filter.status as any }),
        ...(filter.priority      && { priority: filter.priority as any }),
        ...(filter.assignedToId  && { assignedToId: filter.assignedToId }),
        ...(filter.departmentId  && { departmentId: filter.departmentId }),
        ...(filter.search && {
          OR: [
            { title:       { contains: filter.search, mode: 'insensitive' } },
            { description: { contains: filter.search, mode: 'insensitive' } },
          ],
        }),
      },
      include: INCLUDE,
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });
  },

  async findById(id: string) {
    return prisma.task.findUnique({ where: { id }, include: INCLUDE });
  },

  async create(data: {
    title: string; description?: string; priority: string;
    deadline?: Date; assignedToId?: string; departmentId?: string; createdById: string;
  }) {
    return prisma.task.create({ data: data as any, include: INCLUDE });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.task.update({ where: { id }, data: data as any, include: INCLUDE });
  },

  async delete(id: string) {
    return prisma.task.delete({ where: { id } });
  },
};
