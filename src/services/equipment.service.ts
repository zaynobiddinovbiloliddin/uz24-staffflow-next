import { equipmentRepo, EquipmentFilter } from '@/repositories/equipment.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const equipmentService = {
  async list(_actor: Actor, filter: EquipmentFilter) {
    return equipmentRepo.list(filter);
  },

  async create(actor: Actor, data: { name: string; type: string; serialNumber?: string; status?: string; condition?: string; notes?: string }) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const item = await equipmentRepo.create(data);
    await logAudit(actor.id, 'CREATE', 'Equipment', item.id, `Uskuna qo'shildi: ${item.name}`);
    return item;
  },

  async update(actor: Actor, id: string, data: Record<string, unknown>) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await equipmentRepo.findById(id);
    if (!existing) throw new NotFoundError('Uskuna topilmadi');
    const updated = await equipmentRepo.update(id, data);
    await logAudit(actor.id, 'UPDATE', 'Equipment', id, `Uskuna yangilandi: ${existing.name}`);
    return updated;
  },

  async assign(actor: Actor, id: string, assignedToId: string | null) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await equipmentRepo.findById(id);
    if (!existing) throw new NotFoundError();
    const updated = await equipmentRepo.assign(id, assignedToId);
    await logAudit(actor.id, 'ASSIGN', 'Equipment', id,
      assignedToId ? `Uskuna tayinlandi` : `Uskuna bo'shatildi`);
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await equipmentRepo.findById(id);
    if (!existing) throw new NotFoundError();
    await equipmentRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Equipment', id, `Uskuna o'chirildi: ${existing.name}`);
  },
};
