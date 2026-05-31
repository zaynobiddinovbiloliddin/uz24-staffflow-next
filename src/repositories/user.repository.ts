import { prisma } from '@/lib/prisma';

const SELECT = {
  id: true, fullName: true, username: true, role: true,
  position: true, phone: true, telegramId: true, avatar: true,
  isActive: true, departmentId: true, createdAt: true,
  portfolioLinks: true,
  department: { select: { id: true, name: true, color: true } },
  _count: { select: { assignedTasks: true } },
} as const;

export interface UserFilter {
  role?: string;
  departmentId?: string;
  search?: string;
  isActive?: boolean;
}

export const userRepo = {
  async list(filter: UserFilter = {}) {
    return prisma.user.findMany({
      where: {
        ...(filter.role        && { role: filter.role as any }),
        ...(filter.departmentId && { departmentId: filter.departmentId }),
        ...(filter.isActive != null && { isActive: filter.isActive }),
        ...(filter.search && {
          OR: [
            { fullName: { contains: filter.search, mode: 'insensitive' } },
            { username: { contains: filter.search, mode: 'insensitive' } },
            { position: { contains: filter.search, mode: 'insensitive' } },
          ],
        }),
      },
      select: SELECT,
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.user.findUnique({ where: { id }, select: SELECT });
  },

  async findByUsername(username: string) {
    return prisma.user.findUnique({ where: { username } });
  },

  async create(data: {
    fullName: string; username: string; password: string; role: string;
    position?: string; phone?: string; departmentId?: string; telegramId?: string;
  }) {
    return prisma.user.create({
      data: data as any,
      select: {
        id: true, fullName: true, username: true, role: true,
        position: true, phone: true, isActive: true, departmentId: true,
        department: { select: { id: true, name: true } }, createdAt: true,
      },
    });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.user.update({
      where: { id },
      data: data as any,
      select: {
        id: true, fullName: true, username: true, role: true,
        position: true, phone: true, avatar: true, isActive: true,
        department: { select: { id: true, name: true } }, updatedAt: true,
      },
    });
  },

  async delete(id: string) {
    return prisma.user.delete({ where: { id } });
  },

  async toggleActive(id: string) {
    const user = await prisma.user.findUnique({ where: { id }, select: { isActive: true, fullName: true } });
    if (!user) return null;
    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      select: { id: true, isActive: true, fullName: true },
    });
  },
};
