'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { Check, CheckCircle2, Clock3, Eye, FileText, LoaderCircle, Pencil, Plus, Search, Trash2, X, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CmsPost } from '../../lib/cms';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { PostsDashboardSkeleton } from './admin-skeleton';

const date = (value: string) => new Intl.DateTimeFormat('pt-BR', { dateStyle: 'medium' }).format(new Date(value));

export function PostsDashboard() {
  const router = useRouter();
  const [posts, setPosts] = useState<CmsPost[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [togglingPostId, setTogglingPostId] = useState<string | null>(null);
  useEffect(() => { fetch('/api/admin/posts').then(async (response) => { if (response.status === 401) { router.push('/admin/login'); return; } const data = await response.json(); if (!response.ok) setError(data.error || 'Falha ao carregar.'); else setPosts(data.posts || []); setLoading(false); }).catch(() => { setError('Falha de conexão com o CMS.'); setLoading(false); }); }, [router]);
  const filtered = useMemo(
    () => posts.filter((post) => `${post.title} ${post.category}`.toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR'))),
    [posts, query],
  );
  const published = posts.filter((post) => post.status === 'published').length;
  const drafts = posts.length - published;
  const togglePublication = async (post: CmsPost) => {
    if (togglingPostId) return;
    const status = post.status === 'published' ? 'draft' : 'published';
    setTogglingPostId(post.id);
    setError('');
    try {
      const response = await fetch(`/api/admin/posts/${post.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const data = await response.json();
      if (response.status === 401) {
        router.push('/admin/login');
        return;
      }
      if (!response.ok) throw new Error(data.error || 'Não foi possível alterar a publicação.');
      setPosts((current) => current.map((item) => item.id === post.id ? data.post as CmsPost : item));
    } catch (toggleError) {
      setError(toggleError instanceof Error ? toggleError.message : 'Falha de conexão ao alterar a publicação.');
    } finally {
      setTogglingPostId(null);
    }
  };
  const remove = async (post: CmsPost) => { if (!window.confirm(`Excluir “${post.title}”?`)) return; const response = await fetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' }); if (response.ok) setPosts((current) => current.filter((item) => item.id !== post.id)); else setError('Não foi possível excluir a matéria.'); };
  if (loading) return <PostsDashboardSkeleton />;
  return <div className="space-y-8">
    <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#c49a45]">Publicações</p><h1 className="mt-2 text-4xl font-bold">Matérias do site</h1><p className="mt-2 text-[#8e8780]">Crie, revise e publique conteúdo editorial com controle de SEO.</p></div><Button asChild variant="gold" size="lg"><Link href="/admin/posts/new"><Plus size={18} />Nova matéria</Link></Button></div>
    <div className="grid gap-4 sm:grid-cols-3"><Metric icon={<FileText size={19} />} label="Total de matérias" value={posts.length} /><Metric icon={<CheckCircle2 size={19} />} label="Publicadas" value={published} accent="green" /><Metric icon={<Clock3 size={19} />} label="Rascunhos" value={drafts} accent="gold" /></div>
    <Card><CardContent className="p-0"><div className="flex flex-col gap-4 border-b border-[#e7e0d6] p-5 md:flex-row md:items-center md:justify-between"><div><h2 className="font-bold">Todas as publicações</h2><p className="text-sm text-[#8e8780]">{filtered.length} resultado(s) encontrados</p></div><div className="relative w-full md:max-w-sm"><Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8e8780]" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por título ou categoria" className="pl-10" /></div></div>{error ? <div role="alert" className="m-5 rounded-xl bg-[#9f342d]/10 px-4 py-3 text-sm text-[#9f342d]">{error}</div> : null}{filtered.length ? <div className="admin-scrollbar overflow-x-auto"><table className="w-full min-w-[820px] table-fixed text-left text-sm"><colgroup><col className="w-[46%]" /><col className="w-[18%]" /><col className="w-[13%]" /><col className="w-[13%]" /><col className="w-[10%]" /></colgroup><thead className="bg-[#fbfaf7] text-xs uppercase tracking-wider text-[#8e8780]"><tr><th className="px-5 py-3 font-semibold">Matéria</th><th className="px-5 py-3 font-semibold">Categoria</th><th className="px-5 py-3 text-center font-semibold">Status</th><th className="px-5 py-3 font-semibold">Atualização</th><th className="px-5 py-3 text-right font-semibold">Ações</th></tr></thead><tbody>{filtered.map((post) => { const isPublished = post.status === 'published'; const isToggling = togglingPostId === post.id; return <tr key={post.id} className="admin-table-row border-t border-[#eee9e2] transition-colors"><td className="px-5 py-3"><div className="flex min-w-0 items-center gap-3">{post.imagePath ? <img src={post.imagePath} alt="" className="h-12 w-16 rounded-lg object-cover" /> : <div className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-[#f1ece4] text-[#8e8780]"><FileText size={18} /></div>}<div className="min-w-0"><p className="truncate font-semibold text-[#120e0e]">{post.title}</p><p className="mt-1 truncate text-xs text-[#8e8780]">/{post.slug}</p></div></div></td><td className="px-5 py-3 text-[#6f6962]">{post.category}</td><td className="px-5 py-3"><div className="flex items-center justify-center gap-2.5"><button type="button" role="switch" aria-checked={isPublished} aria-busy={isToggling} aria-label={`${isPublished ? 'Despublicar' : 'Publicar'} ${post.title}`} title={isPublished ? 'Despublicar matéria' : 'Publicar matéria'} disabled={Boolean(togglingPostId)} onClick={() => void togglePublication(post)} className={`relative inline-flex h-8 w-[60px] shrink-0 items-center rounded-full p-1 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c49a45] focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70 ${isPublished ? 'bg-[#c89223]' : 'bg-[#b8b8b8]'}`}><span className={`grid h-6 w-6 place-items-center rounded-full bg-white text-[#c89223] shadow-sm transition-transform duration-200 ${isPublished ? 'translate-x-7' : 'translate-x-0'}`}>{isToggling ? <LoaderCircle size={14} className="animate-spin" aria-hidden="true" /> : isPublished ? <Check size={14} aria-hidden="true" /> : <X size={14} className="text-[#777]" aria-hidden="true" />}</span></button><span className="text-sm text-[#6f6962]">{isPublished ? 'Publicado' : 'Rascunho'}</span></div></td><td className="px-5 py-3 text-[#6f6962]">{date(post.publishedAt)}</td><td className="px-5 py-3"><div className="flex justify-end gap-1"><Button asChild variant="ghost" size="icon"><Link href={`/noticias/${post.slug}`} target="_blank" rel="noopener noreferrer" aria-label={`Ver ${post.title}`} title="Ver post público"><Eye size={17} /></Link></Button><Button asChild variant="ghost" size="icon"><Link href={`/admin/posts/${post.id}`} aria-label={`Editar ${post.title}`} title="Editar matéria"><Pencil size={17} /></Link></Button><Button variant="ghost" size="icon" className="text-[#9f342d] hover:bg-[#9f342d]/10" onClick={() => remove(post)} aria-label={`Excluir ${post.title}`} title="Excluir matéria"><Trash2 size={17} /></Button></div></td></tr>; })}</tbody></table></div> : <div className="p-14 text-center"><XCircle className="mx-auto text-[#c49a45]" size={30} /><h3 className="mt-4 font-bold">Nenhuma publicação encontrada</h3><p className="mt-1 text-sm text-[#8e8780]">Ajuste a busca ou crie a primeira matéria.</p></div>}</CardContent></Card>
  </div>;
}

function Metric({ icon, label, value, accent = 'ink' }: { icon: React.ReactNode; label: string; value: number; accent?: 'ink' | 'green' | 'gold' }) { const colors = { ink: 'bg-[#f1ece4] text-[#120e0e]', green: 'bg-[#edf9f0] text-[#287442]', gold: 'bg-[#fff8e6] text-[#916819]' }; return <Card><CardContent className="flex items-center gap-4 p-5"><div className={`grid h-11 w-11 place-items-center rounded-xl ${colors[accent]}`}>{icon}</div><div><p className="text-sm text-[#8e8780]">{label}</p><p className="mt-1 text-2xl font-bold">{value}</p></div></CardContent></Card>; }
