import { ArrowRight } from 'lucide-react';

export function OpportunitiesSection() {
  return (
    <section className="section section-light trabalhe-conosco-gold-section section-full-width reveal" id="oportunidades">
      <div className="container trabalhe-container">
        {/* Bloco de imagem mobile que vem antes do container de textos */}
        <div className="trabalhe-mobile-media">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/Paginas (Imagens)/Home/trabalhe-mobile-real.webp"
            alt="Equipe Grupo Mais Barato"
            className="trabalhe-mobile-img"
            loading="lazy"
          />
        </div>

        <div className="trabalhe-card-banner">
          <div className="trabalhe-card-content">
            <span className="eyebrow-gold">OPORTUNIDADES</span>
            <h2 className="trabalhe-card-headline">
              Construa sua história com a do{' '}
              <span className="headline-highlight-italic">GMB</span>
            </h2>
            <div className="trabalhe-gold-accent-line" />
            <p className="trabalhe-card-description">
              Venha fazer parte de um time que cresce junto e transforma o dia a dia de milhares de pessoas
            </p>
            <div className="trabalhe-card-actions">
              <a
                href="https://grupomaisbarato.portaldetalentos.senior.com.br/"
                target="_blank"
                rel="noopener"
                className="btn-trabalhe-card"
              >
                QUERO ME CANDIDATAR <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
