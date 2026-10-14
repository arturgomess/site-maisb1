/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminShell } from './admin-shell';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings', useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

const originalScrollY = Object.getOwnPropertyDescriptor(window, 'scrollY');
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  document.body.removeAttribute('style');
  if (originalScrollY) Object.defineProperty(window, 'scrollY', originalScrollY);
  else Reflect.deleteProperty(window, 'scrollY');
});

const administrator = {
  id: 'admin-1', name: 'Grupo +B', email: 'admin@example.invalid',
  role: 'ADMINISTRATOR',
  canManagePosts: true,
  canManageSettings: true,
  canManageAccess: true,
  isActive: true,
  mustChangePassword: false,
  lastAccessAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};
const ScrollTestShell = AdminShell as unknown as ComponentType<{ children: ReactNode; user?: typeof administrator }>;

describe('AdminShell sidebar scrolling', () => {
  it('locks page scrolling, contains menu overscroll, and restores the previous position on close', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 240 });
    document.body.style.cssText = 'overflow: auto; color: black';
    const previousStyle = document.body.getAttribute('style');
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});

    render(<ScrollTestShell user={administrator}><div>Settings</div></ScrollTestShell>);
    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));

    const sidebar = document.querySelector('.admin-sidebar-inner');
    expect(document.body.style.position).toBe('fixed');
    expect(document.body.style.top).toBe('-240px');
    expect(sidebar?.className).toContain('overflow-y-auto');
    expect(sidebar?.className).toContain('overscroll-y-contain');

    fireEvent.click(screen.getByRole('button', { name: 'Fechar menu' }));

    expect(document.body.getAttribute('style')).toBe(previousStyle);
    expect(scrollTo).toHaveBeenLastCalledWith(0, 240);
  });

  it('restores page position when the sidebar unmounts while open', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 120 });
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { unmount } = render(<ScrollTestShell user={administrator}><div>Settings</div></ScrollTestShell>);

    fireEvent.click(screen.getByRole('button', { name: 'Abrir menu' }));
    unmount();

    expect(document.body.style.position).toBe('');
    expect(scrollTo).toHaveBeenLastCalledWith(0, 120);
  });
});
