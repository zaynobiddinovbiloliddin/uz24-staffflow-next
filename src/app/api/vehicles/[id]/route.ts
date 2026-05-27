import { requireAuth } from '@/lib/auth-helpers';
import { handleError, apiResponse } from '@/lib/api-response';
import { applyRateLimit } from '@/lib/rate-limit';
import { vehicleService } from '@/services/vehicle.service';
import { updateVehicleSchema, assignVehicleSchema } from '@/lib/validations';
import { ValidationError } from '@/lib/errors';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = updateVehicleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const vehicle = await vehicleService.update(session.user, params.id, parsed.data);
    return apiResponse.success(vehicle);
  } catch (e) { return handleError(e); }
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();

    const body = await req.json();
    const parsed = assignVehicleSchema.safeParse(body);
    if (!parsed.success) throw new ValidationError(parsed.error.errors[0].message);

    const vehicle = await vehicleService.assign(session.user, params.id, parsed.data.assignedToId);
    return apiResponse.success(vehicle);
  } catch (e) { return handleError(e); }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    applyRateLimit(req, 'write');
    const session = await requireAuth();
    await vehicleService.delete(session.user, params.id);
    return apiResponse.noContent();
  } catch (e) { return handleError(e); }
}
