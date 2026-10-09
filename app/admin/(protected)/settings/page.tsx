import { redirect } from 'next/navigation';
import { SettingsForm } from '../../../../components/admin/settings-form';
import { AdminForbidden } from '../../../../components/admin/admin-forbidden';
import { getCurrentAdmin } from '../../../../lib/cms-auth';

export default async function AdminSettingsPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (!user.canManageSettings) return <AdminForbidden user={user} />;
  return <SettingsForm />;
}
