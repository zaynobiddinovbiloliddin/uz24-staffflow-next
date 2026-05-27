import { taskRepo, TaskFilter } from '@/repositories/task.repository';
import { notificationRepo } from '@/repositories/notification.repository';
import { logAudit } from '@/lib/audit';
import { ForbiddenError, NotFoundError } from '@/lib/errors';
import type { Session } from 'next-auth';

type Actor = Session['user'];

export const taskService = {
  async list(actor: Actor, filter: TaskFilter) {
    if (actor.role === 'EMPLOYEE') filter.assignedToId = actor.id;
    else if (actor.role === 'ADMIN' && actor.departmentId) filter.departmentId = actor.departmentId;
    return taskRepo.list(filter);
  },

  async getById(actor: Actor, id: string) {
    const task = await taskRepo.findById(id);
    if (!task) throw new NotFoundError('Vazifa topilmadi');
    if (actor.role === 'EMPLOYEE' && task.assignedToId !== actor.id) throw new ForbiddenError();
    return task;
  },

  async create(actor: Actor, data: {
    title: string; description?: string; priority: string;
    deadline?: string; assignedToId?: string; departmentId?: string;
  }) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();

    const task = await taskRepo.create({
      ...data,
      deadline: data.deadline ? new Date(data.deadline) : undefined,
      createdById: actor.id,
    });

    if (task.assignedToId) {
      await notificationRepo.create({
        title: 'Yangi vazifa tayinlandi',
        message: `Sizga yangi vazifa: "${task.title}"`,
        type: 'task',
        userId: task.assignedToId,
      });
    }

    await logAudit(actor.id, 'CREATE', 'Task', task.id, `Vazifa yaratildi: ${task.title}`);
    return task;
  },

  async update(actor: Actor, id: string, data: Record<string, unknown>) {
    const task = await taskRepo.findById(id);
    if (!task) throw new NotFoundError();

    // Employee can only update status of their own tasks
    if (actor.role === 'EMPLOYEE') {
      if (task.assignedToId !== actor.id) throw new ForbiddenError();
      const allowedKeys = ['status'];
      const illegal = Object.keys(data).filter((k) => !allowedKeys.includes(k));
      if (illegal.length) throw new ForbiddenError('Siz faqat holatni o\'zgartira olasiz');
    }

    if (data.deadline) data.deadline = new Date(data.deadline as string);

    const updated = await taskRepo.update(id, data);
    await logAudit(actor.id, 'UPDATE', 'Task', id, `Vazifa yangilandi: ${task.title}`);
    return updated;
  },

  async delete(actor: Actor, id: string) {
    if (actor.role === 'EMPLOYEE') throw new ForbiddenError();
    const task = await taskRepo.findById(id);
    if (!task) throw new NotFoundError();
    await taskRepo.delete(id);
    await logAudit(actor.id, 'DELETE', 'Task', id, `Vazifa o'chirildi: ${task.title}`);
  },
};
