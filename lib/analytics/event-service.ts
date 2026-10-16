import { createHmac } from 'node:crypto';
import { classifyTrafficSource } from './attribution';
import { db } from '../db';

export type AnalyticsEventType = 'page_view' | 'engagement';

export type AnalyticsEventInput = {
  eventId: string;
  eventType: AnalyticsEventType;
  path: string;
  engagedSeconds?: number;
};

export type AnalyticsRequestMetadata = {
  hasConsent: boolean;
  visitorId: string | null;
  userAgent: string | null;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  hasAdClickId: boolean;
};

type AnalyticsPrismaClient = {
  analyticsEvent?: { create(args: { data: Record<string, unknown> }): Promise<unknown> };
  analyticsVisitor?: { updateMany(args: { where: { visitorDigest: string; revokedAt: null }; data: { lastSeenAt: Date } }): Promise<{ count: number }> };
  post?: { findFirst(args: { where: Record<string, unknown>; select: { id: true } }): Promise<{ id: string } | null> };
  $transaction?: <T>(operation: (transaction: AnalyticsPrismaClient) => Promise<T>) => Promise<T>;
};

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function validPath(path: unknown): path is string {
  if (typeof path !== 'string' || path.length < 1 || path.length > 500 || !path.startsWith('/') || path.startsWith('//')) return false;
  if (/[?#\u0000-\u001f\\]/.test(path) || /%(?![0-9a-f]{2})/i.test(path)) return false;
  try {
    const parsed = new URL(path, 'https://analytics.invalid');
    return parsed.origin === 'https://analytics.invalid' && parsed.pathname === path && !/^\/admin(?:\/|$)/i.test(parsed.pathname);
  } catch {
    return false;
  }
}

function getDevice(userAgent: string | null): 'DESKTOP' | 'MOBILE' | 'TABLET' {
  const value = userAgent?.slice(0, 1000).toLowerCase() || '';
  if (/ipad|tablet|kindle|silk|playbook/.test(value) || /android/.test(value) && !/mobile/.test(value)) return 'TABLET';
  if (/iphone|ipod|mobile|android/.test(value)) return 'MOBILE';
  return 'DESKTOP';
}

function isUniqueConflict(error: unknown) {
  return Boolean(error && typeof error === 'object' && 'code' in error && error.code === 'P2002');
}

export async function recordAnalyticsEvent(
  input: AnalyticsEventInput,
  metadata: AnalyticsRequestMetadata,
): Promise<'created' | 'duplicate' | 'ignored'> {
  if (!metadata.hasConsent || !metadata.visitorId || !uuidPattern.test(metadata.visitorId)) return 'ignored';
  if (!process.env.ANALYTICS_HMAC_SECRET || !uuidPattern.test(input.eventId) || !validPath(input.path)) return 'ignored';
  if (input.eventType !== 'page_view' && input.eventType !== 'engagement') return 'ignored';
  const engagedSeconds = input.eventType === 'engagement' ? input.engagedSeconds : 0;
  if (input.eventType === 'engagement' && (!Number.isInteger(engagedSeconds) || engagedSeconds! < 0 || engagedSeconds! > 15)) return 'ignored';
  if (!db) return 'ignored';

  const client = db as unknown as AnalyticsPrismaClient;
  if (!client.analyticsEvent?.create || !client.analyticsVisitor?.updateMany || !client.$transaction) return 'ignored';
  const occurredAt = new Date();
  let postId: string | null = null;
  const articlePath = input.path.match(/^\/noticias\/([^/]+)\/?$/i);
  if (articlePath && client.post?.findFirst) {
    let slug = '';
    try { slug = decodeURIComponent(articlePath[1]); } catch { return 'ignored'; }
    if (!slug || slug.length > 160 || /[\\/\u0000-\u001f]/.test(slug)) return 'ignored';
    const post = await client.post.findFirst({ where: { slug, status: 'published', publishedAt: { lte: occurredAt } }, select: { id: true } });
    postId = post?.id || null;
  }

  const attribution = classifyTrafficSource(metadata);
  const data = {
    eventId: input.eventId,
    eventType: input.eventType,
    occurredAt,
    path: input.path,
    postId,
    visitorDigest: createHmac('sha256', process.env.ANALYTICS_HMAC_SECRET).update(metadata.visitorId).digest('hex'),
    sourceCategory: attribution.category,
    sourceHost: attribution.sourceHost,
    device: getDevice(metadata.userAgent),
    engagedSeconds: engagedSeconds || 0,
  };

  try {
    return await client.$transaction(async (transaction) => {
      // Updating the consent row locks it against concurrent revocation. If revocation wins,
      // this conditional write affects no row and the in-flight beacon is discarded.
      const activeVisitor = await transaction.analyticsVisitor!.updateMany({
        where: { visitorDigest: data.visitorDigest, revokedAt: null },
        data: { lastSeenAt: occurredAt },
      });
      if (activeVisitor.count !== 1) return 'ignored';
      await transaction.analyticsEvent!.create({ data });
      return 'created';
    });
  } catch (error) {
    if (isUniqueConflict(error)) return 'duplicate';
    throw error;
  }
}
