'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, CircleUserRound, FileText, Filter, KeyRound, LoaderCircle, Plus, RefreshCw, Search, Settings2, ShieldCheck, UserRoundX, UsersRound, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { hasFullAdminAccess } from '../../lib/admin-access';
import type { AdminPermissions } from '../../lib/admin-access';

type AccessUser = {
  id: string; name: string; email: string; role: string; roleLabel: string;
  permissions: AdminPermissions;
  isActive: boolean; lastAccessAt: string | null; createdAt: string;
};

type ListResponse = {
  users: AccessUser[];
  stats: { total: number; active: number; inactive: number };
  pagination: { page: number; pageSize: number; total: number; pages: number };
};

const dateTime = new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' });

function avatarInitials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}

function roleClasses(role: string) {
  if (role === 'ADMINISTRATOR') return 'bg-[#fff5df] text-[#8c6314]';
  if (role === 'EDITOR') return 'bg-[#e8f1ff] text-[#245a9b]';
  return 'bg-[#f0eef0] text-[#57535b]';
}

function ConfirmDialog({ user, busy, error, onCancel, onConfirm }: { user: AccessUser; busy: boolean; error: string; onCancel: () => void; onConfirm: () => void }) {
  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !busy) onCancel(); };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [busy, onCancel]);

  return <div className="fixed inset-0 z-[100] grid place-items-center bg-[#120e0e]/45 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget && !busy) onCancel(); }}>
    <section role="alertdialog" aria-modal="true" aria-labelledby="deactivate-title" aria-describedby="deactivate-description" className="w-full max-w-md rounded-2xl border border-[#e7e0d6] bg-white p-6 shadow-2xl">
      <div className="grid size-11 place-items-center rounded-xl bg-[#fff0ef] text-[#a2352e]"><UserRoundX size={20} /></div>
      <h2 id="deactivate-title" className="mt-4 text-xl font-bold">Desativar {user.name}?</h2>
      <p id="deactivate-description" className="mt-2 text-sm leading-6 text-[#726d68]">A conta perderá o acesso e as sessões atuais serão encerradas. Você pode reativá-la depois.</p>
      {error && <p role="alert" className="mt-4 rounded-lg bg-[#fff2f0] px-3 py-2 text-sm text-[#9f342d]">{error}</p>}
      <div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={onCancel} disabled={busy}>Cancelar</Button><Button variant="danger" onClick={onConfirm} disabled={busy}>{busy ? <LoaderCircle size={16} className="animate-spin" /> : null}Desativar usuário</Button></div>
    </section>
  </div>;
}

