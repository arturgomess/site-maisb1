import { requireAdminPermission } from '../../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../../lib/analytics/admin-api';
import { getAnalyticsSourceDetails } from '../../../../../../lib/analytics/queries';
import type { TrafficSource } from '../../../../../../lib/analytics/attribution';

export const runtime = 'nodejs';
const categories: TrafficSource[] = ['ORGANIC', 'SOCIAL', 'DIRECT', 'REFERRAL', 'PAID_SEARCH', 'OTHER'];

export async function GET(request: Request, context: { params: Promise<{ source: string }> }) {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if ('error' in parsed) return parsed.error;
  const { source: rawSource } = await context.params;
  const source = rawSource.toUpperCase() as TrafficSource;
  if (!categories.includes(source)) return Response.json({ error: 'Origem inválida.' }, { status: 400 });
  return Response.json(await getAnalyticsSourceDetails(parsed.range, source, parsed.now), { headers: { 'Cache-Control': 'no-store' } });
}
