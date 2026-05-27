import { vehicleRepo, VehicleFilter } from '@/repositories/vehicle.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const vehicleService = {
  async list(_actor: Actor, filter: VehicleFilter) {
    return vehicleRepo.list(filter);
  },

  async create(actor: Actor, data: { name: string; plateNumber: string; type: string; status?: string; fuelType?: string; mileage?: number; notes?: string }) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const item = await vehicleRepo.create(data);
    await logAudit(actor.id, 'CREATE', 'Vehicle', item.id, `Transport qo'shildi: ${item.name}`);
    return item;
  },

  async update(actor: Actor, id: string, data: Record<string, unknown>) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await vehicleRepo.findById(id);
    if (!existing) throw new NotFoundError('Transport topilmadi');
    const updated = await vehicleRepo.update(id, data);
    await logAudit(actor.id, 'UPDATE', 'Vehicle', id, `Transport yangilandi: ${existing.name}`);
    return updated;
  },

  async assign(actor: Actor, id: string, assignedToId: string | null) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await vehicleRepo.findById(id);
    if (!existing) throw new NotFoundError();
    const updated = await vehicleRepo.assign(id, assignedToId);
    await logAudit(actor.id, 'ASSIGN', 'Vehicle', id,
      assignedToId ? `Transport tayinlandi` : `Transport bo'shatildi`);
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await vehicleRepo.findById(id);
    if (!existing) throw new NotFoundError();
    await vehicleRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Vehicle', id, `Transport o'chirildi: ${existing.name}`);
  },
};
