import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import LandingPage from '@/components/landing/LandingPage';

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    const role = session.user.role;
    if (role === 'SUPERADMIN') redirect('/superadmin/dashboard');
    if (role === 'ADMIN') redirect('/admin/dashboard');
    redirect('/employee/dashboard');
  }

  return <LandingPage />;
}
