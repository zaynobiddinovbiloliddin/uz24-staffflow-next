import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { NotFoundError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, fullName: true, username: true, role: true,
        position: true, phone: true, telegramId: true, avatar: true,
        isActive: true, departmentId: true, createdAt: true,
        department: { select: { id: true, name: true, color: true } },
      },
    });

    if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
    return apiResponse.success(user);
  } catch (e) { return handleError(e); }
}
