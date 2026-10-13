/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ArticleView } from './article-view';
import type { NewsArticle } from '../lib/types';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

afterEach(cleanup);

const article: NewsArticle = {
  id: 'post-1', slug: 'materia', title: 'Matéria institucional', category: 'Institucional', publishedAt: '2026-10-08T12:00:00Z',
  excerpt: 'Resumo da matéria.', imagePath: '/uploads/cover.webp', imageCardPath: '/uploads/cover-card.webp', body: [],
  bodyHtml: '<p>Texto <img src="/uploads/body.webp" width="1000" height="500" loading="lazy" decoding="async"></p>',
  gallery: [{ url: '/uploads/gallery.webp', width: 1200, height: 800, alt: 'Equipe', caption: 'Legenda' }],
};

describe('ArticleView image rendering', () => {
  it('reserves the hero dimensions and keeps the cover eager for the first viewport', () => {
    const { container } = render(<ArticleView article={article} related={[]} shareUrl="http://localhost/noticias/materia" />);
    const cover = container.querySelector('.article-cover-img');

    expect(cover?.getAttribute('src')).toBe('/uploads/cover.webp');
    expect(cover?.getAttribute('width')).toBe('1920');
    expect(cover?.getAttribute('height')).toBe('1080');
    expect(cover?.getAttribute('loading')).toBe('eager');
  });

  it('reserves gallery dimensions and lazy loads gallery and body images', () => {
    const { container } = render(<ArticleView article={article} related={[]} shareUrl="http://localhost/noticias/materia" />);
    const gallery = container.querySelector('.article-gallery-item img');
    const body = container.querySelector('.article-rich-html img');

    expect(gallery?.getAttribute('width')).toBe('1200');
    expect(gallery?.getAttribute('height')).toBe('800');
    expect(gallery?.getAttribute('loading')).toBe('lazy');
    expect(body?.getAttribute('loading')).toBe('lazy');
  });
});
