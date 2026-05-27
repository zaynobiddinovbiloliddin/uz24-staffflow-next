import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { notificationRepo } from '@/repositories/notification.repository';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get('unread') === 'true';

    const [notifications, unreadCount] = await Promise.all([
      notificationRepo.listForUser(session.user.id, unreadOnly),
      notificationRepo.countUnread(session.user.id),
    ]);

    return apiResponse.success({ notifications, unreadCount });
  } catch (e) { return handleError(e); }
}
