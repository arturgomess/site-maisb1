import { requireAdminPermission } from '../../../../../../lib/admin-api-auth';
import { parseAnalyticsRequest } from '../../../../../../lib/analytics/admin-api';
import { getAnalyticsPostDetails } from '../../../../../../lib/analytics/queries';

export const runtime = 'nodejs';

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPermission('analytics');
  if (access.response) return access.response;
  const parsed = parseAnalyticsRequest(request);
  if ('error' in parsed) return parsed.error;
  const { id } = await context.params;
  if (!/^[a-zA-Z0-9_-]{1,30}$/.test(id)) return Response.json({ error: 'Publicação inválida.' }, { status: 400 });
  const result = await getAnalyticsPostDetails(parsed.range, id, parsed.now);
  return result ? Response.json(result, { headers: { 'Cache-Control': 'no-store' } }) : Response.json({ error: 'Publicação não encontrada.' }, { status: 404 });
}
