import { Prisma } from '@prisma/client';
import { canGrantPermissions, hasFullAdminAccess, isSecurePassword, isValidAdminEmail, normalizeAdminEmail, resolveAdminPermissions, type AdminPermissions } from '../../../../../lib/admin-access';
import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { hashAdminPassword } from '../../../../../lib/admin-auth-crypto';
import { getAdminPermissions } from '../../../../../lib/cms-auth';
import { db } from '../../../../../lib/db';
import { parseAuditDetails, toAdminUserView } from '../../../../../lib/admin-user-view';

export const runtime = 'nodejs';

type RouteContext = { params: Promise<{ id: string }> };

function samePermissions(left: AdminPermissions, right: AdminPermissions) {
  return left.posts === right.posts && left.settings === right.settings && left.access === right.access;
}

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function GET(_request: Request, context: RouteContext) {
  const access = await requireAdminPermission('access');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const { id } = await context.params;
  const user = await db.adminUser.findUnique({
    where: { id },
    include: {
      auditEventsAsTarget: {
        orderBy: { createdAt: 'desc' }, take: 30,
        include: { actor: { select: { id: true, name: true, email: true } } },
      },
    },
  });
  if (!user) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  const history = user.auditEventsAsTarget.map((event) => ({
    id: event.id,
    action: event.action,
    details: parseAuditDetails(event.details),
    createdAt: event.createdAt,
    actor: event.actor ? { id: event.actor.id, name: event.actor.name, email: event.actor.email } : null,
  }));
  return Response.json({ user: toAdminUserView(user), history });
}

export async function PATCH(request: Request, context: RouteContext) {
  const access = await requireAdminPermission('access');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Dados de usuário inválidos.' }, { status: 400 });
  const current = await db.adminUser.findUnique({ where: { id } });
  if (!current) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });

  const name = body.name === undefined ? current.name : String(body.name).trim();
  const email = body.email === undefined ? current.email : normalizeAdminEmail(String(body.email));
  if (name.length < 2 || name.length > 160) return Response.json({ error: 'Informe o nome completo do usuário.' }, { status: 400 });
  if (!isValidAdminEmail(email)) return Response.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  if (body.isActive !== undefined && typeof body.isActive !== 'boolean') return Response.json({ error: 'Status de conta inválido.' }, { status: 400 });
  const password = String(body.password || '');
  const hasPasswordReset = password.length > 0;
  if (hasPasswordReset && !isSecurePassword(password)) return Response.json({ error: 'A nova senha deve ter exatamente 8 caracteres.' }, { status: 400 });
  if (hasPasswordReset && password !== String(body.confirmPassword || '')) return Response.json({ error: 'As senhas não coincidem.' }, { status: 400 });

  const role = body.role === undefined ? current.role : String(body.role);
  const currentPermissions = { posts: current.canManagePosts, settings: current.canManageSettings, access: current.canManageAccess };
  let permissions = currentPermissions;
  if (body.role !== undefined || body.permissions !== undefined) {
    try {
      permissions = resolveAdminPermissions(role, body.permissions ?? currentPermissions);
    } catch (error) {
      return Response.json({ error: error instanceof Error ? error.message : 'Permissões inválidas.' }, { status: 400 });
    }
  }
  if (!canGrantPermissions(getAdminPermissions(access.user), permissions)) return Response.json({ error: 'Você não pode conceder permissões acima do seu próprio acesso.' }, { status: 403 });

  const isActive = body.isActive === undefined ? current.isActive : body.isActive;
  const wasFullAdmin = hasFullAdminAccess(currentPermissions, current.isActive);
  const remainsFullAdmin = hasFullAdminAccess(permissions, isActive);
  if (wasFullAdmin && current.id !== access.user.id && !hasFullAdminAccess(getAdminPermissions(access.user), access.user.isActive)) {
    return Response.json({ error: 'Somente um administrador completo pode alterar outra conta administrativa completa.' }, { status: 403 });
  }

  const profileChanged = current.name !== name || current.email !== email || current.role !== role;
  const permissionsChanged = !samePermissions(currentPermissions, permissions);
  const statusChanged = current.isActive !== isActive;
  const revokeSessions = permissionsChanged || statusChanged || hasPasswordReset;
  if (!profileChanged && !permissionsChanged && !statusChanged && !hasPasswordReset) return Response.json({ user: toAdminUserView(current) });

  try {
    const passwordHash = hasPasswordReset ? await hashAdminPassword(password) : undefined;
    const updated = await db.$transaction(async (transaction) => {
      await transaction.$executeRaw`INSERT IGNORE INTO admin_bootstrap (id, usedAt) VALUES (1, NULL)`;
      await transaction.$queryRaw`SELECT id FROM admin_bootstrap WHERE id = 1 FOR UPDATE`;
      if (wasFullAdmin && !remainsFullAdmin) {
        const fullAdmins = await transaction.adminUser.count({ where: { isActive: true, canManagePosts: true, canManageSettings: true, canManageAccess: true } });
        if (fullAdmins <= 1) throw new Error('LAST_FULL_ADMIN');
      }

      const saved = await transaction.adminUser.update({
        where: { id },
        data: {
          name, email, role, canManagePosts: permissions.posts, canManageSettings: permissions.settings, canManageAccess: permissions.access, isActive,
          ...(passwordHash ? { passwordHash, mustChangePassword: true } : {}),
        },
      });
      if (revokeSessions) await transaction.adminSession.deleteMany({ where: { userId: id } });
      if (profileChanged) await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: id, action: 'PROFILE_UPDATED', details: JSON.stringify({ name: { from: current.name, to: name }, email: { from: current.email, to: email }, role: { from: current.role, to: role } }) },
      });
      if (permissionsChanged) await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: id, action: 'PERMISSIONS_UPDATED', details: JSON.stringify({ from: currentPermissions, to: permissions }) },
      });
      if (statusChanged) await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: id, action: isActive ? 'ACCOUNT_ACTIVATED' : 'ACCOUNT_DEACTIVATED', details: JSON.stringify({ isActive }) },
      });
      if (hasPasswordReset) await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: id, action: 'PASSWORD_RESET', details: JSON.stringify({ mustChangePassword: true }) },
      });
      return saved;
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });
    return Response.json({ user: toAdminUserView(updated), sessionsRevoked: revokeSessions, currentSessionRevoked: revokeSessions && id === access.user.id });
  } catch (error) {
    if (error instanceof Error && error.message === 'LAST_FULL_ADMIN') return Response.json({ error: 'Não é possível desativar ou reduzir o acesso do último administrador completo.' }, { status: 409 });
    if (isUniqueConstraint(error)) return Response.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    return Response.json({ error: 'Não foi possível salvar as alterações do usuário.' }, { status: 500 });
  }
}
