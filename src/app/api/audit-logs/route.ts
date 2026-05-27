import { requireSuperAdmin } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireSuperAdmin();
    const { searchParams } = new URL(req.url);

    const entity = searchParams.get('entity');
    const action = searchParams.get('action');
    const userId = searchParams.get('userId');
    const page   = Math.max(1, parseInt(searchParams.get('page')  ?? '1'));
    const limit  = Math.min(100, parseInt(searchParams.get('limit') ?? '50'));

    const where = {
      ...(entity && { entity }),
      ...(action && { action }),
      ...(userId && { userId }),
    };

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { id: true, fullName: true, role: true, avatar: true } } },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return apiResponse.success({ logs, total, page, limit, pages: Math.ceil(total / limit) });
  } catch (e) { return handleError(e); }
}
