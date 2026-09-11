'use client';

import Link from 'next/link';
import { Badge, CalendarDays, Clock3, Copy, MessageCircle, UserRound, X } from 'lucide-react';
import { Fragment, useState } from 'react';
import type { NewsArticle } from '../lib/types';
import { NewsCard } from './news-card';

function ShareIcon({ type }: { type: 'whatsapp' | 'linkedin' | 'x' | 'copy' }) {
  if (type === 'whatsapp') return <MessageCircle size={17} />;
  if (type === 'linkedin') return <Badge size={17} />;
  if (type === 'x') return <X size={17} />;
  return <Copy size={17} />;
}

export function ArticleView({ article, related }: { article: NewsArticle; related: NewsArticle[] }) {
  const [copied, setCopied] = useState(false);
  const date = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(article.publishedAt));
  const share = (network: string) => {
    const url = window.location.href;
    const target = network === 'whatsapp'
      ? `https://wa.me/?text=${encodeURIComponent(`${article.title} ${url}`)}`
      : network === 'linkedin'
        ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`
        : `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(url)}`;
    window.open(target, '_blank', 'noopener,noreferrer');
  };

  return <>
    <main className="article-page-wrapper" id="wf-main-content">
      <section className="article-hero-section">
        <div className="article-container" id="article-content-container">
          <div className="article-breadcrumbs">
            <Link href="/">Início</Link>
            <span className="article-breadcrumbs-divider">/</span>
            <Link href="/noticias">Notícias</Link>
            <span className="article-breadcrumbs-divider">/</span>
            <span className="article-breadcrumbs-current">{article.category}</span>
          </div>
          <header className="article-header">
            <h1 className="article-main-title">{article.title}</h1>
            <p className="article-lead-excerpt">{article.excerpt}</p>
            <div className="article-meta-bar">
              <div className="article-meta-left">
                <span className="article-author-info"><UserRound size={14} /> {article.author || 'Grupo Mais Barato'}</span>
                <span>•</span>
                <span><CalendarDays size={14} /> {date}</span>
                <span>•</span>
                <span><Clock3 size={14} /> 1 min de leitura</span>
              </div>
            </div>
          </header>
          <figure className="article-cover-wrapper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="article-cover-img" src={article.imagePath || '/assets/Fotografias/Grupo Institucional +B/foto-grupo-b-em-fente-fachada_pessoas.webp'} alt={article.title} />
            <figcaption className="article-cover-caption">Fachada e equipe do Grupo Mais Barato</figcaption>
          </figure>
          <div className="article-content-body">
            {article.bodyHtml ? <div className="article-rich-html" dangerouslySetInnerHTML={{ __html: article.bodyHtml }} /> : article.body.map((paragraph, index) => {
              if (index === 2) {
                return <blockquote className="article-quote" key={`${article.slug}-body-${index}`}><p>{`“${paragraph}”`}</p></blockquote>;
              }
              if (index === 1) {
                return <Fragment key={`${article.slug}-body-${index}`}>
                  <h2 className="article-h2">Um ecossistema multissetorial completo</h2>
                  <p className="article-p">{paragraph}</p>
                </Fragment>;
              }
              return <p className="article-p" key={`${article.slug}-body-${index}`}>{paragraph}</p>;
            })}
          </div>
          {article.gallery?.length ? <section className="article-gallery" aria-labelledby="article-gallery-title">
            <h2 className="article-gallery-title" id="article-gallery-title">Galeria de fotos</h2>
            <div className="article-gallery-grid">
              {article.gallery.map((item, index) => <figure className="article-gallery-item" key={`${item.url}-${index}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={item.url} alt={item.alt || `${article.title} — foto ${index + 1}`} loading="lazy" />
                {item.caption ? <figcaption>{item.caption}</figcaption> : null}
              </figure>)}
            </div>
          </section> : null}
          <div className="article-share-section">
            <h3 className="article-share-title">Compartilhar matéria:</h3>
            <div className="article-share-buttons">
              <button type="button" className="btn-share btn-share-whatsapp" onClick={() => share('whatsapp')}><ShareIcon type="whatsapp" /> WhatsApp</button>
              <button type="button" className="btn-share btn-share-linkedin" onClick={() => share('linkedin')}><ShareIcon type="linkedin" /> LinkedIn</button>
              <button type="button" className="btn-share btn-share-twitter" onClick={() => share('x')}><ShareIcon type="x" /> X / Twitter</button>
              <button type="button" className="btn-share btn-share-copy" onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); setTimeout(() => setCopied(false), 1800); }}><ShareIcon type="copy" /> {copied ? 'Link copiado' : 'Copiar Link'}</button>
            </div>
          </div>
        </div>
      </section>
      <section className="article-related-section" id="article-related-section">
        <div className="container">
          <h2 className="article-related-title">Matérias Recomendadas</h2>
          <div className="news-cards-grid" id="article-related-cards-container">
            {related.map((item) => <NewsCard key={item.id} article={item} />)}
          </div>
        </div>
      </section>
    </main>
  </>;
}
