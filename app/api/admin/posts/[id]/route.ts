import { revalidatePath } from 'next/cache';
import { requireAdminPermission } from '../../../../../lib/admin-api-auth';
import { deleteCmsPost, getCmsPost, updateCmsPost } from '../../../../../lib/cms';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  const { id } = await context.params;
  const post = await getCmsPost(id);
  return post ? Response.json({ post }) : Response.json({ error: 'Post não encontrado.' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    const post = await updateCmsPost(id, await request.json());
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${post.slug}`);
    revalidatePath('/');
    return Response.json({ post });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar post.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const access = await requireAdminPermission('posts');
  if (access.response) return access.response;
  const { id } = await context.params;
  try {
    await deleteCmsPost(id);
    revalidatePath('/noticias');
    revalidatePath('/');
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao excluir post.' }, { status: 400 });
  }
}

