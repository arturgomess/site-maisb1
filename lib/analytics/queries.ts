import { Prisma } from '@prisma/client';
import { db } from '../db';
import type { AnalyticsRange } from './date-range';
import type { TrafficSource } from './attribution';

const retentionMs = 90 * 24 * 60 * 60 * 1000;
const sources: TrafficSource[] = ['ORGANIC', 'SOCIAL', 'DIRECT', 'REFERRAL', 'PAID_SEARCH', 'OTHER'];
const devices = ['DESKTOP', 'MOBILE', 'TABLET'] as const;

type AnalyticsRow = Record<string, unknown>;
type AnalyticsQueryClient = {
  $queryRaw<T>(query: TemplateStringsArray | ReturnType<typeof Prisma.sql>, ...values: unknown[]): Promise<T>;
  post: {
    findUnique(args: { where: { id: string }; select: { id: true; slug: true; title: true; publishedAt: true; imagePath: true } }): Promise<PostMetadata | null>;
    findMany(args: { where: { id: { in: string[] } }; select: { id: true; slug: true; title: true; publishedAt: true; imagePath: true } }): Promise<PostMetadata[]>;
  };
};

type PostMetadata = { id: string; slug: string; title: string; publishedAt: Date; imagePath: string | null };
type Bounds = { start: Date; end: Date };

export type AnalyticsSummary = { pageViews: number; uniqueVisitors: number; avgEngagedSeconds: number; postViews: number };
export type AnalyticsConsentDecisions = { accepted: number; rejected: number; total: number; acceptPercent: number; rejectPercent: number };
export type AnalyticsTrendPoint = { day: string; pageViews: number; uniqueVisitors: number };
export type AnalyticsSourceRow = { category: TrafficSource; views: number; percent: number };
export type AnalyticsDeviceRow = { device: (typeof devices)[number]; views: number; percent: number };
export type AnalyticsPageRow = { path: string; views: number; percent: number };
export type AnalyticsPostRow = PostMetadata & { views: number };

const zeroSummary: AnalyticsSummary = { pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 };
const zeroConsentDecisions: AnalyticsConsentDecisions = { accepted: 0, rejected: 0, total: 0, acceptPercent: 0, rejectPercent: 0 };

function client() {
  return db as unknown as AnalyticsQueryClient | null;
}

function boundsFor(range: AnalyticsRange, now: Date): Bounds | null {
  const retentionStart = now.getTime() - retentionMs;
  const start = new Date(Math.max(range.startUtc.getTime(), retentionStart));
  const end = new Date(Math.min(range.endUtc.getTime(), now.getTime()));
  return start < end ? { start, end } : null;
}

function number(value: unknown) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function percent(value: number, total: number) {
  return total > 0 ? Math.round((value / total) * 1000) / 10 : 0;
}

function sourceName(value: unknown): TrafficSource {
  return sources.includes(value as TrafficSource) ? value as TrafficSource : 'OTHER';
}

async function summaryFor(bounds: Bounds, postId?: string): Promise<AnalyticsSummary> {
  const dbClient = client();
  if (!dbClient) return zeroSummary;
  const postFilter = postId ? Prisma.sql`AND postId = ${postId}` : Prisma.empty;
  const rows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT
      COUNT(CASE WHEN eventType = 'page_view' THEN 1 END) AS pageViews,
      COUNT(DISTINCT CASE WHEN eventType = 'page_view' THEN visitorDigest END) AS uniqueVisitors,
      COALESCE(SUM(CASE WHEN eventType = 'engagement' THEN engagedSeconds ELSE 0 END), 0) AS engagedSeconds,
      COUNT(CASE WHEN eventType = 'page_view' AND postId IS NOT NULL THEN 1 END) AS postViews
    FROM analytics_events
    WHERE occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
      ${postFilter}
  `;
  const result = rows[0] || {};
  const pageViews = number(result.pageViews);
  const engagedSeconds = number(result.engagedSeconds);
  return {
    pageViews,
    uniqueVisitors: number(result.uniqueVisitors),
    avgEngagedSeconds: pageViews ? Math.round((engagedSeconds / pageViews) * 10) / 10 : 0,
    postViews: number(result.postViews),
  };
}

function analyticsSummary(range: AnalyticsRange, now: Date, postId?: string) {
  const bounds = boundsFor(range, now);
  return bounds ? summaryFor(bounds, postId) : Promise.resolve(zeroSummary);
}

export function getAnalyticsSummary(range: AnalyticsRange, now = new Date()) {
  return analyticsSummary(range, now);
}

export async function getAnalyticsConsentDecisions(range: AnalyticsRange, now = new Date()): Promise<AnalyticsConsentDecisions> {
  const bounds = boundsFor(range, now);
  const dbClient = client();
  if (!bounds || !dbClient) return zeroConsentDecisions;
  const rows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT decision, COUNT(*) AS total
    FROM analytics_consent_decisions
    WHERE occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
    GROUP BY decision
  `;
  const counts = new Map(rows.map((row) => [String(row.decision), number(row.total)]));
  const accepted = counts.get('accepted') || 0;
  const rejected = counts.get('rejected') || 0;
  const total = accepted + rejected;
  return { accepted, rejected, total, acceptPercent: percent(accepted, total), rejectPercent: percent(rejected, total) };
}

