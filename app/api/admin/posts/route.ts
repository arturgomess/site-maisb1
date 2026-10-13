import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '../../../../lib/admin-api-auth';
import { cmsAvailable, createCmsPost, listCmsPosts } from '../../../../lib/cms';

export const runtime = 'nodejs';

export async function GET() {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  try {
    return Response.json({ posts: await listCmsPosts(), storage: cmsAvailable() ? 'mysql' : 'unconfigured' });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao carregar posts.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  try {
    const post = await createCmsPost(await request.json());
    revalidatePath('/noticias');
    revalidatePath('/');
    return Response.json({ post }, { status: 201 });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao criar post.' }, { status: 400 });
  }
}
