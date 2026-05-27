import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { taskService } from '@/services/task.service';
import { createTaskSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const tasks = await taskService.list(session.user, {
      status:   searchParams.get('status')   ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      search:   searchParams.get('search')   ?? undefined,
    });

    return apiResponse.success(tasks);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createTaskSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const task = await taskService.create(session.user, parsed.data);
    return apiResponse.created(task);
  } catch (e) { return handleError(e); }
}
