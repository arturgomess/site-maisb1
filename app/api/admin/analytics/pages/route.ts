import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../lib/analytics/admin-api';
import { getAnalyticsPages } from '../../../../../lib/analytics/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if ('error' in parsed) return parsed.error;
  return Response.json(await getAnalyticsPages(parsed.range, parsed.page, parsed.pageSize, parsed.now), { headers: { 'Cache-Control': 'no-store' } });
}
