import { cookies } from 'next/headers';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { canGrantPermissions, normalizeSessionPermissions, type AdminPermissions } from './admin-access';
import { hashAdminPassword, hashSessionToken, verifyAdminPassword } from './admin-auth-crypto';
import { db } from './db';

export const CMS_COOKIE = 'cms_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const ADMIN_SESSION_MAX_AGE_MS = ADMIN_SESSION_MAX_AGE_SECONDS * 1000;

export type AdminSessionUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  canManagePosts: boolean;
  canManageSettings: boolean;
  canManageAccess: boolean;
  canManageAnalytics: boolean;
  isActive: boolean;
  mustChangePassword: boolean;
  lastAccessAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function getAdminPermissions(user: Pick<AdminSessionUser, 'canManagePosts' | 'canManageSettings' | 'canManageAccess' | 'canManageAnalytics'>): AdminPermissions {
  return { posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess, analytics: user.canManageAnalytics };
}

export function verifyLegacyAdminPassword(password: string) {
  const expected = process.env.CMS_ADMIN_PASSWORD || '';
  if (!expected || !password) return false;
  const received = Buffer.from(password);
  const stored = Buffer.from(expected);
  return received.length === stored.length && timingSafeEqual(received, stored);
}

export async function getBootstrapStatus() {
  if (!db || !process.env.CMS_ADMIN_PASSWORD) return false;
  const [usersCount, bootstrap] = await Promise.all([
    db.adminUser.count(),
    db.adminBootstrap.findUnique({ where: { id: 1 } }),
  ]);
  return usersCount === 0 && !bootstrap?.usedAt;
}

export function isCmsConfigured() {
  return Boolean(db);
}

export async function createAdminSession(userId: string) {
  if (!db) throw new Error('Banco de dados indisponível.');
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + ADMIN_SESSION_MAX_AGE_MS);
  await db.adminSession.create({
    data: { tokenHash: hashSessionToken(token), userId, expiresAt },
  });
  return token;
}

export async function setAdminSessionCookie(token: string) {
  (await cookies()).set(CMS_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
    path: '/',
  });
}

export async function getCurrentAdmin(): Promise<AdminSessionUser | null> {
  if (!db) return null;
  const token = (await cookies()).get(CMS_COOKIE)?.value;
  if (!token || token.length > 128) return null;

  const session = await db.adminSession.findUnique({
    where: { tokenHash: hashSessionToken(token) },
    include: { user: true },
  });
  if (!session || session.expiresAt.getTime() <= Date.now() || !session.user.isActive) return null;
  const { passwordHash: _passwordHash, ...user } = session.user;
  const permissions = normalizeSessionPermissions(user.role, getAdminPermissions(user));
  return {
    ...user,
    canManagePosts: permissions.posts,
    canManageSettings: permissions.settings,
    canManageAccess: permissions.access,
    canManageAnalytics: permissions.analytics,
  };
}

export async function isAdminAuthenticated(permission?: keyof AdminPermissions) {
  const user = await getCurrentAdmin();
  if (!user || user.mustChangePassword) return false;
  if (!permission) return true;
  const permissions = getAdminPermissions(user);
  return permissions[permission];
}

export async function clearCurrentAdminSession() {
  if (!db) return;
  const token = (await cookies()).get(CMS_COOKIE)?.value;
  if (!token) return;
  await db.adminSession.deleteMany({ where: { tokenHash: hashSessionToken(token) } });
}

export async function hashNewPassword(password: string) {
  return hashAdminPassword(password);
}

export { verifyAdminPassword };
export { canGrantPermissions };
