'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { useAnalyticsConsent } from './analytics-consent-provider';

function pageEvent(path: string, includeAttribution: boolean) {
  const url = new URL(window.location.href);
  let referrer: string | null = null;
  if (includeAttribution && document.referrer) {
    try {
      const parsed = new URL(document.referrer);
      if (parsed.protocol === 'http:' || parsed.protocol === 'https:') referrer = parsed.origin;
    } catch { /* Ignore malformed browser referrers. */ }
  }
  return {
    eventId: crypto.randomUUID(),
    eventType: 'page_view',
    path,
    referrer,
    utmSource: includeAttribution ? url.searchParams.get('utm_source') : null,
    utmMedium: includeAttribution ? url.searchParams.get('utm_medium') : null,
    hasAdClickId: includeAttribution && ['gclid', 'gbraid', 'wbraid', 'msclkid'].some((key) => url.searchParams.has(key)),
  };
}

function send(payload: Record<string, unknown>, keepalive = false) {
  const body = JSON.stringify(payload);
  if (keepalive && typeof navigator.sendBeacon === 'function') {
    const accepted = navigator.sendBeacon('/api/analytics/events', new Blob([body], { type: 'application/json' }));
    if (accepted) return;
  }
  void fetch('/api/analytics/events', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive,
    credentials: 'same-origin',
  }).catch(() => undefined);
}

export function PublicAnalyticsTracker() {
  const pathname = usePathname();
  const { decision, decisionRef } = useAnalyticsConsent();
  const lastPage = useRef<string | null>(null);
  const attributionUsed = useRef(false);
  const isAdmin = Boolean(pathname?.toLowerCase().startsWith('/admin'));

  useEffect(() => {
    if (decision !== 'accepted' || isAdmin || !pathname || pathname.toLowerCase().startsWith('/admin')) return;
    const path = pathname.slice(0, 500);
    if (lastPage.current !== path) {
      lastPage.current = path;
      send(pageEvent(path, !attributionUsed.current));
      attributionUsed.current = true;
    }

    let engagedSeconds = 0;
    const flush = (keepalive = true) => {
      if (decisionRef.current !== 'accepted') return;
      if (engagedSeconds < 1) return;
      const batch = Math.min(15, engagedSeconds);
      engagedSeconds -= batch;
      send({ eventId: crypto.randomUUID(), eventType: 'engagement', path, engagedSeconds: batch }, keepalive);
    };
    const timer = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return;
      engagedSeconds += 1;
      if (engagedSeconds >= 15) flush(false);
    }, 1000);
    const onVisibilityChange = () => { if (document.visibilityState !== 'visible') flush(true); };
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      flush(true);
    };
  }, [decision, decisionRef, isAdmin, pathname]);

  return null;
}
