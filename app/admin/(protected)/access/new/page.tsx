import { redirect } from 'next/navigation';
import { AdminForbidden } from '../../../../../components/admin/admin-forbidden';
import { AdminUserForm } from '../../../../../components/admin/admin-user-form';
import { getCurrentAdmin } from '../../../../../lib/cms-auth';

export default async function NewAdminUserPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.canManageAccess) return <AdminForbidden user={user} />;
  return <AdminUserForm currentUserId={user.id} />;
}
