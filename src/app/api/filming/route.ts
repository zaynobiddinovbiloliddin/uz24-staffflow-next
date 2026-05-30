import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

export async function GET(req: Request) {
  try {
    await requireAuth();
    const { searchParams } = new URL(req.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const date = searchParams.get('date');

    const where: any = {};
    if (date) where.date = new Date(date);
    else {
      if (from) where.date = { ...where.date, gte: new Date(from) };
      if (to) where.date = { ...where.date, lte: new Date(to) };
    }

    const entries = await prisma.filmingEntry.findMany({
      where,
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { include: { user: { select: { id: true, fullName: true, position: true } } } },
      },
      orderBy: [{ date: 'asc' }, { cameraNo: 'asc' }],
    });

    return apiResponse.success(entries);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    const { date, cameraNo, startTime, location, topic, reporters, equipment, operatorIds } = body;

    if (!date || !cameraNo || !startTime || !location || !topic) {
      return NextResponse.json({ message: 'date, cameraNo, startTime, location va topic majburiy' }, { status: 400 });
    }

    const entry = await prisma.filmingEntry.create({
      data: {
        date: new Date(date),
        cameraNo: Number(cameraNo),
        startTime,
        location,
        topic,
        reporters: reporters ?? null,
        equipment: equipment ?? null,
        createdById: session.user.id,
        operators: operatorIds?.length
          ? { create: operatorIds.map((uid: string) => ({ userId: uid })) }
          : undefined,
      },
      include: {
        createdBy: { select: { id: true, fullName: true } },
        operators: { include: { user: { select: { id: true, fullName: true } } } },
      },
    });

    return apiResponse.created(entry);
  } catch (e) { return handleError(e); }
}
