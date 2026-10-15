import { getRoleLabel } from './admin-access';

export function toAdminUserView(user: {
  id: string; name: string; email: string; role: string; canManagePosts: boolean; canManageSettings: boolean;
  canManageAccess: boolean; isActive: boolean; mustChangePassword: boolean; lastAccessAt: Date | null; createdAt: Date; updatedAt: Date;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    roleLabel: getRoleLabel(user.role),
    permissions: { posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess },
    isActive: user.isActive,
    mustChangePassword: user.mustChangePassword,
    lastAccessAt: user.lastAccessAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export function parseAuditDetails(details: string | null) {
  if (!details) return null;
  try {
    const value: unknown = JSON.parse(details);
    return value && typeof value === 'object' && !Array.isArray(value) ? value : null;
  } catch {
    return null;
  }
}
