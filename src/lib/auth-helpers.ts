import { getServerSession } from 'next-auth';
import { authOptions } from './auth';
import { UnauthorizedError, ForbiddenError } from './errors';

export type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session) throw new UnauthorizedError();
  return session;
}

export async function requireRole(...roles: Role[]) {
  const session = await requireAuth();
  if (!roles.includes(session.user.role as Role)) throw new ForbiddenError();
  return session;
}

export async function requireSuperAdmin() {
  return requireRole('SUPERADMIN');
}

export async function requireAdminOrAbove() {
  return requireRole('SUPERADMIN', 'ADMIN');
}
