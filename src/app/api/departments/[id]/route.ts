import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { departmentService } from '@/services/department.service';
import { departmentSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = departmentSchema.partial().safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const dept = await departmentService.update(session.user, params.id, parsed.data);
    return apiResponse.success(dept);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await departmentService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
