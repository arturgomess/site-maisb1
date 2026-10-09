'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { BarChart3, ExternalLink, FileText, LogOut, Menu, Settings2, UsersRound, X } from 'lucide-react';
import { useState } from 'react';
import { getRoleLabel, hasFullAdminAccess } from '../../lib/admin-access';
import type { AdminSessionUser } from '../../lib/cms-auth';

type AdminNavItem = { href: string; label: string; icon: typeof FileText; permission: 'canManagePosts' | 'canManageSettings' | 'canManageAccess' | 'canManageAnalytics' };

const contentItems: AdminNavItem[] = [{ href: '/admin/posts', label: 'Publicações', icon: FileText, permission: 'canManagePosts' }];
const administrationItems: AdminNavItem[] = [
  { href: '/admin/access', label: 'Gestão de Acessos', icon: UsersRound, permission: 'canManageAccess' as const },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3, permission: 'canManageAnalytics' as const },
  { href: '/admin/settings', label: 'Configurações', icon: Settings2, permission: 'canManageSettings' as const },
];

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}

export function AdminShell({ children, user }: { children: React.ReactNode; user: AdminSessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const visibleContentItems = contentItems.filter(({ permission }) => user[permission]);
  const visibleAdminItems = administrationItems.filter(({ permission }) => user[permission]);
  const fullAccess = hasFullAdminAccess({ posts: user.canManagePosts, settings: user.canManageSettings, access: user.canManageAccess, analytics: user.canManageAnalytics }, user.isActive);

  const logout = async () => {
    await fetch('/api/admin/session', { method: 'DELETE' });
    router.push('/admin/login');
    router.refresh();
  };

  const nav = (items: AdminNavItem[]) => items.map(({ href, label, icon: Icon }) => (
    <Link key={href} href={href} title={label} aria-label={label} aria-current={pathname.startsWith(href) ? 'page' : undefined} data-active={pathname.startsWith(href)} className="admin-sidebar-link flex h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-white/70 transition-colors lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3" onClick={() => setOpen(false)}>
      <Icon size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" />
      <span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">{label}</span>
    </Link>
  ));

  return <div className="admin-shell flex min-h-screen">
    <div className={`fixed inset-0 z-40 bg-[#120e0e]/40 lg:hidden ${open ? 'block' : 'hidden'}`} onClick={() => setOpen(false)} />
    <aside className={`admin-sidebar group/sidebar fixed inset-y-0 left-0 z-50 flex w-[270px] flex-col text-white transition-transform lg:fixed lg:inset-y-0 lg:top-0 lg:h-screen lg:w-[72px] lg:flex-none lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="admin-sidebar-inner absolute inset-y-0 left-0 flex w-[270px] flex-col border-r border-white/10 bg-[#120e0e] text-white shadow-[12px_0_30px_rgba(18,14,14,0.12)] transition-[width] duration-300 lg:w-[72px] lg:group-hover/sidebar:w-[270px]">
        <div className="flex h-[72px] items-center justify-between border-b border-white/10 px-4">
          <Link href="/admin" className="flex min-w-0 items-center justify-center gap-3 lg:group-hover/sidebar:justify-start" onClick={() => setOpen(false)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/assets/Logo Marca Grupo MaisB/Logo Grupo Mais Barato (White Monoegativo).webp" alt="Grupo Mais Barato" className="h-10 w-10 shrink-0 object-contain" />
            <span className="min-w-0 overflow-hidden whitespace-nowrap opacity-100 transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[170px] lg:group-hover/sidebar:opacity-100"><strong className="block text-sm tracking-wide">GRUPO +B</strong><small className="text-xs text-white/50">Painel editorial</small></span>
          </Link>
          <button className="rounded-lg p-2 text-white/60 hover:bg-white/10 lg:hidden" onClick={() => setOpen(false)} aria-label="Fechar menu"><X size={20} /></button>
        </div>
        {visibleContentItems.length > 0 && <div className="px-3 py-5">
          <p className="mb-3 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c49a45] transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100">Gestão de conteúdo</p>
          <nav aria-label="Gestão de conteúdo" className="space-y-1">{nav(visibleContentItems)}</nav>
        </div>}
        {visibleAdminItems.length > 0 && <div className="px-3 pt-1">
          <p className="mb-3 overflow-hidden whitespace-nowrap px-3 text-[10px] font-bold uppercase tracking-[0.18em] text-[#c49a45] transition-opacity lg:opacity-0 lg:group-hover/sidebar:opacity-100">Administração</p>
          <nav aria-label="Administração" className="space-y-1">{nav(visibleAdminItems)}</nav>
        </div>}
        <div className="mt-auto space-y-1 border-t border-white/10 px-3 pb-4 pt-3">
          <Link href="/" target="_blank" rel="noreferrer" title="Ver site público" aria-label="Ver site público" className="admin-sidebar-link flex h-12 items-center gap-3 rounded-xl px-3 text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3"><ExternalLink size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" /><span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">Ver site público</span></Link>
          <button title="Sair do painel" aria-label="Sair do painel" className="admin-sidebar-link flex h-12 w-full items-center gap-3 rounded-xl px-3 text-left text-sm text-white/60 transition-colors hover:bg-white/10 hover:text-white lg:mx-auto lg:w-12 lg:justify-center lg:gap-0 lg:px-0 lg:group-hover/sidebar:mx-0 lg:group-hover/sidebar:w-full lg:group-hover/sidebar:justify-start lg:group-hover/sidebar:gap-3 lg:group-hover/sidebar:px-3" onClick={logout}><LogOut size={21} strokeWidth={1.9} className="admin-sidebar-icon shrink-0" /><span className="overflow-hidden whitespace-nowrap transition-opacity lg:max-w-0 lg:opacity-0 lg:group-hover/sidebar:max-w-[180px] lg:group-hover/sidebar:opacity-100">Sair do painel</span></button>
        </div>
      </div>
    </aside>
    <div className="min-w-0 flex-1 lg:ml-[72px]">
      <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between border-b border-[#e7e0d6] bg-[#f7f5f1]/95 px-5 backdrop-blur lg:px-8">
        <button className="rounded-xl border border-[#ddd6cc] bg-white p-2 lg:hidden" onClick={() => setOpen(true)} aria-label="Abrir menu"><Menu size={20} /></button>
        <p className="hidden text-sm text-[#4d4845] lg:block">Sua presença digital do Grupo +B.</p>
        <div className="ml-auto flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold">{user.name}</p><p className="text-xs text-[#8e8780]">{fullAccess ? 'Acesso completo' : getRoleLabel(user.role)}</p></div><div aria-hidden="true" className="grid h-10 w-10 place-items-center rounded-full bg-[#c49a45] font-bold text-[#120e0e]">{initials(user.name)}</div></div>
      </header>
      <main className="mx-auto max-w-[1440px] p-5 lg:p-8">{children}</main>
    </div>
  </div>;
}
