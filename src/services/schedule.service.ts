import { scheduleRepo, ScheduleFilter } from '@/repositories/schedule.repository';
import { notificationRepo } from '@/repositories/notification.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const scheduleService = {
  async list(actor: Actor, filter: ScheduleFilter) {
    if (actor.role === 'EMPLOYEE') filter.userId = actor.id;
    return scheduleRepo.list(filter);
  },

  async create(actor: Actor, data: { userId: string; date: string; startTime: string; endTime: string; shiftType: string; note?: string }) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const schedule = await scheduleRepo.create({ ...data, date: new Date(data.date) });

    await notificationRepo.create({
      title: "Jadval qo'shildi",
      message: `${new Date(data.date).toLocaleDateString('uz')} kuni ${data.startTime}–${data.endTime} smena`,
      type: 'schedule',
      userId: data.userId,
    });

    await logAudit(actor.id, 'CREATE', 'Schedule', schedule.id, "Jadval qo'shildi");
    return schedule;
  },

  async update(actor: Actor, id: string, data: Record<string, unknown>) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await scheduleRepo.findById(id);
    if (!existing) throw new NotFoundError('Jadval topilmadi');
    const updated = await scheduleRepo.update(id, {
      ...data,
      ...(data.date ? { date: new Date(data.date as string) } : {}),
    } as any);
    await logAudit(actor.id, 'UPDATE', 'Schedule', id, 'Jadval yangilandi');
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const existing = await scheduleRepo.findById(id);
    if (!existing) throw new NotFoundError();
    await scheduleRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Schedule', id, "Jadval o'chirildi");
  },
};
