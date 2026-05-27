import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

const SECURITY_HEADERS = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const { pathname } = req.nextUrl;

    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    const role = token.role as string;

    if (pathname.startsWith('/superadmin') && role !== 'SUPERADMIN') {
      return NextResponse.redirect(new URL(getDashboardUrl(role), req.url));
    }

    if (pathname.startsWith('/admin') && role === 'EMPLOYEE') {
      return NextResponse.redirect(new URL('/employee/dashboard', req.url));
    }

    const res = NextResponse.next();
    Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
    return res;
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  },
);

function getDashboardUrl(role: string): string {
  if (role === 'ADMIN') return '/admin/dashboard';
  return '/employee/dashboard';
}

export const config = {
  matcher: [
    '/superadmin/:path*',
    '/admin/:path*',
    '/employee/:path*',
  ],
};
