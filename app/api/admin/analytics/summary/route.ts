import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../lib/analytics/admin-api';
import { getAnalyticsSummary } from '../../../../../lib/analytics/queries';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if ('error' in parsed && parsed.error) return parsed.error;
  return Response.json(await getAnalyticsSummary(parsed.range, parsed.now), { headers: { 'Cache-Control': 'no-store' } });
}
