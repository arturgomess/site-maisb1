import { randomBytes, scryptSync } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const name = process.env.INITIAL_ADMIN_NAME?.trim() || '';
const email = process.env.INITIAL_ADMIN_EMAIL?.trim().toLowerCase() || '';
const password = process.env.INITIAL_ADMIN_PASSWORD || '';
const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;

if (name.length < 2 || name.length > 160 || !validEmail || password.length !== 8) {
  console.error('Defina INITIAL_ADMIN_NAME, INITIAL_ADMIN_EMAIL e INITIAL_ADMIN_PASSWORD válidos no ambiente do comando. A senha deve ter exatamente 8 caracteres.');
  process.exit(1);
}

const salt = randomBytes(16);
const derivedKey = scryptSync(password, salt, 64, { N: 16_384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 });
const passwordHash = `scrypt$16384$8$1$${salt.toString('base64url')}$${derivedKey.toString('base64url')}`;
const prisma = new PrismaClient();

try {
  await prisma.$transaction(async (transaction) => {
    await transaction.$executeRaw`INSERT IGNORE INTO admin_bootstrap (id, usedAt) VALUES (1, NULL)`;
    const rows = await transaction.$queryRaw`SELECT id, usedAt FROM admin_bootstrap WHERE id = 1 FOR UPDATE`;
    if (!rows[0] || rows[0].usedAt || await transaction.adminUser.count() > 0) {
      throw new Error('INITIAL_ADMIN_ALREADY_CONFIGURED');
    }

    const permissions = { posts: true, settings: true, access: true };
    const admin = await transaction.adminUser.create({
      data: {
        name,
        email,
        passwordHash,
        role: 'ADMINISTRATOR',
        canManagePosts: permissions.posts,
        canManageSettings: permissions.settings,
        canManageAccess: permissions.access,
      },
    });
    const now = new Date();
    await transaction.adminBootstrap.update({ where: { id: 1 }, data: { usedAt: now } });
    await transaction.adminAuditEvent.create({
      data: {
        actorId: admin.id,
        targetId: admin.id,
        action: 'ACCOUNT_BOOTSTRAPPED',
        details: JSON.stringify({ role: admin.role, permissions }),
      },
    });
  }, { isolationLevel: 'Serializable' });

  console.log('Administrador inicial provisionado. Entre em /admin/login com o e-mail e a senha definidos para este comando.');
} catch (error) {
  if (error instanceof Error && error.message === 'INITIAL_ADMIN_ALREADY_CONFIGURED') {
    console.error('O provisionamento inicial já foi concluído ou já existem usuários. Nenhum dado foi alterado.');
  } else {
    console.error('Não foi possível provisionar o administrador. Confirme que as migrations estão aplicadas e que o banco está disponível.');
  }
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
