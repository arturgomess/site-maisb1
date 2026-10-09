/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminUserForm } from './admin-user-form';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));
vi.mock('lucide-react', async (importOriginal) => {
  const icons = await importOriginal<typeof import('lucide-react')>();
  return {
    ...icons,
    Eye: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} data-icon="Eye" />,
    EyeOff: (props: React.SVGProps<SVGSVGElement>) => <svg {...props} data-icon="EyeOff" />,
  };
});

afterEach(cleanup);

describe('AdminUserForm permission switches', () => {
  it('shows the custom permission states and moves each switch handle within its track', () => {
    render(<AdminUserForm currentUserId="admin-1" />);

    const posts = screen.getByRole('switch', { name: 'Permissão: Publicações' });
    const settings = screen.getByRole('switch', { name: 'Permissão: Configurações' });
    const access = screen.getByRole('switch', { name: 'Permissão: Gestão de Acessos' });
    const analytics = screen.getByRole('switch', { name: 'Permissão: Analytics' });
    const postsHandle = posts.querySelector('span');
    const settingsHandle = settings.querySelector('span');

    expect(posts.getAttribute('aria-checked')).toBe('true');
    expect(settings.getAttribute('aria-checked')).toBe('false');
    expect(access.getAttribute('aria-checked')).toBe('false');
    expect(analytics.getAttribute('aria-checked')).toBe('false');
    expect(postsHandle?.className).toContain('left-1');
    expect(postsHandle?.className).toContain('translate-x-5');
    expect(settingsHandle?.className).toContain('translate-x-0');

    fireEvent.click(settings);

    expect(settings.getAttribute('aria-checked')).toBe('true');
    expect(settingsHandle?.className).toContain('translate-x-5');

    fireEvent.click(analytics);

    expect(analytics.getAttribute('aria-checked')).toBe('true');
  });

  it('shows eye icons that match whether each password is currently visible', () => {
    render(<AdminUserForm currentUserId="admin-1" />);

    const password = screen.getByLabelText('Senha');
    const confirmPassword = screen.getByLabelText('Confirmar senha');
    const showPasswordButton = screen.getByRole('button', { name: 'Mostrar senha' });
    const showConfirmButton = screen.getByRole('button', { name: 'Mostrar confirmação de senha' });

    expect(password.getAttribute('type')).toBe('password');
    expect(showPasswordButton.querySelector('svg')?.getAttribute('data-icon')).toBe('EyeOff');
    expect(showConfirmButton.querySelector('svg')?.getAttribute('data-icon')).toBe('EyeOff');

    fireEvent.click(showPasswordButton);
    fireEvent.click(showConfirmButton);

    expect(password.getAttribute('type')).toBe('text');
    expect(confirmPassword.getAttribute('type')).toBe('text');
    expect(screen.getByRole('button', { name: 'Ocultar senha' }).querySelector('svg')?.getAttribute('data-icon')).toBe('Eye');
    expect(screen.getByRole('button', { name: 'Ocultar confirmação de senha' }).querySelector('svg')?.getAttribute('data-icon')).toBe('Eye');
  });
});
