import { cookies } from 'next/headers';
import { recordAnalyticsEvent, type AnalyticsEventInput } from '../../../../lib/analytics/event-service';
import { ANALYTICS_CONSENT_COOKIE, ANALYTICS_VISITOR_COOKIE, isAnalyticsVisitorId, isSameOriginRequest } from '../../../../lib/analytics/privacy';

export const runtime = 'nodejs';
const maxPayloadBytes = 4096;

function safeReferrer(value: unknown) {
  if (typeof value !== 'string' || value.length > 300) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.origin;
  } catch {
    return null;
  }
}

function shortValue(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) || null : null;
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  const hintedLength = Number(request.headers.get('content-length'));
  if (hintedLength > maxPayloadBytes) return Response.json({ error: 'Evento muito grande.' }, { status: 413 });
  const raw = await request.text();
  if (Buffer.byteLength(raw, 'utf8') > maxPayloadBytes) return Response.json({ error: 'Evento muito grande.' }, { status: 413 });
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return Response.json({ error: 'Evento inválido.' }, { status: 400 });
  }

  const jar = await cookies();
  const visitorId = jar.get(ANALYTICS_VISITOR_COOKIE)?.value;
  if (jar.get(ANALYTICS_CONSENT_COOKIE)?.value !== 'accepted' || !isAnalyticsVisitorId(visitorId)) {
    return Response.json({ recorded: false }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  }

  const allowedKeys = new Set(['eventId', 'eventType', 'path', 'engagedSeconds', 'referrer', 'utmSource', 'utmMedium', 'hasAdClickId']);
  if (Object.keys(body).some((key) => !allowedKeys.has(key)) || typeof body.eventId !== 'string' || typeof body.path !== 'string') {
    return Response.json({ error: 'Evento inválido.' }, { status: 400 });
  }
  if (body.eventType !== 'page_view' && body.eventType !== 'engagement') return Response.json({ error: 'Tipo de evento inválido.' }, { status: 400 });
  if (!body.path.startsWith('/') || body.path.startsWith('//') || /^\/admin(?:\/|$)/i.test(body.path) || /[?#\\\u0000-\u001f]/.test(body.path)) {
    return Response.json({ error: 'Caminho de página inválido.' }, { status: 400 });
  }
  const event: AnalyticsEventInput = {
    eventId: body.eventId,
    eventType: body.eventType,
    path: body.path,
    ...(body.eventType === 'engagement' ? { engagedSeconds: typeof body.engagedSeconds === 'number' ? body.engagedSeconds : Number.NaN } : {}),
  };
  if (body.eventType === 'page_view' && body.engagedSeconds !== undefined) return Response.json({ error: 'Evento inválido.' }, { status: 400 });

  try {
    const result = await recordAnalyticsEvent(event, {
      hasConsent: true,
      visitorId,
      userAgent: request.headers.get('user-agent')?.slice(0, 1000) || null,
      referrer: safeReferrer(body.referrer),
      utmSource: shortValue(body.utmSource, 100),
      utmMedium: shortValue(body.utmMedium, 100),
      hasAdClickId: body.hasAdClickId === true,
    });
    return Response.json({ recorded: result === 'created' }, { status: 202, headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ recorded: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
