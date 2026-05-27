export class AppError extends Error {
  constructor(
    public readonly message: string,
    public readonly statusCode: number,
    public readonly code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = this.constructor.name;
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400, 'VALIDATION_ERROR'); }
}
export class UnauthorizedError extends AppError {
  constructor(message = 'Tizimga kirish talab etiladi') { super(message, 401, 'UNAUTHORIZED'); }
}
export class ForbiddenError extends AppError {
  constructor(message = "Ruxsat yo'q") { super(message, 403, 'FORBIDDEN'); }
}
export class NotFoundError extends AppError {
  constructor(message = 'Topilmadi') { super(message, 404, 'NOT_FOUND'); }
}
export class ConflictError extends AppError {
  constructor(message: string) { super(message, 409, 'CONFLICT'); }
}
export class RateLimitError extends AppError {
  public readonly retryAfter: number;
  constructor(retryAfterSeconds: number) {
    super("Juda ko'p so'rovlar. Iltimos, biroz kuting.", 429, 'RATE_LIMIT');
    this.retryAfter = retryAfterSeconds;
  }
}