async function trendFor(bounds: Bounds, localDays: string[], postId?: string, sourceCategory?: TrafficSource): Promise<AnalyticsTrendPoint[]> {
  const dbClient = client();
  if (!dbClient) return localDays.map((day) => ({ day, pageViews: 0, uniqueVisitors: 0 }));
  const postFilter = postId ? Prisma.sql`AND postId = ${postId}` : Prisma.empty;
  const sourceFilter = sourceCategory ? Prisma.sql`AND sourceCategory = ${sourceCategory}` : Prisma.empty;
  const rows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT CAST(DATE(COALESCE(CONVERT_TZ(occurredAt, '+00:00', 'America/Sao_Paulo'), DATE_SUB(occurredAt, INTERVAL 3 HOUR))) AS CHAR) AS day,
      COUNT(*) AS pageViews, COUNT(DISTINCT visitorDigest) AS uniqueVisitors
    FROM analytics_events
    WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
      ${postFilter} ${sourceFilter}
    GROUP BY day ORDER BY day ASC
  `;
  const byDay = new Map<string, AnalyticsTrendPoint>();
  for (const row of rows) {
    const day = String(row.day || '').slice(0, 10);
    if (day) byDay.set(day, { day, pageViews: number(row.pageViews), uniqueVisitors: number(row.uniqueVisitors) });
  }
  return localDays.map((day) => byDay.get(day) || { day, pageViews: 0, uniqueVisitors: 0 });
}

export async function getAnalyticsTrend(range: AnalyticsRange, now = new Date()): Promise<AnalyticsTrendPoint[]> {
  const bounds = boundsFor(range, now);
  return bounds ? trendFor(bounds, range.localDays) : range.localDays.map((day) => ({ day, pageViews: 0, uniqueVisitors: 0 }));
}

async function sourcesFor(bounds: Bounds, postId?: string): Promise<AnalyticsSourceRow[]> {
  const dbClient = client();
  if (!dbClient) return [];
  const postFilter = postId ? Prisma.sql`AND postId = ${postId}` : Prisma.empty;
  const rows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT sourceCategory AS category, COUNT(*) AS views FROM analytics_events
    WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
      ${postFilter}
    GROUP BY sourceCategory ORDER BY views DESC, category ASC
  `;
  const combined = new Map<TrafficSource, number>();
  for (const row of rows) combined.set(sourceName(row.category), (combined.get(sourceName(row.category)) || 0) + number(row.views));
  const total = [...combined.values()].reduce((sum, views) => sum + views, 0);
  return [...combined].map(([category, views]) => ({ category, views, percent: percent(views, total) })).sort((a, b) => b.views - a.views || sources.indexOf(a.category) - sources.indexOf(b.category));
}

export async function getAnalyticsSources(range: AnalyticsRange, now = new Date()): Promise<AnalyticsSourceRow[]> {
  const bounds = boundsFor(range, now);
  return bounds ? sourcesFor(bounds) : [];
}

export async function getAnalyticsSourceDetails(range: AnalyticsRange, category: TrafficSource, now = new Date()) {
  const bounds = boundsFor(range, now);
  const dbClient = client();
  if (!bounds || !dbClient) return { category, views: 0, posts: [] as AnalyticsPostRow[], trend: range.localDays.map((day) => ({ day, pageViews: 0, uniqueVisitors: 0 })) };
  const [countRows, postRows, trend] = await Promise.all([
    dbClient.$queryRaw<AnalyticsRow[]>`SELECT COUNT(*) AS views FROM analytics_events WHERE eventType = 'page_view' AND sourceCategory = ${category} AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}`,
    dbClient.$queryRaw<AnalyticsRow[]>`
      SELECT p.id, p.slug, p.title, p.publishedAt, p.imagePath, COUNT(*) AS views
      FROM analytics_events e INNER JOIN posts p ON p.id = e.postId
      WHERE e.eventType = 'page_view' AND e.sourceCategory = ${category} AND e.postId IS NOT NULL AND e.occurredAt >= ${bounds.start} AND e.occurredAt < ${bounds.end}
      GROUP BY p.id, p.slug, p.title, p.publishedAt, p.imagePath ORDER BY views DESC, p.publishedAt DESC, p.id ASC LIMIT 5
    `,
    trendFor(bounds, range.localDays, undefined, category),
  ]);
  const posts = postRows.map((row) => ({
    id: String(row.id), slug: String(row.slug), title: String(row.title), publishedAt: new Date(String(row.publishedAt)),
    imagePath: row.imagePath ? String(row.imagePath) : null, views: number(row.views),
  }));
  return { category, views: number(countRows[0]?.views), posts, trend };
}

