import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    const { cameraNo, startTime, location, topic, reporters, equipment, operatorIds } = body;

    await prisma.filmingOperator.deleteMany({ where: { filmingEntryId: params.id } });

    const updated = await prisma.filmingEntry.update({
      where: { id: params.id },
      data: {
        ...(cameraNo !== undefined && { cameraNo: Number(cameraNo) }),
        ...(startTime && { startTime }),
        ...(location && { location }),
        ...(topic && { topic }),
        reporters: reporters ?? null,
        equipment: equipment ?? null,
        operators: operatorIds?.length
          ? { create: operatorIds.map((uid: string) => ({ userId: uid })) }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    return apiResponse.success(updated);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAuth();
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });
    }

    await prisma.filmingEntry.delete({ where: { id: params.id } });
    return new NextResponse(null, { status: 204 });
  } catch (e) { return handleError(e); }
}
