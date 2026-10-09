import { randomBytes } from 'node:crypto';
import { isSecurePassword } from '../../../../../lib/admin-access';
import { hashAdminPassword, hashSessionToken, verifyAdminPassword } from '../../../../../lib/admin-auth-crypto';
import { ADMIN_SESSION_MAX_AGE_SECONDS, getCurrentAdmin, setAdminSessionCookie } from '../../../../../lib/cms-auth';
import { db } from '../../../../../lib/db';

export const runtime = 'nodejs';

export async function POST(request: Request) {
  const user = await getCurrentAdmin();
  if (!user) return Response.json({ error: 'Sua sessão expirou. Entre novamente.' }, { status: 401 });
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Dados de senha inválidos.' }, { status: 400 });
  const currentPassword = String(body.currentPassword || '');
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');
  const stored = await db.adminUser.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  if (!stored || !await verifyAdminPassword(currentPassword, stored.passwordHash)) return Response.json({ error: 'A senha atual está incorreta.' }, { status: 400 });
  if (!isSecurePassword(password)) return Response.json({ error: 'A nova senha deve ter exatamente 8 caracteres.' }, { status: 400 });
  if (password !== confirmPassword) return Response.json({ error: 'As senhas não coincidem.' }, { status: 400 });
  if (password === currentPassword) return Response.json({ error: 'Escolha uma senha diferente da atual.' }, { status: 400 });

  const token = randomBytes(32).toString('base64url');
  const now = new Date();
  try {
    const passwordHash = await hashAdminPassword(password);
    await db.$transaction(async (transaction) => {
      await transaction.adminUser.update({ where: { id: user.id }, data: { passwordHash, mustChangePassword: false } });
      await transaction.adminSession.deleteMany({ where: { userId: user.id } });
      await transaction.adminSession.create({ data: { userId: user.id, tokenHash: hashSessionToken(token), expiresAt: new Date(now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000) } });
      await transaction.adminAuditEvent.create({
        data: { actorId: user.id, targetId: user.id, action: 'PASSWORD_CHANGED', details: JSON.stringify({ forcedChangeCompleted: true }) },
      });
    });
    await setAdminSessionCookie(token);
    return Response.json({ passwordChanged: true });
  } catch {
    return Response.json({ error: 'Não foi possível atualizar a senha.' }, { status: 500 });
  }
}
