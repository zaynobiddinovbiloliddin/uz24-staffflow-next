import { payrollRepo, PayrollFilter } from '@/repositories/payroll.repository';
import { notificationRepo } from '@/repositories/notification.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError, ConflictError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const payrollService = {
  async list(actor: Actor, filter: PayrollFilter) {
    if (actor.role === 'EMPLOYEE') filter.userId = actor.id;
    return payrollRepo.list(filter);
  },

  async create(actor: Actor, data: {
    userId: string; month: number; year: number;
    baseSalary: number; bonus: number; deductions: number; notes?: string;
  }) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();

    const existing = await payrollRepo.findUnique(data.userId, data.month, data.year);
    if (existing) throw new ConflictError('Bu oy uchun maosh allaqachon kiritilgan');

    const totalAmount = data.baseSalary + data.bonus - data.deductions;
    const payroll = await payrollRepo.create({ ...data, totalAmount });

    await logAudit(actor.id, 'CREATE', 'Payroll', payroll.id,
      `Maosh kiritildi: ${payroll.user.fullName} — ${data.month}/${data.year}`);
    return payroll;
  },

  async pay(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await payrollRepo.findById(id);
    if (!existing) throw new NotFoundError('Maosh topilmadi');

    const payroll = await payrollRepo.pay(id);

    await notificationRepo.create({
      title: "Maosh to'landi",
      message: `${payroll.month}/${payroll.year} oyiga maoshingiz hisobingizga o'tkazildi`,
      type: 'payroll',
      userId: payroll.userId,
    });

    await logAudit(actor.id, 'PAY', 'Payroll', id, `Maosh to'landi: ${payroll.user.fullName}`);
    return payroll;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role !== 'SUPERADMIN') throw new ForbiddenError();
    const existing = await payrollRepo.findById(id);
    if (!existing) throw new NotFoundError();
    await payrollRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Payroll', id, "Maosh o'chirildi");
  },
};
