import sanitizeHtml from 'sanitize-html';
import { db } from './db';
import type { GalleryImage, NewsArticle, SiteSettings } from './types';

const fallbackArticles: NewsArticle[] = [
  { id: 'fallback-grupo-mais-barato', slug: 'grupo-mais-barato-celebra-10-anos-expansao-varejo-paraense', title: 'Grupo Mais Barato celebra 10 anos de expansão e inovação no varejo paraense', category: 'Institucional', publishedAt: '2026-08-20T12:00:00-03:00', excerpt: 'Com mais de 10 mil metros quadrados de área operacional e 5 marcas consolidadas, o Grupo reafirma seu compromisso com Belém e com a geração de oportunidades.', imagePath: '/assets/Fotografias/Grupo Institucional +B/foto-grupo-b-em-fente-fachada_pessoas.webp', author: 'Assessoria de Comunicação Grupo +B', body: ['Desde a sua fundação em 2015, o Grupo Mais Barato tem sido sinônimo de pioneirismo, respeito às pessoas e compromisso inegociável com a qualidade. O que começou como uma visão de transformar o varejo local hoje se consolida como um dos ecossistemas de marcas mais integrados da Região Norte.', 'Hoje, o ecossistema abrange os Supermercados +B, a rede de farmácias +B Farma, os espaços de conveniência e lazer Villa Plaza e Villa Plaza Park, além da boutique refinada The Wine Experience. Essa sinergia permite atender os clientes em todas as suas necessidades diárias com máxima excelência.', 'Mais do que crescer, nosso propósito sempre foi transformar relações e construir um futuro sustentável para as comunidades onde estamos inseridos.', 'Os próximos anos trarão investimentos contínuos em tecnologia, infraestrutura logística e capacitação de colaboradores, mantendo Belém no centro do nosso coração e dos nossos negócios.'] },
  { id: 'fallback-wine-experience', slug: 'the-wine-experience-apresenta-selecao-exclusiva-de-rotulos', title: 'The Wine Experience apresenta seleção exclusiva de rótulos internacionais para o segundo semestre', category: 'The Wine Experience', publishedAt: '2026-08-15T12:00:00-03:00', excerpt: 'Adega premium traz safras consagradas de vinícolas do Chile, Argentina, França e Itália com atendimento especializado.', imagePath: '/assets/Fotografias/The Wine Experience/salao-principal-clientes.webp', body: ['A The Wine Experience amplia a curadoria de rótulos e experiências para quem aprecia bons vinhos.'] },
  { id: 'fallback-supermercados', slug: 'mais-b-supermercados-expande-setor-de-carnes-nobres', title: '+B Supermercados expande setor de carnes nobres e hortifrúti selecionado na unidade Alcindo Cacela', category: '+B Supermercados', publishedAt: '2026-08-10T12:00:00-03:00', excerpt: 'Novos balcões climatizados, cortes especiais com padrão gourmet e hortifrúti abastecido diariamente.', imagePath: '/assets/Fotografias/Supermercado +B/00_CardHome/4-supemercado.webp', body: ['A expansão reforça o compromisso com qualidade, variedade e proximidade.'] },
  { id: 'fallback-farma', slug: 'mais-b-farma-inaugura-programa-atencao-farmaceutica', title: '+B Farma inaugura programa de atenção farmacêutica com aferições e orientações gratuitas', category: '+B Farma', publishedAt: '2026-08-01T12:00:00-03:00', excerpt: 'Iniciativa reforça o cuidado integral com a saúde e o bem-estar da família paraense com farmacêuticos presentes em tempo integral.', imagePath: '/assets/Fotografias/Mais B Farma/foto-farma-b (1).webp', body: ['A iniciativa reforça o cuidado integral com a saúde e o bem-estar das famílias paraenses.'] },
  { id: 'fallback-park', slug: 'villa-plaza-park-anuncia-programacao-cultural-lazer-gastronomia', title: 'Villa Plaza Park anuncia programação cultural de lazer e gastronomia para os finais de semana', category: 'Villa Plaza', publishedAt: '2026-07-28T12:00:00-03:00', excerpt: 'Música ao vivo, espaço kids seguro, food park e ambientes instagramáveis fazem do complexo o ponto de encontro favorito na região.', imagePath: '/assets/Fotografias/Villa Plaza (Park Infantil)/villa-plaza-park-tapana.webp', body: ['O Villa Plaza Park reúne diversão, gastronomia e experiências para toda a família.'] },
];

