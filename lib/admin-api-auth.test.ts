import { describe, expect, it } from 'vitest';
import { authorizeAdminRequest, type PermissionCheckUser } from './admin-api-auth';

const editor: PermissionCheckUser = {
  canManagePosts: true,
  canManageSettings: false,
  canManageAccess: false,
  canManageAnalytics: false,
  mustChangePassword: false,
};

describe('admin API authorization', () => {
  it('requires an authenticated account', () => {
    expect(authorizeAdminRequest(null, 'posts')).toBe('unauthenticated');
  });

  it('restricts temporary-password sessions to password change', () => {
    expect(authorizeAdminRequest({ ...editor, mustChangePassword: true }, 'posts')).toBe('password-change-required');
  });

  it('denies a direct request for an area the account cannot access', () => {
    expect(authorizeAdminRequest(editor, 'settings')).toBe('forbidden');
  });

  it('denies analytics requests without the dedicated permission', () => {
    expect(authorizeAdminRequest(editor, 'analytics')).toBe('forbidden');
    expect(authorizeAdminRequest({ ...editor, canManageAnalytics: true }, 'analytics')).toBe('allowed');
  });

  it('allows only the requested permission when it is enabled', () => {
    expect(authorizeAdminRequest(editor, 'posts')).toBe('allowed');
  });
});
