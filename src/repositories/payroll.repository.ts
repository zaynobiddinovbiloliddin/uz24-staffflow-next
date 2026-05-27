import { prisma } from '@/lib/prisma';

const INCLUDE = {
  user: { select: { id: true, fullName: true, position: true, avatar: true, department: { select: { name: true } } } },
} as const;

export interface PayrollFilter { month?: number; year?: number; status?: string; userId?: string; }

export const payrollRepo = {
  async list(filter: PayrollFilter = {}) {
    return prisma.payroll.findMany({
      where: {
        ...(filter.userId  && { userId: filter.userId }),
        ...(filter.month   && { month: filter.month }),
        ...(filter.year    && { year: filter.year }),
        ...(filter.status  && { status: filter.status as any }),
      },
      include: INCLUDE,
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  },

  async findById(id: string) {
    return prisma.payroll.findUnique({ where: { id }, include: INCLUDE });
  },

  async findUnique(userId: string, month: number, year: number) {
    return prisma.payroll.findUnique({ where: { userId_month_year: { userId, month, year } } });
  },

  async create(data: { userId: string; month: number; year: number; baseSalary: number; bonus: number; deductions: number; totalAmount: number; notes?: string }) {
    return prisma.payroll.create({ data, include: INCLUDE });
  },

  async pay(id: string) {
    return prisma.payroll.update({
      where: { id },
      data: { status: 'PAID', paidAt: new Date() } as any,
      include: INCLUDE,
    });
  },

  async delete(id: string) {
    return prisma.payroll.delete({ where: { id } });
  },
};
