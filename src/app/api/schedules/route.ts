import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { scheduleService } from '@/services/schedule.service';
import { scheduleSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const data = await scheduleService.list(session.user, {
      userId: searchParams.get('userId') ?? undefined,
      from:   searchParams.get('from')   ?? undefined,
      to:     searchParams.get('to')     ?? undefined,
    });

    return apiResponse.success(data);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = scheduleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const schedule = await scheduleService.create(session.user, parsed.data);
    return apiResponse.created(schedule);
  } catch (e) { return handleError(e); }
}
