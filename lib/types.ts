export type GalleryImage = {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
};

export type NewsArticle = {
  id: string;
  slug: string;
  title: string;
  category: string;
  publishedAt: string;
  excerpt: string;
  imagePath?: string;
  imageCardPath?: string;
  imageAlt?: string;
  imageCaption?: string;
  gallery?: GalleryImage[];
  author?: string;
  body: string[];
  bodyHtml?: string;
  status?: 'draft' | 'published';
  seoTitle?: string;
  seoDescription?: string;
  noIndex?: boolean;
};

export type SiteSettings = {
  siteName: string;
  defaultTitle: string;
  defaultDescription: string;
  defaultKeywords: string[];
  canonicalUrl?: string;
  ogImage?: string;
  robotsIndex?: boolean;
};
