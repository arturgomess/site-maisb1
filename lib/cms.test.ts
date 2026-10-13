import { describe, expect, it, vi } from 'vitest';

const { createPostMock } = vi.hoisted(() => ({ createPostMock: vi.fn() }));
vi.mock('./db', () => ({ db: { post: { create: createPostMock } } }));
import { cleanHtml, createCmsPost } from './cms';

describe('CMS article HTML', () => {
  it('retains image dimensions while setting lazy loading and removing unsafe handlers', () => {
    const html = cleanHtml('<p><img src="/uploads/photo.webp" width="900" height="450" onerror="alert(1)"></p>');

    expect(html).toContain('src="/uploads/photo.webp"');
    expect(html).toContain('width="900"');
    expect(html).toContain('height="450"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).not.toContain('onerror');
  });

  it('persists the generated card thumbnail path on the CMS post', async () => {
    const publishedAt = new Date('2026-10-08T12:00:00Z');
    createPostMock.mockResolvedValue({
      id: 'post-1', title: 'Matéria institucional', slug: 'materia-institucional', category: 'Institucional', publishedAt,
      excerpt: 'Resumo com mais de vinte caracteres.', author: 'Grupo +B', bodyHtml: '<p>Conteúdo</p>', status: 'published',
      seoTitle: 'Matéria institucional', seoDescription: 'Resumo com mais de vinte caracteres.', imagePath: '/uploads/cover.webp',
      imageCardPath: '/uploads/cover-card.webp', imageAlt: 'Capa', imageCaption: '', galleryJson: '[]', noIndex: false,
    });

    await createCmsPost({
      title: 'Matéria institucional', slug: 'materia-institucional', category: 'Institucional', publishedAt: publishedAt.toISOString(),
      excerpt: 'Resumo com mais de vinte caracteres.', author: 'Grupo +B', bodyHtml: '<p>Conteúdo</p>', status: 'published',
      seoTitle: 'Matéria institucional', seoDescription: 'Resumo com mais de vinte caracteres.', imagePath: '/uploads/cover.webp',
      imageCardPath: '/uploads/cover-card.webp', imageAlt: 'Capa', imageCaption: '', gallery: [], noIndex: false,
    });

    expect(createPostMock.mock.calls[0][0].data.imageCardPath).toBe('/uploads/cover-card.webp');
  });
});
