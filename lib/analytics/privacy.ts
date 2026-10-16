import { createHmac } from 'node:crypto';

export const ANALYTICS_CONSENT_COOKIE = 'analytics_consent';
export const ANALYTICS_VISITOR_COOKIE = 'analytics_visitor';
export const ANALYTICS_CONSENT_MAX_AGE = 90 * 24 * 60 * 60;

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isAnalyticsVisitorId(value: string | undefined): value is string {
  return Boolean(value && uuidPattern.test(value));
}

export function getAnalyticsVisitorDigest(visitorId: string) {
  const secret = process.env.ANALYTICS_HMAC_SECRET;
  if (!secret) throw new Error('Analytics HMAC secret is not configured.');
  return createHmac('sha256', secret).update(visitorId).digest('hex');
}

export function isSameOriginRequest(request: Request) {
  const originHeader = request.headers.get('origin');
  const requestHost = (request.headers.get('x-forwarded-host') || request.headers.get('host') || new URL(request.url).host).split(',')[0].trim().toLowerCase();
  if (!originHeader || !requestHost) return false;
  try {
    const origin = new URL(originHeader);
    return (origin.protocol === 'http:' || origin.protocol === 'https:') && origin.host.toLowerCase() === requestHost;
  } catch {
    return false;
  }
}

export function analyticsCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: ANALYTICS_CONSENT_MAX_AGE,
  };
}
