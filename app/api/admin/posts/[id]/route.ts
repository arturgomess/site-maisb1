import { revalidatePath } from 'next/cache';
import { isAdminAuthenticated } from '../../../../../lib/cms-auth';
import { deleteCmsPost, getCmsPost, updateCmsPost, updateCmsPostStatus } from '../../../../../lib/cms';

export const runtime = 'nodejs';

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { id } = await context.params;
  const post = await getCmsPost(id);
  return post ? Response.json({ post }) : Response.json({ error: 'Post não encontrado.' }, { status: 404 });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
  const { id } = await context.params;
  try {
    const body = await request.json();
    if (body && Object.keys(body).length === 1 && Object.hasOwn(body, 'status')) {
      if (body.status !== 'draft' && body.status !== 'published') {
        return Response.json({ error: 'Status de publicação inválido.' }, { status: 400 });
      }
      const post = await updateCmsPostStatus(id, body.status);
      if (!post) return Response.json({ error: 'Post não encontrado.' }, { status: 404 });
      revalidatePath('/noticias');
      revalidatePath(`/noticias/${post.slug}`);
      revalidatePath('/');
      return Response.json({ post });
    }

    const post = await updateCmsPost(id, body);
    revalidatePath('/noticias');
    revalidatePath(`/noticias/${post.slug}`);
    revalidatePath('/');
    return Response.json({ post });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Falha ao atualizar post.' }, { status: 400 });
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) return Response.json({ error: 'Não autenticado.' }, { status: 401 });
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

