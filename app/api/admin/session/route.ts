import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { isValidAdminEmail, normalizeAdminEmail } from '../../../../lib/admin-access';
import { hashSessionToken, verifyAdminPassword } from '../../../../lib/admin-auth-crypto';
import { CMS_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, clearCurrentAdminSession, getCurrentAdmin, isCmsConfigured, setAdminSessionCookie } from '../../../../lib/cms-auth';
import { db } from '../../../../lib/db';

export const runtime = 'nodejs';

function safeUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>) {
  const { id, name, email, role, canManagePosts, canManageSettings, canManageAccess, isActive, mustChangePassword, lastAccessAt, createdAt, updatedAt } = user;
  return { id, name, email, role, permissions: { posts: canManagePosts, settings: canManageSettings, access: canManageAccess }, isActive, mustChangePassword, lastAccessAt, createdAt, updatedAt };
}

export async function GET() {
  if (!isCmsConfigured()) return Response.json({ configured: false, authenticated: false });
  const user = await getCurrentAdmin();
  return Response.json({ configured: true, authenticated: Boolean(user), user: user ? safeUser(user) : null });
}

export async function POST(request: Request) {
  if (!isCmsConfigured()) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const email = normalizeAdminEmail(String(body.email || ''));
  const password = String(body.password || '');
  if (!isValidAdminEmail(email) || password.length > 128) return Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });

  const user = await db!.adminUser.findUnique({ where: { email } });
  if (!user || !user.isActive || !await verifyAdminPassword(password, user.passwordHash)) {
    return Response.json({ error: 'E-mail ou senha inválidos.' }, { status: 401 });
  }

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  try {
    await db!.$transaction([
      db!.adminUser.update({ where: { id: user.id }, data: { lastAccessAt: now } }),
      db!.adminSession.create({ data: { tokenHash: hashSessionToken(token), userId: user.id, expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000) } }),
    ]);
    await setAdminSessionCookie(token);
    const { passwordHash: _passwordHash, ...publicUser } = { ...user, lastAccessAt: now };
    return Response.json({ authenticated: true, user: safeUser(publicUser) });
  } catch {
    return Response.json({ error: 'Não foi possível iniciar a sessão.' }, { status: 500 });
  }
}

export async function DELETE() {
  await clearCurrentAdminSession();
  (await cookies()).delete(CMS_COOKIE);
  return Response.json({ authenticated: false });
}
