import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { payrollService } from '@/services/payroll.service';
import { createPayrollSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);

    const data = await payrollService.list(session.user, {
      month:  searchParams.get('month')  ? Number(searchParams.get('month'))  : undefined,
      year:   searchParams.get('year')   ? Number(searchParams.get('year'))   : undefined,
      status: searchParams.get('status') ?? undefined,
    });

    return apiResponse.success(data);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createPayrollSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const payroll = await payrollService.create(session.user, parsed.data);
    return apiResponse.created(payroll);
  } catch (e) { return handleError(e); }
}
