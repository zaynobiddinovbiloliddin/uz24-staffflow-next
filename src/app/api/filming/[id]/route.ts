import { requireAuth, requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAuth();
    const entry = await prisma.filmingEntry.findUnique({
      where: { id: params.id },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { orderBy: { sortOrder: 'asc' } },
      },
    });
    if (!entry) return apiResponse.notFound('Jadval topilmadi');
    return apiResponse.success(entry);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminOrAbove();
    const body = await req.json();
    const { date, approvedBy, operators } = body;

    if (!Array.isArray(operators) || operators.length === 0) {
      return apiResponse.validationError("Kamida bitta qator bo'lishi shart");
    }

    await prisma.filmingOperator.deleteMany({ where: { filmingEntryId: params.id } });

    const updated = await prisma.filmingEntry.update({
      where: { id: params.id },
      data: {
        ...(date && { date: new Date(date) }),
        ...(approvedBy !== undefined && { approvedBy: approvedBy?.trim() || 'M. Safarov' }),
        operators: {
          create: operators.map((op: any, idx: number) => ({
            cameraNumber: String(op.cameraNumber ?? ''),
            exitTime: String(op.exitTime ?? ''),
            operatorNames: Array.isArray(op.operatorNames) ? op.operatorNames : [],
            eventLocation: String(op.eventLocation ?? ''),
            eventDescription: op.eventDescription?.trim() || null,
            reporterNames: Array.isArray(op.reporterNames) ? op.reporterNames : [],
            equipment: op.equipment?.trim() || 'HD jamlanmasi, mikrofon, chiroq, avtotransport',
            sortOrder: typeof op.sortOrder === 'number' ? op.sortOrder : idx,
          })),
        },
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { orderBy: { sortOrder: 'asc' } },
      },
    });

    await logAudit(
      session.user.id,
      'UPDATE',
      'FilmingEntry',
      params.id,
      `Tasvirga olish jadvali yangilandi`,
    );

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
    await prisma.filmingEntry.delete({ where: { id: params.id } });

    await logAudit(
      session.user.id,
      'DELETE',
      'FilmingEntry',
      params.id,
      "Tasvirga olish jadvali o'chirildi",
    );

    return apiResponse.noContent();
  } catch (e) {
    return handleError(e);
  }
}
