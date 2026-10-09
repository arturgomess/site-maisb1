import { beforeEach, describe, expect, it, vi } from 'vitest';

const { jar, visitorCreate, visitorFind, transaction, visitorRevoke, eventDelete, visitorCreateTx, decisionCreate, decisionFind } = vi.hoisted(() => ({
  jar: new Map<string, string>(), visitorCreate: vi.fn(), visitorFind: vi.fn(), transaction: vi.fn(),
  visitorRevoke: vi.fn(), eventDelete: vi.fn(), visitorCreateTx: vi.fn(), decisionCreate: vi.fn(), decisionFind: vi.fn(),
}));
vi.mock('next/headers', () => ({ cookies: async () => ({
  get: (name: string) => jar.has(name) ? { value: jar.get(name)! } : undefined,
  set: (name: string, value: string) => jar.set(name, value),
  delete: (name: string) => jar.delete(name),
}) }));
vi.mock('../../../../lib/db', () => ({ db: {
  analyticsVisitor: { create: visitorCreate, findUnique: visitorFind },
  analyticsConsentLog: { findUnique: decisionFind },
  $transaction: transaction,
} }));

import { DELETE, GET, POST } from './route';

const url = 'http://localhost:3000/api/analytics/consent';
const decisionId = '2a2a26f0-504d-4535-a5a1-08fd04c3161d';
const request = (method: string, body?: unknown) => new Request(url, {
  method,
  headers: { origin: 'http://localhost:3000', ...(body ? { 'content-type': 'application/json' } : {}) },
  ...(body ? { body: JSON.stringify(body) } : {}),
});

describe('analytics consent route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    jar.clear();
    process.env.ANALYTICS_HMAC_SECRET = 'consent-test-secret';
    visitorCreate.mockResolvedValue({});
    visitorFind.mockResolvedValue({ revokedAt: null });
    visitorRevoke.mockResolvedValue({ count: 1 });
    eventDelete.mockResolvedValue({ count: 2 });
    visitorCreateTx.mockResolvedValue({});
    decisionCreate.mockResolvedValue({});
    decisionFind.mockResolvedValue(null);
    transaction.mockImplementation((callback) => callback({
      analyticsConsentLog: { create: decisionCreate },
      analyticsVisitor: { updateMany: visitorRevoke, create: visitorCreateTx },
      analyticsEvent: { deleteMany: eventDelete },
    }));
  });

  it('creates a random visitor digest only after an accepted choice', async () => {
    const response = await POST(request('POST', { decision: 'accepted', decisionId }));
    expect(response.status).toBe(200);
    const created = visitorCreateTx.mock.calls[0][0].data;
    expect(created.visitorDigest).toMatch(/^[a-f0-9]{64}$/);
    expect(created).toHaveProperty('consentedAt');
    expect(decisionCreate).toHaveBeenCalledWith({ data: { decisionId, decision: 'accepted', occurredAt: expect.any(Date) } });
    expect(jar.get('analytics_consent')).toBe('accepted');
    expect(jar.get('analytics_visitor')).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('does not issue a visitor identifier for rejection', async () => {
    const response = await POST(request('POST', { decision: 'rejected', decisionId }));
    expect(response.status).toBe(200);
    expect(jar.get('analytics_consent')).toBe('rejected');
    expect(jar.has('analytics_visitor')).toBe(false);
    expect(visitorCreate).not.toHaveBeenCalled();
    expect(decisionCreate).toHaveBeenCalledWith({ data: { decisionId, decision: 'rejected', occurredAt: expect.any(Date) } });
  });

  it('revokes the prior visitor and removes linked events when accepted preferences change to refusal', async () => {
    jar.set('analytics_consent', 'accepted');
    jar.set('analytics_visitor', '8a2a26f0-504d-4535-a5a1-08fd04c3161d');
    const response = await POST(request('POST', { decision: 'rejected', decisionId }));
    expect(response.status).toBe(200);
    expect(visitorRevoke).toHaveBeenCalledWith({ where: { visitorDigest: expect.any(String), revokedAt: null }, data: { revokedAt: expect.any(Date) } });
    expect(eventDelete).toHaveBeenCalledWith({ where: { visitorDigest: expect.any(String) } });
    expect(jar.get('analytics_consent')).toBe('rejected');
    expect(jar.has('analytics_visitor')).toBe(false);
  });

  it('does not duplicate an accepted decision when a request is retried', async () => {
    const conflict = Object.assign(new Error('duplicate'), { code: 'P2002' });
    decisionCreate.mockRejectedValueOnce(conflict);
    decisionFind.mockResolvedValueOnce({ decision: 'accepted' });
    const response = await POST(request('POST', { decision: 'accepted', decisionId }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ decision: 'accepted', duplicate: true });
    expect(decisionCreate).toHaveBeenCalledTimes(1);
    expect(jar.get('analytics_visitor')).toMatch(/^[0-9a-f-]{36}$/i);
  });

  it('requires a decision id and does not save a local server preference on storage failure', async () => {
    const missingId = await POST(request('POST', { decision: 'rejected' }));
    expect(missingId.status).toBe(400);
    expect(decisionCreate).not.toHaveBeenCalled();
    transaction.mockRejectedValueOnce(new Error('database down'));
    const unavailable = await POST(request('POST', { decision: 'rejected', decisionId }));
    expect(unavailable.status).toBe(503);
    expect(jar.has('analytics_consent')).toBe(false);
  });

  it('reports current acceptance without exposing the visitor identifier', async () => {
    jar.set('analytics_consent', 'accepted');
    jar.set('analytics_visitor', '8a2a26f0-504d-4535-a5a1-08fd04c3161d');
    const response = await GET();
    expect(await response.json()).toEqual({ decision: 'accepted' });
  });

  it('revokes consent, deletes linked events, and rejects pending writes', async () => {
    jar.set('analytics_consent', 'accepted');
    jar.set('analytics_visitor', '8a2a26f0-504d-4535-a5a1-08fd04c3161d');
    const response = await DELETE(request('DELETE'));
    expect(response.status).toBe(200);
    expect(eventDelete).toHaveBeenCalledWith({ where: { visitorDigest: expect.any(String) } });
    expect(visitorRevoke).toHaveBeenCalledWith({ where: { visitorDigest: expect.any(String), revokedAt: null }, data: { revokedAt: expect.any(Date) } });
    expect(jar.get('analytics_consent')).toBe('revoked');
    expect(jar.has('analytics_visitor')).toBe(false);
  });

  it('rejects a cross-origin consent request', async () => {
    const crossOrigin = new Request(url, { method: 'POST', headers: { origin: 'https://evil.example', 'content-type': 'application/json' }, body: JSON.stringify({ decision: 'accepted', decisionId }) });
    expect((await POST(crossOrigin)).status).toBe(403);
    expect(visitorCreate).not.toHaveBeenCalled();
  });
});
