'use client';

import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

const asset = (path: string) => `/assets/${path}`;

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [contactsMenuOpen, setContactsMenuOpen] = useState(false);
  const menuToggleRef = useRef<HTMLButtonElement>(null);
  const contactsCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openContactsMenu = () => {
    if (contactsCloseTimeoutRef.current) {
      clearTimeout(contactsCloseTimeoutRef.current);
      contactsCloseTimeoutRef.current = null;
    }
    setContactsMenuOpen(true);
  };

  const scheduleContactsMenuClose = () => {
    if (contactsCloseTimeoutRef.current) clearTimeout(contactsCloseTimeoutRef.current);
    contactsCloseTimeoutRef.current = setTimeout(() => {
      setContactsMenuOpen(false);
      contactsCloseTimeoutRef.current = null;
    }, 200);
  };

  const closeContactsMenu = () => {
    if (contactsCloseTimeoutRef.current) {
      clearTimeout(contactsCloseTimeoutRef.current);
      contactsCloseTimeoutRef.current = null;
    }
    setContactsMenuOpen(false);
  };

  useEffect(() => () => {
    if (contactsCloseTimeoutRef.current) clearTimeout(contactsCloseTimeoutRef.current);
  }, []);

  useEffect(() => {
    const header = document.getElementById('topo');
    if (!header) return;
    let lastScrollY = window.scrollY;
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      header.classList.toggle('scrolled', currentScrollY > 40);
      header.classList.toggle('hidden', currentScrollY > 150 && currentScrollY > lastScrollY);
      if (currentScrollY < lastScrollY) header.classList.remove('hidden');
      lastScrollY = currentScrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    document.body.classList.toggle('menu-open', menuOpen);
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMenuOpen(false);
      menuToggleRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.classList.remove('menu-open');
    };
  }, [menuOpen]);

  return (
    <header className="site-header" id="topo">
      <div className="brand-group">
        <Link className="brand-main" href="/#home" aria-label="Grupo Mais Barato">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={asset('Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp')} alt="Logo Grupo Mais Barato" />
        </Link>
      </div>

      <button ref={menuToggleRef} type="button" className="menu-toggle" aria-expanded={menuOpen} aria-controls="main-menu" aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'} onClick={() => setMenuOpen((value) => !value)}>
        {menuOpen ? <X size={26} /> : <Menu size={26} />}
      </button>

      {menuOpen && (
        <div
          className="mobile-menu-backdrop"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      <nav className={`main-menu ${menuOpen ? 'is-open open' : ''}`} id="main-menu" aria-label="Navegação principal">
        <Link id="menu-link-sobre" href="/sobre-nos" onClick={() => setMenuOpen(false)}>Sobre</Link>
        <Link id="menu-link-noticias" href="/noticias" onClick={() => setMenuOpen(false)}>Notícias</Link>
        <div className="dropdown">
          <a id="menu-link-marcas" href="/#marcas" className="drop-link" aria-haspopup="true" aria-label="Nossas Marcas e submenu" onClick={() => setMenuOpen(false)}>Nossas Marcas</a>
          <div className="drop-panel" aria-label="Submenu Nossas Marcas">
            {[
              ['icon-b-supermercadoo.webp', '+B Supermercados', 'super'],
              ['icon-b-farmaa.webp', '+B Farma', 'farma'],
              ['icon-vila-plaza.webp', 'Villa Plaza', 'plaza'],
              ['icon-vila-plaza.webp', 'Villa Plaza Park', 'park'],
              ['icon-the-winee.webp', 'The Wine Experience', 'wine'],
            ].map(([logo, label, id]) => (
              <a id={`menu-link-${id}`} href={`/#marca-${id}`} className={`dropdown-item-rich brand-${id}`} key={id} onClick={() => setMenuOpen(false)}>
                <span className="dropdown-item-logo">{/* eslint-disable-next-line @next/next/no-img-element */}<img src={asset(`Icones Submarcas/${logo}`)} alt={label} /></span>
                <span className="dropdown-item-text">{label}</span>
              </a>
            ))}
          </div>
        </div>
        <div
          className={`dropdown contacts-dropdown ${contactsMenuOpen ? 'is-open' : ''}`}
          onMouseEnter={openContactsMenu}
          onMouseLeave={scheduleContactsMenuClose}
        >
          <a id="menu-link-contato" href="/#contato" className="drop-link btn-header-contact" aria-haspopup="true" aria-label="Contato e submenu" onClick={() => setMenuOpen(false)}>Contato</a>
          <div className="drop-panel" aria-label="Submenu Contatos">
            <a id="menu-link-unidades" href="/#store-locator-teaser" onClick={() => { closeContactsMenu(); setMenuOpen(false); }}>Nossas Unidades</a>
            <a id="menu-link-trabalhe" href="https://grupomaisbarato.portaldetalentos.senior.com.br/" target="_blank" rel="noopener" onClick={() => { closeContactsMenu(); setMenuOpen(false); }}>Trabalhe Conosco</a>
          </div>
        </div>
      </nav>
    </header>
  );
}
