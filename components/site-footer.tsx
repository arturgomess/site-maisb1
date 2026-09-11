'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  Search,
  X,
} from 'lucide-react';
import { StoreUnit, storeUnits } from '../lib/locations';

const asset = (path: string) => `/assets/${path}`;

function InstagramBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function FacebookBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </svg>
  );
}

function LinkedinBrandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect x="2" y="9" width="4" height="12" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

type BrandLocatorSelection = {
  brandId: string;
};

function unitMatchesBrand(unit: StoreUnit, brandId: string) {
  if (brandId === 'super') return unit.category === '+B Supermercados';
  const brandLabels: Record<string, string> = {
    farma: '+B FARMA',
    wine: 'THE WINE EXPERIENCE',
    plaza: 'VILLA PLAZA',
    park: 'VILLA PLAZA PARK',
  };
  return brandLabels[brandId] ? unit.subbrands.includes(brandLabels[brandId]) : false;
}

// Cálculo do status da loja em tempo real
function getStoreStatus(unit: StoreUnit) {
  const now = new Date();
  const day = now.getDay();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const todaySched = unit.schedule[day];
  const [openH, openM] = todaySched.open.split(':').map(Number);
  const [closeH, closeM] = todaySched.close.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;

  let isOpen = false;
  let statusText = '';

  if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
    isOpen = true;
    statusText = `Aberto · Fecha ${todaySched.close}`;
  } else if (currentMinutes < openMinutes) {
    isOpen = false;
    statusText = `Fechado · Abre hoje às ${todaySched.open}`;
  } else {
    const nextDay = (day + 1) % 7;
    const tomorrowSched = unit.schedule[nextDay];
    isOpen = false;
    statusText = `Fechado · Abre amanhã às ${tomorrowSched.open}`;
  }

  return { isOpen, statusText, day };
}

// Ordem dos dias no painel de horários: Segunda a Domingo
const daysOrder = [1, 2, 3, 4, 5, 6, 0];

