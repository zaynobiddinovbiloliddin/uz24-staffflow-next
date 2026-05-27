import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { analyticsService } from '@/services/analytics.service';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const type = new URL(req.url).searchParams.get('type') ?? 'overview';

    if (type === 'overview')    return apiResponse.success(await analyticsService.overview(session.user));
    if (type === 'tasks-chart') return apiResponse.success(await analyticsService.tasksChart(session.user));
    if (type === 'departments') return apiResponse.success(await analyticsService.departments(session.user));

    throw new ValidationError("Noto'g'ri type");
  } catch (e) { return handleError(e); }
}
