import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { vehicleService } from '@/services/vehicle.service';
import { createVehicleSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function GET(req: Request) {
  try {
    applyRateLimit(req, 'read');
    const session = await requireAuth();
    const { searchParams } = new URL(req.url);
    const data = await vehicleService.list(session.user, { status: searchParams.get('status') ?? undefined });
    return apiResponse.success(data);
  } catch (e) { return handleError(e); }
}

export async function POST(req: Request) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = createVehicleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const vehicle = await vehicleService.create(session.user, parsed.data);
    return apiResponse.created(vehicle);
  } catch (e) { return handleError(e); }
}
