import { requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminOrAbove();
    const body = await req.json();
    const { type, fullName, phone, vehicleInfo, telegramUsername, notes } = body;

    if (fullName !== undefined && !fullName?.trim()) {
      return apiResponse.validationError('Ism familiya bo\'sh bo\'lmasligi kerak');
    }
    if (phone !== undefined && !phone?.trim()) {
      return apiResponse.validationError('Telefon raqam bo\'sh bo\'lmasligi kerak');
    }

    const updated = await prisma.contact.update({
      where: { id: params.id },
      data: {
        ...(type       !== undefined && { type }),
        ...(fullName   !== undefined && { fullName: fullName.trim() }),
        ...(phone      !== undefined && { phone: phone.trim() }),
        vehicleInfo:      vehicleInfo?.trim() || null,
        telegramUsername: telegramUsername?.trim().replace(/^@/, '') || null,
        notes:            notes?.trim() || null,
      },
    });

    await logAudit(session.user.id, 'UPDATE', 'Contact', params.id, `Kontakt yangilandi: ${updated.fullName}`);
    return apiResponse.success(updated);
  } catch (e) {
    return handleError(e);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminOrAbove();

    const contact = await prisma.contact.findUnique({ where: { id: params.id } });
    if (!contact) return apiResponse.notFound('Kontakt topilmadi');

    // Soft delete
    await prisma.contact.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAudit(session.user.id, 'DELETE', 'Contact', params.id, `Kontakt o'chirildi: ${contact.fullName}`);
    return apiResponse.noContent();
  } catch (e) {
    return handleError(e);
  }
}
