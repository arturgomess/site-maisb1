/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsConsent } from './analytics-consent';
import { AnalyticsConsentProvider, useAnalyticsConsent } from './analytics-consent-provider';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

afterEach(() => { cleanup(); vi.unstubAllGlobals(); window.localStorage.clear(); window.sessionStorage.clear(); });

function response(decision: string, ok = true) {
  return Promise.resolve({ ok, json: async () => ({ decision, ...(ok ? {} : { error: 'Falha ao salvar.' }) }) });
}

function ConsentStatus() {
  const consent = useAnalyticsConsent();
  return <span data-testid="consent-status">{consent.loading ? 'loading' : consent.decision}</span>;
}

function mount() {
  return render(<AnalyticsConsentProvider><ConsentStatus /><AnalyticsConsent /></AnalyticsConsentProvider>);
}

describe('AnalyticsConsent', () => {
  it('renders a centered modal outside the page tree and lets close dismiss without deciding', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response('undecided'));
    vi.stubGlobal('fetch', fetchMock);
    const { container } = mount();
    const dialog = await screen.findByRole('dialog', { name: 'Sua privacidade importa' });
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.parentElement?.className).toMatch(/overlay/);
    expect(container.contains(dialog)).toBe(false);
    fireEvent.click(screen.getByRole('button', { name: /fechar/i }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['Aceitar métricas', 'accepted'],
    ['Recusar', 'rejected'],
  ] as const)('%s fecha imediatamente enquanto a gravação aguarda o servidor', async (label, decision) => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('undecided'))
      .mockImplementationOnce(() => new Promise(() => undefined));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: label }));

    expect(screen.queryByRole('dialog')).toBeNull();
    expect(document.body.style.overflow).not.toBe('hidden');
    expect(fetchMock.mock.calls[1][1]).toMatchObject({ method: 'POST' });
    expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toMatchObject({ decision, decisionId: expect.any(String) });
    if (decision === 'rejected') expect(screen.getByTestId('consent-status').textContent).toBe('rejected');
    else expect(screen.getByTestId('consent-status').textContent).toBe('undecided');
  });

  it.each([
    ['Aceitar métricas', 'accepted'],
    ['Recusar', 'rejected'],
  ] as const)('confirma a preferência %s depois que o servidor a registra', async (label, decision) => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response('undecided')).mockResolvedValueOnce(response(decision));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    fireEvent.click(await screen.findByRole('button', { name: label }));

    await waitFor(() => expect(screen.getByTestId('consent-status').textContent).toBe(decision));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('stops collection immediately on refusal, keeps a retryable decision on sync failure, and shows it on reopen', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response('accepted')).mockResolvedValueOnce(response('rejected', false));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await waitFor(() => expect(screen.getByTestId('consent-status').textContent).toBe('accepted'));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => { window.dispatchEvent(new Event('analytics-open-consent')); });
    fireEvent.click(await screen.findByRole('button', { name: 'Recusar' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(window.localStorage.getItem('analytics-consent-pending')).not.toBeNull());
    expect(JSON.parse(window.localStorage.getItem('analytics-consent-pending') || '{}')).toMatchObject({ decision: 'rejected', decisionId: expect.any(String) });
    expect(window.sessionStorage.getItem('analytics-consent-sync-failed')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('Falha ao salvar.');
    expect(screen.queryByRole('dialog')).toBeNull();
    await act(async () => { window.dispatchEvent(new Event('analytics-open-consent')); });
    const dialog = await screen.findByRole('dialog', { name: 'Sua privacidade importa' });
    expect(within(dialog).getByRole('alert').textContent).toContain('Falha ao salvar.');
    expect(within(dialog).getByRole('alert').textContent).not.toContain('recusa');
    expect(within(dialog).getByRole('button', { name: 'Aceitar métricas' })).toBeTruthy();
    expect(screen.getAllByRole('alert')).toHaveLength(1);
  });

  it('does not automatically reopen after a sync failure on the same tab', async () => {
    window.sessionStorage.setItem('analytics-consent-sync-failed', 'true');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(response('undecided')));
    mount();
    await waitFor(() => expect(screen.getByTestId('consent-status').textContent).toBe('undecided'));
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('retries a failed acceptance with the same id and enables collection only after confirmation', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response('undecided'))
      .mockResolvedValueOnce(response('undecided', false))
      .mockResolvedValueOnce(response('accepted'));
    vi.stubGlobal('fetch', fetchMock);
    const firstMount = mount();
    fireEvent.click(await screen.findByRole('button', { name: 'Aceitar métricas' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    await waitFor(() => expect(window.localStorage.getItem('analytics-consent-pending')).not.toBeNull());
    const firstChoice = JSON.parse(window.localStorage.getItem('analytics-consent-pending') || '{}');
    expect(firstChoice).toMatchObject({ decision: 'accepted', decisionId: expect.any(String) });
    expect(screen.getByTestId('consent-status').textContent).toBe('undecided');

    firstMount.unmount();
    mount();
    await waitFor(() => expect(screen.getByTestId('consent-status').textContent).toBe('accepted'));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(JSON.parse(String(fetchMock.mock.calls[2][1]?.body))).toEqual(firstChoice);
    expect(window.localStorage.getItem('analytics-consent-pending')).toBeNull();
  });

  it('opens from the global footer event and links to the privacy policy', async () => {
    const fetchMock = vi.fn().mockResolvedValueOnce(response('rejected'));
    vi.stubGlobal('fetch', fetchMock);
    mount();
    await waitFor(() => expect(screen.getByTestId('consent-status').textContent).toBe('rejected'));
    await act(async () => { await new Promise((resolve) => setTimeout(resolve, 0)); });
    await act(async () => { window.dispatchEvent(new Event('analytics-open-consent')); });
    const dialog = await screen.findByRole('dialog', { name: 'Sua privacidade importa' });
    expect(dialog.querySelector('a')?.getAttribute('href')).toBe('/termos-e-privacidade');
  });
});