export async function getAnalyticsDevices(range: AnalyticsRange, now = new Date()): Promise<AnalyticsDeviceRow[]> {
  const bounds = boundsFor(range, now);
  const dbClient = client();
  if (!bounds || !dbClient) return devices.map((device) => ({ device, views: 0, percent: 0 }));
  const rows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT device, COUNT(*) AS views FROM analytics_events
    WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
    GROUP BY device
  `;
  const counts = new Map<string, number>(rows.map((row) => [String(row.device), number(row.views)]));
  const total = [...counts.values()].reduce((sum, views) => sum + views, 0);
  return devices.map((device) => ({ device, views: counts.get(device) || 0, percent: percent(counts.get(device) || 0, total) }));
}

export async function getAnalyticsPages(range: AnalyticsRange, page = 1, pageSize = 10, now = new Date()) {
  const bounds = boundsFor(range, now);
  const dbClient = client();
  if (!bounds || !dbClient) return { page, pageSize, total: 0, pages: [] as AnalyticsPageRow[] };
  const offset = (page - 1) * pageSize;
  const [rows, totalRows] = await Promise.all([
    dbClient.$queryRaw<AnalyticsRow[]>`
      SELECT path, COUNT(*) AS views FROM analytics_events
      WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
      GROUP BY path ORDER BY views DESC, path ASC LIMIT ${pageSize} OFFSET ${offset}
    `,
    dbClient.$queryRaw<AnalyticsRow[]>`
      SELECT COUNT(*) AS total FROM (SELECT path FROM analytics_events WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end} GROUP BY path) AS page_groups
    `,
  ]);
  const totalViews = rows.reduce((sum, row) => sum + number(row.views), 0);
  // Use a range-wide denominator so page shares remain stable across pagination.
  const totalViewRows = await dbClient.$queryRaw<AnalyticsRow[]>`
    SELECT COUNT(*) AS totalViews FROM analytics_events WHERE eventType = 'page_view' AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end}
  `;
  const denominator = number(totalViewRows[0]?.totalViews) || totalViews;
  const total = number(totalRows[0]?.total);
  return {
    page,
    pageSize,
    total,
    pages: rows.map((row) => ({ path: String(row.path), views: number(row.views), percent: percent(number(row.views), denominator) })),
  };
}

export async function getAnalyticsPosts(range: AnalyticsRange, page = 1, pageSize = 5, now = new Date()) {
  const bounds = boundsFor(range, now);
  const dbClient = client();
  if (!bounds || !dbClient) return { page, pageSize, total: 0, posts: [] as AnalyticsPostRow[] };
  const offset = (page - 1) * pageSize;
  const [rows, totalRows] = await Promise.all([
    dbClient.$queryRaw<AnalyticsRow[]>`
      SELECT p.id, p.slug, p.title, p.publishedAt, p.imagePath, COUNT(*) AS views
      FROM analytics_events e INNER JOIN posts p ON p.id = e.postId
      WHERE e.eventType = 'page_view' AND e.postId IS NOT NULL AND e.occurredAt >= ${bounds.start} AND e.occurredAt < ${bounds.end}
      GROUP BY p.id, p.slug, p.title, p.publishedAt, p.imagePath ORDER BY views DESC, p.publishedAt DESC, p.id ASC LIMIT ${pageSize} OFFSET ${offset}
    `,
    dbClient.$queryRaw<AnalyticsRow[]>`
      SELECT COUNT(*) AS total FROM (SELECT postId FROM analytics_events WHERE eventType = 'page_view' AND postId IS NOT NULL AND occurredAt >= ${bounds.start} AND occurredAt < ${bounds.end} GROUP BY postId) AS post_groups
    `,
  ]);
  return { page, pageSize, total: number(totalRows[0]?.total), posts: rows.map((row) => ({
    id: String(row.id), slug: String(row.slug), title: String(row.title), publishedAt: new Date(String(row.publishedAt)),
    imagePath: row.imagePath ? String(row.imagePath) : null, views: number(row.views),
  })) };
}

export async function getAnalyticsPostDetails(range: AnalyticsRange, postId: string, now = new Date()) {
  const dbClient = client();
  if (!dbClient) return null;
  const post = await dbClient.post.findUnique({ where: { id: postId }, select: { id: true, slug: true, title: true, publishedAt: true, imagePath: true } });
  if (!post) return null;
  const bounds = boundsFor(range, now);
  if (!bounds) return { post, summary: zeroSummary, sources: [] as AnalyticsSourceRow[], trend: range.localDays.map((day) => ({ day, pageViews: 0, uniqueVisitors: 0 })) };
  const [summary, sourcesResult, trend] = await Promise.all([summaryFor(bounds, postId), sourcesFor(bounds, postId), trendFor(bounds, range.localDays, postId)]);
  const sourceTotal = sourcesResult.reduce((sum, row) => sum + row.views, 0);
  const sources = sourcesResult.map((row) => ({ ...row, percent: percent(row.views, sourceTotal) }));
  return { post, summary, sources, trend };
}
