import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { notificationRepo } from '@/repositories/notification.repository';
import { ValidationError } from '@/lib/errors';

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    const { action } = await req.json();

    if (action === 'read') {
      const result = await notificationRepo.markRead(params.id, session.user.id);
      return apiResponse.success(result);
    }

    throw new ValidationError("Noto'g'ri action");
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await notificationRepo.delete(params.id, session.user.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