export function AccessManagement({ initialCreated = false }: { initialCreated?: boolean }) {
  const [data, setData] = useState<ListResponse | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(initialCreated ? 'Usuário cadastrado com sucesso. A conta já pode entrar com as credenciais definidas.' : '');
  const [pendingDeactivate, setPendingDeactivate] = useState<AccessUser | null>(null);
  const [busyUserId, setBusyUserId] = useState('');
  const [dialogError, setDialogError] = useState('');
  const requestVersion = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setSearch(searchInput.trim()); setPage(1); }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: '10' });
      if (search) params.set('search', search);
      if (role) params.set('role', role);
      if (status) params.set('status', status);
      const response = await fetch(`/api/admin/users?${params}`, { cache: 'no-store' });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar usuários.');
      if (version !== requestVersion.current) return;
      if (result.pagination.pages > 0 && page > result.pagination.pages) { setPage(result.pagination.pages); return; }
      setData(result as ListResponse);
    } catch (cause) {
      if (version === requestVersion.current) setError(cause instanceof Error ? cause.message : 'Falha de conexão com a gestão de acessos.');
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, role, search, status]);

  useEffect(() => { void load(); }, [load]);

  const clearFilters = () => { setSearchInput(''); setSearch(''); setRole(''); setStatus(''); setPage(1); };

  const deactivate = async () => {
    if (!pendingDeactivate) return;
    setBusyUserId(pendingDeactivate.id);
    setDialogError('');
    try {
      const response = await fetch(`/api/admin/users/${pendingDeactivate.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: false }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível desativar a conta.');
      setPendingDeactivate(null);
      setNotice('Usuário desativado. As sessões ativas foram encerradas.');
      await load();
    } catch (cause) {
      setDialogError(cause instanceof Error ? cause.message : 'Não foi possível desativar a conta.');
    } finally {
      setBusyUserId('');
    }
  };

  const activate = async (user: AccessUser) => {
    setBusyUserId(user.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isActive: true }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível ativar a conta.');
      setNotice('Usuário ativado.');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível ativar a conta.');
    } finally {
      setBusyUserId('');
    }
  };

  const hasFilters = Boolean(searchInput || role || status);
  const users = data?.users || [];
  const stats = data?.stats || { total: 0, active: 0, inactive: 0 };
  const pagination = data?.pagination;

  return <div className="space-y-7">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
      <div className="flex items-start gap-4">
        <div className="hidden size-14 shrink-0 place-items-center rounded-2xl bg-[#f4eee3] text-[#a77919] sm:grid"><UsersRound size={26} /></div>
        <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a77919]">Administração</p><h1 className="mt-1 text-3xl font-bold sm:text-4xl">Gestão de Acessos</h1><p className="mt-2 text-sm text-[#77716b] sm:text-base">Cadastre usuários e defina os níveis de acesso à plataforma.</p></div>
      </div>
      <Button asChild variant="gold" size="lg"><Link href="/admin/access/new"><Plus size={18} />Novo usuário</Link></Button>
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <Card><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-[#f4eee3] text-[#a77919]"><UsersRound size={21} /></span><div><p className="text-sm text-[#77716b]">Total de usuários</p><p className="mt-1 text-2xl font-bold">{stats.total}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-[#e9f7ee] text-[#24965b]"><CheckCircle2 size={21} /></span><div><p className="text-sm text-[#77716b]">Usuários ativos</p><p className="mt-1 text-2xl font-bold">{stats.active}</p></div></CardContent></Card>
      <Card><CardContent className="flex items-center gap-4 p-5"><span className="grid size-11 place-items-center rounded-xl bg-[#f0eff1] text-[#79777d]"><CircleUserRound size={21} /></span><div><p className="text-sm text-[#77716b]">Usuários inativos</p><p className="mt-1 text-2xl font-bold">{stats.inactive}</p></div></CardContent></Card>
    </div>

    <section aria-label="Filtros de usuários" className="grid gap-3 md:grid-cols-[minmax(220px,1fr)_220px_220px_auto]">
      <label className="relative"><span className="sr-only">Buscar por nome ou e-mail</span><Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#8e8780]" /><input value={searchInput} onChange={(event) => setSearchInput(event.target.value)} placeholder="Buscar por nome ou e-mail..." className="h-12 w-full rounded-xl border border-[#ded8d0] bg-white pl-11 pr-10 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" />{searchInput && <button type="button" onClick={() => setSearchInput('')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#77716b] hover:bg-[#f4f1ec]" aria-label="Limpar busca"><X size={16} /></button>}</label>
      <label className="relative"><span className="sr-only">Filtrar por perfil</span><Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#77716b]" /><select value={role} onChange={(event) => { setRole(event.target.value); setPage(1); }} className="h-12 w-full rounded-xl border border-[#ded8d0] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20"><option value="">Todos os perfis</option><option value="EDITOR">Editor</option><option value="ADMINISTRATOR">Administrador</option><option value="CUSTOM">Personalizado</option></select></label>
      <label><span className="sr-only">Filtrar por status</span><select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="h-12 w-full rounded-xl border border-[#ded8d0] bg-white px-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20"><option value="">Todos os status</option><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>
      <Button variant="outline" onClick={clearFilters} disabled={!hasFilters && !notice}><RefreshCw size={16} />Limpar filtros</Button>
    </section>

    {notice && <div role="status" className="flex items-center justify-between rounded-xl border border-[#b8dfc5] bg-[#edf9f0] px-4 py-3 text-sm text-[#287442]">{notice}<button type="button" onClick={() => setNotice('')} aria-label="Fechar aviso"><X size={16} /></button></div>}
    {error && <div role="alert" className="rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-4 py-3 text-sm text-[#9f342d]">{error}</div>}

    <Card><CardContent className="p-0">
      <div className="flex items-center justify-between border-b border-[#e7e0d6] px-5 py-4"><div><h2 className="font-semibold">Usuários</h2><p className="mt-1 text-xs text-[#8e8780]">{pagination?.total ?? 0} resultado(s)</p></div>{loading && <LoaderCircle size={18} className="animate-spin text-[#a77919]" aria-label="Atualizando usuários" />}</div>
      <div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-[#fbfaf7] text-xs uppercase tracking-wide text-[#77716b]"><tr><th className="px-5 py-3 font-semibold">Usuário</th><th className="px-4 py-3 font-semibold">E-mail</th><th className="px-4 py-3 font-semibold">Perfil de acesso</th><th className="px-4 py-3 font-semibold">Status</th><th className="px-4 py-3 font-semibold">Último acesso</th><th className="px-4 py-3 text-right font-semibold">Ações</th></tr></thead><tbody className="divide-y divide-[#eee9e2]">
        {users.map((user) => <tr key={user.id} className="admin-table-row"><td className="px-5 py-4"><div className="flex items-center gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-full font-semibold ${user.role === 'ADMINISTRATOR' ? 'bg-[#d5a02c] text-[#120e0e]' : 'bg-[#ecebed] text-[#4a474c]'}`}>{avatarInitials(user.name)}</span><div className="min-w-0"><p className="truncate font-semibold">{user.name}</p><p className="text-xs text-[#8e8780]">{hasFullAdminAccess(user.permissions, user.isActive) ? 'Acesso completo' : user.roleLabel}</p></div></div></td><td className="max-w-[220px] truncate px-4 py-4 text-[#4d4845]">{user.email}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-semibold ${roleClasses(user.role)}`}>{user.roleLabel}</span></td><td className="px-4 py-4"><span className="inline-flex items-center gap-2"><span className={`size-2 rounded-full ${user.isActive ? 'bg-[#22a35a]' : 'bg-[#c7423b]'}`} />{user.isActive ? 'Ativo' : 'Inativo'}</span></td><td className="whitespace-nowrap px-4 py-4 text-[#4d4845]">{user.lastAccessAt ? dateTime.format(new Date(user.lastAccessAt)) : 'Nunca'}</td><td className="px-4 py-4"><div className="flex justify-end gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/access/${user.id}`}><FileText size={15} />Editar</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/admin/access/${user.id}?reset=1`}><KeyRound size={15} />Redefinir senha</Link></Button>{user.isActive ? <Button size="sm" variant="ghost" disabled={busyUserId === user.id} onClick={() => { setDialogError(''); setPendingDeactivate(user); }}>Desativar</Button> : <Button size="sm" variant="ghost" disabled={busyUserId === user.id} onClick={() => void activate(user)}>Ativar</Button>}</div></td></tr>)}
      </tbody></table></div>

      <div className="divide-y divide-[#eee9e2] lg:hidden">{users.map((user) => <article key={user.id} className="space-y-3 p-4">
        <div className="flex items-start gap-3"><span className={`grid size-10 shrink-0 place-items-center rounded-full font-semibold ${user.role === 'ADMINISTRATOR' ? 'bg-[#d5a02c] text-[#120e0e]' : 'bg-[#ecebed] text-[#4a474c]'}`}>{avatarInitials(user.name)}</span><div className="min-w-0 flex-1"><p className="break-words font-semibold">{user.name}</p><p className="break-all text-sm text-[#77716b]">{user.email}</p></div></div>
        <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs font-semibold ${roleClasses(user.role)}`}>{user.roleLabel}</span><span className={`rounded-full px-3 py-1 text-xs font-semibold ${user.isActive ? 'bg-[#e9f7ee] text-[#287442]' : 'bg-[#fff0ef] text-[#9f342d]'}`}>{user.isActive ? 'Ativo' : 'Inativo'}</span></div>
        <p className="text-xs text-[#77716b]">Último acesso: {user.lastAccessAt ? dateTime.format(new Date(user.lastAccessAt)) : 'Nunca'}</p>
        <div className="flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link href={`/admin/access/${user.id}`}>Editar acesso</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/admin/access/${user.id}?reset=1`}>Redefinir senha</Link></Button>{user.isActive ? <Button size="sm" variant="ghost" onClick={() => { setDialogError(''); setPendingDeactivate(user); }}>Desativar</Button> : <Button size="sm" variant="ghost" onClick={() => void activate(user)}>Ativar</Button>}</div>
      </article>)}</div>

      {!loading && users.length === 0 && <div className="px-6 py-14 text-center"><div className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#f4f1ec] text-[#8e8780]"><UsersRound size={22} /></div><p className="mt-4 font-semibold">{hasFilters ? 'Nenhum usuário encontrado' : 'Ainda não há usuários cadastrados'}</p><p className="mt-1 text-sm text-[#77716b]">{hasFilters ? 'Ajuste ou limpe os filtros para ver outros resultados.' : 'Cadastre a primeira conta de acesso do painel.'}</p>{hasFilters && <Button variant="ghost" className="mt-3" onClick={clearFilters}>Limpar filtros</Button>}</div>}
      {pagination && pagination.pages > 1 && <div className="flex flex-col gap-3 border-t border-[#e7e0d6] px-4 py-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-[#77716b]">Página {pagination.page} de {pagination.pages}</p><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1 || loading} onClick={() => setPage((current) => Math.max(1, current - 1))}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= pagination.pages || loading} onClick={() => setPage((current) => Math.min(pagination.pages, current + 1))}>Próxima</Button></div></div>}
    </CardContent></Card>

    <section className="flex flex-col gap-4 rounded-2xl border border-[#eadfcd] bg-[#fbf7ef] p-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><span className="grid size-10 shrink-0 place-items-center rounded-full bg-[#d5a02c] text-[#120e0e]"><ShieldCheck size={19} /></span><div><h2 className="font-semibold">Sobre os perfis de acesso</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-[#6f685f]">Defina se a pessoa poderá publicar conteúdo, alterar configurações ou administrar outras contas. O servidor valida cada permissão em todas as páginas e operações.</p></div></div><div className="flex gap-2 text-xs text-[#77716b]"><span className="inline-flex items-center gap-1"><FileText size={14} />Publicações</span><span className="inline-flex items-center gap-1"><Settings2 size={14} />Configurações</span></div></section>

    {pendingDeactivate && <ConfirmDialog user={pendingDeactivate} busy={busyUserId === pendingDeactivate.id} error={dialogError} onCancel={() => setPendingDeactivate(null)} onConfirm={() => void deactivate()} />}
  </div>;
}
