import { describe, expect, it } from 'vitest';
import { classifyTrafficSource } from './attribution';

describe('classifyTrafficSource', () => {
  const empty = { referrer: null, utmSource: null, utmMedium: null, hasAdClickId: false };

  it('recognizes direct visits without a referrer', () => {
    expect(classifyTrafficSource(empty)).toEqual({ category: 'DIRECT', sourceHost: null });
  });

  it.each(['https://www.google.com/search?q=private', 'https://www.bing.com/path?token=x'])('classifies known search referrers and persists only the host', (referrer) => {
    const result = classifyTrafficSource({ ...empty, referrer });
    expect(result.category).toBe('ORGANIC');
    expect(result.sourceHost).toMatch(/^(google\.com|bing\.com)$/);
  });

  it('recognizes paid search from ad click ids and paid UTM media', () => {
    expect(classifyTrafficSource({ ...empty, referrer: 'https://google.com/', hasAdClickId: true }).category).toBe('PAID_SEARCH');
    expect(classifyTrafficSource({ ...empty, utmSource: 'Google', utmMedium: 'cpc' }).category).toBe('PAID_SEARCH');
  });

  it('classifies social campaigns and social referrers', () => {
    expect(classifyTrafficSource({ ...empty, utmSource: 'instagram', utmMedium: 'social' }).category).toBe('SOCIAL');
    expect(classifyTrafficSource({ ...empty, referrer: 'https://m.facebook.com/story' })).toEqual({ category: 'SOCIAL', sourceHost: 'facebook.com' });
  });

  it('uses campaign parameters before referrer categories', () => {
    expect(classifyTrafficSource({ ...empty, referrer: 'https://partner.example/a', utmSource: 'newsletter', utmMedium: 'email' })).toEqual({ category: 'OTHER', sourceHost: 'partner.example' });
  });

  it('uses referral and other for non-campaign unknown traffic', () => {
    expect(classifyTrafficSource({ ...empty, referrer: 'https://www.partner.example/path?q=secret' })).toEqual({ category: 'REFERRAL', sourceHost: 'partner.example' });
    expect(classifyTrafficSource({ ...empty, referrer: 'javascript:alert(1)' })).toEqual({ category: 'OTHER', sourceHost: null });
  });
});
