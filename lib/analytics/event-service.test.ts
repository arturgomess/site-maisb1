import { createHmac, randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { analyticsEventCreate, postFindFirst, visitorUpdate, transaction } = vi.hoisted(() => ({
  analyticsEventCreate: vi.fn(), postFindFirst: vi.fn(), visitorUpdate: vi.fn(), transaction: vi.fn(),
}));
vi.mock('../db', () => ({ db: { $transaction: transaction, analyticsEvent: { create: analyticsEventCreate }, analyticsVisitor: { updateMany: visitorUpdate }, post: { findFirst: postFindFirst } } }));

import { recordAnalyticsEvent } from './event-service';

const secret = 'unit-test-analytics-secret';
const metadata = {
  hasConsent: true,
  visitorId: '8a2a26f0-504d-4535-a5a1-08fd04c3161d',
  userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) Mobile',
  referrer: 'https://www.google.com/search?q=hidden',
  utmSource: null,
  utmMedium: null,
  hasAdClickId: false,
};

describe('recordAnalyticsEvent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANALYTICS_HMAC_SECRET = secret;
    postFindFirst.mockResolvedValue({ id: 'post-1' });
    analyticsEventCreate.mockResolvedValue({ id: 'event-1' });
    visitorUpdate.mockResolvedValue({ count: 1 });
    transaction.mockImplementation((callback) => callback({ analyticsEvent: { create: analyticsEventCreate }, analyticsVisitor: { updateMany: visitorUpdate } }));
  });

  it('ignores requests without explicit analytics consent', async () => {
    const result = await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/' }, { ...metadata, hasConsent: false });
    expect(result).toBe('ignored');
    expect(analyticsEventCreate).not.toHaveBeenCalled();
  });

  it('stores a page view with a digest and only the published post relation', async () => {
    const result = await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/noticias/slug-real' }, metadata);
    expect(result).toBe('created');
    const postQuery = postFindFirst.mock.calls[0][0];
    expect(postQuery.where).toMatchObject({ slug: 'slug-real', status: 'published' });
    expect(postQuery.where.publishedAt.lte).toBeInstanceOf(Date);
    expect(postQuery.select).toEqual({ id: true });
    const data = analyticsEventCreate.mock.calls[0][0].data;
    expect(data.visitorDigest).toBe(createHmac('sha256', secret).update(metadata.visitorId).digest('hex'));
    expect(data).toMatchObject({ eventType: 'page_view', path: '/noticias/slug-real', postId: 'post-1', sourceCategory: 'ORGANIC', sourceHost: 'google.com', device: 'MOBILE', engagedSeconds: 0 });
    expect(data).not.toHaveProperty('userAgent');
    expect(data).not.toHaveProperty('ip');
  });

  it('records engagement as a separate bounded event and classifies tablets first', async () => {
    const result = await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'engagement', path: '/sobre', engagedSeconds: 15 }, {
      ...metadata,
      userAgent: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
      referrer: null,
    });
    expect(result).toBe('created');
    expect(analyticsEventCreate.mock.calls[0][0].data).toMatchObject({ eventType: 'engagement', path: '/sobre', postId: null, device: 'TABLET', sourceCategory: 'DIRECT', engagedSeconds: 15 });
    expect(postFindFirst).not.toHaveBeenCalled();
  });

  it.each([
    { eventType: 'page_view', path: '/admin/settings' },
    { eventType: 'page_view', path: '/public?email=private' },
    { eventType: 'engagement', path: '/public', engagedSeconds: 16 },
    { eventType: 'engagement', path: '/public', engagedSeconds: -1 },
    { eventType: 'purchase', path: '/' },
    { eventType: 'page_view', path: '//evil.example/' },
  ])('ignores invalid or private event payload %#', async (event) => {
    const result = await recordAnalyticsEvent({ eventId: randomUUID(), ...event } as never, metadata);
    expect(result).toBe('ignored');
    expect(analyticsEventCreate).not.toHaveBeenCalled();
  });

  it('ignores events without a consented UUID or stable server secret', async () => {
    expect(await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/' }, { ...metadata, visitorId: null })).toBe('ignored');
    delete process.env.ANALYTICS_HMAC_SECRET;
    expect(await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/' }, metadata)).toBe('ignored');
    expect(analyticsEventCreate).not.toHaveBeenCalled();
  });

  it('returns duplicate for an idempotency conflict', async () => {
    analyticsEventCreate.mockRejectedValueOnce({ code: 'P2002' });
    expect(await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/' }, metadata)).toBe('duplicate');
  });

  it('drops a pending beacon when revocation has already marked the visitor inactive', async () => {
    visitorUpdate.mockResolvedValueOnce({ count: 0 });
    expect(await recordAnalyticsEvent({ eventId: randomUUID(), eventType: 'page_view', path: '/' }, metadata)).toBe('ignored');
    expect(analyticsEventCreate).not.toHaveBeenCalled();
  });
});
