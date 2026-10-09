import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { getRolePermissions, isSecurePassword, isValidAdminEmail, normalizeAdminEmail } from '../../../../lib/admin-access';
import { hashAdminPassword, hashSessionToken, verifyAdminPassword } from '../../../../lib/admin-auth-crypto';
import { CMS_COOKIE, ADMIN_SESSION_MAX_AGE_SECONDS, clearCurrentAdminSession, getBootstrapStatus, getCurrentAdmin, isCmsConfigured, setAdminSessionCookie, verifyLegacyAdminPassword } from '../../../../lib/cms-auth';
import { db } from '../../../../lib/db';

export const runtime = 'nodejs';

function safeUser(user: NonNullable<Awaited<ReturnType<typeof getCurrentAdmin>>>) {
  const { id, name, email, role, canManagePosts, canManageSettings, canManageAccess, isActive, mustChangePassword, lastAccessAt, createdAt, updatedAt } = user;
  return { id, name, email, role, permissions: { posts: canManagePosts, settings: canManageSettings, access: canManageAccess }, isActive, mustChangePassword, lastAccessAt, createdAt, updatedAt };
}

async function bootstrapAccount(body: Record<string, unknown>) {
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const bootstrapPassword = String(body.bootstrapPassword || '');
  const name = String(body.name || '').trim();
  const email = normalizeAdminEmail(String(body.email || ''));
  const password = String(body.password || '');

  if (!verifyLegacyAdminPassword(bootstrapPassword)) return Response.json({ error: 'Não foi possível validar a ativação inicial.' }, { status: 401 });
  if (name.length < 2 || name.length > 160 || !isValidAdminEmail(email) || !isSecurePassword(password)) {
    return Response.json({ error: 'Informe nome, e-mail válido e senha com exatamente 8 caracteres.' }, { status: 400 });
  }

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  try {
    const user = await db.$transaction(async (transaction) => {
      await transaction.$executeRaw`INSERT IGNORE INTO admin_bootstrap (id, usedAt) VALUES (1, NULL)`;
      const rows = await transaction.$queryRaw<Array<{ id: number; usedAt: Date | null }>>`SELECT id, usedAt FROM admin_bootstrap WHERE id = 1 FOR UPDATE`;
      const bootstrap = rows[0];
      if (!bootstrap || bootstrap.usedAt || await transaction.adminUser.count() > 0) throw new Error('BOOTSTRAP_UNAVAILABLE');

      const permissions = getRolePermissions('ADMINISTRATOR');
      const created = await transaction.adminUser.create({
        data: {
          name,
          email,
          passwordHash: await hashAdminPassword(password),
          role: 'ADMINISTRATOR',
          canManagePosts: permissions.posts,
          canManageSettings: permissions.settings,
          canManageAccess: permissions.access,
          lastAccessAt: now,
        },
      });
      await transaction.adminBootstrap.update({ where: { id: 1 }, data: { usedAt: now } });
      await transaction.adminAuditEvent.create({
        data: { actorId: created.id, targetId: created.id, action: 'ACCOUNT_BOOTSTRAPPED', details: JSON.stringify({ role: created.role, permissions }) },
      });
      await transaction.adminSession.create({
        data: { tokenHash: hashSessionToken(token), userId: created.id, expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000) },
      });
      return created;
    });

    await setAdminSessionCookie(token);
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return Response.json({ authenticated: true, user: safeUser(publicUser) }, { status: 201 });
  } catch (error) {
    if (error instanceof Error && (error.message === 'BOOTSTRAP_UNAVAILABLE' || 'code' in error && error.code === 'P2002')) {
      return Response.json({ error: error.message === 'BOOTSTRAP_UNAVAILABLE' ? 'A ativação inicial já foi concluída.' : 'Este e-mail já está cadastrado.' }, { status: 409 });
    }
    return Response.json({ error: 'Não foi possível concluir a ativação inicial.' }, { status: 500 });
  }
}

export async function GET() {
  if (!isCmsConfigured()) return Response.json({ configured: false, authenticated: false, needsBootstrap: false });
  const user = await getCurrentAdmin();
  return Response.json({ configured: true, authenticated: Boolean(user), needsBootstrap: user ? false : await getBootstrapStatus(), user: user ? safeUser(user) : null });
}

export async function POST(request: Request) {
  if (!isCmsConfigured()) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  if (body.action === 'bootstrap') return bootstrapAccount(body);

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
