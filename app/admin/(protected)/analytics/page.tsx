import { redirect } from 'next/navigation';
import { AnalyticsDashboard } from '../../../../components/admin/analytics/analytics-dashboard';
import { AdminForbidden } from '../../../../components/admin/admin-forbidden';
import { getCurrentAdmin } from '../../../../lib/cms-auth';

export default async function AnalyticsPage() {
  const user = await getCurrentAdmin();
  if (!user) redirect('/admin/login');
  if (user.mustChangePassword) redirect('/admin/change-password');
  if (!user.canManageAnalytics) return <AdminForbidden user={user} />;
  return <AnalyticsDashboard />;
}
