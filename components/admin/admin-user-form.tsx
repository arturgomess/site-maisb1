'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, BarChart3, Check, CheckCircle2, Eye, EyeOff, FileText, Info, LoaderCircle, LockKeyhole, PencilLine, Plus, Settings2, ShieldCheck, SlidersHorizontal, UserRound, UsersRound, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { getRoleLabel, getRolePermissions, isSecurePassword, isValidAdminEmail, type AdminPermissions, type AdminRole } from '../../lib/admin-access';

type AccessUser = {
  id: string; name: string; email: string; role: AdminRole;
  permissions: AdminPermissions; isActive: boolean; mustChangePassword: boolean;
};

type AuditEvent = {
  id: string; action: string; details: Record<string, unknown> | null; createdAt: string;
  actor: { name: string; email: string } | null;
};

const areas: { key: keyof AdminPermissions; label: string; description: string; icon: typeof FileText }[] = [
  { key: 'posts', label: 'Publicações', description: 'Criar, editar e gerenciar postagens.', icon: FileText },
  { key: 'settings', label: 'Configurações', description: 'Acessar e alterar as configurações da plataforma.', icon: Settings2 },
  { key: 'access', label: 'Gestão de Acessos', description: 'Cadastrar, editar e gerenciar outros usuários.', icon: UsersRound },
  { key: 'analytics', label: 'Analytics', description: 'Visualizar os dados de desempenho do site.', icon: BarChart3 },
];

const eventLabels: Record<string, string> = {
  ACCOUNT_BOOTSTRAPPED: 'Conta administrativa ativada', ACCOUNT_CREATED: 'Conta criada', PROFILE_UPDATED: 'Perfil atualizado',
  PERMISSIONS_UPDATED: 'Permissões modificadas', ACCOUNT_ACTIVATED: 'Conta ativada', ACCOUNT_DEACTIVATED: 'Conta desativada',
  PASSWORD_RESET: 'Senha redefinida', PASSWORD_CHANGED: 'Senha alterada',
};

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase() || '').join('') || '?';
}

function eventSummary(event: AuditEvent) {
  if (event.action === 'PERMISSIONS_UPDATED') return 'Permissões da conta foram modificadas.';
  if (event.action === 'PROFILE_UPDATED') return 'Informações básicas ou perfil foram atualizados.';
  if (event.action === 'ACCOUNT_DEACTIVATED') return 'A conta perdeu o acesso ao painel.';
  if (event.action === 'ACCOUNT_ACTIVATED') return 'A conta voltou a ter acesso ao painel.';
  if (event.action === 'PASSWORD_RESET') return 'Uma nova senha temporária foi definida; a troca é obrigatória no próximo acesso.';
  if (event.action === 'PASSWORD_CHANGED') return 'A senha da conta foi alterada.';
  return 'A conta de acesso foi criada.';
}

