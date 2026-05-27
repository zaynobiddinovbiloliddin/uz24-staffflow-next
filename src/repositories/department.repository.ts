import { prisma } from '@/lib/prisma';

export const departmentRepo = {
  async list() {
    return prisma.department.findMany({
      include: { _count: { select: { users: true, tasks: true } } },
      orderBy: { name: 'asc' },
    });
  },

  async findById(id: string) {
    return prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { users: true, tasks: true } } },
    });
  },

  async findByName(name: string) {
    return prisma.department.findUnique({ where: { name } });
  },

  async create(data: { name: string; description?: string; color?: string }) {
    return prisma.department.create({ data });
  },

  async update(id: string, data: { name?: string; description?: string; color?: string }) {
    return prisma.department.update({ where: { id }, data });
  },

  async delete(id: string) {
    return prisma.department.delete({ where: { id } });
  },
};
