import { z } from 'zod';

// ─── User ────────────────────────────────────────────────────────────────────

export const createUserSchema = z.object({
  fullName:     z.string().min(2, 'Ism kamida 2 ta harf').max(100),
  username:     z.string().min(3, 'Username kamida 3 ta harf').max(50)
                  .regex(/^[a-z0-9_]+$/, 'Faqat kichik harf, raqam, _'),
  password:     z.string().min(6, 'Parol kamida 6 ta belgi').max(100),
  role:         z.enum(['SUPERADMIN', 'ADMIN', 'EMPLOYEE']),
  position:     z.string().max(100).optional(),
  phone:        z.string().max(20).optional(),
  departmentId: z.string().cuid().optional(),
  telegramId:   z.string().max(50).optional(),
});

export const updateUserSchema = z.object({
  fullName:     z.string().min(2).max(100).optional(),
  role:         z.enum(['SUPERADMIN', 'ADMIN', 'EMPLOYEE']).optional(),
  position:     z.string().max(100).optional(),
  phone:        z.string().max(20).optional(),
  departmentId: z.string().cuid().nullable().optional(),
  telegramId:   z.string().max(50).nullable().optional(),
  password:     z.string().min(6).max(100).optional(),
  isActive:     z.boolean().optional(),
  avatar:       z.string()
                  .refine(
                    v => !v || /^data:image\/(jpeg|png|webp|gif);base64,/.test(v),
                    'Avatar faqat JPEG, PNG, WebP yoki GIF formatida bo\'lishi kerak',
                  )
                  .refine(v => !v || v.length <= 150_000, 'Avatar hajmi 100KB dan oshmasligi kerak')
                  .nullable().optional(),
});

// ─── Task ────────────────────────────────────────────────────────────────────

export const createTaskSchema = z.object({
  title:        z.string().min(2, 'Sarlavha kamida 2 ta harf').max(200),
  description:  z.string().max(2000).optional(),
  priority:     z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).default('MEDIUM'),
  deadline:     z.preprocess(
    (v) => {
      if (typeof v !== 'string' || !v) return v;
      // datetime-local input produces "2025-01-15T14:30" — append UTC offset
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(v)) return v + ':00.000Z';
      return v;
    },
    z.string().datetime({ offset: true }).optional(),
  ),
  assignedToId: z.string().cuid().optional(),
  departmentId: z.string().cuid().optional(),
});

export const updateTaskSchema = createTaskSchema.partial().extend({
  status:       z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).optional(),
  cancelReason: z.string().max(500).optional(),
});

// ─── Department ───────────────────────────────────────────────────────────────

export const departmentSchema = z.object({
  name:        z.string().min(2, 'Nom kamida 2 ta harf').max(100),
  description: z.string().max(500).optional(),
  color:       z.string()
                 .regex(/^#[0-9a-fA-F]{6}$/, "Rang #xxxxxx formatida bo'lishi kerak")
                 .default('#3b82f6'),
});

// ─── Schedule ────────────────────────────────────────────────────────────────

const scheduleBaseSchema = z.object({
  userId:    z.string().cuid(),
  date:      z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Sana YYYY-MM-DD formatida bo'lishi kerak"),
  startTime: z.string().regex(/^\d{2}:\d{2}$/, "Vaqt HH:MM formatida bo'lishi kerak"),
  endTime:   z.string().regex(/^\d{2}:\d{2}$/, "Vaqt HH:MM formatida bo'lishi kerak"),
  shiftType: z.enum(['Kunduzgi', 'Kechki', 'Tungi', 'Qisqartirilgan']).default('Kunduzgi'),
  note:      z.string().max(500).optional(),
});

const timeOrderMsg = { message: "Boshlanish vaqti tugash vaqtidan oldin bo'lishi kerak", path: ['endTime'] };

export const scheduleSchema = scheduleBaseSchema.refine(
  (d) => !d.startTime || !d.endTime || d.startTime < d.endTime,
  timeOrderMsg,
);

export const updateScheduleSchema = scheduleBaseSchema.partial().refine(
  (d) => !d.startTime || !d.endTime || d.startTime < d.endTime,
  timeOrderMsg,
);

// ─── Equipment ───────────────────────────────────────────────────────────────

export const createEquipmentSchema = z.object({
  name:         z.string().min(2).max(100),
  type:         z.string().min(2).max(100),
  serialNumber: z.string().max(100).optional(),
  status:       z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'BROKEN']).default('AVAILABLE'),
  condition:    z.string().max(200).optional(),
  notes:        z.string().max(500).optional(),
});

export const updateEquipmentSchema = createEquipmentSchema.partial();
export const assignEquipmentSchema  = z.object({ assignedToId: z.string().cuid().nullable() });

// ─── Vehicle ─────────────────────────────────────────────────────────────────

export const createVehicleSchema = z.object({
  name:        z.string().min(2).max(100),
  plateNumber: z.string().min(4).max(20),
  type:        z.string().min(2).max(100),
  status:      z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE']).default('AVAILABLE'),
  fuelType:    z.string().max(50).optional(),
  mileage:     z.number().int().min(0).optional(),
  notes:       z.string().max(500).optional(),
});

export const updateVehicleSchema   = createVehicleSchema.partial();
export const assignVehicleSchema   = z.object({ assignedToId: z.string().cuid().nullable() });

// ─── Payroll ──────────────────────────────────────────────────────────────────

export const createPayrollSchema = z.object({
  userId:     z.string().cuid(),
  month:      z.number().int().min(1).max(12),
  year:       z.number().int().min(2020).max(2099),
  baseSalary: z.number().positive("Asosiy maosh musbat bo'lishi kerak"),
  bonus:      z.number().min(0).default(0),
  deductions: z.number().min(0).default(0),
  notes:      z.string().max(500).optional(),
});
