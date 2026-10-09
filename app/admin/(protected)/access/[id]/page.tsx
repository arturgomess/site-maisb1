import { redirect } from 'next/navigation';
import { AdminForbidden } from '../../../../../components/admin/admin-forbidden';
import { AdminUserForm } from '../../../../../components/admin/admin-user-form';
import { getCurrentAdmin } from '../../../../../lib/cms-auth';

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const [{ id }, user] = await Promise.all([params, getCurrentAdmin()]);
  if (!user) redirect('/admin/login');
  if (!user.canManageAccess) return <AdminForbidden user={user} />;
  return <AdminUserForm userId={id} currentUserId={user.id} />;
}
