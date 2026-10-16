export const ADMIN_ROLES = ['EDITOR', 'ADMINISTRATOR', 'CUSTOM'] as const;
export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminPermissions = {
  posts: boolean;
  settings: boolean;
  access: boolean;
  analytics: boolean;
};

export const PERMISSION_LABELS: Record<keyof AdminPermissions, string> = {
  posts: 'Publicações',
  settings: 'Configurações',
  access: 'Gestão de Acessos',
  analytics: 'Analytics',
};

export function getRolePermissions(role: AdminRole | string): AdminPermissions {
  if (role === 'ADMINISTRATOR') return { posts: true, settings: true, access: true, analytics: true };
  if (role === 'EDITOR') return { posts: true, settings: false, access: false, analytics: false };
  return { posts: false, settings: false, access: false, analytics: false };
}

export function normalizeSessionPermissions(role: AdminRole | string, stored: AdminPermissions): AdminPermissions {
  return role === 'ADMINISTRATOR' ? getRolePermissions(role) : stored;
}

export function resolveAdminPermissions(role: AdminRole | string, requested: unknown): AdminPermissions {
  if (role === 'EDITOR' || role === 'ADMINISTRATOR') return getRolePermissions(role);
  if (role !== 'CUSTOM' || !requested || typeof requested !== 'object') throw new Error('Perfil de acesso inválido.');

  const value = requested as Record<string, unknown>;
  const permissions: AdminPermissions = {
    posts: value.posts === true,
    settings: value.settings === true,
    access: value.access === true,
    analytics: value.analytics === true,
  };
  if (['posts', 'settings', 'access', 'analytics'].some((key) => key in value && typeof value[key] !== 'boolean')) {
    throw new Error('Permissões inválidas.');
  }
  if (!permissions.posts && !permissions.settings && !permissions.access && !permissions.analytics) throw new Error('Selecione pelo menos uma permissão.');
  return permissions;
}

export function hasFullAdminAccess(permissions: AdminPermissions, isActive: boolean) {
  return isActive && permissions.posts && permissions.settings && permissions.access && permissions.analytics;
}

export function sameAdminPermissions(left: AdminPermissions, right: AdminPermissions) {
  return (Object.keys(left) as (keyof AdminPermissions)[]).every((key) => left[key] === right[key]);
}

export function canGrantPermissions(actor: AdminPermissions, target: AdminPermissions) {
  return (Object.keys(target) as (keyof AdminPermissions)[]).every((key) => !target[key] || actor[key]);
}

export function isSecurePassword(password: string) {
  return password.length === 8;
}

export function normalizeAdminEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidAdminEmail(email: string) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getRoleLabel(role: AdminRole | string) {
  if (role === 'ADMINISTRATOR') return 'Administrador';
  if (role === 'EDITOR') return 'Editor';
  return 'Personalizado';
}

export function inferRole(permissions: AdminPermissions): AdminRole {
  if (permissions.posts && permissions.settings && permissions.access && permissions.analytics) return 'ADMINISTRATOR';
  if (permissions.posts && !permissions.settings && !permissions.access && !permissions.analytics) return 'EDITOR';
  return 'CUSTOM';
}

export function getAdminHomeHref(permissions: AdminPermissions) {
  if (permissions.posts) return '/admin/posts';
  if (permissions.settings) return '/admin/settings';
  if (permissions.access) return '/admin/access';
  if (permissions.analytics) return '/admin/analytics';
  return '/admin/login';
}
