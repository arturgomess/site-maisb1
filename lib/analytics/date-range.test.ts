import { describe, expect, it } from 'vitest';
import { resolveAnalyticsRange } from './date-range';

describe('resolveAnalyticsRange', () => {
  const now = new Date('2026-10-09T15:30:00.000Z');

  it('returns the current Sao Paulo day through now', () => {
    const range = resolveAnalyticsRange({ period: 'today' }, now);
    expect(range.startUtc.toISOString()).toBe('2026-10-09T03:00:00.000Z');
    expect(range.endUtc).toEqual(now);
    expect(range.localDays).toEqual(['2026-10-09']);
  });

  it.each([
    ['7d', '2026-10-03T03:00:00.000Z', 7],
    ['30d', '2026-09-10T03:00:00.000Z', 30],
    ['90d', '2026-07-12T03:00:00.000Z', 90],
  ] as const)('includes today and the previous days for %s', (period, startUtc, days) => {
    const range = resolveAnalyticsRange({ period }, now);
    expect(range.startUtc.toISOString()).toBe(startUtc);
    expect(range.endUtc).toEqual(now);
    expect(range.localDays).toHaveLength(days);
    expect(range.localDays[0]).toBe(startUtc.slice(0, 10));
    expect(range.localDays.at(-1)).toBe('2026-10-09');
  });

  it('treats custom to-date as inclusive and range end as exclusive', () => {
    const range = resolveAnalyticsRange({ period: 'custom', from: '2026-10-01', to: '2026-10-03' }, now);
    expect(range.startUtc.toISOString()).toBe('2026-10-01T03:00:00.000Z');
    expect(range.endUtc.toISOString()).toBe('2026-10-04T03:00:00.000Z');
    expect(range.localDays).toEqual(['2026-10-01', '2026-10-02', '2026-10-03']);
  });

  it('uses the historical Sao Paulo daylight-saving boundary for local midnight', () => {
    const range = resolveAnalyticsRange({ period: 'custom', from: '2018-11-04', to: '2018-11-04' }, now);
    expect(range.startUtc.toISOString()).toBe('2018-11-04T03:00:00.000Z');
    expect(range.endUtc.toISOString()).toBe('2018-11-05T02:00:00.000Z');
  });

  it.each([
    { period: 'custom' as const },
    { period: 'custom' as const, from: '2026-02-30', to: '2026-03-01' },
    { period: 'custom' as const, from: '2026-10-04', to: '2026-10-03' },
    { period: 'custom' as const, from: '2026-01-01', to: '2026-04-01' },
  ])('rejects invalid custom range %#', (input) => {
    expect(() => resolveAnalyticsRange(input, now)).toThrow();
  });

  it('rejects unknown period values', () => {
    expect(() => resolveAnalyticsRange({ period: 'year' as never }, now)).toThrow();
  });
});
