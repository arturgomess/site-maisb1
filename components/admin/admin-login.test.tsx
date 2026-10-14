/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminLogin } from './admin-login';

const router = vi.hoisted(() => ({ push: vi.fn(), refresh: vi.fn() }));

vi.mock('next/navigation', () => ({ useRouter: () => router }));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('AdminLogin', () => {
  it('keeps the login limited to email and password when no admin account exists', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      configured: true,
      authenticated: false,
      needsBootstrap: true,
      user: null,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));

    render(<AdminLogin />);

    expect(await screen.findByRole('heading', { name: 'Entrar no CMS' })).toBeTruthy();
    await waitFor(() => expect(document.querySelectorAll('form input')).toHaveLength(2));
    expect(screen.getByLabelText('E-mail de acesso')).toBeTruthy();
    expect(screen.getByLabelText('Senha')).toBeTruthy();
    expect(screen.queryByText(/ativar conta/i)).toBeNull();
    expect(screen.queryByLabelText(/senha atual do painel/i)).toBeNull();
    expect(screen.queryByLabelText(/confirmar/i)).toBeNull();
  });

  it('submits only the administrator-provided email and password and opens the permitted area', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ configured: true, authenticated: false, needsBootstrap: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ authenticated: true, user: { permissions: { posts: true, settings: false, access: false } } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    render(<AdminLogin />);
    fireEvent.change(await screen.findByLabelText('E-mail de acesso'), { target: { value: ' editor@empresa.com ' } });
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'senha123' } });
    fireEvent.submit(document.querySelector('form')!);

    await waitFor(() => expect(router.push).toHaveBeenCalledWith('/admin/posts'));
    expect(fetchMock).toHaveBeenNthCalledWith(2, '/api/admin/session', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'editor@empresa.com', password: 'senha123' }),
    }));
  });
});
