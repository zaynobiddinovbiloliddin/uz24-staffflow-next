import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError } from '@/lib/errors';

const PHONE_REGEX = /^[+\d\s\-()]{7,20}$/;
const AVATAR_PREFIX_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,/;
const MAX_AVATAR_BYTES = 150_000;

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true, fullName: true, username: true, role: true,
        position: true, phone: true, telegramId: true, avatar: true,
        isActive: true, departmentId: true, createdAt: true,
        department: { select: { id: true, name: true, color: true } },
      },
    });

    if (!user) throw new NotFoundError('Foydalanuvchi topilmadi');
    return apiResponse.success(user);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    const body = await req.json();

    const updateData: Record<string, unknown> = {};

    if (body.phone !== undefined) {
      if (body.phone && !PHONE_REGEX.test(body.phone)) {
        throw new ValidationError("Noto'g'ri telefon raqam formati");
      }
      updateData.phone = body.phone || null;
    }

    if (body.avatar !== undefined) {
      if (body.avatar) {
        if (!AVATAR_PREFIX_REGEX.test(body.avatar)) {
          throw new ValidationError('Avatar faqat JPEG, PNG, WebP yoki GIF formatida bo\'lishi kerak');
        }
        if (body.avatar.length > MAX_AVATAR_BYTES) {
          throw new ValidationError('Avatar hajmi 100KB dan oshmasligi kerak');
        }
      }
      updateData.avatar = body.avatar || null;
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, fullName: true, phone: true, avatar: true },
    });

    return apiResponse.success(updated);
  } catch (e) { return handleError(e); }
}
