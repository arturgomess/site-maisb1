'use client';

import Link from 'next/link';
import { ArrowRight, ArrowUpRight, ChevronLeft, ChevronRight, HeartPulse, Leaf, MapPin, Maximize2, Minimize2, PartyPopper, ShoppingCart, Utensils, Volume2, VolumeX, Wine } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FaqSection } from './home/faq-section';
import { OpportunitiesSection } from './home/opportunities-section';

const asset = (path: string) => `/assets/${path}`;

export function HomeHero() {
  return <section className="hero-carousel-section section-dark" id="home"><div className="carousel-slides-wrapper"><div className="carousel-slide active"><video className="hero-bg-video" autoPlay muted loop playsInline poster={asset('Videos/video-b-home-poster.webp')}><source src={asset('Videos/Supermercado Mais B - Institucional.mp4')} type="video/mp4" /></video><div className="slide-overlay" /><div className="container slide-container"><div className="slide-content"><span className="slide-eyebrow">BEM-VINDO</span><h1 className="slide-headline-huge">Somos o<br /><span className="slide-headline-nowrap">Grupo <span className="headline-highlight-italic">Mais Barato</span></span></h1><p className="slide-lead">Grandes marcas e experiências que fazem parte do dia a dia dos paraenses.</p><div className="slide-actions"><Link href="/sobre-nos" className="btn-hero-cta">Conheça o GMB <ArrowRight size={16} aria-hidden="true" /></Link></div></div></div></div></div></section>;
}

