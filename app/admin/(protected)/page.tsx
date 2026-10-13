import { redirect } from 'next/navigation';
import { getAdminHomeHref } from '../../../lib/admin-access';
import { getCurrentAdmin } from '../../../lib/cms-auth';

export default async function AdminPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  redirect(getAdminHomeHref({ posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess }));
}
