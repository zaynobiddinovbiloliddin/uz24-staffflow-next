import { prisma } from '@/lib/prisma';

export interface EquipmentFilter { status?: string; }

export const equipmentRepo = {
  async list(filter: EquipmentFilter = {}) {
    return prisma.equipment.findMany({
      where: { ...(filter.status && { status: filter.status as any }) },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.equipment.findUnique({ where: { id } });
  },

  async create(data: { name: string; type: string; serialNumber?: string; status?: string; condition?: string; notes?: string }) {
    return prisma.equipment.create({ data: data as any });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.equipment.update({ where: { id }, data: data as any });
  },

  async assign(id: string, assignedToId: string | null) {
    return prisma.equipment.update({
      where: { id },
      data: {
        assignedToId,
        status: assignedToId ? 'IN_USE' : 'AVAILABLE',
      } as any,
    });
  },

  async delete(id: string) {
    return prisma.equipment.delete({ where: { id } });
  },
};
