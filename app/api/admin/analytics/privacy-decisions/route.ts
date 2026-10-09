import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../lib/analytics/admin-api';
import { getAnalyticsConsentDecisions } from '../../../../../lib/analytics/queries';

export const runtime = 'nodejs';

export async function GET(request: Request): Promise<Response> {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if (parsed.error) return parsed.error;
  const data = await getAnalyticsConsentDecisions(parsed.range, parsed.now);
  return Response.json(data, { headers: { 'Cache-Control': 'no-store' } });
}
