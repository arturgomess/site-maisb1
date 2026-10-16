export type TrafficSource = 'ORGANIC' | 'SOCIAL' | 'DIRECT' | 'REFERRAL' | 'PAID_SEARCH' | 'OTHER';

export type TrafficAttribution = {
  category: TrafficSource;
  sourceHost: string | null;
};

type AttributionInput = {
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  hasAdClickId: boolean;
};

const searchDomains = ['google.', 'bing.com', 'duckduckgo.com', 'search.yahoo.', 'baidu.com', 'ecosia.org', 'yandex.', 'search.brave.com'];
const socialDomains = ['facebook.com', 'instagram.com', 'linkedin.com', 'tiktok.com', 'pinterest.', 'reddit.com', 'twitter.com', 'x.com', 'youtube.com', 'youtu.be', 'threads.net', 'whatsapp.com'];
const paidMedia = new Set(['cpc', 'ppc', 'paidsearch', 'paid-search', 'sem']);
const socialMedia = new Set(['social', 'social-media', 'social-network', 'social_network', 'sm']);

function normalizeValue(value: string | null) {
  return value?.trim().toLowerCase().replace(/\s+/g, '') || null;
}

function normalizedHost(referrer: string | null) {
  if (!referrer) return null;
  try {
    const url = new URL(referrer);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '').replace(/^mobile\./, '') || null;
  } catch {
    return null;
  }
}

function matchesDomain(host: string | null, domains: string[]) {
  return Boolean(host && domains.some((domain) => host === domain || host.endsWith(`.${domain}`) || domain.endsWith('.') && host.startsWith(domain)));
}

export function classifyTrafficSource(input: AttributionInput): TrafficAttribution {
  const host = normalizedHost(input.referrer);
  const source = normalizeValue(input.utmSource);
  const medium = normalizeValue(input.utmMedium);
  const hasCampaign = Boolean(source || medium);
  const searchCampaign = Boolean(source && (searchDomains.some((domain) => source.includes(domain.replace(/\.$/, '')) || source.includes(domain)) || ['google', 'bing', 'yahoo', 'duckduckgo', 'baidu', 'ecosia', 'yandex', 'brave'].includes(source)));

  if (input.hasAdClickId || paidMedia.has(medium || '') && searchCampaign) return { category: 'PAID_SEARCH', sourceHost: host };
  if (hasCampaign) {
    if (medium === 'organic' && searchCampaign) return { category: 'ORGANIC', sourceHost: host };
    if (socialMedia.has(medium || '') || matchesDomain(host, socialDomains) && (source === 'facebook' || source === 'instagram' || source === 'linkedin' || source === 'tiktok' || source === 'reddit')) {
      return { category: 'SOCIAL', sourceHost: host };
    }
    return { category: 'OTHER', sourceHost: host };
  }
  if (!input.referrer) return { category: 'DIRECT', sourceHost: null };
  if (!host) return { category: 'OTHER', sourceHost: null };
  if (matchesDomain(host, searchDomains)) return { category: 'ORGANIC', sourceHost: host };
  if (matchesDomain(host, socialDomains)) return { category: 'SOCIAL', sourceHost: host };
  return { category: 'REFERRAL', sourceHost: host };
}
