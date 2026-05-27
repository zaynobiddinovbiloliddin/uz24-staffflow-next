import { prisma } from '@/lib/prisma';

export const notificationRepo = {
  async listForUser(userId: string, unreadOnly = false) {
    return prisma.notification.findMany({
      where: { userId, ...(unreadOnly ? { isRead: false } : {}) },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  },

  async countUnread(userId: string) {
    return prisma.notification.count({ where: { userId, isRead: false } });
  },

  async markRead(id: string, userId: string) {
    return prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  },

  async markAllRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  },

  async create(data: { title: string; message: string; type: string; userId: string }) {
    return prisma.notification.create({ data }).catch(() => null);
  },

  async delete(id: string, userId: string) {
    return prisma.notification.deleteMany({ where: { id, userId } });
  },
};
