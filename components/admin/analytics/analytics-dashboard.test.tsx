/** @vitest-environment jsdom */
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AnalyticsDashboard } from './analytics-dashboard';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

function jsonResponse(value: unknown) {
  return Promise.resolve({ ok: true, json: async () => value });
}

describe('AnalyticsDashboard', () => {
  it('shows only zero values and empty states when the collector has no data', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/summary')) return jsonResponse({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
      if (url.includes('/privacy-decisions')) return jsonResponse({ accepted: 0, rejected: 0, total: 0, acceptPercent: 0, rejectPercent: 0 });
      if (url.includes('/trend')) return jsonResponse([]);
      if (url.includes('/sources')) return jsonResponse([]);
      if (url.includes('/devices')) return jsonResponse([{ device: 'DESKTOP', views: 0, percent: 0 }, { device: 'MOBILE', views: 0, percent: 0 }, { device: 'TABLET', views: 0, percent: 0 }]);
      if (url.includes('/posts')) return jsonResponse({ page: 1, pageSize: 5, total: 0, posts: [] });
      return jsonResponse({ page: 1, pageSize: 10, total: 0, pages: [] });
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<AnalyticsDashboard />);
    expect(screen.getByRole('heading', { name: 'Visão geral do desempenho' })).toBeTruthy();
    await waitFor(() => expect(screen.getByText('Nenhuma publicação foi acessada neste período.')).toBeTruthy());
    expect(screen.getByText('Nenhuma página foi acessada neste período.')).toBeTruthy();
    const metrics = within(screen.getByLabelText('Indicadores principais'));
    expect(metrics.getByText('Visualizações de página').parentElement?.textContent).toContain('0');
    expect(metrics.getByText('Visitantes únicos').parentElement?.textContent).toContain('0');
    expect(metrics.getByText('Tempo médio de permanência').parentElement?.textContent).toContain('0s');
    expect(metrics.getByText('Publicações lidas').parentElement?.textContent).toContain('0');
    expect(screen.getByLabelText('Indicadores principais').textContent).not.toContain('%');
    expect(await screen.findByText('Decisões registradas')).toBeTruthy();
    expect(screen.getByText('Ainda não há decisões neste período.')).toBeTruthy();
  });

  it('sends the selected date range to independently loaded sections', async () => {
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/summary')) return jsonResponse({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
      if (url.includes('/privacy-decisions')) return jsonResponse({ accepted: 83, rejected: 17, total: 100, acceptPercent: 83, rejectPercent: 17 });
      if (url.includes('/trend')) return jsonResponse([]);
      if (url.includes('/sources')) return jsonResponse([]);
      if (url.includes('/devices')) return jsonResponse([]);
      if (url.includes('/posts')) return jsonResponse({ page: 1, pageSize: 5, total: 0, posts: [] });
      return jsonResponse({ page: 1, pageSize: 10, total: 0, pages: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<AnalyticsDashboard />);
    const period = screen.getByLabelText('Período');
    fireEvent.change(period, { target: { value: '7d' } });
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('period=7d'))).toBe(true));
    await waitFor(() => expect(fetchMock.mock.calls.some(([url]) => String(url).includes('/privacy-decisions?period=7d'))).toBe(true));
    expect((await screen.findByText('Aceitaram')).parentElement?.textContent).toContain('83,0%');
    expect(screen.getByText('100')).toBeTruthy();
  });

  it('refreshes privacy decisions while the dashboard stays open', async () => {
    let privacyRequests = 0;
    const fetchMock = vi.fn((input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes('/privacy-decisions')) {
        privacyRequests += 1;
        const accepted = privacyRequests > 1 ? 1 : 0;
        return jsonResponse({ accepted, rejected: 0, total: accepted, acceptPercent: accepted ? 100 : 0, rejectPercent: 0 });
      }
      if (url.includes('/summary')) return jsonResponse({ pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 });
      if (url.includes('/trend')) return jsonResponse([]);
      if (url.includes('/sources')) return jsonResponse([]);
      if (url.includes('/devices')) return jsonResponse([]);
      if (url.includes('/posts')) return jsonResponse({ page: 1, pageSize: 5, total: 0, posts: [] });
      return jsonResponse({ page: 1, pageSize: 10, total: 0, pages: [] });
    });
    vi.stubGlobal('fetch', fetchMock);
    const intervalSpy = vi.spyOn(window, 'setInterval');

    render(<AnalyticsDashboard />);
    await waitFor(() => expect(privacyRequests).toBe(1));
    const refresh = intervalSpy.mock.calls.find(([, delay]) => delay === 15_000)?.[0];
    expect(refresh).toBeTypeOf('function');

    act(() => { (refresh as () => void)(); });
    await waitFor(() => expect(privacyRequests).toBe(2));
  });
});
