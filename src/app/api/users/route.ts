import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { userService } from '@/services/user.service';
import { createUserSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const users = await userService.list(session.user, {
      role:         searchParams.get('role') ?? undefined,
      departmentId: searchParams.get('departmentId') ?? undefined,
      search:       searchParams.get('search') ?? undefined,
      isActive:     searchParams.has('isActive') ? searchParams.get('isActive') === 'true' : undefined,
    });

    return apiResponse.success(users);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createUserSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const user = await userService.create(session.user, parsed.data);
    return apiResponse.created(user);
  } catch (e) { return handleError(e); }
}
