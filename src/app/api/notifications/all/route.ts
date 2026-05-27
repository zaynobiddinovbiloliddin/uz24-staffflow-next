import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { notificationRepo } from '@/repositories/notification.repository';

export async function PATCH(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await notificationRepo.markAllRead(session.user.id);
    return apiResponse.success({ message: "Barchasi o'qildi" });
  } catch (e) { return handleError(e); }
}
