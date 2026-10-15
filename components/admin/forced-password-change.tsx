'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Eye, EyeOff, LoaderCircle, LockKeyhole } from 'lucide-react';
import { Button } from '../ui/button';
import { getAdminHomeHref, isSecurePassword, type AdminPermissions } from '../../lib/admin-access';

export function ForcedPasswordChange({ permissions }: { permissions: AdminPermissions }) {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!currentPassword) { setError('Informe a senha temporária atual.'); return; }
    if (!isSecurePassword(password)) { setError('A nova senha precisa ter exatamente 8 caracteres.'); return; }
    if (password !== confirmPassword) { setError('As senhas não coincidem.'); return; }
    if (password === currentPassword) { setError('Escolha uma senha diferente da temporária.'); return; }
    setLoading(true);
    try {
      const response = await fetch('/api/admin/account/password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, password, confirmPassword }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível alterar a senha.');
      router.push(getAdminHomeHref(permissions));
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Falha de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return <main className="grid min-h-screen place-items-center bg-[#f7f5f1] px-4 py-10 text-[#120e0e]"><form noValidate onSubmit={submit} className="w-full max-w-md rounded-3xl border border-[#e7e0d6] bg-white p-6 shadow-[0_18px_55px_rgba(26,20,12,0.08)] sm:p-8">
    <span className="grid size-12 place-items-center rounded-2xl bg-[#f4eee3] text-[#a77919]"><LockKeyhole size={22} /></span>
    <h1 className="mt-5 text-2xl font-bold">Crie sua senha pessoal</h1>
    <p className="mt-2 text-sm leading-6 text-[#77716b]">Por segurança, a senha temporária precisa ser substituída antes de usar o painel.</p>
    <label htmlFor="current-password" className="mt-6 block text-sm font-semibold">Senha temporária<input id="current-password" type={visible ? 'text' : 'password'} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d0] px-3 pr-11 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" /></label>
    <label htmlFor="new-password" className="mt-4 block text-sm font-semibold">Nova senha<span className="relative mt-2 block"><input id="new-password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-11 w-full rounded-xl border border-[#ded8d0] px-3 pr-11 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" /><button type="button" onClick={() => setVisible((value) => !value)} aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-[#77716b]">{visible ? <Eye size={17} /> : <EyeOff size={17} />}</button></span></label>
    <label htmlFor="confirm-new-password" className="mt-4 block text-sm font-semibold">Confirmar nova senha<input id="confirm-new-password" type={visible ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#ded8d0] px-3 text-sm outline-none focus:border-[#c49a45] focus:ring-2 focus:ring-[#c49a45]/20" /></label>
    <p className="mt-2 text-xs leading-5 text-[#77716b]">Use exatamente 8 caracteres. Não é necessário combinar letras e números.</p>
    {error && <p role="alert" className="mt-4 rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-3 py-2 text-sm text-[#9f342d]">{error}</p>}
    <Button type="submit" variant="gold" size="lg" className="mt-6 w-full" disabled={loading}>{loading ? <LoaderCircle size={17} className="animate-spin" /> : <Check size={17} />}Salvar nova senha</Button>
  </form></main>;
}
