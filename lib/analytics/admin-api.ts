import { resolveAnalyticsRange, type AnalyticsPeriod } from './date-range';

const periods: AnalyticsPeriod[] = ['today', '7d', '30d', '90d', 'custom'];

export function parseAnalyticsRequest(request: Request, defaultPageSize = 10) {
  const params = new URL(request.url).searchParams;
  const period = params.get('period') || '30d';
  if (!periods.includes(period as AnalyticsPeriod)) return { error: Response.json({ error: 'Período inválido.' }, { status: 400 }) } as const;
  try {
    const range = resolveAnalyticsRange({
      period: period as AnalyticsPeriod,
      from: params.get('from') || undefined,
      to: params.get('to') || undefined,
    }, new Date());
    const rawPage = params.get('page');
    const rawPageSize = params.get('pageSize');
    const page = rawPage === null ? 1 : Number(rawPage);
    const pageSize = rawPageSize === null ? defaultPageSize : Number(rawPageSize);
    if (!Number.isInteger(page) || page < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 50) {
      return { error: Response.json({ error: 'Paginação inválida.' }, { status: 400 }) } as const;
    }
    return { range, now: new Date(), page, pageSize } as const;
  } catch (error) {
    return { error: Response.json({ error: error instanceof Error ? error.message : 'Período inválido.' }, { status: 400 }) } as const;
  }
}
