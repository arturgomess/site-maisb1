import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { analyticsCookieOptions, ANALYTICS_CONSENT_COOKIE, ANALYTICS_VISITOR_COOKIE, getAnalyticsVisitorDigest, isAnalyticsVisitorId, isSameOriginRequest } from '../../../../lib/analytics/privacy';
import { db } from '../../../../lib/db';

export const runtime = 'nodejs';

type ConsentTransaction = {
  analyticsConsentLog: { create(args: { data: { decisionId: string; decision: 'accepted' | 'rejected'; occurredAt: Date } }): Promise<unknown> };
  analyticsVisitor: {
    create(args: { data: { visitorDigest: string; consentedAt: Date; lastSeenAt: Date } }): Promise<unknown>;
    updateMany(args: { where: { visitorDigest: string; revokedAt: null }; data: { revokedAt: Date } }): Promise<{ count: number }>;
  };
  analyticsEvent: { deleteMany(args: { where: { visitorDigest: string } }): Promise<{ count: number }> };
};

type ConsentClient = {
  analyticsConsentLog: { findUnique(args: { where: { decisionId: string }; select: { decision: true } }): Promise<{ decision: string } | null> };
  analyticsVisitor: { findUnique(args: { where: { visitorDigest: string }; select: { revokedAt: true } }): Promise<{ revokedAt: Date | null } | null> };
  $transaction<T>(operation: (transaction: ConsentTransaction) => Promise<T>): Promise<T>;
};

async function revokeDigest(transaction: ConsentTransaction, digest: string) {
  await transaction.analyticsVisitor.updateMany({ where: { visitorDigest: digest, revokedAt: null }, data: { revokedAt: new Date() } });
  await transaction.analyticsEvent.deleteMany({ where: { visitorDigest: digest } });
}

function isDuplicate(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

async function setDecision(decision: 'accepted' | 'rejected' | 'revoked', visitorId?: string) {
  const jar = await cookies();
  const options = analyticsCookieOptions();
  if (decision === 'accepted' && visitorId) jar.set(ANALYTICS_VISITOR_COOKIE, visitorId, options);
  else jar.delete(ANALYTICS_VISITOR_COOKIE);
  jar.set(ANALYTICS_CONSENT_COOKIE, decision, options);
}

export async function GET() {
  const jar = await cookies();
  const decision = jar.get(ANALYTICS_CONSENT_COOKIE)?.value;
  if (decision === 'rejected') return Response.json({ decision: 'rejected' }, { headers: { 'Cache-Control': 'no-store' } });
  const visitorId = jar.get(ANALYTICS_VISITOR_COOKIE)?.value;
  if (decision !== 'accepted' || !isAnalyticsVisitorId(visitorId) || !db || !process.env.ANALYTICS_HMAC_SECRET) {
    return Response.json({ decision: 'undecided' }, { headers: { 'Cache-Control': 'no-store' } });
  }
  const client = db as unknown as ConsentClient;
  const visitor = await client.analyticsVisitor.findUnique({ where: { visitorDigest: getAnalyticsVisitorDigest(visitorId) }, select: { revokedAt: true } });
  return Response.json({ decision: visitor && visitor.revokedAt === null ? 'accepted' : 'undecided' }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function POST(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  const body = await request.json().catch(() => null) as { decision?: unknown; decisionId?: unknown } | null;
  if (!body || (body.decision !== 'accepted' && body.decision !== 'rejected') || typeof body.decisionId !== 'string' || !uuidPattern.test(body.decisionId)) {
    return Response.json({ error: 'Escolha de consentimento inválida.' }, { status: 400 });
  }

  const currentId = (await cookies()).get(ANALYTICS_VISITOR_COOKIE)?.value;
  const hasCurrentId = isAnalyticsVisitorId(currentId);
  if (!db || (hasCurrentId && !process.env.ANALYTICS_HMAC_SECRET)) return Response.json({ error: 'O consentimento não pôde ser atualizado agora.' }, { status: 503 });
  const currentDigest = hasCurrentId ? getAnalyticsVisitorDigest(currentId) : null;
  if (body.decision === 'accepted' && (!db || !process.env.ANALYTICS_HMAC_SECRET)) {
    return Response.json({ error: 'A coleta analítica está temporariamente indisponível.' }, { status: 503 });
  }

  try {
    const client = db as unknown as ConsentClient;
    const now = new Date();
    let duplicate = false;
    let visitorId: string | null = null;
    try {
      visitorId = await client.$transaction(async (transaction) => {
        await transaction.analyticsConsentLog.create({ data: { decisionId: body.decisionId as string, decision: body.decision as 'accepted' | 'rejected', occurredAt: now } });
        if (currentDigest) await revokeDigest(transaction, currentDigest);
        if (body.decision === 'accepted') {
          const newVisitorId = randomUUID();
          const digest = getAnalyticsVisitorDigest(newVisitorId);
          await transaction.analyticsVisitor.create({ data: { visitorDigest: digest, consentedAt: now, lastSeenAt: now } });
          return newVisitorId;
        }
        return null;
      });
    } catch (error) {
      if (!isDuplicate(error)) throw error;
      const saved = await client.analyticsConsentLog.findUnique({ where: { decisionId: body.decisionId }, select: { decision: true } });
      if (!saved) throw error;
      if (saved.decision !== body.decision) return Response.json({ error: 'Este identificador já foi usado para outra decisão.' }, { status: 409 });
      duplicate = true;
      if (currentDigest) {
        await client.$transaction((transaction) => revokeDigest(transaction, currentDigest));
      }
      if (body.decision === 'accepted') {
        visitorId = randomUUID();
        const digest = getAnalyticsVisitorDigest(visitorId);
        await client.$transaction((transaction) => transaction.analyticsVisitor.create({ data: { visitorDigest: digest, consentedAt: now, lastSeenAt: now } }).then(() => visitorId));
      }
    }
    if (body.decision === 'accepted' && visitorId) await setDecision('accepted', visitorId);
    else await setDecision('rejected');
    return Response.json({ decision: body.decision, duplicate }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'O consentimento não pôde ser atualizado agora.' }, { status: 503 });
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginRequest(request)) return Response.json({ error: 'Origem inválida.' }, { status: 403 });
  const visitorId = (await cookies()).get(ANALYTICS_VISITOR_COOKIE)?.value;
  if (isAnalyticsVisitorId(visitorId)) {
    if (!db || !process.env.ANALYTICS_HMAC_SECRET) return Response.json({ error: 'O consentimento não pôde ser revogado agora.' }, { status: 503 });
    try {
      const digest = getAnalyticsVisitorDigest(visitorId);
      const client = db as unknown as { $transaction<T>(operation: (transaction: ConsentTransaction) => Promise<T>): Promise<T> };
      await client.$transaction((transaction) => revokeDigest(transaction, digest));
    } catch {
      return Response.json({ error: 'O consentimento não pôde ser revogado agora.' }, { status: 503 });
    }
  }
  await setDecision('revoked');
  return Response.json({ decision: 'revoked' }, { headers: { 'Cache-Control': 'no-store' } });
}
