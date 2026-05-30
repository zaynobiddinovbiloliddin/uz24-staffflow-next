import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { prisma } from '@/lib/prisma';

const VALID_STATUSES = ['I', 'D', 'S', 'K', 'T', 'B', 'O'];

export async function GET(req: Request) {
  try {
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const where: any = {};
    if (session.user.role === 'EMPLOYEE') {
      where.userId = session.user.id;
    } else if (userId) {
      where.userId = userId;
    }
    if (from) where.date = { ...where.date, gte: new Date(from) };
    if (to) where.date = { ...where.date, lte: new Date(to) };

    const statuses = await prisma.dailyStatus.findMany({
      where,
      include: { user: { select: { id: true, fullName: true, position: true, department: { select: { name: true } } } } },
      orderBy: [{ date: 'asc' }],
    });

    return apiResponse.success(statuses);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    const session = await requireAuth();
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    const { userId, date, status, note } = body;

    if (!userId || !date || !status) {
      return NextResponse.json({ message: 'userId, date va status majburiy' }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ message: `Status noto\'g\'ri. Qabul qilinadiganlar: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const result = await prisma.dailyStatus.upsert({
      where: { userId_date: { userId, date: new Date(date) } },
      update: { status, note: note ?? null },
      create: { userId, date: new Date(date), status, note: note ?? null },
      include: { user: { select: { id: true, fullName: true } } },
    });

    return apiResponse.created(result);
  } catch (e) { return handleError(e); }
}

export async function PUT(req: Request) {
  try {
    const session = await requireAuth();
    if (session.user.role === 'EMPLOYEE') {
      return NextResponse.json({ message: 'Ruxsat yo\'q' }, { status: 403 });
    }

    const body = await req.json();
    const { entries, notifyUsers } = body;

    if (!Array.isArray(entries) || !entries.length) {
      return NextResponse.json({ message: 'entries massivi kerak' }, { status: 400 });
    }

    const results = await Promise.all(
      entries.map((e: any) =>
        prisma.dailyStatus.upsert({
          where: { userId_date: { userId: e.userId, date: new Date(e.date) } },
          update: { status: e.status, note: e.note ?? null },
          create: { userId: e.userId, date: new Date(e.date), status: e.status, note: e.note ?? null },
        }),
      ),
    );

    if (notifyUsers && Array.isArray(notifyUsers) && notifyUsers.length) {
      const month = new Date(entries[0].date).toLocaleString('uz', { month: 'long' });
      const year = new Date(entries[0].date).getFullYear();
      await prisma.notification.createMany({
        data: notifyUsers.map((uid: string) => ({
          userId: uid,
          title: 'Yangi oy jadvali tayyor!',
          message: `${month.charAt(0).toUpperCase() + month.slice(1)} ${year} oy jadvali tayyor! Profilingizda ko'ring.`,
          type: 'schedule',
        })),
      });
    }

    return apiResponse.success({ updated: results.length });
  } catch (e) { return handleError(e); }
}
