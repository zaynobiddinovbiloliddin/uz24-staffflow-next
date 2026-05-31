import { requireAuth, requireAdminOrAbove } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { logAudit } from '@/lib/audit';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get('date');
    const month = searchParams.get('month');
    const operatorName = searchParams.get('operatorName');

    const where: Record<string, unknown> = {};

    if (date) {
      where.date = new Date(date);
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0) };
    }

    if (operatorName) {
      where.operators = { some: { operatorNames: { has: operatorName } } };
    }

    const entries = await prisma.filmingEntry.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { date: 'desc' },
    });

    return apiResponse.success(entries);
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: Request) {
  try {
    const session = await requireAdminOrAbove();
    const body = await req.json();
    const { date, approvedBy, operators } = body;

    if (!date) return apiResponse.validationError('Sana majburiy');
    if (!Array.isArray(operators) || operators.length === 0) {
      return apiResponse.validationError("Kamida bitta qator qo'shilishi shart");
    }

    const entry = await prisma.filmingEntry.create({
      data: {
        date: new Date(date),
        approvedBy: approvedBy?.trim() || 'M. Safarov',
        createdById: session.user.id,
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
      'CREATE',
      'FilmingEntry',
      entry.id,
      `Tasvirga olish jadvali yaratildi: ${date}`,
    );

    return apiResponse.created(entry);
  } catch (e) {
    return handleError(e);
  }
}
