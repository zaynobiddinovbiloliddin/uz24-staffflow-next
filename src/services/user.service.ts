import bcrypt from 'bcryptjs';
import { userRepo, UserFilter } from '@/repositories/user.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError, ConflictError, ValidationError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const userService = {
  async list(actor: Actor, filter: UserFilter) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    // Admin only sees their own department
    if (actor.role === 'ADMIN' && actor.departmentId) {
      filter.departmentId = actor.departmentId;
    }
    return userRepo.list(filter);
  },

  async getById(actor: Actor, id: string) {
    if (actor.role === 'EMPLOYEE' && actor.id !== id) throw new ForbiddenError();
    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
    return user;
  },

  async create(actor: Actor, data: {
    fullName: string; username: string; password: string; role: string;
    position?: string; phone?: string; departmentId?: string; telegramId?: string;
  }) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    // Admins can only create EMPLOYEE role
    if (actor.role === 'ADMIN' && data.role !== 'EMPLOYEE') {
      throw new ForbiddenError('Admin faqat xodim yaratishi mumkin');
    }

    const existing = await userRepo.findByUsername(data.username);
    if (existing) throw new ConflictError('Bu username band');

    const hashed = await bcrypt.hash(data.password, 12);
    const user = await userRepo.create({ ...data, password: hashed });
    await logAudit(actor.id, 'CREATE', 'User', user.id, `Yangi foydalanuvchi: ${user.fullName}`);
    return user;
  },

  async update(actor: Actor, id: string, data: Record<string, unknown>) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();

    const existing = await userRepo.findById(id);
    if (!existing) throw new NotFoundError('Foydalanuvchi topilmadi');

    const updateData: Record<string, unknown> = { ...data };

    if (updateData.username) {
      const taken = await userRepo.findByUsername(updateData.username as string);
      if (taken && taken.id !== id) throw new ConflictError('Bu username band');
    }

    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password as string, 12);
    } else {
      delete updateData.password;
    }

    const updated = await userRepo.update(id, updateData);
    await logAudit(actor.id, 'UPDATE', 'User', id, `Foydalanuvchi yangilandi: ${updated.fullName}`);
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    if (actor.id === id) throw new ValidationError("O'zingizni o'chira olmaysiz");

    const user = await userRepo.findById(id);
    if (!user) throw new NotFoundError();

    await userRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'User', id, `Foydalanuvchi o'chirildi: ${user.fullName}`);
  },

  async toggleActive(actor: Actor, id: string) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    if (actor.id === id) throw new ValidationError("O'z holatingizni o'zgartira olmaysiz");

    const updated = await userRepo.toggleActive(id);
    if (!updated) throw new NotFoundError();

    await logAudit(actor.id, 'TOGGLE', 'User', id,
      `${updated.fullName} — ${updated.isActive ? 'Faollashtirildi' : "O'chirildi"}`);
    return updated;
  },
};
