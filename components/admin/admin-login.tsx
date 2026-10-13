'use client';

import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, LoaderCircle, LockKeyhole } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { getAdminHomeHref, isSecurePassword, isValidAdminEmail } from '../../lib/admin-access';

type SessionResponse = { configured: boolean; authenticated: boolean; needsBootstrap: boolean };
type SessionUser = { mustChangePassword: boolean; permissions: { posts: boolean; settings: boolean; access: boolean } };

export function AdminLogin() {
  const router = useRouter();
  const [status, setStatus] = useState<SessionResponse | null>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bootstrapPassword, setBootstrapPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch('/api/admin/session', { cache: 'no-store' }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível verificar o painel.');
      if (alive) setStatus(result as SessionResponse);
    }).catch((cause) => { if (alive) setError(cause instanceof Error ? cause.message : 'Falha de conexão com o painel.'); }).finally(() => { if (alive) setChecking(false); });
    return () => { alive = false; };
  }, []);

  const isBootstrap = status?.needsBootstrap === true;

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    if (isBootstrap) {
      if (name.trim().length < 2) { setError('Informe o nome completo do administrador.'); setLoading(false); return; }
      if (!isValidAdminEmail(email.trim().toLowerCase())) { setError('Informe um e-mail válido.'); setLoading(false); return; }
      if (!isSecurePassword(password)) { setError('A nova senha precisa ter exatamente 8 caracteres.'); setLoading(false); return; }
      if (password !== confirmPassword) { setError('As senhas não coincidem.'); setLoading(false); return; }
    } else if (!isValidAdminEmail(email.trim().toLowerCase()) || !password) {
      setError('Informe seu e-mail e senha.'); setLoading(false); return;
    }

    try {
      const body = isBootstrap
        ? { action: 'bootstrap', name: name.trim(), email: email.trim().toLowerCase(), bootstrapPassword, password, confirmPassword }
        : { email: email.trim().toLowerCase(), password };
      const response = await fetch('/api/admin/session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await response.json();
      if (!response.ok) { setError(data.error || 'Não foi possível entrar.'); return; }
      const user = data.user as SessionUser;
      router.push(user.mustChangePassword ? '/admin/change-password' : getAdminHomeHref(user.permissions));
      router.refresh();
    } catch {
      setError('Falha de conexão com o painel. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (checking) return <main className="grid min-h-screen place-items-center bg-[#120e0e] text-[#c49a45]"><LoaderCircle className="animate-spin" aria-label="Verificando autenticação" /></main>;

  return <main className="min-h-screen bg-[#120e0e] px-5 py-10 text-white"><div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_420px]">
    <div className="hidden lg:block"><span className="mb-5 block text-xs font-bold uppercase tracking-[0.22em] text-[#c49a45]">Área restrita</span><h1 className="max-w-xl font-serif text-6xl leading-[0.98]">Conteúdo que mantém a marca em movimento.</h1><p className="mt-6 max-w-lg text-lg leading-8 text-white/60">O painel editorial do Grupo +B centraliza publicação, SEO, imagens e distribuição das matérias.</p></div>
    <form noValidate onSubmit={submit} className="rounded-3xl border border-white/10 bg-[#191616] p-8 shadow-2xl sm:p-10">
      <div className="mb-8 flex items-center gap-3"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#c49a45] text-[#120e0e]"><LockKeyhole size={22} /></div><div><p className="font-bold">Painel editorial</p><p className="text-xs text-white/50">Grupo Mais Barato</p></div></div>
      <h2 className="text-2xl font-bold">{isBootstrap ? 'Ativar conta administrativa' : 'Entrar no CMS'}</h2>
      <p className="mt-2 text-sm leading-6 text-white/55">{isBootstrap ? 'Use a senha atual do painel para criar a conta individual do administrador principal.' : 'Entre com o e-mail e a senha da sua conta.'}</p>
      {!status?.configured && <p role="alert" className="mt-4 rounded-xl border border-[#f29a92]/30 bg-[#9f342d]/20 px-3 py-2 text-sm text-[#f29a92]">Banco de dados indisponível. O acesso ao painel não pode ser validado agora.</p>}
      {isBootstrap && <label htmlFor="admin-name" className="mt-6 block text-sm font-semibold">Nome completo<Input id="admin-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} className="mt-2 border-white/15 bg-[#120e0e] text-white placeholder:text-white/35" placeholder="Nome do administrador" /></label>}
      <label htmlFor="admin-email" className="mt-6 block text-sm font-semibold">E-mail de acesso<input id="admin-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#120e0e] px-4 text-white outline-none placeholder:text-white/35 focus:border-[#c49a45]" placeholder="voce@empresa.com" /></label>
      {isBootstrap && <label htmlFor="bootstrap-password" className="mt-4 block text-sm font-semibold">Senha atual do painel<input id="bootstrap-password" type="password" autoComplete="current-password" value={bootstrapPassword} onChange={(event) => setBootstrapPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#120e0e] px-4 text-white outline-none placeholder:text-white/35 focus:border-[#c49a45]" /></label>}
      <label htmlFor="admin-password" className="mt-4 block text-sm font-semibold">{isBootstrap ? 'Nova senha individual' : 'Senha'}<input id="admin-password" type="password" autoComplete={isBootstrap ? 'new-password' : 'current-password'} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#120e0e] px-4 text-white outline-none placeholder:text-white/35 focus:border-[#c49a45]" placeholder="••••••••••••" /></label>
      {isBootstrap && <><label htmlFor="confirm-admin-password" className="mt-4 block text-sm font-semibold">Confirmar nova senha<input id="confirm-admin-password" type="password" autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-white/15 bg-[#120e0e] px-4 text-white outline-none placeholder:text-white/35 focus:border-[#c49a45]" /></label><p className="mt-2 text-xs leading-5 text-white/50">Use exatamente 8 caracteres. Não é necessário combinar letras e números. A senha compartilhada deixa de funcionar após a ativação.</p></>}
      {error && <p role="alert" className="mt-4 rounded-xl bg-[#9f342d]/20 px-3 py-2 text-sm text-[#f29a92]">{error}</p>}
      <Button type="submit" variant="gold" size="lg" className="mt-6 w-full" disabled={loading || !status?.configured}>{loading ? <LoaderCircle className="animate-spin" size={17} /> : null}{loading ? 'Validando...' : isBootstrap ? 'Ativar conta' : <>Acessar painel <ArrowRight size={17} /></>}</Button>
      <p className="mt-6 text-center text-xs text-white/35">Acesso protegido por sessão individual HttpOnly.</p>
    </form>
  </div></main>;
}
