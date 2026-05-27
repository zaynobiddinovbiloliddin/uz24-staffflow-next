import { prisma } from '@/lib/prisma';

export interface VehicleFilter { status?: string; }

export const vehicleRepo = {
  async list(filter: VehicleFilter = {}) {
    return prisma.vehicle.findMany({
      where: { ...(filter.status && { status: filter.status as any }) },
      orderBy: { createdAt: 'desc' },
    });
  },

  async findById(id: string) {
    return prisma.vehicle.findUnique({ where: { id } });
  },

  async create(data: { name: string; plateNumber: string; type: string; status?: string; fuelType?: string; mileage?: number; notes?: string }) {
    return prisma.vehicle.create({ data: data as any });
  },

  async update(id: string, data: Record<string, unknown>) {
    return prisma.vehicle.update({ where: { id }, data: data as any });
  },

  async assign(id: string, assignedToId: string | null) {
    return prisma.vehicle.update({
      where: { id },
      data: {
        assignedToId,
        status: assignedToId ? 'IN_USE' : 'AVAILABLE',
      } as any,
    });
  },

  async delete(id: string) {
    return prisma.vehicle.delete({ where: { id } });
  },
};
