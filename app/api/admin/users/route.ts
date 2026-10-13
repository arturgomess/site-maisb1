import { Prisma } from '@prisma/client';
import { ADMIN_ROLES, canGrantPermissions, isSecurePassword, isValidAdminEmail, normalizeAdminEmail, resolveAdminPermissions, type AdminPermissions, type AdminRole } from '../../../../lib/admin-access';
import { requireAdminPermission } from '../../../../lib/admin-api-auth';
import { hashAdminPassword } from '../../../../lib/admin-auth-crypto';
import { getAdminPermissions } from '../../../../lib/cms-auth';
import { db } from '../../../../lib/db';
import { toAdminUserView } from '../../../../lib/admin-user-view';

export const runtime = 'nodejs';

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export async function GET(request: Request) {
  const access = await requireAdminPermission('access');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });

  const query = new URL(request.url).searchParams;
  const page = Math.max(1, Number.parseInt(query.get('page') || '1', 10) || 1);
  const pageSize = Math.min(50, Math.max(1, Number.parseInt(query.get('pageSize') || '10', 10) || 10));
  const search = (query.get('search') || '').trim().slice(0, 254);
  const role = query.get('role') || '';
  const status = query.get('status') || '';
  if (role && !ADMIN_ROLES.includes(role as AdminRole)) return Response.json({ error: 'Perfil de acesso inválido.' }, { status: 400 });
  if (status && !['ACTIVE', 'INACTIVE'].includes(status)) return Response.json({ error: 'Status inválido.' }, { status: 400 });

  const where: Prisma.AdminUserWhereInput = {};
  if (role) where.role = role;
  if (status) where.isActive = status === 'ACTIVE';
  if (search) where.OR = [{ name: { contains: search } }, { email: { contains: search } }];

  const [users, filteredCount, total, active, inactive] = await Promise.all([
    db.adminUser.findMany({ where, orderBy: [{ name: 'asc' }, { email: 'asc' }], skip: (page - 1) * pageSize, take: pageSize }),
    db.adminUser.count({ where }),
    db.adminUser.count(),
    db.adminUser.count({ where: { isActive: true } }),
    db.adminUser.count({ where: { isActive: false } }),
  ]);
  return Response.json({ users: users.map(toAdminUserView), stats: { total, active, inactive }, pagination: { page, pageSize, total: filteredCount, pages: Math.ceil(filteredCount / pageSize) } });
}

export async function POST(request: Request) {
  const access = await requireAdminPermission('access');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado.' }, { status: 503 });
  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  if (!body) return Response.json({ error: 'Dados de cadastro inválidos.' }, { status: 400 });

  const name = String(body.name || '').trim();
  const email = normalizeAdminEmail(String(body.email || ''));
  const password = String(body.password || '');
  const confirmPassword = String(body.confirmPassword || '');
  const role = String(body.role || 'CUSTOM');
  if (name.length < 2 || name.length > 160) return Response.json({ error: 'Informe o nome completo do usuário.' }, { status: 400 });
  if (!isValidAdminEmail(email)) return Response.json({ error: 'Informe um e-mail válido.' }, { status: 400 });
  if (!isSecurePassword(password)) return Response.json({ error: 'A senha deve ter exatamente 8 caracteres.' }, { status: 400 });
  if (password !== confirmPassword) return Response.json({ error: 'As senhas não coincidem.' }, { status: 400 });

  let permissions: AdminPermissions;
  try {
    permissions = resolveAdminPermissions(role, body.permissions);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Permissões inválidas.' }, { status: 400 });
  }
  if (!canGrantPermissions(getAdminPermissions(access.user), permissions)) return Response.json({ error: 'Você não pode conceder permissões acima do seu próprio acesso.' }, { status: 403 });

  try {
    const passwordHash = await hashAdminPassword(password);
    const created = await db.$transaction(async (transaction) => {
      const user = await transaction.adminUser.create({
        data: {
          name, email, passwordHash, role,
          canManagePosts: permissions.posts, canManageSettings: permissions.settings, canManageAccess: permissions.access,
        },
      });
      await transaction.adminAuditEvent.create({
        data: { actorId: access.user.id, targetId: user.id, action: 'ACCOUNT_CREATED', details: JSON.stringify({ name, email, role, permissions }) },
      });
      return user;
    });
    return Response.json({ user: toAdminUserView(created) }, { status: 201 });
  } catch (error) {
    if (isUniqueConstraint(error)) return Response.json({ error: 'Este e-mail já está cadastrado.' }, { status: 409 });
    return Response.json({ error: 'Não foi possível cadastrar o usuário.' }, { status: 500 });
  }
}
