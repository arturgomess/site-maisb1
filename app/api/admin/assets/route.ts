import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { requireAdminPermission } from '../../../../lib/admin-api-auth';

export const runtime = 'nodejs';

const allowedTypes: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export async function POST(request: Request) {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) return Response.json({ error: 'Envie um arquivo de imagem.' }, { status: 400 });
  const extension = allowedTypes[file.type];
  if (!extension || file.size > 8 * 1024 * 1024) return Response.json({ error: 'A imagem deve ser JPG, PNG ou WebP e ter até 8 MB.' }, { status: 400 });

  const fileName = `${randomUUID()}.${extension}`;
  const uploadDirectory = path.join(process.cwd(), 'public', 'uploads');
  await mkdir(uploadDirectory, { recursive: true });
  await writeFile(path.join(uploadDirectory, fileName), Buffer.from(await file.arrayBuffer()));
  return Response.json({ asset: { id: fileName, url: `/uploads/${fileName}` } }, { status: 201 });
}
