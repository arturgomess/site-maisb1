import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { getArticleBySlug, getArticles, getSiteSettings } from '../../../lib/content';
import type { SiteSettings } from '../../../lib/types';
import { ArticleView } from '../../../components/article-view';

type ArticlePageProps = { params: Promise<{ slug: string }> };

async function getPublicSiteOrigin(settings: SiteSettings) {
  const configuredUrl = settings.canonicalUrl || process.env.NEXT_PUBLIC_SITE_URL;
  if (configuredUrl) {
    try {
      const configuredOrigin = new URL(configuredUrl).origin;
      const hostname = new URL(configuredOrigin).hostname;
      if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '::1') return configuredOrigin;
    } catch {
      // Fall through to the origin of the current request when configuration is missing or local.
    }
  }

  const requestHeaders = await headers();
  const host = (requestHeaders.get('x-forwarded-host') || requestHeaders.get('host') || '').split(',')[0].trim();
  const forwardedProtocol = (requestHeaders.get('x-forwarded-proto') || '').split(',')[0].trim().toLowerCase();
  const protocol = forwardedProtocol === 'https' || forwardedProtocol === 'http'
    ? forwardedProtocol
    : /^(localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/i.test(host) ? 'http' : 'https';
  if (host) {
    try {
      return new URL(`${protocol}://${host}`).origin;
    } catch {
      // Fall back to the configured URL if the request does not include a valid host.
    }
  }

  return new URL(configuredUrl || 'http://localhost:3000').origin;
}

export async function generateStaticParams() {
  const articles = await getArticles();
  return articles.map((article) => ({ slug: article.slug }));
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: 'Notícia não encontrada' };
  const settings = await getSiteSettings();
  const siteOrigin = await getPublicSiteOrigin(settings);
  const canonicalUrl = new URL(`/noticias/${encodeURIComponent(article.slug)}`, siteOrigin).toString();
  const socialImage = article.imagePath || settings.ogImage;
  const socialImageUrl = socialImage ? new URL(socialImage, siteOrigin).toString() : undefined;
  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt;
  return {
    metadataBase: new URL(siteOrigin),
    title,
    description,
    robots: article.noIndex ? { index: false, follow: false } : undefined,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      type: 'article',
      url: canonicalUrl,
      publishedTime: article.publishedAt,
      images: socialImageUrl ? [{ url: socialImageUrl, alt: article.imageAlt || article.title }] : undefined,
    },
    twitter: {
      card: socialImageUrl ? 'summary_large_image' : 'summary',
      title,
      description,
      images: socialImageUrl ? [socialImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) notFound();

  const settings = await getSiteSettings();
  const siteOrigin = await getPublicSiteOrigin(settings);
  const shareUrl = new URL(`/noticias/${encodeURIComponent(article.slug)}`, siteOrigin).toString();
  const related = (await getArticles()).filter((item) => item.slug !== article.slug).slice(0, 3);
  return <ArticleView article={article} related={related} shareUrl={shareUrl} />;
}
