import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    await requireAuth();

    const now = new Date();
    // Use local calendar date to match @db.Date storage
    const dayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

    const entry = await prisma.filmingEntry.findFirst({
      where: { date: { gte: dayStart, lt: dayEnd } },
      include: { operators: { orderBy: { sortOrder: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    return apiResponse.success(entry ?? null);
  } catch (e) {
    return handleError(e);
  }
}
