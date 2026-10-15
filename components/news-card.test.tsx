/** @vitest-environment jsdom */
import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewsCard } from './news-card';
import type { NewsArticle } from '../lib/types';

vi.mock('next/link', () => ({ default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => <a href={href} {...props}>{children}</a> }));

afterEach(cleanup);

const baseArticle: NewsArticle = {
  id: 'post-1', slug: 'materia', title: 'Matéria institucional', category: 'Institucional', publishedAt: '2026-10-08T12:00:00Z',
  excerpt: 'Resumo da matéria.', imagePath: '/uploads/cover.webp', imageCardPath: '/uploads/cover-card.webp', body: [],
};

describe('NewsCard image rendering', () => {
  it('uses the small WebP thumbnail with reserved dimensions and lazy loading', () => {
    const { container } = render(<NewsCard article={baseArticle} />);
    const image = container.querySelector('img');

    expect(image?.getAttribute('src')).toBe('/uploads/cover-card.webp');
    expect(image?.getAttribute('width')).toBe('600');
    expect(image?.getAttribute('height')).toBe('400');
    expect(image?.getAttribute('loading')).toBe('lazy');
  });

  it('falls back to the existing cover path for older articles without a thumbnail', () => {
    const { container } = render(<NewsCard article={{ ...baseArticle, imageCardPath: undefined }} />);

    expect(container.querySelector('img')?.getAttribute('src')).toBe('/uploads/cover.webp');
  });
});
