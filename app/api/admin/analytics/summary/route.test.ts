import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requirePermission, summary } = vi.hoisted(() => ({ requirePermission: vi.fn(), summary: vi.fn() }));
vi.mock('../../../../../lib/admin-api-auth', () => ({ requireAdminPermission: requirePermission }));
vi.mock('../../../../../lib/analytics/queries', () => ({ getAnalyticsSummary: summary }));

import { GET } from './route';

describe('admin analytics summary route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ user: { canManageAnalytics: true }, response: null });
    summary.mockResolvedValue({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
  });

  it('checks Analytics permission before running an aggregate', async () => {
    const denied = Response.json({ error: 'forbidden' }, { status: 403 });
    requirePermission.mockResolvedValueOnce({ user: null, response: denied });
    expect((await GET(new Request('http://local/api/admin/analytics/summary'))).status).toBe(403);
    expect(requirePermission).toHaveBeenCalledWith('analytics');
    expect(summary).not.toHaveBeenCalled();
  });

  it('returns aggregates from the protected query layer with no-store caching', async () => {
    const response = await GET(new Request('http://local/api/admin/analytics/summary?period=7d'));
    expect(response.status).toBe(200);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
    expect(summary).toHaveBeenCalledWith(expect.objectContaining({ localDays: expect.any(Array) }), expect.any(Date));
  });

  it('rejects invalid date ranges before querying data', async () => {
    const response = await GET(new Request('http://local/api/admin/analytics/summary?period=custom&from=2026-10-05&to=2026-07-01'));
    expect(response.status).toBe(400);
    expect(summary).not.toHaveBeenCalled();
  });
});
