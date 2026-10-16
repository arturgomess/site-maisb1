/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SettingsForm } from './settings-form';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('SettingsForm', () => {
  it('does not expose the legacy GA setting or send it when settings are saved', async () => {
    const fetchMock = vi.fn((_url: string, options?: RequestInit) => Promise.resolve(options?.method === 'PATCH'
      ? { ok: true, status: 200, json: async () => ({}) }
      : {
        ok: true,
        status: 200,
        json: async () => ({ settings: {
          siteName: 'Grupo +B',
          defaultTitle: 'Grupo +B',
          defaultDescription: 'Site institucional',
          defaultKeywords: ['varejo'],
          googleAnalyticsId: 'G-LEGACY1234',
          canonicalUrl: '',
          ogImage: '',
          robotsIndex: true,
        } }),
      }));
    vi.stubGlobal('fetch', fetchMock);

    render(<SettingsForm />);

    await screen.findByLabelText('Nome do site');
    expect(screen.queryByText(/Google Analytics/i)).toBeNull();
    expect(screen.queryByLabelText(/Measurement ID/i)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Salvar configurações/i }));

    await waitFor(() => expect(fetchMock.mock.calls.some(([, options]) => options?.method === 'PATCH')).toBe(true));
    const saveCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'PATCH');
    const saveBody = JSON.parse(saveCall?.[1]?.body as string);
    expect(saveBody).not.toHaveProperty('googleAnalyticsId');
    expect(saveBody).not.toHaveProperty('analyticsId');
  });
});
