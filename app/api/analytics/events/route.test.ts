import { beforeEach, describe, expect, it, vi } from 'vitest';

const { jar, record } = vi.hoisted(() => ({ jar: new Map<string, string>(), record: vi.fn() }));
vi.mock('next/headers', () => ({ cookies: async () => ({ get: (name: string) => jar.has(name) ? { value: jar.get(name)! } : undefined }) }));
vi.mock('../../../../lib/analytics/event-service', () => ({ recordAnalyticsEvent: record }));

import { POST } from './route';

const url = 'http://localhost:3000/api/analytics/events';
const makeRequest = (body: unknown, origin = 'http://localhost:3000') => new Request(url, {
  method: 'POST', headers: { origin, host: 'localhost:3000', 'content-type': 'application/json', 'user-agent': 'Mozilla/5.0 Mobile' }, body: JSON.stringify(body),
});

describe('analytics events route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jar.clear();
    jar.set('analytics_consent', 'accepted');
    jar.set('analytics_visitor', '8a2a26f0-504d-4535-a5a1-08fd04c3161d');
    record.mockResolvedValue('created');
  });

  it('passes only a small, consented event with normalized attribution metadata', async () => {
    const response = await POST(makeRequest({
      eventId: 'e1d1c766-617a-46ee-a9d3-ccbbfb43c872', eventType: 'page_view', path: '/noticias/slug',
      referrer: 'https://www.google.com/', utmSource: 'google', utmMedium: 'organic', hasAdClickId: false,
    }));
    expect(response.status).toBe(202);
    expect(record).toHaveBeenCalledWith(
      { eventId: 'e1d1c766-617a-46ee-a9d3-ccbbfb43c872', eventType: 'page_view', path: '/noticias/slug' },
      expect.objectContaining({ hasConsent: true, visitorId: jar.get('analytics_visitor'), referrer: 'https://www.google.com', utmSource: 'google', utmMedium: 'organic', userAgent: 'Mozilla/5.0 Mobile' }),
    );
  });

  it('refuses collection without both consent and visitor cookies', async () => {
    jar.delete('analytics_consent');
    const response = await POST(makeRequest({ eventId: 'e1d1c766-617a-46ee-a9d3-ccbbfb43c872', eventType: 'page_view', path: '/' }));
    expect(response.status).toBe(202);
    expect(record).not.toHaveBeenCalled();
  });

  it('rejects oversized, cross-origin, and admin event requests', async () => {
    expect((await POST(makeRequest({ eventId: 'x', eventType: 'page_view', path: '/admin' }))).status).toBe(400);
    expect((await POST(makeRequest({ eventId: 'e1d1c766-617a-46ee-a9d3-ccbbfb43c872', eventType: 'page_view', path: '/' }, 'https://evil.example'))).status).toBe(403);
    const huge = 'x'.repeat(5000);
    expect((await POST(makeRequest({ eventId: 'e1d1c766-617a-46ee-a9d3-ccbbfb43c872', eventType: 'page_view', path: '/', huge }))).status).toBe(413);
    expect(record).not.toHaveBeenCalled();
  });
});
