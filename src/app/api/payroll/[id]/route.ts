import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { payrollService } from '@/services/payroll.service';
import { ValidationError } from '@/lib/errors';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    const { action } = await req.json();

    if (action === 'pay') {
      const payroll = await payrollService.pay(session.user, params.id);
      return apiResponse.success(payroll);
    }

    throw new ValidationError("Noto'g'ri action");
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await payrollService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