export function InstitutionalVideoHero() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [muted, setMuted] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null);

  const resetHideTimer = (delay = 2600) => {
    setControlsVisible(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (fullscreen) {
      hideTimerRef.current = setTimeout(() => {
        if (!isDraggingRef.current) {
          setControlsVisible(false);
        }
      }, delay);
    }
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (!isDraggingRef.current && video.duration) {
        setProgress((video.currentTime / video.duration) * 100);
      }
    };

    const onFullscreenChange = () => {
      const isFs = Boolean(
        document.fullscreenElement === sectionRef.current ||
        (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement === sectionRef.current
      );
      setFullscreen(isFs);
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (isFs) {
        hideTimerRef.current = setTimeout(() => {
          setControlsVisible(false);
        }, 3000);
      }
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [fullscreen]);

  // Listener para mousemove quando estiver em tela cheia: se mexer o mouse, reaparece
  useEffect(() => {
    if (!fullscreen) {
      setControlsVisible(true);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      return;
    }

    const onMouseMove = (e: MouseEvent) => {
      const isNearBottom = e.clientY > window.innerHeight - 160;
      resetHideTimer(isNearBottom ? 4000 : 2600);
    };

    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [fullscreen]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    resetHideTimer();
  };

  const toggleFullscreen = () => {
    const section = sectionRef.current;
    if (!section) return;
    const doc = document as unknown as {
      fullscreenElement?: Element;
      webkitFullscreenElement?: Element;
      exitFullscreen?: () => Promise<void>;
      webkitExitFullscreen?: () => void;
    };
    const sec = section as unknown as {
      requestFullscreen?: () => Promise<void>;
      webkitRequestFullscreen?: () => void;
    };

    if (doc.fullscreenElement || doc.webkitFullscreenElement) {
      if (doc.exitFullscreen) void doc.exitFullscreen();
      else if (doc.webkitExitFullscreen) doc.webkitExitFullscreen();
    } else {
      if (sec.requestFullscreen) void sec.requestFullscreen();
      else if (sec.webkitRequestFullscreen) sec.webkitRequestFullscreen();
    }
  };

  const seekFromClientX = (clientX: number) => {
    const video = videoRef.current;
    const track = trackRef.current;
    if (!video || !track) return;
    const duration = video.duration;
    if (!duration || isNaN(duration) || !isFinite(duration)) return;

    const rect = track.getBoundingClientRect();
    if (rect.width <= 0) return;

    const clickX = Math.max(0, Math.min(clientX - rect.left, rect.width));
    const pct = clickX / rect.width;
    const targetTime = pct * duration;

    video.currentTime = targetTime;
    setProgress(pct * 100);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    isDraggingRef.current = true;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    seekFromClientX(e.clientX);
    resetHideTimer(5000);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    seekFromClientX(e.clientX);
    resetHideTimer(5000);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      seekFromClientX(e.clientX);
      resetHideTimer();
    }
  };

  const isControlsShown = !fullscreen || controlsVisible;

  return (
    <section
      className={`video-hero-section wf-section ${fullscreen ? 'is-fullscreen' : ''} ${fullscreen && !controlsVisible ? 'hide-cursor' : ''}`}
      ref={sectionRef}
      onMouseMove={() => resetHideTimer()}
    >
      <video id="inst-video" ref={videoRef} autoPlay loop muted playsInline poster={asset('Videos/video-b-home-poster.webp')}>
        <source src={asset('Videos/Supermercado Mais B - Institucional.mp4')} type="video/mp4" />
      </video>
      <div className="video-overlay" />
      <div className="video-hero-content visually-hidden"><span className="slide-eyebrow">SOBRE O GRUPO</span><h1>Grupo Mais Barato</h1></div>
      <div
        className={`video-hero-controls ${isControlsShown ? 'fs-visible' : ''}`}
        aria-label="Controles do vídeo institucional"
        onMouseEnter={() => {
          if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
          setControlsVisible(true);
        }}
        onMouseLeave={() => {
          if (fullscreen && !isDraggingRef.current) resetHideTimer(1800);
        }}
      >
        <div
          className={`video-progress-container ${isControlsShown ? 'fs-visible' : ''}`}
          id="video-progress-container"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          role="slider"
          aria-label="Progresso do vídeo"
          aria-valuenow={Math.round(progress)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
        >
          <div className="video-progress-track" ref={trackRef}>
            <div className="video-progress-bar" style={{ width: `${progress}%` }} />
          </div>
        </div>
        <div className={`video-controls-right ${isControlsShown ? 'fs-visible' : ''}`}>
          <button id="video-mute-toggle" type="button" className="video-mute-btn" onClick={toggleMute} aria-label={muted ? 'Desmutar vídeo' : 'Mutar vídeo'}>
            {muted ? <VolumeX size={22} aria-hidden="true" /> : <Volume2 size={22} aria-hidden="true" />}
          </button>
          <button id="video-fullscreen-toggle" type="button" className="video-fullscreen-btn" onClick={toggleFullscreen} aria-label="Alternar tela cheia">
            {fullscreen ? <Minimize2 size={22} aria-hidden="true" /> : <Maximize2 size={22} aria-hidden="true" />}
          </button>
        </div>
      </div>
    </section>
  );
}

export function AboutSection() {
  return <section className="section section-light about-premium-section section-full-width" id="sobre"><div className="container about-container"><div className="about-main-grid"><div className="about-content-col"><span className="eyebrow-gold">SOBRE O GRUPO</span><h2 className="about-headline">O <span className="headline-highlight-italic">Grupo Mais Barato</span> reúne negócios que fazem parte do dia a dia das pessoas de <span style={{ whiteSpace: 'nowrap' }}>Belém — PA</span></h2><div className="about-paragraphs"><p className="about-mid-text">Conectando varejo, gastronomia, saúde, bem-estar e serviços com qualidade, inovação e proximidade.</p><p className="about-lead-extended">Nossa atuação integra marcas que compartilham o mesmo compromisso: oferecer experiências que superem expectativas, sempre com foco nas pessoas, na excelência e no desenvolvimento das comunidades onde estamos presentes. Mais do que crescer, acreditamos em transformar relações, gerar oportunidades e construir um futuro cada vez melhor para clientes, colaboradores, parceiros e para a sociedade.</p></div><div className="gold-accent-line" /></div><div className="about-photo-col"><div className="about-photo-wrapper">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={asset('Fotografias/Grupo Institucional +B/foto-grupo-b-em-fente-fachada_pessoas.webp')} alt="Equipe e Fachada Grupo Mais Barato" className="about-team-photo" loading="lazy" /></div></div></div></div></section>;
}

export function AboutInstitutional() {
  const onAboutMouseMove = (event: React.MouseEvent<HTMLElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
  };
  return <section className="section about-premium-dark-section" id="sobre" onMouseMove={onAboutMouseMove}>
    <div className="about-bg-glow glow-dark-top-right" aria-hidden="true" />
    <div className="about-bg-glow glow-dark-center-photo" aria-hidden="true" />
    <div className="about-bg-glow glow-dark-bottom-left" aria-hidden="true" />
    <div className="about-dotted-pattern" aria-hidden="true" />
    <div className="about-mouse-spotlight" aria-hidden="true" />

    <div className="container about-container">
      <div className="about-main-grid">
        <div className="about-content-col reveal">
          <span className="eyebrow-gold">SOBRE O GRUPO</span>
          <h2 className="about-headline">O <span className="headline-highlight-italic">Grupo Mais Barato</span> reúne negócios que fazem parte do dia a dia das pessoas de <span style={{ whiteSpace: 'nowrap' }}>Belém — PA</span></h2>
          <div className="about-paragraphs">
            <p className="about-mid-text">Conectando varejo, gastronomia, saúde, bem-estar e serviços com qualidade, inovação e proximidade.</p>
            <p>Nossa atuação integra marcas que compartilham o mesmo compromisso: oferecer experiências que superem expectativas, sempre com foco nas pessoas, na excelência e no desenvolvimento das comunidades onde estamos presentes. Mais do que crescer, acreditamos em transformar relações, gerar oportunidades e construir um futuro cada vez melhor para clientes, colaboradores, parceiros e para a sociedade.</p>
          </div>
          <div className="gold-accent-line" />
        </div>

        <div className="about-photo-col reveal delay-1">
          <div className="about-photo-wrapper">
            <img src={asset('Fotografias/Grupo Institucional +B/foto-grupo-b-em-fente-fachada_pessoas.webp')} alt="Equipe e Fachada Grupo Mais Barato" className="about-team-photo" loading="lazy" />
            <div className="about-floating-glass-card">
              <div className="floating-card-icon"><Leaf size={22} aria-hidden="true" /></div>
              <div className="floating-card-divider" />
              <div className="floating-card-text">Crescimento que gera valor,<br />impacto e desenvolvimento<br /><span className="headline-highlight-italic">sustentável</span> para a nossa região.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="about-culture-block reveal delay-1">
        <div className="about-culture-header"><span className="eyebrow-gold">IDENTIDADE CORPORATIVA</span><h3 className="about-culture-title">Nossa <span className="headline-highlight-italic">Cultura</span></h3><div className="culture-title-accent" /></div>
        <div className="about-culture-grid">
          <div className="culture-card culture-card-missao">
            <div className="culture-card-icon-badge">
              <svg className="culture-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="8" />
                <circle cx="12" cy="12" r="4.5" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <line x1="12" y1="1.5" x2="12" y2="4" />
                <line x1="12" y1="20" x2="12" y2="22.5" />
                <line x1="1.5" y1="12" x2="4" y2="12" />
                <line x1="20" y1="12" x2="22.5" y2="12" />
                <line x1="4.5" y1="4.5" x2="6.2" y2="6.2" />
                <line x1="17.8" y1="17.8" x2="19.5" y2="19.5" />
                <line x1="4.5" y1="19.5" x2="6.2" y2="17.8" />
                <line x1="17.8" y1="6.2" x2="19.5" y2="4.5" />
              </svg>
            </div>
            <div className="culture-card-divider" />
            <div className="culture-card-body">
              <h4 className="culture-card-title">Missão</h4>
              <p className="culture-card-text">Participar da vida de nossos clientes, oferecendo produtos e serviços de qualidade comprometida a preços competitivos.</p>
            </div>
          </div>
          <div className="culture-card culture-card-visao">
            <div className="culture-card-icon-badge">
              <svg className="culture-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M2 12s3.8-7 10-7 10 7 10 7-3.8 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3.2" />
                <circle cx="12" cy="12" r="1.2" fill="currentColor" />
              </svg>
            </div>
            <div className="culture-card-divider" />
            <div className="culture-card-body">
              <h4 className="culture-card-title">Visão</h4>
              <p className="culture-card-text">Ser reconhecida pelo mercado como uma empresa referência em qualidade, preços competitivos e serviços de excelência na região norte do país.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>;
}

const brandData = [
  { id: 'wine', theme: 'wine', logo: 'icon-the-winee.webp', watermark: Wine, serifTitle: true, title: <>THE WINE<br /><span className="card-brand-subtitle">Xperience</span></>, keywords: 'RÓTULOS • EXPERIÊNCIA • SOFISTICAÇÃO', description: 'Experiência voltada ao universo dos vinhos, com curadoria de rótulos e momentos para apreciar bons encontros.', images: ['The Wine Experience/parede-vinhos-decoracao.webp', 'The Wine Experience/salao-principal-clientes.webp', 'The Wine Experience/mesa-reservada-adega.webp', 'The Wine Experience/jantar-harmonizado-brinde.webp'] },
  { id: 'super', theme: 'super', logo: 'icon-b-supermercadoo.webp', watermark: ShoppingCart, title: <>+B Supermercados</>, keywords: 'VARIEDADE • ECONOMIA • CONVENIÊNCIA', description: 'Rede de supermercados com mix completo de alimentos e ofertas para a rotina das famílias.', images: ['Supermercado +B/00_CardHome/1-foto-supermercado.webp', 'Supermercado +B/00_CardHome/2-foto-supermercado.webp', 'Supermercado +B/00_CardHome/3-foto-supermercado.webp', 'Supermercado +B/00_CardHome/4-supemercado.webp'] },
  { id: 'farma', theme: 'farma', logo: 'icon-b-farmaa.webp', watermark: HeartPulse, title: <>+B Farma</>, keywords: 'SAÚDE • BELEZA • CONVENIÊNCIA', description: 'Drogarias integradas oferecendo amplo estoque de medicamentos, cuidados para a pele, cosméticos e atendimento humanizado.', images: ['Mais B Farma/foto-farma-b (1).webp', 'Mais B Farma/foto-farma-b (2).webp', 'Mais B Farma/foto-farma-b (3).webp', 'Mais B Farma/foto-farma-b (4).webp'] },
  { id: 'park', theme: 'park', logo: 'icon-vila-plaza.webp', watermark: PartyPopper, title: <>Villa Plaza Park</>, keywords: 'DIVERSÃO • FAMÍLIA • LAZER', description: 'Maior Parque infantil de Belém, pensado para crianças e famílias, com atrações, segurança e muita diversão para os pequenos.', images: ['Villa Plaza (Park Infantil)/foto-park-infantil (1).webp', 'Villa Plaza (Park Infantil)/foto-park-infantil (2).webp', 'Villa Plaza (Park Infantil)/foto-park-infantil (3).webp', 'Villa Plaza (Park Infantil)/foto-park-infantil (4).webp'] },
  { id: 'plaza', theme: 'plaza', logo: 'icon-vila-plaza.webp', watermark: Utensils, serifTitle: true, title: <>Villa Plaza<br />Restaurante</>, keywords: 'SABOR · ENCONTROS · EXPERIÊNCIA', description: 'Ambiente acolhedor e cardápio pensado para momentos especiais, encontros e boa gastronomia.', images: ['Villa Plaza (Restaurante)/vila-plaza-restaurante-ambiente.webp', 'Villa Plaza (Restaurante)/vila-plaza-gastronomia_buffet_pratos_quentes.webp', 'Villa Plaza (Restaurante)/vila-plaza-gastronomia_buffet_saladas_selecao.webp', 'Villa Plaza (Restaurante)/vila-plaza-experiencia_servico_garcom.webp'] },
];

const orbitOrder = ['plaza', 'super', 'wine', 'park', 'farma'];

function getBaseAngle(id: string, activeId: string, isMobile: boolean) {
  const count = orbitOrder.length;
  const activeIdx = orbitOrder.indexOf(activeId);
  const brandIdx = orbitOrder.indexOf(id);
  const relIdx = (activeIdx - brandIdx + count) % count;
  if (isMobile) {
    if (id === activeId) return 90;
    return 45 + (relIdx - 1) * 90;
  }
  return relIdx * (360 / count);
}

function getNextClockwiseAngle(currentAngle: number, targetBaseAngle: number) {
  const currentMod = ((currentAngle % 360) + 360) % 360;
  let diff = targetBaseAngle - currentMod;
  if (diff < 0) diff += 360;
  return currentAngle + diff;
}

function getPreviousCounterClockwiseAngle(currentAngle: number, targetBaseAngle: number) {
  const currentMod = ((currentAngle % 360) + 360) % 360;
  let diff = targetBaseAngle - currentMod;
  if (diff > 0) diff -= 360;
  return currentAngle + diff;
}

function getShortestPathAngle(currentAngle: number, targetBaseAngle: number) {
  const currentMod = ((currentAngle % 360) + 360) % 360;
  let diff = targetBaseAngle - currentMod;
  if (diff > 180) diff -= 360;
  else if (diff < -180) diff += 360;
  return currentAngle + diff;
}

function BrandOrbitMobile({
  active,
  onSelect,
  progress,
}: {
  active: string;
  onSelect: (id: string, direction?: 'next' | 'prev') => void;
  progress: number;
}) {
  const activeIdx = orbitOrder.indexOf(active);

  const cornerSlots = [
    { left: '19%', top: '22%', name: 'top-left' },
    { left: '81%', top: '22%', name: 'top-right' },
    { left: '81%', top: '78%', name: 'bottom-right' },
    { left: '19%', top: '78%', name: 'bottom-left' },
  ];

  return (
    <div className="brands-orbit-box brands-orbit-mobile" id="brands-orbit-box">
      <svg className="brands-orbit-svg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
        <circle cx="250" cy="250" r="209" className="network-orbit-line" />
        <circle cx="250" cy="250" r="125" className="network-orbit-line orbit-inner" />
        <line x1="250" y1="250" x2="95" y2="110" className="split-connect-line" />
        <line x1="250" y1="250" x2="405" y2="110" className="split-connect-line" />
        <line x1="250" y1="250" x2="405" y2="390" className="split-connect-line" />
        <line x1="250" y1="250" x2="95" y2="390" className="split-connect-line" />
        <line x1="250" y1="250" x2="250" y2="500" className="split-connect-line mobile-vertical-bridge" />
        <circle
          id="hub-progress-arc"
          cx="250"
          cy="250"
          r="66"
          fill="none"
          stroke="#C89223"
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeDasharray="415"
          strokeDashoffset={String(415 * (1 - progress))}
          transform="rotate(-90 250 250)"
        />
      </svg>

      {/* Marca central da espiral: SEMPRE do Grupo +B, FIXO, igual desktop, NUNCA MUDA */}
      <div className="mobile-hub-center" id="mobile-hub-center" aria-label="Grupo Mais Barato">
        <img
          className="hub-logo-white"
          src={asset('Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp')}
          alt="Logo Grupo Mais Barato"
        />
      </div>

      {/* Nós satélites das marcas nos 4 cantos do X */}
      {orbitOrder.map((id) => {
        const brand = brandData.find((item) => item.id === id);
        if (!brand) return null;
        const brandIdx = orbitOrder.indexOf(id);
        const diff = (brandIdx - activeIdx + 5) % 5;
        const isVisible = diff !== 3;
        let slotIdx = 0;
        if (diff === 0) slotIdx = 1;
        else if (diff === 1) slotIdx = 2;
        else if (diff === 2) slotIdx = 3;
        else if (diff === 4) slotIdx = 0;
        else slotIdx = 3;

        const slot = cornerSlots[slotIdx];
        const isActive = id === active;
        const label = id === 'super' ? 'Supermercados +B' : id === 'wine' ? 'The Wine' : id === 'farma' ? '+B Farma' : id === 'park' ? 'Villa Plaza Park' : 'Villa Plaza';

        return (
          <button
            key={id}
            type="button"
            className={`mobile-brand-slot slot-${slot.name} brand-${id}${isActive ? ' active' : ''}`}
            style={{
              left: slot.left,
              top: slot.top,
              transform: `translate(-50%, -50%) scale(${isActive ? 1.08 : 1})`,
              opacity: isVisible ? 1 : 0,
              pointerEvents: isVisible ? 'auto' : 'none',
              zIndex: isActive ? 20 : 15,
            }}
            onClick={() => onSelect(id)}
            aria-label={isActive ? `${label} (marca ativa)` : `Ver ${label}`}
          >
            <div className="mobile-node-circle">
              <img src={asset('Icones Submarcas/' + brand.logo)} alt={label} />
            </div>
            <span className="mobile-node-label">
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function BrandOrbit({
  active,
  onSelect,
  isMobile,
  nodeAngles,
  lineAngles,
  bridgeTransform,
  progress,
}: {
  active: string;
  onSelect: (id: string, direction?: 'next' | 'prev') => void;
  isMobile: boolean;
  nodeAngles: Record<string, number>;
  lineAngles: Record<string, number>;
  bridgeTransform: string;
  progress: number;
}) {
  if (isMobile) {
    return <BrandOrbitMobile active={active} onSelect={onSelect} progress={progress} />;
  }

  return (
    <div
      className="brands-orbit-box"
      id="brands-orbit-box"
      style={{
        '--orbit-radius': '200px',
      } as React.CSSProperties}
    >
      <svg className="brands-orbit-svg" viewBox="0 0 500 500" preserveAspectRatio="xMidYMid meet" id="brands-orbit-svg" aria-hidden="true">
        <circle cx="250" cy="250" r="200" className="network-orbit-line" />
        <circle cx="250" cy="250" r="120" className="network-orbit-line orbit-inner" />
        <line
          id="line-active-bridge"
          x1="250"
          y1="250"
          x2="450"
          y2="250"
          className="split-connect-line active-bridge"
          style={{
            transformOrigin: '250px 250px',
            transform: bridgeTransform,
            opacity: 1,
            stroke: '#C89223',
            strokeWidth: '2px',
          }}
        />
        {orbitOrder.map((id) => {
          const isActive = id === active;
          const angle = lineAngles[id] ?? getBaseAngle(id, active, false);
          return (
            <line
              key={id}
              id={'line-' + id}
              x1="250"
              y1="250"
              x2="450"
              y2="250"
              className={'split-connect-line to-' + id}
              style={{
                transformOrigin: '250px 250px',
                transform: `rotate(${angle}deg)`,
                opacity: isActive ? 0 : 0.65,
                stroke: '#C89223',
              }}
            />
          );
        })}
        <circle
          id="hub-progress-arc"
          cx="250"
          cy="250"
          r="74"
          fill="none"
          stroke="#C89223"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="465"
          strokeDashoffset={String(465 * (1 - progress))}
          transform="rotate(-90 250 250)"
        />
      </svg>
      <button type="button" className="brands-hub-center" id="brands-hub-center" title="Voltar ao início da rotação" onClick={() => onSelect('plaza')}>
        <img className="hub-logo-white" src={asset('Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp')} alt="Logo Grupo Mais Barato" />
      </button>
      {orbitOrder.map((id) => {
        const brand = brandData.find((item) => item.id === id);
        if (!brand) return null;
        const label = id === 'super' ? 'Supermercados +B' : id === 'wine' ? 'The Wine' : id === 'farma' ? '+B Farma' : id === 'park' ? 'Villa Plaza Park' : 'Villa Plaza';
        const isActive = id === active;
        const angle = nodeAngles[id] ?? getBaseAngle(id, active, false);
        return (
          <div
            key={id}
            className={'orbit-arm arm-' + id}
            style={{
              transform: `rotate(${angle}deg)`,
            }}
          >
            <button
              type="button"
              className={'network-node split-node carousel-node node-' + id + (isActive ? ' active' : '')}
              data-brand={id}
              role="button"
              aria-label={'Ver ' + label}
              onClick={() => onSelect(id)}
              style={{
                transform: `translate(var(--orbit-radius, 200px), 0) rotate(-${angle}deg) translate(-50%, -50%)`,
                opacity: isActive ? 0 : 1,
                pointerEvents: isActive ? 'none' : 'auto',
              }}
            >
              <span className="node-logo-wrapper" style={{ transform: 'scale(0.9)' }}>
                <img src={asset('Icones Submarcas/' + brand.logo)} alt={'Logo ' + label} />
              </span>
              <span className="node-label" style={{ opacity: isActive ? 0 : 1 }}>{label}</span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function BrandsSection() {
  const [active, setActive] = useState('plaza');
  const [isMobile, setIsMobile] = useState(false);
  const [progress, setProgress] = useState(0);
  const [bridgeTransform, setBridgeTransform] = useState('rotate(0deg) scaleX(2.15)');
  const [nodeAngles, setNodeAngles] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    orbitOrder.forEach((id) => { initial[id] = getBaseAngle(id, 'plaza', false); });
    return initial;
  });
  const [lineAngles, setLineAngles] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    orbitOrder.forEach((id) => { initial[id] = getBaseAngle(id, 'plaza', false); });
    return initial;
  });

  const isMobileRef = useRef(false);
  const nodeAnglesRef = useRef(nodeAngles);
  nodeAnglesRef.current = nodeAngles;
  const lineAnglesRef = useRef(lineAngles);
  lineAnglesRef.current = lineAngles;
  const activeRef = useRef(active);
  activeRef.current = active;
  const touchStartX = useRef<number | null>(null);

  const onBrandsMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.style.setProperty('--mouse-x', `${event.clientX - rect.left}px`);
    event.currentTarget.style.setProperty('--mouse-y', `${event.clientY - rect.top}px`);
  };

  const updateBridge = (mobile: boolean) => {
    if (mobile) {
      setBridgeTransform('rotate(90deg) scaleX(1.35)');
      return;
    }
    const orbit = document.getElementById('brands-orbit-box');
    const activeCard = document.querySelector<HTMLElement>('.brand-detail-card.active');
    const logo = activeCard?.querySelector<HTMLElement>('.card-logo-overlap');
    if (orbit && logo) {
      const orbitRect = orbit.getBoundingClientRect();
      const logoRect = logo.getBoundingClientRect();
      if (orbitRect.width > 0) {
        const orbitCenterX = orbitRect.left + orbitRect.width / 2;
        const orbitCenterY = orbitRect.top + orbitRect.height / 2;
        const logoCenterX = logoRect.left + logoRect.width / 2;
        const logoCenterY = logoRect.top + logoRect.height / 2;
        const dx = logoCenterX - orbitCenterX;
        const dy = logoCenterY - orbitCenterY;
        const angle = Math.atan2(dy, dx) * 180 / Math.PI;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const scaleX = (distance / orbitRect.width) * (500 / 200);
        setBridgeTransform(`rotate(${angle.toFixed(2)}deg) scaleX(${scaleX.toFixed(2)})`);
        return;
      }
    }
    setBridgeTransform('rotate(0deg) scaleX(2.15)');
  };

  const calculateNextAngles = (targetActive: string, direction?: 'next' | 'prev') => {
    const mobile = isMobileRef.current;
    const nextNode: Record<string, number> = {};
    const nextLine: Record<string, number> = {};

    orbitOrder.forEach((id) => {
      const targetBase = getBaseAngle(id, targetActive, mobile);
      const prevNodeAngle = nodeAnglesRef.current[id] ?? targetBase;
      const prevLineAngle = lineAnglesRef.current[id] ?? targetBase;

      if (mobile) {
        nextNode[id] = getShortestPathAngle(prevNodeAngle, targetBase);
        nextLine[id] = getShortestPathAngle(prevLineAngle, targetBase);
      } else if (direction === 'prev') {
        nextNode[id] = getPreviousCounterClockwiseAngle(prevNodeAngle, targetBase);
        nextLine[id] = getPreviousCounterClockwiseAngle(prevLineAngle, targetBase);
      } else {
        nextNode[id] = getNextClockwiseAngle(prevNodeAngle, targetBase);
        nextLine[id] = getNextClockwiseAngle(prevLineAngle, targetBase);
      }
    });

    nodeAnglesRef.current = nextNode;
    lineAnglesRef.current = nextLine;
    setNodeAngles(nextNode);
    setLineAngles(nextLine);
  };

  const selectBrand = (id: string, direction?: 'next' | 'prev', updateHash = true) => {
    setActive(id);
    setProgress(0);
    calculateNextAngles(id, direction);
    if (updateHash && typeof window !== 'undefined') window.history.replaceState(null, '', '#marca-' + id);
    window.requestAnimationFrame(() => updateBridge(isMobileRef.current));
  };

  const selectRelative = (offset: number) => {
    const activeIndex = orbitOrder.indexOf(active);
    const nextIndex = (activeIndex + offset + orbitOrder.length) % orbitOrder.length;
    selectBrand(orbitOrder[nextIndex], offset < 0 ? 'prev' : 'next');
  };

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth <= 980;
      const wasMobile = isMobileRef.current;
      setIsMobile(mobile);
      isMobileRef.current = mobile;
      updateBridge(mobile);
      if (mobile !== wasMobile) {
        const nextNodes: Record<string, number> = {};
        const nextLines: Record<string, number> = {};
        orbitOrder.forEach((id) => {
          nextNodes[id] = getBaseAngle(id, activeRef.current, mobile);
          nextLines[id] = getBaseAngle(id, activeRef.current, mobile);
        });
        nodeAnglesRef.current = nextNodes;
        lineAnglesRef.current = nextLines;
        setNodeAngles(nextNodes);
        setLineAngles(nextLines);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    const fromHash = window.location.hash.match(/^#marca-(super|farma|plaza|park|wine)$/)?.[1];
    if (fromHash) {
      selectBrand(fromHash);
      window.requestAnimationFrame(() => document.getElementById('marcas')?.scrollIntoView({ block: 'start' }));
    }
    const onHashChange = () => {
      const next = window.location.hash.match(/^#marca-(super|farma|plaza|park|wine)$/)?.[1];
      if (next) selectBrand(next);
    };
    window.addEventListener('hashchange', onHashChange);
    return () => {
      window.removeEventListener('resize', checkMobile);
      window.removeEventListener('hashchange', onHashChange);
    };
  }, []);

  useEffect(() => {
    updateBridge(isMobile);
  }, [active, isMobile]);

  useEffect(() => {
    let paused = false;
    let accumulatedElapsed = 0;
    let lastTime = performance.now();
    let raf = 0;
    const duration = 9000;

    const stage = document.querySelector('.brands-carousel-stage');
    const orbit = document.getElementById('brands-orbit-box');

    const pause = () => { paused = true; };
    const resume = () => {
      paused = false;
      lastTime = performance.now();
    };

    stage?.addEventListener('mouseenter', pause);
    stage?.addEventListener('mouseleave', resume);
    orbit?.addEventListener('mouseenter', pause);
    orbit?.addEventListener('mouseleave', resume);

    const tick = (now: number) => {
      const delta = now - lastTime;
      lastTime = now;

      if (!paused) {
        accumulatedElapsed += delta;
      }

      const p = Math.min(accumulatedElapsed / duration, 1);
      setProgress(p);

      if (!paused && p >= 1) {
        accumulatedElapsed = 0;
        const currentIdx = orbitOrder.indexOf(activeRef.current);
        const nextId = orbitOrder[(currentIdx + 1) % orbitOrder.length];
        selectBrand(nextId, 'next', false);
        return;
      }
      raf = window.requestAnimationFrame(tick);
    };
    raf = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(raf);
      stage?.removeEventListener('mouseenter', pause);
      stage?.removeEventListener('mouseleave', resume);
      orbit?.removeEventListener('mouseenter', pause);
      orbit?.removeEventListener('mouseleave', resume);
    };
  }, [active]);

  const onStageKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowLeft') { event.preventDefault(); selectRelative(-1); }
    if (event.key === 'ArrowRight') { event.preventDefault(); selectRelative(1); }
  };
  const onTouchStart = (event: React.TouchEvent<HTMLDivElement>) => { touchStartX.current = event.touches[0]?.clientX ?? null; };
  const onTouchEnd = (event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;
    const distance = event.changedTouches[0]?.clientX - touchStartX.current;
    if (Math.abs(distance) > 45) selectRelative(distance < 0 ? 1 : -1);
    touchStartX.current = null;
  };

  const openBrandLocation = (event: React.MouseEvent<HTMLAnchorElement>, brandId: string) => {
    event.preventDefault();
    event.stopPropagation();
    window.history.pushState(null, '', '#store-locator-teaser');
    window.dispatchEvent(new CustomEvent('store-locator-brand-select', { detail: { brandId } }));
  };

  return <section className="brands-scroll-container" id="marcas"><div className="brands-sticky-wrapper"><div className="brands-black-block" onMouseMove={onBrandsMouseMove}><div className="brands-grid-overlay" /><div className="container brands-section-container"><div className="brands-section-head"><span className="eyebrow-gold">NOSSAS MARCAS</span><h2 className="brands-headline-title">Marcas que conectam, cuidam e fazem parte <span className="headline-highlight-italic">do dia a dia.</span></h2><div className="brands-subtitle-badge-wrapper"><p className="brands-subtitle-text">Cada marca conecta consumo, cuidado, gastronomia, lazer e experiências para o dia a dia.</p></div></div><div className="brands-carousel-stage" tabIndex={0} onKeyDown={onStageKeyDown} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} aria-label="Carrossel de marcas" role="region"><div className="brands-layout-split"><div className="brands-layout-left"><BrandOrbit active={active} onSelect={selectBrand} isMobile={isMobile} nodeAngles={nodeAngles} lineAngles={lineAngles} bridgeTransform={bridgeTransform} progress={progress} /></div><div className="brands-layout-right"><button type="button" className="brands-nav-arrow arrow-left" aria-label="Marca anterior" onClick={() => selectRelative(-1)}><ChevronLeft size={22} /></button><button type="button" className="brands-nav-arrow arrow-right" aria-label="Próxima marca" onClick={() => selectRelative(1)}><ChevronRight size={22} /></button>{brandData.map((brand) => { const Watermark = brand.watermark; return <div className={'brand-detail-card theme-' + brand.theme + (brand.id === active ? ' active' : '')} data-brand={brand.id} id={'marca-' + brand.id} key={brand.id}><div className="card-top-gallery">{brand.images.map((image, index) => <div className="gallery-panel panel-image" key={image}><img src={asset('Fotografias/' + image)} alt={`${brand.id} imagem ${index + 1}`} /></div>)}</div><div className="card-details-body"><div className="card-logo-overlap"><img src={asset('Icones Submarcas/' + brand.logo)} alt={brand.id} /></div><div className="card-header-info"><span className="card-badge">MARCA EM DESTAQUE</span><h3 className={'card-brand-title' + (brand.serifTitle ? ' serif-font' : '')}>{brand.title}</h3><span className={'card-brand-keywords keyword-' + brand.id}>{brand.keywords}</span></div><p className="card-brand-description">{brand.description}</p><div className="card-actions"><a href="#store-locator-teaser" className="open-map-trigger btn-card-primary" onClick={(event) => openBrandLocation(event, brand.id)}><MapPin size={15} aria-hidden="true" /> Ver unidades & localização</a></div><Watermark className="card-watermark" size={120} strokeWidth={1.5} aria-hidden="true" /></div></div>; })}</div></div></div></div></div></div></section>;
}

export { OpportunitiesSection, FaqSection };
export function FaqSectionExport() {
  return <FaqSection />;
}
export function WorkAndFaqSections() {
  return <><OpportunitiesSection /><FaqSection /></>;
}
