import { describe, expect, it } from 'vitest';
import { normalizeArticle } from './content';

describe('normalizeArticle', () => {
  it('exposes a generated card thumbnail and keeps legacy image paths when no thumbnail exists', () => {
    const common = {
      id: 'post-1', slug: 'materia', title: 'Matéria', category: 'Institucional', publishedAt: new Date('2026-10-08T12:00:00Z'),
      excerpt: 'Resumo da matéria.', author: 'Grupo +B', bodyHtml: '<p>Texto</p>', status: 'published', seoTitle: null,
      seoDescription: null, imagePath: '/uploads/cover.webp', imageAlt: null, imageCaption: null, galleryJson: null, noIndex: false,
    };

    expect(normalizeArticle({ ...common, imageCardPath: '/uploads/cover-card.webp' })).toMatchObject({
      imagePath: '/uploads/cover.webp',
      imageCardPath: '/uploads/cover-card.webp',
    });
    expect(normalizeArticle({ ...common, imageCardPath: null })).toMatchObject({
      imagePath: '/uploads/cover.webp',
      imageCardPath: undefined,
    });
  });

  it('retains dimensions and lazy loading on sanitized article body images', () => {
    const article = normalizeArticle({
      id: 'post-2', slug: 'materia', title: 'Matéria', category: 'Institucional', publishedAt: new Date('2026-10-08T12:00:00Z'),
      excerpt: 'Resumo da matéria.', author: 'Grupo +B', bodyHtml: '<img src="/uploads/body.webp" width="1200" height="600">',
      status: 'published', seoTitle: null, seoDescription: null, imagePath: null, imageCardPath: null, imageAlt: null,
      imageCaption: null, galleryJson: null, noIndex: false,
    });

    expect(article.bodyHtml).toContain('width="1200"');
    expect(article.bodyHtml).toContain('height="600"');
    expect(article.bodyHtml).toContain('loading="lazy"');
    expect(article.bodyHtml).toContain('decoding="async"');
  });

  it('keeps gallery dimensions when normalizing saved JSON', () => {
    const article = normalizeArticle({
      id: 'post-3', slug: 'materia', title: 'Matéria', category: 'Institucional', publishedAt: new Date('2026-10-08T12:00:00Z'),
      excerpt: 'Resumo da matéria.', author: 'Grupo +B', bodyHtml: '<p>Texto</p>', status: 'published', seoTitle: null,
      seoDescription: null, imagePath: null, imageCardPath: null, imageAlt: null, imageCaption: null,
      galleryJson: '[{"url":"/uploads/gallery.webp","width":1200,"height":800}]', noIndex: false,
    });

    expect(article.gallery).toEqual([{ url: '/uploads/gallery.webp', width: 1200, height: 800, alt: '', caption: '' }]);
  });
});
