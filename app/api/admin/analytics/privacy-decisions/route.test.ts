import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requirePermission, query } = vi.hoisted(() => ({ requirePermission: vi.fn(), query: vi.fn() }));
vi.mock('../../../../../lib/admin-api-auth', () => ({ requireAdminPermission: requirePermission }));
vi.mock('../../../../../lib/analytics/queries', () => ({ getAnalyticsConsentDecisions: query }));

import { GET } from './route';

describe('admin analytics privacy decisions route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requirePermission.mockResolvedValue({ user: { canManageAnalytics: true }, response: null });
    query.mockResolvedValue({ accepted: 0, rejected: 0, total: 0, acceptPercent: 0, rejectPercent: 0 });
  });

  it('requires analytics permission before querying', async () => {
    requirePermission.mockResolvedValueOnce({ user: null, response: Response.json({}, { status: 403 }) });
    expect((await GET(new Request('http://local/api/admin/analytics/privacy-decisions'))).status).toBe(403);
    expect(query).not.toHaveBeenCalled();
  });

  it('uses the requested period and disables caching', async () => {
    const response = await GET(new Request('http://local/api/admin/analytics/privacy-decisions?period=7d'));
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(await response.json()).toEqual({ accepted: 0, rejected: 0, total: 0, acceptPercent: 0, rejectPercent: 0 });
    expect(query).toHaveBeenCalledWith(expect.objectContaining({ localDays: expect.any(Array) }), expect.any(Date));
  });
});
