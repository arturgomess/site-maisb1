import { hasFullAdminAccess, isSecurePassword } from '../../../../../../lib/admin-access';
import { requireAdminPermission } from '../../../../../../lib/admin-api-auth';
import { hashAdminPassword } from '../../../../../../lib/admin-auth-crypto';
import { getAdminPermissions } from '../../../../../../lib/cms-auth';
import { db } from '../../../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPermission('access');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const { id } = await context.params;
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Dados de redefinição inválidos.' }, { status: 400 });
  const password = String(body.password || '');
  if (!isSecurePassword(password)) return Response.json({ error: 'A senha deve ter exatamente 8 caracteres.' }, { status: 400 });
  if (password !== String(body.confirmPassword || '')) return Response.json({ error: 'As senhas não coincidem.' }, { status: 400 });

  const target = await db.adminUser.findUnique({ where: { id } });
  if (!target) return Response.json({ error: 'Usuário não encontrado.' }, { status: 404 });
  const targetPermissions = { posts: target.canManagePosts, settings: target.canManageSettings, access: target.canManageAccess };
  if (target.id !== access.user.id && hasFullAdminAccess(targetPermissions, target.isActive) && !hasFullAdminAccess(getAdminPermissions(access.user), access.user.isActive)) {
    return Response.json({ error: 'Somente um administrador completo pode redefinir a senha de outra conta administrativa completa.' }, { status: 403 });
  }

  try {
    const passwordHash = await hashAdminPassword(password);
    await db.$transaction(async (transaction) => {
      await transaction.adminUser.update({ where: { id }, data: { passwordHash, mustChangePassword: false } });
      await transaction.adminSession.deleteMany({ where: { userId: id } });
      await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: id, action: 'PASSWORD_RESET', details: JSON.stringify({ mustChangePassword: false }) },
      });
    });
    return Response.json({ passwordReset: true, mustChangePassword: false, sessionsRevoked: true });
  } catch {
    return Response.json({ error: 'Não foi possível redefinir a senha.' }, { status: 500 });
  }
}
