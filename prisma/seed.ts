import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seed boshlandi...');

  // Tozalash — FK tartibiga rioya qilib
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.report.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.dailyStatus.deleteMany();
  await prisma.filmingOperator.deleteMany();
  await prisma.filmingEntry.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.schedule.deleteMany();
  await prisma.task.deleteMany();
  await prisma.user.deleteMany();
  await prisma.department.deleteMany();

  // Bo'limlar
  const departments = await Promise.all([
    prisma.department.create({ data: { name: "Yangiliklar bo'limi", description: 'Xabarlar va yangiliklar tayyorlash', color: '#3b82f6' } }),
    prisma.department.create({ data: { name: "Operatorlar bo'limi", description: 'TV va drone operatorlar', color: '#10b981' } }),
    prisma.department.create({ data: { name: "Texnik bo'lim", description: "Texnik ta'minot va uskunalar", color: '#f59e0b' } }),
    prisma.department.create({ data: { name: "POLL bo'limi", description: 'Online efir va streaming', color: '#8b5cf6' } }),
    prisma.department.create({ data: { name: "TJK bo'limi", description: 'Tashkiliy-jamoatchilik ishlari', color: '#ef4444' } }),
  ]);

  const [news, operators, tech, poll, tjk] = departments;

  // Parollar
  const superPass = await bcrypt.hash('Super@2025', 12);
  const adminPass = await bcrypt.hash('Admin@2025', 12);
  const staffPass = await bcrypt.hash('Staff@2025', 12);

  // Foydalanuvchilar
  const superadmin = await prisma.user.create({
    data: { fullName: 'Sardor Toshmatov', username: 'superadmin', password: superPass, role: 'SUPERADMIN', position: 'Bosh administrator', phone: '+998901234567', isActive: true },
  });

  const admin1 = await prisma.user.create({
    data: { fullName: 'Aziz Karimov', username: 'admin01', password: adminPass, role: 'ADMIN', position: "Bo'lim boshlig'i", phone: '+998901234568', isActive: true, departmentId: operators.id },
  });

  const admin2 = await prisma.user.create({
    data: { fullName: 'Dilnoza Yusupova', username: 'admin02', password: adminPass, role: 'ADMIN', position: 'Xabarlar muharriri', phone: '+998901234569', isActive: true, departmentId: news.id },
  });

  const emp1 = await prisma.user.create({
    data: { fullName: 'Jasur Rahimov', username: 'operator01', password: staffPass, role: 'EMPLOYEE', position: 'TV Operator', phone: '+998901234570', isActive: true, departmentId: operators.id },
  });

  const emp2 = await prisma.user.create({
    data: { fullName: 'Malika Hasanova', username: 'operator02', password: staffPass, role: 'EMPLOYEE', position: 'Drone Operator', phone: '+998901234571', isActive: true, departmentId: operators.id },
  });

  const emp3 = await prisma.user.create({
    data: { fullName: 'Bobur Ismoilov', username: 'poll01', password: staffPass, role: 'EMPLOYEE', position: 'POLL Operator', phone: '+998901234572', isActive: true, departmentId: poll.id },
  });

  const emp4 = await prisma.user.create({
    data: { fullName: 'Nilufar Qodirova', username: 'tjk01', password: staffPass, role: 'EMPLOYEE', position: 'TJK Mutaxassisi', phone: '+998901234573', isActive: true, departmentId: tjk.id },
  });

  console.log('✅ 7 ta foydalanuvchi yaratildi');

  // Vazifalar
  const t1 = await prisma.task.create({
    data: { title: 'Toshkent shahar tadbirini yoritish', description: "Shahar hokimligi anjumanini to'liq yoritish", status: 'IN_PROGRESS', priority: 'HIGH', deadline: new Date(Date.now() + 2 * 86400000), createdById: admin1.id, assignedToId: emp1.id, departmentId: operators.id },
  });
  const t2 = await prisma.task.create({
    data: { title: "Yangiliklar yig'indisini tayyorlash", description: "Kunlik 19:00 yangiliklar dasturi uchun material", status: 'PENDING', priority: 'URGENT', deadline: new Date(Date.now() + 86400000), createdById: admin2.id, assignedToId: emp1.id, departmentId: news.id },
  });
  await prisma.task.create({
    data: { title: 'Drone uchirish — Navruz marosimlari', description: 'Aerial suratga olish', status: 'COMPLETED', priority: 'MEDIUM', deadline: new Date(Date.now() - 86400000), createdById: admin1.id, assignedToId: emp2.id, departmentId: operators.id },
  });
  await prisma.task.create({
    data: { title: 'Onlayn efir sozlash', description: 'YouTube va telekanal saytida jonli efir', status: 'PENDING', priority: 'HIGH', deadline: new Date(Date.now() + 3 * 86400000), createdById: superadmin.id, assignedToId: emp3.id, departmentId: poll.id },
  });
  await prisma.task.create({
    data: { title: 'Jamoa uchrashuvi tashkil etish', description: "Oylik umumiy yig'ilish", status: 'IN_PROGRESS', priority: 'LOW', deadline: new Date(Date.now() + 7 * 86400000), createdById: superadmin.id, assignedToId: emp4.id, departmentId: tjk.id },
  });

  console.log('✅ Vazifalar yaratildi');

  // ── Jadvallar — May va Iyun 2026 + bugundan 7 kun ──────────────────────────
  const employees = [
    { user: emp1, start: '08:00', end: '17:00', shift: 'Kunduzgi', sickDay: 7  },
    { user: emp2, start: '08:00', end: '17:00', shift: 'Kunduzgi', sickDay: 14 },
    { user: emp3, start: '14:00', end: '22:00', shift: 'Kechki',   sickDay: 21 },
    { user: emp4, start: '09:00', end: '18:00', shift: 'Kunduzgi', sickDay: 10 },
  ];

  // Generate schedules for a full month
  async function seedMonth(year: number, month: number) {
    const daysInMonth = new Date(year, month, 0).getDate();
    const records: any[] = [];
    for (const emp of employees) {
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month - 1, d);
        const dow = date.getDay(); // 0=Sun, 6=Sat
        const isWeekend = dow === 0 || dow === 6;
        let shiftType: string;
        let startTime: string;
        let endTime: string;
        if (isWeekend) {
          shiftType = 'Dam'; startTime = '00:00'; endTime = '00:00';
        } else if (d === emp.sickDay) {
          shiftType = 'Kasallik'; startTime = '00:00'; endTime = '00:00';
        } else {
          shiftType = emp.shift; startTime = emp.start; endTime = emp.end;
        }
        records.push({ userId: emp.user.id, date, startTime, endTime, shiftType });
      }
    }
    await prisma.schedule.createMany({ data: records });
    console.log(`   ✓ ${year}-${String(month).padStart(2,'0')} uchun ${records.length} ta jadval`);
  }

  await seedMonth(2026, 5); // May 2026
  await seedMonth(2026, 6); // Iyun 2026

  // Bugundan keyingi 7 kun (hozirgi oy uchun)
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayMonth = today.getMonth() + 1;
  const todayYear = today.getFullYear();
  if (!(todayYear === 2026 && (todayMonth === 5 || todayMonth === 6))) {
    for (let i = 0; i < 7; i++) {
      const date = new Date(today); date.setDate(date.getDate() + i);
      await prisma.schedule.createMany({
        data: employees.map(emp => ({
          userId: emp.user.id, date,
          startTime: emp.start, endTime: emp.end, shiftType: emp.shift,
        })),
      });
    }
    console.log('   ✓ Bugundan 7 kun jadval qo\'shildi');
  }
  console.log('✅ Jadvallar yaratildi (May 2026 + Iyun 2026)');

  // Uskunalar
  await prisma.equipment.createMany({
    data: [
      { name: 'Sony PXW-Z90', type: 'Kamera', serialNumber: 'SNY-001', status: 'IN_USE', assignedToId: emp1.id },
      { name: 'Sony PXW-Z90', type: 'Kamera', serialNumber: 'SNY-002', status: 'AVAILABLE' },
      { name: 'DJI Mavic 3', type: 'Drone', serialNumber: 'DJI-001', status: 'IN_USE', assignedToId: emp2.id },
      { name: 'Sennheiser EW 112P', type: 'Mikrofon', serialNumber: 'SNH-001', status: 'AVAILABLE' },
      { name: 'Manfrotto 504X', type: 'Shtativ', serialNumber: 'MNF-001', status: 'AVAILABLE' },
      { name: 'Blackmagic ATEM Mini', type: 'Mikser', serialNumber: 'BLK-001', status: 'IN_USE', assignedToId: emp3.id },
      { name: 'Zhiyun Crane 3S', type: 'Gimbal', serialNumber: 'ZHY-001', status: 'MAINTENANCE' },
    ],
  });
  console.log('✅ Uskunalar yaratildi');

  // Transportlar
  await prisma.vehicle.createMany({
    data: [
      { name: 'Mercedes Sprinter', plateNumber: '01 AAA 001', type: 'OB-van', status: 'AVAILABLE' },
      { name: 'Toyota Camry', plateNumber: '01 BBB 002', type: 'Yengil avtomobil', status: 'IN_USE', assignedToId: emp1.id },
      { name: 'Chevrolet Damas', plateNumber: '01 CCC 003', type: 'Furgon', status: 'AVAILABLE' },
      { name: 'Hyundai Starex', plateNumber: '01 DDD 004', type: 'Mikroavtobus', status: 'MAINTENANCE' },
    ],
  });
  console.log('✅ Transportlar yaratildi');

  // Maoshlar
  const month = new Date().getMonth() + 1;
  const year = new Date().getFullYear();
  const empList = [emp1, emp2, emp3, emp4];
  const baseList = [3500000, 3000000, 2800000, 2500000];
  for (let i = 0; i < empList.length; i++) {
    const base = baseList[i];
    const bonus = 300000;
    const deductions = Math.floor(base * 0.08);
    await prisma.payroll.create({
      data: { userId: empList[i].id, month, year, baseSalary: base, bonus, deductions, totalAmount: base + bonus - deductions, status: i < 2 ? 'PAID' : 'PENDING', paidAt: i < 2 ? new Date() : null },
    });
  }
  console.log('✅ Maoshlar yaratildi');

  // Bildirishnomalar
  await prisma.notification.createMany({
    data: [
      { title: 'Yangi vazifa', message: 'Sizga yangi vazifa tayinlandi: Toshkent shahar tadbirini yoritish', userId: emp1.id, type: 'task' },
      { title: "Jadval qo'shildi", message: "Ertangi ish vaqtingiz belgilandi: 08:00-17:00", userId: emp1.id, type: 'schedule' },
      { title: "Maosh to'landi", message: "May oyiga maoshingiz hisobingizga o'tkazildi", userId: emp1.id, type: 'payroll', isRead: true },
      { title: 'Yangi vazifa', message: 'Drone uchirish — Navruz marosimlari vazifasi berildi', userId: emp2.id, type: 'task' },
      { title: 'Xush kelibsiz!', message: "Yangi tizimga xush kelibsiz! Barcha vazifalaringizni shu yerda kuzating.", userId: emp3.id, type: 'info' },
    ],
  });
  console.log('✅ Bildirishnomalar yaratildi');

  // Audit loglar
  await prisma.auditLog.createMany({
    data: [
      { action: 'LOGIN', entity: 'User', entityId: superadmin.id, details: 'Tizimga kirdi', userId: superadmin.id },
      { action: 'CREATE', entity: 'Task', entityId: t1.id, details: `Vazifa yaratildi: ${t1.title}`, userId: admin1.id },
      { action: 'CREATE', entity: 'Task', entityId: t2.id, details: `Vazifa yaratildi: ${t2.title}`, userId: admin2.id },
      { action: 'CREATE', entity: 'User', entityId: emp1.id, details: `Yangi xodim: ${emp1.fullName}`, userId: superadmin.id },
    ],
  });
  console.log('✅ Audit loglar yaratildi');

  console.log('\n🎉 Seed muvaffaqiyatli yakunlandi!');
  console.log('   superadmin  / Super@2025  → /superadmin/dashboard');
  console.log('   admin01     / Admin@2025  → /admin/dashboard');
  console.log('   operator01  / Staff@2025  → /employee/dashboard');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
