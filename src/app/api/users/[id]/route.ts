import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { userService } from '@/services/user.service';
import { updateUserSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';
import { prisma } from '@/lib/prisma';
import { logAudit } from '@/lib/audit';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const user = await userService.getById(session.user, params.id);
    return apiResponse.success(user);
  } catch (e) { return handleError(e); }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const user = await userService.update(session.user, params.id, parsed.data);
    return apiResponse.success(user);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await userService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    const body = await req.json();
    const { action } = body;

    if (action === 'toggle') {
      const updated = await userService.toggleActive(session.user, params.id);
      return apiResponse.success(updated);
    }

    if (action === 'changeDept') {
      if (!['SUPERADMIN', 'ADMIN'].includes(session.user.role)) {
        throw new ValidationError("Ruxsat yo'q");
      }
      const updated = await prisma.user.update({
        where: { id: params.id },
        data: { departmentId: body.departmentId || null },
        select: {
          id: true, fullName: true, departmentId: true,
          department: { select: { id: true, name: true } },
        },
      });
      await logAudit(session.user.id, 'CHANGE_DEPT', 'User', params.id,
        `Bo'lim o'zgartirildi → ${updated.department?.name ?? 'Tayinlanmagan'}`);
      return apiResponse.success(updated);
    }

    throw new ValidationError("Noto'g'ri action");
  } catch (e) { return handleError(e); }
}
