'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ExternalLink, FileText, LogOut, Menu, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useState } from 'react';

const navItems = [
  { href: '/admin/posts', label: 'Publicações', icon: FileText },
  { href: '/admin/settings', label: 'Configurações', icon: SlidersHorizontal },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const scrollY = window.scrollY;
    const originalBodyStyle = document.body.getAttribute('style');
    Object.assign(document.body.style, {
      position: 'fixed',
      top: `-${scrollY}px`,
      left: '0',
      right: '0',
      width: '100%',
      overflow: 'hidden',
    });

    return () => {
      if (originalBodyStyle === null) document.body.removeAttribute('style');
      else document.body.setAttribute('style', originalBodyStyle);
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const logout = async () => { await fetch('/api/admin/session', { method: 'DELETE' }); router.push('/admin/login'); };

  return <div className="admin-shell flex min-h-screen">
    <div className={`fixed inset-0 z-40 bg-[#120e0e]/40 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
    <aside className={`admin-sidebar group/sidebar fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col text-white transition-transform lg:fixed lg:inset-y-0 lg:top-0 lg:h-screen lg:w-[72px] lg:flex-none lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="admin-sidebar-inner absolute inset-y-0 left-0 flex w-[270px] flex-col overflow-y-auto overscroll-y-contain border-r border-white/10 bg-[#120e0e] text-white shadow-[12px_0_30px_rgba(18,14,14,0.12)] transition-[width] duration-300 lg:w-[72px] lg:group-hover/sidebar:w-[270px]">
      <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-4">
        <Link href="/admin/posts" className="flex min-w-0 items-center justify-center gap-3 lg:group-hover/sidebar:justify-start" onClick={() => setOpen(false)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/assets/Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp" alt="Grupo Mais Barato" className="h-10 w-10 shrink-0 object-contain" />
          <span className="min-w-0 overflow-hidden whitespace-nowrap opacity-100 transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[170px] lg:group-hover/sidebar:opacity-100"><strong className="block text-sm tracking-wide">GRUPO +B</strong><small className="text-xs text-white/50">Painel editorial</small></span>
        </Link>
        <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
      </div>
      <div className="px-3 py-5">
        <p className="mb-3 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c49a45] transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100">Gestão de conteúdo</p>
        <nav className="space-y-1">
          {navItems.map(({ href, label, icon: Icon }) => <Link key={href} href={href} title={label} aria-label={label} data-active={pathname.startsWith(href)} className="admin-sidebar-link flex h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm font-medium text-white/70 transition-colors lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3" onClick={() => setOpen(false)}><Icon size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" /><span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">{label}</span></Link>)}
        </nav>
      </div>
      <div className="mt-auto space-y-1 border-t border-white/10 px-3 pb-4 pt-3">
        <Link href="/" target="_blank" title="Ver site público" aria-label="Ver site público" className="admin-sidebar-link flex h-12 items-center justify-start gap-3 rounded-xl px-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3"><ExternalLink size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" /><span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">Ver site público</span></Link>
        <button title="Sair do painel" aria-label="Sair do painel" className="admin-sidebar-link flex h-12 w-full items-center justify-start gap-3 rounded-xl px-3 text-left text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3" onClick={logout}><LogOut size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" /><span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">Sair do painel</span></button>
      </div>
      </div>
    </aside>
    <div className="min-w-0 flex-1 lg:ml-[72px]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e7e0d6] bg-[#f7f5f1]/95 px-5 backdrop-blur lg:px-8">
        <button className="rounded-xl border border-[#ddd6cc] bg-white p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
        <div className="hidden lg:block"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#8e8780]">Central de conteúdo</p><p className="text-sm text-[#4d4845]">Gerencie as notícias e a presença digital do Grupo +B.</p></div>
        <div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">Administrador</p><p className="text-xs text-[#8e8780]">Acesso editorial</p></div><div className="grid h-10 w-10 place-items-center rounded-full bg-[#c49a45] font-bold text-[#120e0e]">A</div></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-5 lg:p-8">{children}</main>
    </div>
  </div>;
}
