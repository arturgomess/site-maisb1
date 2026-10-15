import { redirect } from 'next/navigation';
import { AdminShell } from '../../../components/admin/admin-shell';
import { getCurrentAdmin } from '../../../lib/cms-auth';

export default async function ProtectedAdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (user.mustChangePassword) redirect('/admin/change-password');

  return <AdminShell user={user}>{children}</AdminShell>;
}
