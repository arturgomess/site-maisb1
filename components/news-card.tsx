import Link from 'next/link';
import type { NewsArticle } from '../lib/types';

const formatDate = (date: string) => {
  const value = new Date(date);
  const parts = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).formatToParts(value);
  const day = parts.find((part) => part.type === 'day')?.value || '';
  const month = parts.find((part) => part.type === 'month')?.value || '';
  const year = parts.find((part) => part.type === 'year')?.value || '';
  return `${day} de ${month} de ${year}`;
};

export function NewsCard({ article }: { article: NewsArticle }) {
  return (
    <article className="news-card">
      <Link href={`/noticias/${article.slug}`} className="news-card-thumb-wrap" aria-label={article.title}>
        {article.imageCardPath || article.imagePath ? <img className="news-card-thumb" src={article.imageCardPath || article.imagePath} alt="" width={600} height={400} loading="lazy" decoding="async" /> : null}
      </Link>
      <div className="news-card-body">
        <div className="news-card-meta"><span>{formatDate(article.publishedAt)}</span></div>
        <h3 className="news-card-title"><Link href={`/noticias/${article.slug}`}>{article.title}</Link></h3>
      </div>
    </article>
  );
}
