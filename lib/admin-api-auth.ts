import type { AdminPermissions } from './admin-access';
import { getCurrentAdmin, type AdminSessionUser } from './cms-auth';

export type PermissionCheckUser = Pick<AdminSessionUser, 'canManagePosts' | 'canManageSettings' | 'canManageAccess' | 'canManageAnalytics' | 'mustChangePassword'>;
export type AdminPermission = keyof AdminPermissions;
export type AuthorizationOutcome = 'allowed' | 'unauthenticated' | 'password-change-required' | 'forbidden';

export function authorizeAdminRequest(user: PermissionCheckUser | null, permission: AdminPermission): AuthorizationOutcome {
  if (!user) return 'unauthenticated';
  if (user.mustChangePassword) return 'password-change-required';
  const field = { posts: 'canManagePosts', settings: 'canManageSettings', access: 'canManageAccess', analytics: 'canManageAnalytics' } as const;
  return user[field[permission]] ? 'allowed' : 'forbidden';
}

export async function requireAdminPermission(permission: AdminPermission): Promise<
  { user: AdminSessionUser; response: null } |
  { user: null; response: Response }
> {
  const user = await getCurrentAdmin();
  const outcome = authorizeAdminRequest(user, permission);
  if (outcome === 'allowed') return { user: user!, response: null };
  if (outcome === 'unauthenticated') return { user: null, response: Response.json({ error: 'Não autenticado.' }, { status: 401 }) };
  if (outcome === 'password-change-required') return { user: null, response: Response.json({ error: 'Atualize sua senha para continuar.', code: 'PASSWORD_CHANGE_REQUIRED' }, { status: 403 }) };
  return { user: null, response: Response.json({ error: 'Você não tem permissão para acessar esta área.' }, { status: 403 }) };
}