export function AdminUserForm({ userId, currentUserId }: { userId?: string; currentUserId: string }) {
  const router = useRouter();
  const editing = Boolean(userId);
  const [user, setUser] = useState<AccessUser | null>(null);
  const [history, setHistory] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(Boolean(userId));
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [role, setRole] = useState<AdminRole>('CUSTOM');
  const [permissions, setPermissions] = useState<AdminPermissions>({ posts: true, settings: false, access: false, analytics: false });
  const [isActive, setIsActive] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);

  useEffect(() => {
    if (!userId) return;
    let alive = true;
    fetch(`/api/admin/users/${userId}`, { cache: 'no-store' }).then(async (response) => {
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os dados do usuário.');
      if (!alive) return;
      setUser(result.user);
      setHistory(result.history || []);
      setName(result.user.name);
      setEmail(result.user.email);
      setRole(result.user.role);
      setPermissions(result.user.permissions);
      setIsActive(result.user.isActive);
    }).catch((cause) => { if (alive) setError(cause instanceof Error ? cause.message : 'Falha ao carregar usuário.'); }).finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [userId]);

  const displayName = name.trim() || (editing ? 'Usuário' : 'Nome do usuário');
  const displayEmail = email.trim() || 'email@empresa.com';
  const roleLabel = getRoleLabel(role);
  const activeAreas = useMemo(() => areas.filter(({ key }) => permissions[key]), [permissions]);
  const profileDescription = role === 'EDITOR' ? 'Acesso apenas às publicações.' : role === 'ADMINISTRATOR' ? 'Acesso completo à plataforma.' : 'Defina manualmente as permissões.';

  const selectRole = (nextRole: AdminRole) => {
    setRole(nextRole);
    if (nextRole !== 'CUSTOM') setPermissions(getRolePermissions(nextRole));
  };

  const togglePermission = (key: keyof AdminPermissions) => {
    if (role !== 'CUSTOM') return;
    setPermissions((current) => ({ ...current, [key]: !current[key] }));
  };

  const validate = () => {
    const next: Record<string, string> = {};
    if (name.trim().length < 2) next.name = 'Informe o nome completo.';
    if (!isValidAdminEmail(email.trim().toLowerCase())) next.email = 'Informe um e-mail válido.';
    if (!editing && !isSecurePassword(password)) next.password = 'Use exatamente 8 caracteres.';
    if (editing && password && !isSecurePassword(password)) next.password = 'Use exatamente 8 caracteres.';
    if ((!editing || password) && password !== confirmPassword) next.confirmPassword = 'As senhas não coincidem.';
    if (role === 'CUSTOM' && !Object.values(permissions).some(Boolean)) next.permissions = 'Selecione ao menos uma área de acesso.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const save = async (event?: FormEvent, confirmedDeactivation = false) => {
    event?.preventDefault();
    setError('');
    setNotice('');
    if (!validate()) return;
    if (editing && user?.isActive && !isActive && !confirmedDeactivation) { setConfirmDeactivate(true); return; }

    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: name.trim(), email: email.trim().toLowerCase(), role, permissions,
      };
      if (editing) payload.isActive = isActive;
      if (password) { payload.password = password; payload.confirmPassword = confirmPassword; }
      const response = await fetch(editing ? `/api/admin/users/${userId}` : '/api/admin/users', {
        method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o usuário.');
      if (!editing) {
        router.push('/admin/access?created=1');
        router.refresh();
        return;
      }
      setUser(result.user);
      setPassword('');
      setConfirmPassword('');
      setNotice('Alterações salvas.');
      setConfirmDeactivate(false);
      if (result.currentSessionRevoked && userId === currentUserId) {
        router.push('/admin/login?session=updated');
        router.refresh();
        return;
      }
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o usuário.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div role="status" aria-label="Carregando usuário" className="grid min-h-80 place-items-center text-[#8e8780]"><LoaderCircle className="animate-spin" /></div>;
  if (editing && !user && error) return <div role="alert" className="rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-4 py-3 text-sm text-[#9f342d]">{error}</div>;

  return <div className="space-y-5">
    <Link href="/admin/access" className="inline-flex items-center gap-2 text-sm text-[#77716b] hover:text-[#8c6314]"><ArrowLeft size={16} />Voltar para a lista</Link>
    <div><div className="flex items-center gap-3"><span className="grid size-11 place-items-center rounded-xl bg-[#f4eee3] text-[#bb8719]">{editing ? <PencilLine size={23} /> : <Plus size={24} />}</span><h1 className="text-3xl font-bold sm:text-4xl">{editing ? 'Editar usuário' : 'Novo usuário'}</h1></div><p className="mt-2 text-sm text-[#77716b] sm:text-base">{editing ? 'Atualize as informações do usuário e gerencie suas permissões de acesso.' : 'Cadastre um novo usuário e defina quais áreas ele poderá acessar.'}</p></div>

    {error && <div role="alert" className="rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-4 py-3 text-sm text-[#9f342d]">{error}</div>}
    {notice && <div role="status" className="rounded-xl border border-[#b8dfc5] bg-[#edf9f0] px-4 py-3 text-sm text-[#287442]">{notice}</div>}

    <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <form noValidate onSubmit={(event) => void save(event)} className="space-y-5">
        <Card className="space-y-6 p-5 sm:p-6">
          <section aria-labelledby="basic-info-title">
            <h2 id="basic-info-title" className="flex items-center gap-2 text-lg font-bold"><UserRound size={20} className="text-[#bb8719]" />Informações básicas</h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              <label className="block text-sm font-medium" htmlFor="user-name">Nome completo<input id="user-name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} aria-invalid={Boolean(errors.name)} aria-describedby={errors.name ? 'name-error' : undefined} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d0] bg-white px-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" placeholder="Ex.: Ana Silva" />{errors.name && <span id="name-error" className="mt-1 block text-xs text-[#9f342d]">{errors.name}</span>}</label>
              <label className="block text-sm font-medium" htmlFor="user-email">E-mail de acesso<input id="user-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? 'email-error' : undefined} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d0] bg-white px-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" placeholder="exemplo@empresa.com" />{errors.email && <span id="email-error" className="mt-1 block text-xs text-[#9f342d]">{errors.email}</span>}</label>
              {editing && <label className="block text-sm font-medium" htmlFor="account-status">Status da conta<select id="account-status" value={isActive ? 'ACTIVE' : 'INACTIVE'} onChange={(event) => setIsActive(event.target.value === 'ACTIVE')} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d0] bg-white px-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20"><option value="ACTIVE">Ativo</option><option value="INACTIVE">Inativo</option></select></label>}
              <label className="block text-sm font-medium sm:col-span-2" htmlFor="user-password">{editing ? 'Nova senha (opcional)' : 'Senha'}<span className="relative mt-2 block"><input id="user-password" type={showPassword ? 'text' : 'password'} autoComplete={editing ? 'new-password' : 'new-password'} value={password} onChange={(event) => setPassword(event.target.value)} aria-invalid={Boolean(errors.password)} aria-describedby="password-help" className="h-11 w-full rounded-xl border border-[#ded8d0] bg-white px-3 pr-11 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" placeholder={editing ? 'Deixe em branco para manter a senha atual' : 'Crie uma senha segura'} /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#77716b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c49a45]">{showPassword ? <Eye size={17} /> : <EyeOff size={17} />}</button></span>{errors.password && <span className="mt-1 block text-xs text-[#9f342d]">{errors.password}</span>}</label>
              <label className="block text-sm font-medium sm:col-span-2 xl:col-span-1" htmlFor="confirm-password">Confirmar senha{(!editing || password) && <span className="relative mt-2 block"><input id="confirm-password" type={showConfirmPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} aria-invalid={Boolean(errors.confirmPassword)} aria-describedby={errors.confirmPassword ? 'confirm-password-error' : 'password-help'} className="h-11 w-full rounded-xl border border-[#ded8d0] bg-white px-3 pr-11 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" placeholder="Repita a senha" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? 'Ocultar confirmação de senha' : 'Mostrar confirmação de senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#77716b] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c49a45]">{showConfirmPassword ? <Eye size={17} /> : <EyeOff size={17} />}</button></span>}{errors.confirmPassword && <span id="confirm-password-error" className="mt-1 block text-xs text-[#9f342d]">{errors.confirmPassword}</span>}</label>
              <p id="password-help" className="text-xs leading-5 text-[#77716b] sm:col-span-2">Use exatamente 8 caracteres. Não é necessário combinar letras e números. Senhas nunca são exibidas depois de salvas.</p>
            </div>
          </section>

          <div className="border-t border-[#ece6de]" />

          <section aria-labelledby="access-profile-title">
            <h2 id="access-profile-title" className="flex items-center gap-2 text-lg font-bold"><ShieldCheck size={20} className="text-[#bb8719]" />Perfil de acesso</h2>
            <p className="mt-1 text-sm text-[#77716b]">Escolha um perfil ou personalize as áreas permitidas.</p>
            <fieldset className="mt-4 grid gap-3 md:grid-cols-3"><legend className="sr-only">Selecione o perfil de acesso</legend>
              {([
                { value: 'EDITOR', label: 'Editor', description: 'Acesso apenas às publicações.', icon: FileText },
                { value: 'ADMINISTRATOR', label: 'Administrador', description: 'Acesso completo à plataforma.', icon: Settings2 },
                { value: 'CUSTOM', label: 'Personalizado', description: 'Defina manualmente as permissões.', icon: SlidersHorizontal },
              ] as const).map(({ value, label, description, icon: Icon }) => <label key={value} className={`relative flex min-h-[82px] cursor-pointer items-start gap-3 rounded-xl border p-3 transition-colors ${role === value ? 'border-[#c89223] bg-[#fff9ed]' : 'border-[#e3ddd5] bg-white hover:border-[#c49a45]'}`}><input type="radio" name="access-role" value={value} checked={role === value} onChange={() => selectRole(value)} className="sr-only" /><span aria-hidden="true" className={`grid size-9 shrink-0 place-items-center rounded-full ${role === value ? 'bg-[#f6e9cb] text-[#9a6d11]' : 'bg-[#f3f2f0] text-[#4d4845]'}`}><Icon size={18} /></span><span className="min-w-0"><strong className="block text-sm">{label}</strong><span className="mt-1 block text-xs leading-4 text-[#77716b]">{description}</span></span><span aria-hidden="true" className={`ml-auto mt-0.5 size-4 shrink-0 rounded-full border ${role === value ? 'border-[#bf891b] ring-2 ring-[#bf891b] ring-offset-2' : 'border-[#b8b5b1]'}`} /></label>)}
            </fieldset>
          </section>

          <section aria-labelledby="account-permissions-title">
            <h2 id="account-permissions-title" className="flex items-center gap-2 text-lg font-bold"><LockKeyhole size={20} className="text-[#bb8719]" />Permissões da conta</h2>
            <p className="mt-1 text-sm text-[#77716b]">Selecione as áreas que o usuário poderá acessar.</p>
            <div className="mt-4 space-y-2">{areas.map(({ key, label, description, icon: Icon }) => <div key={key} className="flex items-center gap-3 rounded-xl border border-[#e7e3de] bg-white px-4 py-3"><Icon size={20} className="shrink-0 text-[#24211e]" /><div className="min-w-0 flex-1"><p className="text-sm font-semibold">{label}</p><p className="text-xs text-[#77716b]">{description}</p></div><button type="button" role="switch" aria-checked={permissions[key]} aria-label={`Permissão: ${label}`} disabled={role !== 'CUSTOM'} onClick={() => togglePermission(key)} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c49a45] focus-visible:ring-offset-2 disabled:cursor-not-allowed ${permissions[key] ? 'bg-[#c89223]' : 'bg-[#d7d8da]'}`}><span className={`absolute left-1 top-1 size-5 rounded-full bg-white shadow-sm transition-transform ${permissions[key] ? 'translate-x-5' : 'translate-x-0'}`} /></button></div>)}</div>
            {errors.permissions && <p role="alert" className="mt-2 text-sm text-[#9f342d]">{errors.permissions}</p>}
            {role !== 'CUSTOM' && <p className="mt-2 text-xs text-[#77716b]">As permissões ficam definidas pelo perfil selecionado.</p>}
          </section>

          {editing && user?.mustChangePassword && <div className="rounded-xl border border-[#ead4a5] bg-[#fff9ed] px-4 py-3 text-sm text-[#6f5420]">Uma senha temporária foi definida. O usuário precisará escolher uma nova senha no próximo acesso.</div>}

          <div className="flex flex-col-reverse gap-2 border-t border-[#ece6de] pt-5 sm:flex-row sm:justify-end"><Button asChild variant="outline"><Link href="/admin/access">Cancelar</Link></Button><Button type="submit" variant="gold" disabled={saving}>{saving ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}{editing ? 'Salvar alterações' : 'Cadastrar usuário'}</Button></div>
        </Card>
      </form>

      <aside className="space-y-5 xl:sticky xl:top-24">
        <Card className="p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><UserRound size={19} />Resumo do acesso</h2><p className="mt-1 text-sm text-[#77716b]">Veja como ficará o acesso deste usuário.</p>
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#fbf6eb] p-3"><span className={`grid size-12 shrink-0 place-items-center rounded-full font-semibold ${editing ? 'bg-[#292725] text-white' : 'bg-[#d5a02c] text-[#120e0e]'}`}>{initials(displayName)}</span><div className="min-w-0"><p className="truncate text-sm font-semibold">{displayName}</p><p className="truncate text-xs text-[#77716b]">{displayEmail}</p></div></div>
          <div className="mt-4 rounded-xl border border-[#ece6de] p-4"><p className="text-sm font-semibold">Perfil selecionado</p><span className="mt-2 inline-flex rounded-full bg-[#e7f1ff] px-3 py-1 text-xs font-semibold text-[#245a9b]">{roleLabel}</span><p className="mt-2 text-xs text-[#77716b]">{profileDescription}</p><div className="my-4 border-t border-[#ece6de]" /><p className="text-sm font-semibold">Permissões ativas</p><ul className="mt-3 space-y-2">{areas.map(({ key, label }) => <li key={key} className="flex items-center gap-2 text-sm"><span className={`grid size-5 place-items-center rounded-full ${permissions[key] ? 'bg-[#48b886] text-white' : 'bg-[#e7e7e9] text-[#929298]'}`}>{permissions[key] ? <Check size={12} /> : <X size={12} />}</span><span className={permissions[key] ? 'text-[#35312d]' : 'text-[#8b8782]'}>{label}</span></li>)}</ul></div>
          {!editing && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#eaf4ff] p-3 text-xs leading-5 text-[#31577f]"><Info size={17} className="mt-0.5 shrink-0 text-[#1677d2]" /><span>A conta poderá entrar com o e-mail e a senha definidos aqui. Nenhum e-mail automático será enviado pelo painel.</span></div>}
          {editing && <div className="mt-4 flex items-start gap-2 rounded-xl bg-[#eaf4ff] p-3 text-xs leading-5 text-[#31577f]"><Info size={17} className="mt-0.5 shrink-0 text-[#1677d2]" /><span>Quando permissões ou status mudarem, todas as sessões existentes do usuário serão encerradas.</span></div>}
        </Card>

        {editing && <Card className="p-5 sm:p-6"><h2 className="flex items-center gap-2 text-lg font-bold"><CheckCircle2 size={19} />Histórico da conta</h2><p className="mt-1 text-sm text-[#77716b]">Alterações administrativas registradas.</p>{history.length === 0 ? <p className="mt-5 rounded-lg bg-[#fbfaf7] p-3 text-sm text-[#77716b]">Ainda não há atividades registradas para esta conta.</p> : <ol className="mt-5 space-y-4">{history.map((event) => <li key={event.id} className="relative border-l border-[#e2d9c9] pb-1 pl-4 last:border-transparent"><span className="absolute -left-[5px] top-1 size-2.5 rounded-full bg-[#c89223] ring-2 ring-white" /><p className="text-sm font-medium">{eventLabels[event.action] || 'Conta atualizada'}</p><p className="mt-1 text-xs text-[#77716b]">{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(event.createdAt))}</p><p className="mt-1 text-xs leading-5 text-[#77716b]">{eventSummary(event)}{event.actor ? ` · ${event.actor.name}` : ''}</p></li>)}</ol>}</Card>}
      </aside>
    </div>

    {confirmDeactivate && user && <div className="fixed inset-0 z-[100] grid place-items-center bg-[#120e0e]/45 p-4"><section role="alertdialog" aria-modal="true" aria-labelledby="confirm-deactivate-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"><h2 id="confirm-deactivate-title" className="text-xl font-bold">Desativar {user.name}?</h2><p className="mt-2 text-sm leading-6 text-[#77716b]">A conta perderá o acesso ao painel e as sessões atuais serão encerradas.</p><div className="mt-6 flex justify-end gap-2"><Button variant="outline" onClick={() => { setConfirmDeactivate(false); setIsActive(true); }} disabled={saving}>Cancelar</Button><Button variant="danger" onClick={() => void save(undefined, true)} disabled={saving}>{saving && <LoaderCircle size={16} className="animate-spin" />}Desativar usuário</Button></div></section></div>}
  </div>;
}
