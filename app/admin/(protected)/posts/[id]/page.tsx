import { redirect } from 'next/navigation';
import { PostEditor } from '../../../../../components/admin/post-editor';
import { AdminForbidden } from '../../../../../components/admin/admin-forbidden';
import { getCurrentAdmin } from '../../../../../lib/cms-auth';

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.canManagePosts) return <AdminForbidden user={user} />;
  return <PostEditor postId={id} />;
}
