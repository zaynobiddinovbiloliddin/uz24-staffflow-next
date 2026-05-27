import 'next-auth';
import 'next-auth/jwt';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      role: 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';
      position?: string;
      departmentId?: string;
      departmentName?: string;
      avatar?: string;
    };
  }

  interface User {
    id: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';
    position?: string;
    departmentId?: string;
    departmentName?: string;
    avatar?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';
    position?: string;
    departmentId?: string;
    departmentName?: string;
    avatar?: string;
  }
}
