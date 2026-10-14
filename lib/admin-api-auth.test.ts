import { describe, expect, it } from 'vitest';
import { authorizeAdminRequest, type PermissionCheckUser } from './admin-api-auth';

const editor: PermissionCheckUser = {
  canManagePosts: true,
  canManageSettings: false,
  canManageAccess: false,
  mustChangePassword: false,
};

describe('admin API authorization', () => {
  it('requires an authenticated account', () => {
    expect(authorizeAdminRequest(null, 'posts')).toBe('unauthenticated');
  });

  it('allows the password assigned by the administrator without a forced password-change gate', () => {
    expect(authorizeAdminRequest({ ...editor, mustChangePassword: true }, 'posts')).toBe('allowed');
  });

  it('denies a direct request for an area the account cannot access', () => {
    expect(authorizeAdminRequest(editor, 'settings')).toBe('forbidden');
  });

  it('allows only the requested permission when it is enabled', () => {
    expect(authorizeAdminRequest(editor, 'posts')).toBe('allowed');
  });
});
