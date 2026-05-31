import bcrypt from 'bcryptjs';
import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { prisma } from '@/lib/prisma';
import { NotFoundError, ValidationError, ConflictError } from '@/lib/errors';

const PHONE_REGEX = /^[+\d\s\-()]{7,20}$/;
const AVATAR_PREFIX_REGEX = /^data:image\/(jpeg|png|webp|gif);base64,/;
const MAX_AVATAR_BYTES = 150_000;
const USERNAME_REGEX = /^[a-z0-9_]+$/;

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
        portfolioLinks: true,
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

    if (body.fullName !== undefined) {
      if (!body.fullName || body.fullName.trim().length < 2) {
        throw new ValidationError('Ism kamida 2 ta harf bo\'lishi kerak');
      }
      updateData.fullName = body.fullName.trim();
    }

    if (body.username !== undefined) {
      const uname = body.username.trim().toLowerCase();
      if (uname.length < 3) throw new ValidationError('Username kamida 3 ta harf');
      if (!USERNAME_REGEX.test(uname)) throw new ValidationError('Faqat kichik harf, raqam, _ ishlatiladi');
      const existing = await prisma.user.findFirst({ where: { username: uname, NOT: { id: session.user.id } } });
      if (existing) throw new ConflictError('Bu username band');
      updateData.username = uname;
    }

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

    if (body.newPassword !== undefined && body.newPassword !== '') {
      if (body.newPassword.length < 6) throw new ValidationError('Parol kamida 6 ta belgi');
      updateData.password = await bcrypt.hash(body.newPassword, 12);
    }

    if (Object.keys(updateData).length === 0) {
      throw new ValidationError("O'zgartirishlar topilmadi");
    }

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: { id: true, fullName: true, username: true, phone: true, avatar: true },
    });

    return apiResponse.success(updated);
  } catch (e) { return handleError(e); }
}
