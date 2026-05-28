import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

async function isAuthorized(req: Request): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get('authorization');
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) return true;

  const session = await getServerSession(authOptions);
  return session?.user?.role === 'SUPERADMIN';
}

function esc(val: unknown): string {
  if (val === null || val === undefined) return 'NULL';
  if (typeof val === 'boolean') return val ? 'TRUE' : 'FALSE';
  if (typeof val === 'number') return String(val);
  if (val instanceof Date) return `'${val.toISOString()}'`;
  return `'${String(val).replace(/'/g, "''")}'`;
}

function generateSQL(data: {
  exportedAt: string;
  users: any[];
  tasks: any[];
  departments: any[];
  equipment: any[];
  vehicles: any[];
  payrolls: any[];
}): string {
  const lines: string[] = [
    `-- ============================================================`,
    `-- Uz24 StaffFlow — SQL Backup`,
    `-- Exported: ${data.exportedAt}`,
    `-- Users: ${data.users.length} | Tasks: ${data.tasks.length} | Depts: ${data.departments.length}`,
    `-- Equipment: ${data.equipment.length} | Vehicles: ${data.vehicles.length} | Payrolls: ${data.payrolls.length}`,
    `-- ============================================================`,
    ``,
    `-- DEPARTMENTS`,
    `TRUNCATE "Department" CASCADE;`,
  ];

  if (data.departments.length) {
    lines.push(
      `INSERT INTO "Department" (id, name, description, color) VALUES`
    );
    lines.push(
      data.departments
        .map((d) => `  (${esc(d.id)}, ${esc(d.name)}, ${esc(d.description)}, ${esc(d.color)})`)
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- USERS`, `TRUNCATE "User" CASCADE;`);
  if (data.users.length) {
    lines.push(
      `INSERT INTO "User" (id, fullName, username, role, position, phone, isActive, createdAt, departmentId) VALUES`
    );
    lines.push(
      data.users
        .map(
          (u) =>
            `  (${esc(u.id)}, ${esc(u.fullName)}, ${esc(u.username)}, ${esc(u.role)}, ` +
            `${esc(u.position)}, ${esc(u.phone)}, ${esc(u.isActive)}, ${esc(u.createdAt)}, ${esc(u.departmentId ?? null)})`
        )
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- TASKS`, `TRUNCATE "Task" CASCADE;`);
  if (data.tasks.length) {
    lines.push(
      `INSERT INTO "Task" (id, title, status, priority, deadline, cancelReason, createdAt, assignedToId, departmentId) VALUES`
    );
    lines.push(
      data.tasks
        .map(
          (t) =>
            `  (${esc(t.id)}, ${esc(t.title)}, ${esc(t.status)}, ${esc(t.priority)}, ` +
            `${esc(t.deadline)}, ${esc(t.cancelReason ?? null)}, ${esc(t.createdAt)}, ` +
            `${esc(t.assignedToId ?? null)}, ${esc(t.departmentId ?? null)})`
        )
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- EQUIPMENT`, `TRUNCATE "Equipment" CASCADE;`);
  if (data.equipment.length) {
    lines.push(
      `INSERT INTO "Equipment" (id, name, type, serialNumber, status, condition, assignedToId) VALUES`
    );
    lines.push(
      data.equipment
        .map(
          (e) =>
            `  (${esc(e.id)}, ${esc(e.name)}, ${esc(e.type)}, ${esc(e.serialNumber ?? null)}, ` +
            `${esc(e.status)}, ${esc(e.condition ?? null)}, ${esc(e.assignedToId ?? null)})`
        )
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- VEHICLES`, `TRUNCATE "Vehicle" CASCADE;`);
  if (data.vehicles.length) {
    lines.push(
      `INSERT INTO "Vehicle" (id, name, plateNumber, type, status, fuelType, mileage, assignedToId) VALUES`
    );
    lines.push(
      data.vehicles
        .map(
          (v) =>
            `  (${esc(v.id)}, ${esc(v.name)}, ${esc(v.plateNumber)}, ${esc(v.type)}, ` +
            `${esc(v.status)}, ${esc(v.fuelType ?? null)}, ${esc(v.mileage ?? null)}, ${esc(v.assignedToId ?? null)})`
        )
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- PAYROLLS`, `TRUNCATE "Payroll" CASCADE;`);
  if (data.payrolls.length) {
    lines.push(
      `INSERT INTO "Payroll" (id, userId, month, year, baseSalary, bonus, deductions, totalAmount, status) VALUES`
    );
    lines.push(
      data.payrolls
        .map(
          (p) =>
            `  (${esc(p.id)}, ${esc(p.userId)}, ${esc(p.month)}, ${esc(p.year)}, ` +
            `${esc(p.baseSalary)}, ${esc(p.bonus)}, ${esc(p.deductions)}, ${esc(p.totalAmount)}, ${esc(p.status)})`
        )
        .join(',\n') + ';'
    );
  }

  lines.push(``, `-- END OF BACKUP`);
  return lines.join('\n');
}

async function sendToTelegram(chatId: string, token: string, sqlContent: string, summary: Record<string, number>): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 19).replace('T', '_').replace(/:/g, '-');
  const fileName = `uz24_backup_${date}.sql`;

  const blob = new Blob([sqlContent], { type: 'text/plain' });
  const formData = new FormData();
  formData.append('chat_id', chatId);
  formData.append('document', blob, fileName);
  formData.append(
    'caption',
    `🗄 Uz24 StaffFlow SQL Backup\n🕐 ${new Date().toLocaleString('uz-Latn-UZ')}\n` +
    `👤 ${summary.users} xodim | 📋 ${summary.tasks} vazifa | 🏢 ${summary.departments} bo'lim`
  );

  const res = await fetch(`https://api.telegram.org/bot${token}/sendDocument`, {
    method: 'POST',
    body: formData,
  });

  return res.ok;
}

export async function POST(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token  = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_BACKUP_CHAT_ID;

  if (!token)  return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN sozlanmagan' }, { status: 400 });
  if (!chatId) return NextResponse.json({ error: 'TELEGRAM_BACKUP_CHAT_ID sozlanmagan' }, { status: 400 });

  try {
    const [users, tasks, departments, equipment, vehicles, payrolls] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true, fullName: true, username: true, role: true,
          position: true, phone: true, isActive: true, createdAt: true,
          departmentId: true,
        },
        orderBy: { fullName: 'asc' },
      }),
      prisma.task.findMany({
        select: {
          id: true, title: true, status: true, priority: true,
          deadline: true, createdAt: true, cancelReason: true,
          assignedToId: true, departmentId: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 1000,
      }),
      prisma.department.findMany({
        select: { id: true, name: true, description: true, color: true },
      }),
      prisma.equipment.findMany({
        select: {
          id: true, name: true, type: true, serialNumber: true,
          status: true, condition: true, assignedToId: true,
        },
      }),
      prisma.vehicle.findMany({
        select: {
          id: true, name: true, plateNumber: true, type: true,
          status: true, fuelType: true, mileage: true, assignedToId: true,
        },
      }),
      prisma.payroll.findMany({
        select: {
          id: true, userId: true, month: true, year: true, baseSalary: true,
          bonus: true, deductions: true, totalAmount: true, status: true,
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
      }),
    ]);

    const summary = {
      users: users.length,
      tasks: tasks.length,
      departments: departments.length,
      equipment: equipment.length,
      vehicles: vehicles.length,
      payrolls: payrolls.length,
    };

    const sqlContent = generateSQL({
      exportedAt: new Date().toISOString(),
      users, tasks, departments, equipment, vehicles, payrolls,
    });

    const ok = await sendToTelegram(chatId, token, sqlContent, summary);

    if (!ok) {
      return NextResponse.json({ error: "Telegram ga jo'natishda xato. Chat ID to'g'riligini tekshiring." }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "SQL backup muvaffaqiyatli jo'natildi", summary });
  } catch (error) {
    console.error('Backup error:', error);
    return NextResponse.json({ error: 'Backup yaratishda xato' }, { status: 500 });
  }
}

// GET — chat_id ni avtomatik topish uchun
export async function GET(req: Request) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'TELEGRAM_BOT_TOKEN sozlanmagan' }, { status: 400 });
  }

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/getUpdates?limit=5`);
    const data = await res.json();

    if (!data.ok || !data.result?.length) {
      return NextResponse.json({
        message: "Hali xabar yo'q. Botga /start yoki biror xabar yuboring, keyin qayta urining.",
        updates: [],
      });
    }

    const chats = data.result.map((u: any) => ({
      chat_id: u.message?.chat?.id,
      type: u.message?.chat?.type,
      title: u.message?.chat?.title ?? u.message?.chat?.username ?? u.message?.chat?.first_name,
    })).filter((c: any) => c.chat_id);

    return NextResponse.json({ chats, message: "Quyidagi chat_id lardan birini tanlang" });
  } catch {
    return NextResponse.json({ error: 'Telegram API ga ulanishda xato' }, { status: 500 });
  }
}
