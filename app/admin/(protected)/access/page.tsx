import { redirect } from 'next/navigation';
import { AdminForbidden } from '../../../../components/admin/admin-forbidden';
import { AccessManagement } from '../../../../components/admin/access-management';
import { getCurrentAdmin } from '../../../../lib/cms-auth';

export default async function AdminAccessPage({ searchParams }: { searchParams: Promise<{ created?: string }> }) {
  const params = await searchParams;
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.canManageAccess) return <AdminForbidden user={user} />;
  return <AccessManagement initialCreated={params.created === '1'} />;
}
