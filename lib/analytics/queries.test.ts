import { beforeEach, describe, expect, it, vi } from 'vitest';

const { queryRaw, postFindUnique, postFindMany } = vi.hoisted(() => ({ queryRaw: vi.fn(), postFindUnique: vi.fn(), postFindMany: vi.fn() }));
vi.mock('../db', () => ({ db: { $queryRaw: queryRaw, post: { findUnique: postFindUnique, findMany: postFindMany } } }));

import { getAnalyticsConsentDecisions, getAnalyticsDevices, getAnalyticsPages, getAnalyticsPostDetails, getAnalyticsSources, getAnalyticsSummary, getAnalyticsTrend } from './queries';

const range = {
  startUtc: new Date('2026-10-07T03:00:00.000Z'),
  endUtc: new Date('2026-10-10T02:00:00.000Z'),
  localDays: ['2026-10-07', '2026-10-08', '2026-10-09'],
};
const now = new Date('2026-10-09T15:30:00.000Z');

describe('analytics aggregate queries', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    postFindUnique.mockResolvedValue({ id: 'post-1', slug: 'slug', title: 'Título real', publishedAt: new Date('2026-10-01T12:00:00Z'), imagePath: null });
    postFindMany.mockResolvedValue([]);
  });

  it('derives headline values from page views and engagement seconds', async () => {
    queryRaw.mockResolvedValueOnce([{ pageViews: BigInt(4), uniqueVisitors: BigInt(3), engagedSeconds: BigInt(18), postViews: BigInt(2) }]);
    await expect(getAnalyticsSummary(range, now)).resolves.toEqual({ pageViews: 4, uniqueVisitors: 3, avgEngagedSeconds: 4.5, postViews: 2 });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });

  it('fills missing local trend days with zeroes', async () => {
    queryRaw.mockResolvedValueOnce([{ day: '2026-10-07', pageViews: BigInt(2), uniqueVisitors: BigInt(2) }, { day: '2026-10-09', pageViews: BigInt(1), uniqueVisitors: BigInt(1) }]);
    await expect(getAnalyticsTrend(range, now)).resolves.toEqual([
      { day: '2026-10-07', pageViews: 2, uniqueVisitors: 2 },
      { day: '2026-10-08', pageViews: 0, uniqueVisitors: 0 },
      { day: '2026-10-09', pageViews: 1, uniqueVisitors: 1 },
    ]);
  });

  it('calculates source percentages from real page view totals', async () => {
    queryRaw.mockResolvedValueOnce([{ category: 'ORGANIC', views: BigInt(3) }, { category: 'DIRECT', views: BigInt(1) }]);
    await expect(getAnalyticsSources(range, now)).resolves.toEqual([
      { category: 'ORGANIC', views: 3, percent: 75 },
      { category: 'DIRECT', views: 1, percent: 25 },
    ]);
  });

  it('calculates device percentages and keeps zero categories explicit', async () => {
    queryRaw.mockResolvedValueOnce([{ device: 'MOBILE', views: BigInt(2) }, { device: 'DESKTOP', views: BigInt(1) }]);
    await expect(getAnalyticsDevices(range, now)).resolves.toEqual([
      { device: 'DESKTOP', views: 1, percent: 33.3 },
      { device: 'MOBILE', views: 2, percent: 66.7 },
      { device: 'TABLET', views: 0, percent: 0 },
    ]);
  });

  it('aggregates accepted and refused decisions without treating missing responses as refusals', async () => {
    queryRaw.mockResolvedValueOnce([{ decision: 'accepted', total: BigInt(83) }, { decision: 'rejected', total: BigInt(17) }]);
    await expect(getAnalyticsConsentDecisions(range, now)).resolves.toEqual({ accepted: 83, rejected: 17, total: 100, acceptPercent: 83, rejectPercent: 17 });
    expect(String(queryRaw.mock.calls[0][0])).toContain('analytics_consent_decisions');
  });

  it('returns an honest empty aggregate when no decisions have been saved', async () => {
    queryRaw.mockResolvedValueOnce([]);
    await expect(getAnalyticsConsentDecisions(range, now)).resolves.toEqual({ accepted: 0, rejected: 0, total: 0, acceptPercent: 0, rejectPercent: 0 });
  });

  it('returns empty states without querying an expired range and uses paginated pages', async () => {
    const expired = { ...range, startUtc: new Date('2025-01-01T00:00:00Z'), endUtc: new Date('2025-01-02T00:00:00Z'), localDays: [] };
    await expect(getAnalyticsSummary(expired, now)).resolves.toEqual({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
    expect(queryRaw).not.toHaveBeenCalled();
    queryRaw.mockResolvedValueOnce([{ path: '/sobre', views: BigInt(1) }]).mockResolvedValueOnce([{ total: BigInt(2) }]).mockResolvedValueOnce([{ totalViews: BigInt(3) }]);
    await expect(getAnalyticsPages(range, 2, 1, now)).resolves.toMatchObject({ total: 2, page: 2, pageSize: 1, pages: [{ path: '/sobre', views: 1, percent: 33.3 }] });
  });

  it('returns editorial metadata and page view details without exposing visitor digests', async () => {
    queryRaw.mockResolvedValueOnce([{ pageViews: BigInt(2), uniqueVisitors: BigInt(1), engagedSeconds: BigInt(20), postViews: BigInt(2) }]);
    queryRaw.mockResolvedValueOnce([{ category: 'ORGANIC', views: BigInt(2) }]);
    queryRaw.mockResolvedValueOnce([{ day: '2026-10-08', pageViews: BigInt(2), uniqueVisitors: BigInt(1) }]);
    await expect(getAnalyticsPostDetails(range, 'post-1', now)).resolves.toMatchObject({
      post: { id: 'post-1', title: 'Título real' },
      summary: { pageViews: 2, uniqueVisitors: 1, postViews: 2 },
      sources: [{ category: 'ORGANIC', views: 2, percent: 100 }],
      trend: expect.arrayContaining([{ day: '2026-10-08', pageViews: 2, uniqueVisitors: 1 }]),
    });
    expect(JSON.stringify(queryRaw.mock.results)).not.toContain('visitorDigest');
  });
});
