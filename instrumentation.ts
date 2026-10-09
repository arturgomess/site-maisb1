import { db } from './lib/db';

const RETENTION_MS = 90 * 24 * 60 * 60 * 1000;
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000;

type AnalyticsInstrumentationState = typeof globalThis & { __groupBAnalyticsCleanup?: NodeJS.Timeout };

async function purgeExpiredAnalytics() {
  if (!db) return;
  const cutoff = new Date(Date.now() - RETENTION_MS);
  await db.analyticsEvent.deleteMany({ where: { occurredAt: { lt: cutoff } } });
  const consentDatabase = db as unknown as { analyticsConsentLog: { deleteMany(args: { where: { occurredAt: { lt: Date } } }): Promise<unknown> } };
  await consentDatabase.analyticsConsentLog.deleteMany({ where: { occurredAt: { lt: cutoff } } });
  const analyticsDatabase = db as unknown as { analyticsVisitor: { deleteMany(args: { where: { OR: Array<Record<string, unknown>> } }): Promise<unknown> } };
  await analyticsDatabase.analyticsVisitor.deleteMany({
    where: { OR: [{ revokedAt: { lt: cutoff } }, { revokedAt: null, lastSeenAt: { lt: cutoff } }] },
  });
}

export async function register() {
  if (process.env.NEXT_RUNTIME !== 'nodejs') return;
  const state = globalThis as AnalyticsInstrumentationState;
  if (state.__groupBAnalyticsCleanup) return;
  void purgeExpiredAnalytics().catch(() => undefined);
  state.__groupBAnalyticsCleanup = setInterval(() => {
    void purgeExpiredAnalytics().catch(() => undefined);
  }, CLEANUP_INTERVAL_MS);
  state.__groupBAnalyticsCleanup.unref();
}
