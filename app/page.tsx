import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { AboutSection, BrandsSection, HomeHero, OpportunitiesSection, FaqSectionExport } from '../components/home-sections';
import { NewsCard } from '../components/news-card';
import { getArticles } from '../lib/content';

export default async function HomePage() {
  const articles = (await getArticles()).slice(0, 3);

  return (
    <>
      <HomeHero />
      <AboutSection />
      <BrandsSection />
      <OpportunitiesSection />
      <section className="section section-light news-home-section reveal" id="noticias">
        <div className="container">
          <div className="news-home-header">
            <div className="news-header-left">
              <span className="eyebrow-gold">NOTÍCIAS & NOVIDADES</span>
              <h2 className="news-home-title">
                Fique por dentro das <span className="headline-highlight-italic">nossas novidades</span>
              </h2>
            </div>
            <div className="news-header-right">
              <Link href="/noticias" className="btn-news-all">
                VER TODAS AS NOTÍCIAS <ArrowRight size={16} aria-hidden="true" />
              </Link>
            </div>
          </div>
          <div className="news-cards-grid" id="news-home-cards-container">
            {articles.map((article) => (
              <NewsCard key={article.id} article={article} />
            ))}
          </div>
          <div className="news-bottom-actions">
            <Link href="/noticias" className="btn-news-all">
              VER TODAS AS NOTÍCIAS <ArrowRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>
      <FaqSectionExport />
    </>
  );
}

