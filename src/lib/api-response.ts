import { NextResponse } from 'next/server';
import { AppError, RateLimitError } from './errors';

export const apiResponse = {
  success<T>(data: T, message = 'Muvaffaqiyatli', status = 200) {
    return NextResponse.json({ success: true, data, message }, { status });
  },

  created<T>(data: T, message = 'Muvaffaqiyatli yaratildi') {
    return NextResponse.json({ success: true, data, message }, { status: 201 });
  },

  noContent() {
    return new NextResponse(null, { status: 204 });
  },

  // Legacy helpers kept for backward compat
  error(error: unknown, status = 500) {
    return handleError(error, status);
  },
  validationError(message: string) {
    return NextResponse.json({ success: false, message, code: 'VALIDATION_ERROR' }, { status: 400 });
  },
  unauthorized(message = 'Tizimga kirish talab etiladi') {
    return NextResponse.json({ success: false, message, code: 'UNAUTHORIZED' }, { status: 401 });
  },
  forbidden(message = "Ruxsat yo'q") {
    return NextResponse.json({ success: false, message, code: 'FORBIDDEN' }, { status: 403 });
  },
  notFound(message = 'Topilmadi') {
    return NextResponse.json({ success: false, message, code: 'NOT_FOUND' }, { status: 404 });
  },
  conflict(message: string) {
    return NextResponse.json({ success: false, message, code: 'CONFLICT' }, { status: 409 });
  },
  tooManyRequests(retryAfter: number) {
    return NextResponse.json(
      { success: false, message: "Juda ko'p so'rovlar. Iltimos, biroz kuting.", code: 'RATE_LIMIT' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  },
};

// Centralised error → HTTP response mapping
export function handleError(error: unknown, _status?: number): NextResponse {
  // Custom app errors
  if (error instanceof RateLimitError) {
    return apiResponse.tooManyRequests(error.retryAfter);
  }
  if (error instanceof AppError) {
    return NextResponse.json(
      { success: false, message: error.message, code: error.code },
      { status: error.statusCode },
    );
  }

  // Prisma-level constraint errors
  const pCode = (error as any)?.code;
  if (pCode === 'P2002') return apiResponse.conflict("Bu ma'lumot allaqachon mavjud");
  if (pCode === 'P2025') return apiResponse.notFound();
  if (pCode === 'P2003') return apiResponse.validationError("Bog'liq ma'lumot topilmadi");

  // Unknown errors
  if (process.env.NODE_ENV !== 'production') console.error('[API Error]', error);
  else console.error('[API Error]', (error as Error)?.message ?? String(error));

  return NextResponse.json(
    { success: false, message: 'Server xatosi yuz berdi', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}