export function SiteFooter() {
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<string | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [openHours, setOpenHours] = useState<Record<string, boolean>>({});
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lightboxTriggerRef = useRef<HTMLElement | null>(null);

  const visibleUnits = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return storeUnits.filter((unit) => {
      const matchesBrand = !brandFilter || unitMatchesBrand(unit, brandFilter);
      const matchesQuery =
        !normalized ||
        `${unit.name} ${unit.address} ${unit.subbrands.join(' ')}`.toLowerCase().includes(normalized);
      return matchesBrand && matchesQuery;
    });
  }, [brandFilter, query]);

  const selectedUnit = selectedUnitId
    ? storeUnits.find((u) => u.id === selectedUnitId) || null
    : null;

  const mapSrc = selectedUnit
    ? `https://www.google.com/maps?q=${encodeURIComponent(
        `${selectedUnit.name} ${selectedUnit.address}, Belém - PA`
      )}&output=embed`
    : 'https://www.google.com/maps?q=Supermercados+Mais+B+Bel%C3%A9m+PA&output=embed';

  const handleSelectUnit = (unitId: string) => {
    setSelectedUnitId((prev) => (prev === unitId ? null : unitId));
    const cardEl = document.getElementById(`footer-card-${unitId}`);
    if (cardEl) {
      cardEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  };

  const toggleHours = (unitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setOpenHours((prev) => ({
      ...prev,
      [unitId]: !prev[unitId],
    }));
  };

  const onFooterMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
  };

  useEffect(() => {
    const onBrandLocatorSelect = (event: Event) => {
      const brandId = (event as CustomEvent<BrandLocatorSelection>).detail?.brandId;
      if (!brandId) return;

      const matchingUnits = storeUnits.filter((unit) => unitMatchesBrand(unit, brandId));
      setBrandFilter(brandId);
      setQuery('');
      if (matchingUnits.length > 0) {
        setSelectedUnitId(matchingUnits[0].id);
      }
      window.requestAnimationFrame(() => {
        document.getElementById('store-locator-teaser')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    };

    const onLocatorHashChange = () => {
      if (window.location.hash === '#store-locator-teaser') {
        setBrandFilter(null);
        setSelectedUnitId(null);
      }
    };

    window.addEventListener('store-locator-brand-select', onBrandLocatorSelect);
    window.addEventListener('hashchange', onLocatorHashChange);
    return () => {
      window.removeEventListener('store-locator-brand-select', onBrandLocatorSelect);
      window.removeEventListener('hashchange', onLocatorHashChange);
    };
  }, []);

  useEffect(() => {
    if (lightboxIndex === null) return;
    lightboxCloseRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLightboxIndex(null);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [lightboxIndex]);

  const closeLightbox = () => {
    setLightboxIndex(null);
    window.setTimeout(() => lightboxTriggerRef.current?.focus(), 0);
  };

  return (
    <footer className="footer footer-gold" id="contato" onMouseMove={onFooterMouseMove}>
      {/* SEÇÃO PRINCIPAL DE UNIDADES (MAPA) */}
      <section className="s-unidades" id="store-locator-teaser">
        <div className="vmap-container">
          <div className="unid-header">
            <span className="eyebrow-gold">NOSSAS UNIDADES</span>
            <h2 className="locator-gold-title">
              Encontre <span className="headline-highlight-italic">nossas unidades</span>
            </h2>
            <p className="locator-gold-desc">Lojas, serviços e experiências mais perto de você.</p>
          </div>

          <div className="unid-layout">
            {/* SIDEBAR: BUSCA + LISTA DE CARDS */}
            <div className="unid-sidebar">
              <div className="search-box">
                <input
                  type="text"
                  id="teaser-search-input"
                  placeholder="Buscar unidade ou endereço"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  aria-label="Buscar unidade ou endereço"
                  autoComplete="off"
                />
                <Search size={16} className="search-icon" aria-hidden="true" />
              </div>

              <div className="units-list" id="teaser-stores-list-container">
                {visibleUnits.length === 0 ? (
                  <div style={{ padding: '20px 10px', color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>
                    <p>Nenhuma unidade encontrada.</p>
                    <button
                      type="button"
                      onClick={() => { setQuery(''); setBrandFilter(null); }}
                      style={{ marginTop: '8px', color: 'var(--gold)', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', fontSize: '0.8rem', padding: 0 }}
                    >
                      Limpar busca
                    </button>
                  </div>
                ) : (
                  visibleUnits.map((unit) => {
                    const status = getStoreStatus(unit);
                    const isActive = selectedUnitId === unit.id;
                    const isOpenDropdown = !!openHours[unit.id];

                    return (
                      <div
                        key={unit.id}
                        className={`unit-card ${isActive ? 'active' : ''}`}
                        id={`footer-card-${unit.id}`}
                        onClick={() => handleSelectUnit(unit.id)}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectUnit(unit.id);
                          }
                        }}
                      >
                        <div
                          className="unit-card-thumb"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectUnit(unit.id);
                            lightboxTriggerRef.current = e.currentTarget.closest('.unit-card') as HTMLElement | null;
                            setLightboxIndex(storeUnits.findIndex((item) => item.id === unit.id));
                          }}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={asset(unit.image)}
                            alt={unit.name}
                            onError={(e) => {
                              const t = e.target as HTMLImageElement;
                              if (t.src !== unit.thumbOnline) t.src = unit.thumbOnline;
                            }}
                          />
                        </div>

                        <div className="unit-card-info">
                          <div className="unit-card-title">
                            <h3>{unit.name}</h3>
                            <span className="unit-rating" title={`${unit.reviewsCount} avaliações no Google`}>
                              ★ {unit.rating}{' '}
                              <span className="unit-reviews-count">({unit.reviewsCount})</span>
                            </span>
                          </div>

                          <div className="unit-tags">{unit.subbrands.join(' | ')}</div>

                          <p className="unit-address">
                            <MapPin size={13} aria-hidden="true" /> {unit.address}
                          </p>

                          {/* DROP DOWN DE HORÁRIOS */}
                          <div className={`unit-hours ${isOpenDropdown ? 'is-open' : ''}`} id={`footer-hours-dropdown-${unit.id}`}>
                            <div
                              className="unit-hours-trigger"
                              onClick={(e) => toggleHours(unit.id, e)}
                            >
                              <Clock size={13} aria-hidden="true" />
                              <span className="hours-status">{status.statusText}</span>
                              <ChevronDown size={12} className="hours-chevron" aria-hidden="true" />
                            </div>

                            <div className="unit-hours-panel">
                              <div className="schedule-grid">
                                {daysOrder.map((d) => {
                                  const item = unit.schedule[d];
                                  const isToday = status.day === d;
                                  return (
                                    <div key={d} className={`schedule-row ${isToday ? 'is-today' : ''}`}>
                                      <span className="sched-day">{item.label}</span>
                                      <span className="sched-time">{item.text}</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          </div>

                          <a
                            href={unit.mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn-maps"
                            onClick={(e) => e.stopPropagation()}
                          >
                            VER NO GOOGLE MAPS
                          </a>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* MAPA GOOGLE EMBED */}
            <div className="unid-map">
              <iframe
                id="teaser-google-map-embed"
                title="Mapa das unidades Supermercados +B"
                src={mapSrc}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
              />
              <a
                href={selectedUnit ? selectedUnit.mapsUrl : 'https://www.google.com/maps/search/?api=1&query=Supermercados+Mais+B+Bel%C3%A9m+PA'}
                target="_blank"
                rel="noopener noreferrer"
                className="mobile-map-directions-btn"
                aria-label="Abrir rota no Google Maps ou Waze"
              >
                <MapPin size={14} aria-hidden="true" />
                <span>{selectedUnit ? `Como chegar em ${selectedUnit.shortName}` : 'Abrir rota no Google Maps / Waze'}</span>
                <ExternalLink size={12} aria-hidden="true" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* LIGHTBOX DE FOTOS DAS UNIDADES */}
      <div
        className={`album-lightbox${lightboxIndex !== null ? ' open' : ''}`}
        id="album-lightbox"
        role="dialog"
        aria-modal="true"
        aria-label="Galeria das unidades"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeLightbox();
        }}
      >
        <button
          ref={lightboxCloseRef}
          type="button"
          className="lightbox-close"
          id="lightbox-close"
          aria-label="Fechar galeria"
          onClick={closeLightbox}
        >
          <X size={24} />
        </button>
        <button
          type="button"
          className="lightbox-nav prev"
          id="lightbox-prev"
          aria-label="Foto anterior"
          onClick={() =>
            setLightboxIndex((current) =>
              current === null ? null : (current + storeUnits.length - 1) % storeUnits.length
            )
          }
        >
          <ChevronLeft size={28} aria-hidden="true" />
        </button>
        <div className="lightbox-content">
          {lightboxIndex !== null ? (
            <>
              <img
                id="lightbox-img"
                src={asset(storeUnits[lightboxIndex].image)}
                alt={storeUnits[lightboxIndex].name}
              />
              <div id="lightbox-caption" className="lightbox-caption">
                {storeUnits[lightboxIndex].name} — {lightboxIndex + 1} de {storeUnits.length}
              </div>
            </>
          ) : null}
        </div>
        <button
          type="button"
          className="lightbox-nav next"
          id="lightbox-next"
          aria-label="Próxima foto"
          onClick={() =>
            setLightboxIndex((current) =>
              current === null ? null : (current + 1) % storeUnits.length
            )
          }
        >
          <ChevronRight size={28} aria-hidden="true" />
        </button>
      </div>

      {/* RODAPÉ INSTITUCIONAL INFERIOR */}
      <div className="footer-minimal-glow-section">
        <div className="container footer-minimal-container">
          <div className="footer-minimal-centered-content">
            <div className="footer-logo-glow-wrapper">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset('Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp')}
                alt="Grupo Mais Barato"
                className="footer-minimal-logo"
              />
            </div>
            <p className="footer-minimal-slogan">Excelência que conecta negócios e pessoas.</p>
            <div className="footer-minimal-social-row">
              <a
                href="https://www.instagram.com/maisbsupermercados"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="social-circle-minimal"
              >
                <InstagramBrandIcon />
              </a>
              <a
                href="https://www.facebook.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="social-circle-minimal"
              >
                <FacebookBrandIcon />
              </a>
              <a
                href="https://www.linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="social-circle-minimal"
              >
                <LinkedinBrandIcon />
              </a>
            </div>
          </div>

          <div className="footer-minimal-bottom-bar">
            <span className="copyright-left">Copyright © 2026 Grupo Mais Barato – All rights reserved</span>
            <div className="legal-center" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link href="/termos-e-privacidade">Termos & Privacidade</Link>
              <span style={{ opacity: 0.35 }}>|</span>
              <Link href="/design" style={{ color: 'var(--color-yellow, #C89223)', fontWeight: 600 }}>
                Design System
              </Link>
            </div>
            <div className="dev-right">
              <span>Desenvolvido por:</span>
              <a href="https://idedigital.com.br" target="_blank" rel="noopener noreferrer" aria-label="ide digital">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={asset('01-logoh-pb-white-mono-ide-digital-negativo-png.webp')}
                  alt="ide digital"
                  className="idedigital-logo-img"
                />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ESTILIZAÇÃO DO COMPONENTE DE MAPA — 1:1 VALIDADO */}
      <style jsx global>{`
        :root {
          --gold: #DDA712;
          --gold-hover: #c49310;
          --gold-light: #F4C542;
          --dark: #0D0D0E;
          --dark-card: #161618;
          --dark-border: #2a2a2e;
          --black: #000;
          --font-sans: 'DM Sans', system-ui, sans-serif;
          --r-sm: 10px;
          --r-md: 16px;
          --r-lg: 24px;
          --r-full: 9999px;
          --ease: .3s ease;
        }

        .s-unidades {
          background: var(--dark);
          color: #fff;
          padding: 60px 0 88px;
          font-family: var(--font-sans);
          width: 100%;
          overflow-x: hidden;
          box-sizing: border-box;
          border-top: 1px solid rgba(255, 255, 255, 0.08);
        }

        .vmap-container {
          width: 100%;
          max-width: 1280px;
          margin-left: auto;
          margin-right: auto;
          padding-left: 32px;
          padding-right: 32px;
          box-sizing: border-box;
        }

        .unid-header {
          margin-bottom: 36px;
        }

        .eyebrow-gold {
          display: inline-block;
          font-size: 0.72rem;
          font-weight: 800;
          letter-spacing: 0.15em;
          color: #c59b27;
          text-transform: uppercase;
          margin-bottom: 8px;
        }

        .locator-gold-title {
          font-family: var(--font-primary, 'DM Sans', -apple-system, sans-serif);
          font-size: clamp(1.8rem, 2.5vw, 2.4rem);
          font-weight: 700;
          line-height: 1.15;
          letter-spacing: -0.02em;
          margin: 0 0 8px;
          color: #ffffff;
        }

        .locator-gold-title .headline-highlight-italic {
          font-family: var(--font-editorial, 'DM Serif Display', 'Playfair Display', Georgia, serif);
          font-weight: 400;
          font-style: italic;
          color: #d8a72b;
          margin-left: 6px;
          display: inline-block;
        }

        .locator-gold-desc {
          font-family: var(--font-primary, 'DM Sans', -apple-system, sans-serif);
          font-size: 0.95rem;
          color: rgba(255, 255, 255, 0.7);
          margin: 0;
          line-height: 1.5;
        }

        .unid-layout {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(0, 1.3fr);
          gap: 28px;
          align-items: stretch;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .unid-sidebar {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .search-box {
          position: relative;
          margin-bottom: 18px;
          width: 100%;
          box-sizing: border-box;
        }

        .search-box input {
          width: 100%;
          padding: 13px 42px 13px 16px;
          background: #18181c;
          border: 1px solid #333;
          border-radius: var(--r-md);
          color: #fff;
          font-size: 0.9rem;
          font-family: inherit;
          box-sizing: border-box;
        }

        .search-box input:focus {
          outline: none;
          border-color: var(--gold);
        }

        .search-icon {
          position: absolute;
          right: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--gold);
          pointer-events: none;
        }

        .units-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
          max-height: 480px;
          overflow-y: auto;
          overflow-x: hidden;
          padding-right: 4px;
          width: 100%;
          min-width: 0;
          box-sizing: border-box;
        }

        .units-list::-webkit-scrollbar {
          width: 5px;
        }

        .units-list::-webkit-scrollbar-thumb {
          background: #333;
          border-radius: 4px;
        }

        .unit-card {
          background: #161619;
          border: 1.5px solid var(--dark-border);
          border-radius: var(--r-md);
          padding: 14px;
          display: flex;
          gap: 14px;
          align-items: center;
          cursor: pointer;
          transition: all var(--ease);
          box-sizing: border-box;
          width: 100%;
          max-width: 100%;
          min-width: 0;
        }

        .unit-card:hover,
        .unit-card.active {
          border-color: var(--gold);
          background: #1c1c20;
        }

        .unit-card-thumb {
          width: 90px;
          height: 80px;
          border-radius: var(--r-sm);
          overflow: hidden;
          flex-shrink: 0;
        }

        .unit-card-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
        }

        .unit-card-info {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 3px;
          justify-content: center;
          min-width: 0;
          overflow: hidden;
        }

        .unit-card-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 6px;
          margin: 0;
          width: 100%;
          min-width: 0;
        }

        .unit-card-title h3 {
          font-size: 0.8rem;
          font-weight: 800;
          line-height: 1.2;
          margin: 0;
          color: #fff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          flex: 1;
          min-width: 0;
        }

        .unit-rating {
          font-size: 0.78rem;
          color: var(--gold);
          font-weight: 700;
          white-space: nowrap;
          display: inline-flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
        }

        .unit-rating .unit-reviews-count {
          font-size: 0.68rem;
          color: rgba(255, 255, 255, 0.45);
          font-weight: 400;
        }

        .unit-tags {
          font-size: 0.65rem;
          color: var(--gold);
          font-weight: 700;
          letter-spacing: 0.3px;
          margin: 0 0 2px;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
          overflow-wrap: break-word;
        }

        .unit-card .unit-address {
          font-size: 0.76rem;
          color: #aaa;
          display: flex;
          align-items: center;
          gap: 5px;
          margin: 0 0 2px !important;
          line-height: 1.3;
          white-space: normal;
          word-break: break-word;
        }

        .unit-card .unit-address svg {
          color: var(--gold);
          stroke: var(--gold);
          flex: 0 0 auto;
        }

        /* Linha de Horários Minimalista */
        .unit-card .unit-hours {
          margin: 0 0 3px !important;
          line-height: 1.3;
        }

        .unit-hours-trigger {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
          font-size: 0.76rem;
          color: #aaa;
          transition: color var(--ease);
          user-select: none;
          padding: 0;
          margin: 0;
          line-height: 1.3;
        }

        .unit-hours-trigger:hover {
          color: #fff;
        }

        .unit-hours-trigger svg {
          color: var(--gold);
          stroke: var(--gold);
          flex: 0 0 auto;
        }

        .unit-hours-trigger .hours-status {
          font-size: 0.76rem;
          font-weight: 400;
          color: inherit;
          line-height: 1.3;
        }

        .unit-hours-trigger .hours-chevron {
          color: #777;
          stroke: #777;
          transition: transform 0.25s ease, stroke 0.2s ease;
          flex: 0 0 auto;
          margin-left: 1px;
        }

        .unit-hours.is-open .unit-hours-trigger {
          color: #fff;
        }

        .unit-hours.is-open .hours-chevron {
          transform: rotate(180deg);
          stroke: var(--gold);
          color: var(--gold);
        }

        .unit-hours-panel {
          max-height: 0;
          opacity: 0;
          overflow: hidden;
          transition: max-height 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease, margin 0.2s ease;
          margin-top: 0;
          padding-left: 18px;
        }

        .unit-hours.is-open .unit-hours-panel {
          max-height: 200px;
          opacity: 1;
          margin-top: 4px;
          margin-bottom: 4px;
        }

        .schedule-grid {
          display: flex;
          flex-direction: column;
          gap: 2px;
          background: rgba(255, 255, 255, 0.03);
          border-left: 1.5px solid rgba(221, 167, 18, 0.4);
          padding: 4px 8px;
          border-radius: 0 6px 6px 0;
        }

        .schedule-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          font-size: 0.68rem;
          color: #888;
          padding: 1px 0;
        }

        .schedule-row.is-today {
          color: #fff;
          font-weight: 700;
        }

        .schedule-row.is-today .sched-day::after {
          content: " • hoje";
          font-size: 0.62rem;
          color: var(--gold);
          font-weight: 700;
        }

        .btn-maps {
          align-self: flex-start;
          font-size: 0.68rem;
          font-weight: 800;
          border: 1px solid #555;
          padding: 3px 10px;
          border-radius: var(--r-full);
          margin-top: 2px;
          color: #fff;
          transition: all var(--ease);
          text-decoration: none;
          display: inline-block;
        }

        .btn-maps:hover {
          border-color: var(--gold);
          color: var(--gold);
        }

        .unid-map {
          border-radius: var(--r-lg);
          overflow: hidden;
          min-height: 480px;
          border: 1px solid var(--dark-border);
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }

        .unid-map iframe {
          display: block;
          width: 100%;
          height: 100%;
          min-height: 480px;
          border: 0;
          box-sizing: border-box;
        }

        .mobile-map-directions-btn {
          position: absolute;
          bottom: 16px;
          right: 16px;
          z-index: 10;
          background: rgba(12, 12, 13, 0.92);
          border: 1px solid #c59b27;
          border-radius: 9999px;
          padding: 8px 16px;
          color: #fff;
          font-size: 0.72rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          backdrop-filter: blur(8px);
          transition: all 0.2s ease;
        }

        .mobile-map-directions-btn:hover {
          background: rgba(221, 167, 18, 0.2);
          border-color: #f5c400;
        }

        /* ──────────────────────────────────────────────
           RESPONSIVIDADE MASTER (MOBILE-FIRST POLISH)
           ────────────────────────────────────────────── */
        @media (max-width: 1100px) {
          .vmap-container {
            padding-left: 20px;
            padding-right: 20px;
          }
          .unid-layout {
            grid-template-columns: minmax(0, 1fr);
            gap: 24px;
            width: 100%;
          }
          .unid-map {
            min-height: 380px;
            height: 380px;
            width: 100%;
          }
          .unid-map iframe {
            min-height: 380px;
            height: 380px;
            width: 100%;
          }
        }

        @media (max-width: 768px) {
          .s-unidades {
            padding: 40px 0 54px;
          }
          .vmap-container {
            padding-left: 16px;
            padding-right: 16px;
          }
          .unid-header {
            margin-bottom: 20px;
          }
          .locator-gold-title {
            font-size: 1.65rem;
            line-height: 1.2;
          }
          .locator-gold-desc {
            font-size: 0.85rem;
          }
          .units-list {
            max-height: 440px;
            gap: 12px;
          }
          .unit-card {
            padding: 12px;
            gap: 12px;
            border-radius: 14px;
          }
          .unit-card-thumb {
            width: 78px;
            height: 72px;
            border-radius: 8px;
          }
          .unit-card-title h3 {
            font-size: 0.76rem;
          }
          .unit-rating {
            font-size: 0.72rem;
          }
          .unid-map {
            min-height: 320px;
            height: 320px;
            border-radius: 16px;
            margin-top: 8px;
          }
          .unid-map iframe {
            min-height: 320px;
            height: 320px;
          }
        }

        @media (max-width: 480px) {
          .vmap-container {
            padding-left: 14px;
            padding-right: 14px;
          }
          .s-unidades {
            padding: 28px 0 44px;
          }
          .locator-gold-title {
            font-size: 1.45rem;
          }
          .locator-gold-title .headline-highlight-italic {
            margin-left: 2px;
          }
          .search-box input {
            padding: 11px 36px 11px 12px;
            font-size: 0.82rem;
          }
          .unit-card {
            padding: 10px;
            gap: 10px;
            border-radius: 12px;
          }
          .unit-card-thumb {
            width: 70px;
            height: 66px;
            border-radius: 6px;
          }
          .unit-card-title h3 {
            font-size: 0.72rem;
          }
          .unit-tags {
            font-size: 0.56rem;
            line-height: 1.25;
          }
          .unit-card .unit-address {
            font-size: 0.7rem;
          }
          .unit-hours-trigger {
            font-size: 0.7rem;
          }
          .unit-hours-panel {
            padding-left: 10px;
          }
          .schedule-grid {
            padding: 4px 6px;
          }
          .schedule-row {
            font-size: 0.62rem;
            gap: 6px;
          }
          .btn-maps {
            font-size: 0.62rem;
            padding: 3px 8px;
          }
          .unid-map {
            min-height: 290px;
            height: 290px;
            border-radius: 14px;
          }
          .unid-map iframe {
            min-height: 290px;
            height: 290px;
          }
          .mobile-map-directions-btn {
            bottom: 10px;
            right: 10px;
            padding: 6px 12px;
            font-size: 0.65rem;
          }
        }
      `}</style>
    </footer>
  );
}
