import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';
import { ForbiddenError } from '@/lib/errors';

const MAX_LINKS = 20;
const URL_REGEX = /^https?:\/\/.+/;

async function canManage(actorId: string, actorRole: string, targetUserId: string) {
  if (actorRole === 'EMPLOYEE' && actorId !== targetUserId) throw new ForbiddenError();
}

export async function POST(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    await canManage(session.user.id, session.user.role, params.id);

    const body = await req.json();
    const url   = (body.url   as string ?? '').trim();
    const title = (body.title as string ?? '').trim() || undefined;

    if (!url) return apiResponse.validationError('URL majburiy');
    if (!URL_REGEX.test(url)) return apiResponse.validationError('URL http:// yoki https:// bilan boshlanishi kerak');

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { portfolioLinks: true, fullName: true },
    });
    if (!user) return apiResponse.notFound('Foydalanuvchi topilmadi');
    if (user.portfolioLinks.length >= MAX_LINKS) {
      return apiResponse.validationError(`Maksimal ${MAX_LINKS} ta link qo'shish mumkin`);
    }

    const entry = JSON.stringify({ url, ...(title && { title }) });
    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { portfolioLinks: { push: entry } },
      select: { portfolioLinks: true },
    });

    await logAudit(session.user.id, 'ADD_PORTFOLIO', 'User', params.id, `Portfolio link qo'shildi: ${url}`);
    return apiResponse.created(updated.portfolioLinks);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAuth();
    await canManage(session.user.id, session.user.role, params.id);

    const body = await req.json();
    const url = (body.url as string ?? '').trim();
    if (!url) return apiResponse.validationError('URL majburiy');

    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: { portfolioLinks: true, fullName: true },
    });
    if (!user) return apiResponse.notFound('Foydalanuvchi topilmadi');

    const filtered = user.portfolioLinks.filter((s) => {
      try { return JSON.parse(s).url !== url; } catch { return true; }
    });

    const updated = await prisma.user.update({
      where: { id: params.id },
      data: { portfolioLinks: { set: filtered } },
      select: { portfolioLinks: true },
    });

    await logAudit(session.user.id, 'REMOVE_PORTFOLIO', 'User', params.id, `Portfolio link o'chirildi: ${url}`);
    return apiResponse.success(updated.portfolioLinks);
  } catch (e) {
    return handleError(e);
  }
}
