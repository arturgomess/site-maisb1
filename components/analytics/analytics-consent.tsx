'use client';

import { Cookie, X } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { createPortal } from 'react-dom';
import { useEffect, useRef, useState } from 'react';
import { useAnalyticsConsent } from './analytics-consent-provider';
import styles from './analytics-consent.module.css';

const pendingConsentKey = 'analytics-consent-pending';
const syncFailedSessionKey = 'analytics-consent-sync-failed';
type PendingConsent = { decision: 'accepted' | 'rejected'; decisionId: string };

function clearPendingConsent() {
  try { window.localStorage.removeItem(pendingConsentKey); } catch { /* Analytics remains gated by the server decision. */ }
}

function clearSyncFailedSession() {
  try { window.sessionStorage.removeItem(syncFailedSessionKey); } catch { /* Session storage is optional. */ }
}

function wasSyncFailedThisSession() {
  try { return window.sessionStorage.getItem(syncFailedSessionKey) === 'true'; } catch { return false; }
}

function markSyncFailedThisSession() {
  try { window.sessionStorage.setItem(syncFailedSessionKey, 'true'); } catch { /* The current component still stays closed. */ }
}

function readPendingConsent(): PendingConsent | null {
  try {
    const value = JSON.parse(window.localStorage.getItem(pendingConsentKey) || 'null') as Partial<PendingConsent> | null;
    if ((value?.decision === 'accepted' || value?.decision === 'rejected') && typeof value.decisionId === 'string') return value as PendingConsent;
  } catch { /* Storage may be disabled or contain an invalid value. */ }
  return null;
}

function savePendingConsent(choice: PendingConsent) {
  try { window.localStorage.setItem(pendingConsentKey, JSON.stringify(choice)); return true; } catch { return false; }
}

export function AnalyticsConsent() {
  const pathname = usePathname();
  const { decision, loading, setDecision } = useAnalyticsConsent();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [syncError, setSyncError] = useState('');
  const dialogRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);
  const pendingDecisionRef = useRef(false);
  const isAdmin = Boolean(pathname?.toLowerCase().startsWith('/admin'));

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (isAdmin) { setOpen(false); return; }
    if (!loading && !initializedRef.current) {
      initializedRef.current = true;
      setOpen(decision === 'undecided' && !wasSyncFailedThisSession());
    }
  }, [decision, isAdmin, loading]);

  useEffect(() => {
    const onOpen = () => {
      if (isAdmin) return;
      setSyncError('');
      setOpen(true);
    };
    window.addEventListener('analytics-open-consent', onOpen);
    return () => window.removeEventListener('analytics-open-consent', onOpen);
  }, [isAdmin]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialogRef.current?.focus();
    return () => { document.body.style.overflow = previousOverflow; };
  }, [open]);

  const choose = async (next: 'accepted' | 'rejected') => {
    if (pendingDecisionRef.current) return;
    pendingDecisionRef.current = true;
    const pending = readPendingConsent();
    const choice = { decision: next, decisionId: pending?.decision === next ? pending.decisionId : crypto.randomUUID() };
    setBusy(true);
    setError('');
    setSyncError('');
    setOpen(false);
    if (next === 'rejected') setDecision('rejected');
    try {
      const response = await fetch('/api/analytics/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(choice),
        credentials: 'same-origin',
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível atualizar suas preferências.');
      clearPendingConsent();
      clearSyncFailedSession();
      setDecision(next);
      setSyncError('');
      setOpen(false);
    } catch (cause) {
      const savedLocally = savePendingConsent(choice);
      markSyncFailedThisSession();
      const message = savedLocally
        ? `${cause instanceof Error ? cause.message : 'Não foi possível atualizar suas preferências.'} A escolha ficou salva neste navegador e será reenviada; as métricas dependem da confirmação do servidor. Você pode tentar novamente em Preferências de cookies.`
        : `${cause instanceof Error ? cause.message : 'Não foi possível atualizar suas preferências.'} A gravação local também falhou, então esta escolha não será contabilizada. Você pode tentar novamente em Preferências de cookies.`;
      setError(message);
      setSyncError(message);
    } finally {
      pendingDecisionRef.current = false;
      setBusy(false);
    }
  };

  if (!mounted || isAdmin || (!open && !syncError)) return null;

  return createPortal(
    <>
      {open && <div className={styles.overlay} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="analytics-consent-title" tabIndex={-1} className={styles.dialog}>
          <button type="button" onClick={() => setOpen(false)} aria-label="Fechar" disabled={busy} className={styles.close}><X size={22} /></button>
          <Cookie size={46} strokeWidth={1.7} aria-hidden="true" className={styles.cookieIcon} />
          <h2 id="analytics-consent-title" className={styles.title}>Sua privacidade importa</h2>
          <p className={styles.description}>Com seu aceite, registramos páginas visitadas, origem aproximada, dispositivo e tempo de navegação para melhorar sua experiência. Os eventos ficam por até 90 dias. Você pode recusar ou revogar quando quiser.</p>
          <p className={styles.privacyLink}>Saiba mais na nossa <a href="/termos-e-privacidade">Política de Privacidade</a>.</p>
          {error && <p role="alert" className={styles.error}>{error}</p>}
          <div className={styles.actions}>
            <button type="button" onClick={() => void choose('rejected')} disabled={busy} className={styles.reject}>{busy ? 'Salvando…' : 'Recusar'}</button>
            <button type="button" onClick={() => void choose('accepted')} disabled={busy} className={styles.accept}>{busy ? 'Salvando…' : 'Aceitar métricas'}</button>
          </div>
        </div>
      </div>}
      {syncError && <div role="alert" className={styles.syncNotice}><span>{syncError}</span><button type="button" aria-label="Fechar aviso" onClick={() => setSyncError('')}><X size={18} /></button></div>}
    </>,
    document.body,
  );
}
