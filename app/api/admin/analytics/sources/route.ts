import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../lib/analytics/admin-api';
import { getAnalyticsSources } from '../../../../../lib/analytics/queries';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if ('error' in parsed) return parsed.error;
  return Response.json(await getAnalyticsSources(parsed.range, parsed.now), { headers: { 'Cache-Control': 'no-store' } });
}
