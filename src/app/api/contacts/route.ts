import { requireAuth, requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const type   = searchParams.get('type')   as 'DRIVER' | 'REPORTER' | 'TECHNICIAN' | 'OTHER' | null;
    const search = searchParams.get('search') ?? '';

    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;
    if (search.trim()) {
      where.OR = [
        { fullName: { contains: search.trim(), mode: 'insensitive' } },
        { phone:    { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      orderBy: [{ type: 'asc' }, { fullName: 'asc' }],
      select: {
        id: true, type: true, fullName: true, phone: true,
        vehicleInfo: true, telegramUsername: true, notes: true,
        createdAt: true,
      },
    });

    return apiResponse.success(contacts);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminOrAbove();
    const body = await req.json();
    const { type, fullName, phone, vehicleInfo, telegramUsername, notes } = body;

    if (!type) return apiResponse.validationError('Kontakt turi majburiy');
    if (!fullName?.trim()) return apiResponse.validationError('Ism familiya majburiy');
    if (!phone?.trim())  return apiResponse.validationError('Telefon raqam majburiy');

    // Session foydalanuvchisi hali ham mavjudligini tekshiramiz
    const sessionUser = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true } });
    if (!sessionUser) {
      return apiResponse.unauthorized('Seansingiz eskirgan. Iltimos, tizimdan chiqib qayta kiring.');
    }

    const contact = await prisma.contact.create({
      data: {
        type,
        fullName: fullName.trim(),
        phone: phone.trim(),
        vehicleInfo: vehicleInfo?.trim() || null,
        telegramUsername: telegramUsername?.trim().replace(/^@/, '') || null,
        notes: notes?.trim() || null,
        createdById: session.user.id,
      },
    });

    await logAudit(session.user.id, 'CREATE', 'Contact', contact.id, `Kontakt yaratildi: ${contact.fullName}`);
    return apiResponse.created(contact);
  } catch (e) {
    return handleError(e);
  }
}
