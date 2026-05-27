import { departmentRepo } from '@/repositories/department.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const departmentService = {
  async list(_actor: Actor) {
    return departmentRepo.list();
  },

  async create(actor: Actor, data: { name: string; description?: string; color?: string }) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await departmentRepo.findByName(data.name);
    if (existing) throw new ConflictError('Bu nom band');
    const dept = await departmentRepo.create(data);
    await logAudit(actor.id, 'CREATE', 'Department', dept.id, `Bo'lim yaratildi: ${dept.name}`);
    return dept;
  },

  async update(actor: Actor, id: string, data: { name?: string; description?: string; color?: string }) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await departmentRepo.findById(id);
    if (!existing) throw new NotFoundError("Bo'lim topilmadi");
    if (data.name && data.name !== existing.name) {
      const nameTaken = await departmentRepo.findByName(data.name);
      if (nameTaken) throw new ConflictError('Bu nom band');
    }
    const updated = await departmentRepo.update(id, data);
    await logAudit(actor.id, 'UPDATE', 'Department', id, `Bo'lim yangilandi: ${updated.name}`);
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const dept = await departmentRepo.findById(id);
    if (!dept) throw new NotFoundError();
    await departmentRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Department', id, `Bo'lim o'chirildi: ${dept.name}`);
  },
};
