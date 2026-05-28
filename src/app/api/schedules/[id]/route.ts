import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { scheduleService } from '@/services/schedule.service';
import { updateScheduleSchema as scheduleSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const schedule = await scheduleService.update(session.user, params.id, parsed.data);
    return apiResponse.success(schedule);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await scheduleService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
