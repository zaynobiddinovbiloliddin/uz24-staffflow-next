import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { taskService } from '@/services/task.service';
import { updateTaskSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const task = await taskService.getById(session.user, params.id);
    return apiResponse.success(task);
  } catch (e) { return handleError(e); }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = updateTaskSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const task = await taskService.update(session.user, params.id, parsed.data);
    return apiResponse.success(task);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await taskService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
