/** @vitest-environment jsdom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AdminSessionUser } from '../../lib/cms-auth';
import { AdminShell } from './admin-shell';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));
vi.mock('next/navigation', () => ({ usePathname: () => '/admin/settings', useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }) }));

afterEach(cleanup);

const administrator: AdminSessionUser = {
  id: 'admin-1',
  name: 'Grupo +B',
  email: 'admin@example.invalid',
  role: 'ADMINISTRATOR',
  canManagePosts: true,
  canManageSettings: true,
  canManageAccess: true,
  canManageAnalytics: true,
  isActive: true,
  mustChangePassword: false,
  lastAccessAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
};

describe('AdminShell analytics navigation', () => {
  it('shows Analytics to an authorized administrator', () => {
    render(<AdminShell user={administrator}><div>Settings</div></AdminShell>);
    expect(screen.getByRole('link', { name: 'Analytics' }).getAttribute('href')).toBe('/admin/analytics');
  });

  it('keeps Analytics hidden when the custom permission is disabled', () => {
    render(<AdminShell user={{ ...administrator, role: 'CUSTOM', canManageAnalytics: false }}><div>Settings</div></AdminShell>);
    expect(screen.queryByRole('link', { name: 'Analytics' })).toBeNull();
  });
});
