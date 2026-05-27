import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { departmentService } from '@/services/department.service';
import { departmentSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const data = await departmentService.list(session.user);
    return apiResponse.success(data);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = departmentSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const dept = await departmentService.create(session.user, parsed.data);
    return apiResponse.created(dept);
  } catch (e) { return handleError(e); }
}
