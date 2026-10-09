'use client';

import { createContext, useCallback, useContext, useEffect, useRef, useState, type MutableRefObject, type ReactNode } from 'react';

export type AnalyticsConsentDecision = 'accepted' | 'rejected' | 'revoked' | 'undecided';
const pendingConsentKey = 'analytics-consent-pending';
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
type PendingConsent = { decision: 'accepted' | 'rejected'; decisionId: string };

function clearPendingConsent() {
  try { window.localStorage.removeItem(pendingConsentKey); } catch { /* The server cookie records the choice after a successful retry. */ }
}

type AnalyticsConsentContextValue = {
  decision: AnalyticsConsentDecision;
  decisionRef: MutableRefObject<AnalyticsConsentDecision>;
  loading: boolean;
  setDecision: (decision: AnalyticsConsentDecision) => void;
};

const AnalyticsConsentContext = createContext<AnalyticsConsentContextValue | null>(null);

export function AnalyticsConsentProvider({ children }: { children: ReactNode }) {
  const [decision, setDecisionState] = useState<AnalyticsConsentDecision>('undecided');
  const decisionRef = useRef<AnalyticsConsentDecision>('undecided');
  const [loading, setLoading] = useState(true);
  const setDecision = useCallback((next: AnalyticsConsentDecision) => { decisionRef.current = next; setDecisionState(next); }, []);

  useEffect(() => {
    let active = true;
    try {
      const stored = JSON.parse(window.localStorage.getItem(pendingConsentKey) || 'null') as { decision?: unknown; decisionId?: unknown } | null;
      if ((stored?.decision === 'accepted' || stored?.decision === 'rejected') && typeof stored.decisionId === 'string' && uuidPattern.test(stored.decisionId)) {
        const pending = stored as PendingConsent;
        if (pending.decision === 'rejected') {
          setDecision('rejected');
          setLoading(false);
        }
        void (async () => {
          try {
            const response = await fetch('/api/analytics/consent', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(pending),
              credentials: 'same-origin',
            });
            if (response.ok) {
              if (active) {
                clearPendingConsent();
                setDecision(pending.decision);
                setLoading(false);
              }
              return;
            }
          } catch { /* Confirm current server consent below; keep an unconfirmed acceptance gated. */ }

          if (pending.decision === 'accepted') {
            let serverDecision: 'accepted' | 'rejected' | 'undecided' = 'undecided';
            try {
              const response = await fetch('/api/analytics/consent', { cache: 'no-store', credentials: 'same-origin' });
              const result = response.ok ? await response.json() : null;
              if (result?.decision === 'accepted' || result?.decision === 'rejected') serverDecision = result.decision;
            } catch { /* Leave analytics gated until the server can confirm a valid choice. */ }
            if (active) {
              if (serverDecision === pending.decision) clearPendingConsent();
              setDecision(serverDecision);
              setLoading(false);
            }
          }
        })();
        return () => { active = false; };
      }
    } catch { /* Storage may be disabled; server consent remains authoritative. */ }
    void fetch('/api/analytics/consent', { cache: 'no-store', credentials: 'same-origin' })
      .then((response) => response.ok ? response.json() : null)
      .then((result) => {
        if (!active) return;
        setDecision(result?.decision === 'accepted' || result?.decision === 'rejected' ? result.decision : 'undecided');
      })
      .catch(() => { if (active) setDecision('undecided'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [setDecision]);

  return <AnalyticsConsentContext.Provider value={{ decision, decisionRef, loading, setDecision }}>{children}</AnalyticsConsentContext.Provider>;
}

export function useAnalyticsConsent() {
  const value = useContext(AnalyticsConsentContext);
  if (!value) throw new Error('AnalyticsConsentProvider is missing.');
  return value;
}
