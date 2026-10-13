import { redirect } from 'next/navigation';
import { PostsDashboard } from '../../../../components/admin/posts-dashboard';
import { AdminForbidden } from '../../../../components/admin/admin-forbidden';
import { getCurrentAdmin } from '../../../../lib/cms-auth';

export default async function AdminPostsPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.canManagePosts) return <AdminForbidden user={user} />;
  return <PostsDashboard />;
}
