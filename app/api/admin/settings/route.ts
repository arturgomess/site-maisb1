import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '../../../../lib/admin-api-auth';
import { db } from '../../../../lib/db';
import { getSiteSettings } from '../../../../lib/content';

export const runtime = 'nodejs';

export async function GET() {
  const access = await requireAdminPermission('settings');
  if (access.response) return access.response;
  return Response.json({ settings: await getSiteSettings(), storage: db ? 'mysql' : 'unconfigured' });
}

export async function PATCH(request: Request) {
  const access = await requireAdminPermission('settings');
  if (access.response) return access.response;
  if (!db) return Response.json({ error: 'Banco de dados não configurado. Defina DATABASE_URL.' }, { status: 503 });
  const body = await request.json();
  const settings = {
    siteName: String(body.siteName || 'Grupo Mais Barato').trim().slice(0, 120),
    defaultTitle: String(body.defaultTitle || '').trim().slice(0, 70),
    defaultDescription: String(body.defaultDescription || '').trim().slice(0, 180),
    defaultKeywords: String(body.defaultKeywords || '').split(',').map((item: string) => item.trim()).filter(Boolean).slice(0, 12),
    canonicalUrl: String(body.canonicalUrl || '').trim().slice(0, 255) || null,
    ogImage: String(body.ogImage || '').trim().slice(0, 500) || null,
    robotsIndex: body.robotsIndex !== false,
  };
  if (!settings.defaultTitle || !settings.defaultDescription) return Response.json({ error: 'Título e descrição padrão são obrigatórios.' }, { status: 400 });
  try {
    const saved = await db.siteSettings.upsert({ where: { id: 1 }, update: settings, create: { id: 1, ...settings } });
    revalidatePath('/', 'layout');
    return Response.json({ settings: { ...settings, id: saved.id } });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao salvar configurações.' }, { status: 500 });
  }
}
