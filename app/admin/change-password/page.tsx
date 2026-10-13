import { redirect } from 'next/navigation';
import { ForcedPasswordChange } from '../../../components/admin/forced-password-change';
import { getCurrentAdmin } from '../../../lib/cms-auth';

export default async function ChangeAdminPasswordPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.mustChangePassword) redirect('/admin');
  return <ForcedPasswordChange permissions={{ posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess }} />;
}
