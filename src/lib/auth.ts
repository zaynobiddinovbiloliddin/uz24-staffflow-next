import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma';

type Role = 'SUPERADMIN' | 'ADMIN' | 'EMPLOYEE';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        username: { label: 'Username', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
          include: { department: { select: { id: true, name: true } } },
        });

        if (!user || !user.isActive) return null;

        const isValid = await bcrypt.compare(credentials.password, user.password);
        if (!isValid) return null;

        // Audit log
        await prisma.auditLog.create({
          data: {
            action: 'LOGIN',
            entity: 'User',
            entityId: user.id,
            details: `${user.fullName} tizimga kirdi`,
            userId: user.id,
          },
        }).catch(() => {});

        return {
          id: user.id,
          name: user.fullName,
          email: user.username,
          role: user.role as Role,
          position: user.position ?? undefined,
          departmentId: user.departmentId ?? undefined,
          departmentName: user.department?.name ?? undefined,
          avatar: user.avatar ?? undefined,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role as Role;
        token.position = (user as any).position;
        token.departmentId = (user as any).departmentId;
        token.departmentName = (user as any).departmentName;
        token.avatar = (user as any).avatar;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.position = token.position as string | undefined;
        session.user.departmentId = token.departmentId as string | undefined;
        session.user.departmentName = token.departmentName as string | undefined;
        session.user.avatar = token.avatar as string | undefined;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },

  jwt: {
    maxAge: 7 * 24 * 60 * 60,
  },

  secret: process.env.NEXTAUTH_SECRET,
};