const fallbackSettings: SiteSettings = { siteName: 'Grupo Mais Barato', defaultTitle: 'Grupo Mais Barato | Varejo, cuidado e experiências', defaultDescription: 'O Grupo Mais Barato reúne negócios que fazem parte do dia a dia das pessoas de Belém-PA.', defaultKeywords: ['Grupo Mais Barato', 'Grupo +B', 'Belém', 'varejo paraense'], robotsIndex: true };

const articleSelect = { id: true, slug: true, title: true, category: true, publishedAt: true, excerpt: true, author: true, bodyHtml: true, status: true, seoTitle: true, seoDescription: true, imagePath: true, imageAlt: true, imageCaption: true, galleryJson: true, noIndex: true } as const;

const normalizeHtmlSpaces = (html: string) => html.replace(/&nbsp;/gi, ' ').replace(/\u00a0/g, ' ');

function normalizeArticle(article: { id: string; slug: string; title: string; category: string; publishedAt: Date; excerpt: string; author: string; bodyHtml: string; status: string; seoTitle: string | null; seoDescription: string | null; imagePath: string | null; imageAlt: string | null; imageCaption: string | null; galleryJson: string | null; noIndex: boolean }): NewsArticle {
  let gallery: GalleryImage[] = [];
  try {
    const parsed = article.galleryJson ? JSON.parse(article.galleryJson) : [];
    gallery = Array.isArray(parsed) ? parsed.slice(0, 12).flatMap((item: unknown) => {
      if (!item || typeof item !== 'object' || typeof (item as { url?: unknown }).url !== 'string') return [];
      const candidate = item as { url: string; alt?: unknown; caption?: unknown };
      if (!/^\/(?:uploads|assets)\//.test(candidate.url) && !/^https?:\/\//i.test(candidate.url)) return [];
      return [{ url: candidate.url, alt: typeof candidate.alt === 'string' ? candidate.alt : '', caption: typeof candidate.caption === 'string' ? candidate.caption : '' }];
    }) : [];
  } catch { gallery = []; }
  return { id: article.id, slug: article.slug, title: article.title, category: article.category, publishedAt: article.publishedAt.toISOString(), excerpt: article.excerpt, imagePath: article.imagePath || undefined, author: article.author, imageAlt: article.imageAlt || undefined, imageCaption: article.imageCaption || undefined, gallery, body: [], bodyHtml: normalizeHtmlSpaces(sanitizeHtml(normalizeHtmlSpaces(article.bodyHtml), { allowedTags: sanitizeHtml.defaults.allowedTags.concat(['h1', 'h2', 'h3', 'u', 'img']), allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, a: ['href', 'target', 'rel'], img: ['src', 'alt', 'width', 'height'] } })), status: article.status === 'draft' ? 'draft' : 'published', seoTitle: article.seoTitle || undefined, seoDescription: article.seoDescription || undefined, noIndex: article.noIndex };
}

export async function getArticles(): Promise<NewsArticle[]> {
  if (!db) return fallbackArticles;
  try {
    const articles = await db.post.findMany({ where: { status: 'published', publishedAt: { lte: new Date() } }, orderBy: { publishedAt: 'desc' }, select: articleSelect });
    return articles.length ? articles.map(normalizeArticle) : fallbackArticles;
  } catch (error) {
    console.error('Database news query failed; using fallback content.', error);
    return fallbackArticles;
  }
}

export async function getArticleBySlug(slug: string): Promise<NewsArticle | null> {
  const articles = await getArticles();
  return articles.find((article) => article.slug === slug) || null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
  if (!db) return fallbackSettings;
  try {
    const settings = await db.siteSettings.findUnique({ where: { id: 1 }, select: { siteName: true, defaultTitle: true, defaultDescription: true, defaultKeywords: true, canonicalUrl: true, ogImage: true, robotsIndex: true } });
    if (!settings) return fallbackSettings;
    let keywords = fallbackSettings.defaultKeywords;
    if (Array.isArray(settings.defaultKeywords)) {
      keywords = settings.defaultKeywords.filter((item): item is string => typeof item === 'string');
    } else if (typeof settings.defaultKeywords === 'string') {
      try {
        const parsed = JSON.parse(settings.defaultKeywords);
        if (Array.isArray(parsed)) keywords = parsed.filter((item): item is string => typeof item === 'string');
      } catch {}
    }
    return { siteName: settings.siteName, defaultTitle: settings.defaultTitle, defaultDescription: settings.defaultDescription, defaultKeywords: keywords, canonicalUrl: settings.canonicalUrl || undefined, ogImage: settings.ogImage || undefined, robotsIndex: settings.robotsIndex };
  } catch {
    return fallbackSettings;
  }
}
