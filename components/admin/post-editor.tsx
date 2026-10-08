'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChangeEvent, ClipboardEvent, DragEvent, FormEvent, type ComponentType, type Ref, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, Check, ImagePlus, LoaderCircle, Save, Sparkles, Upload, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import type { CmsPost, CmsPostInput } from '../../lib/cms';
import { postCategories } from '../../lib/cms';
import { IMAGE_TOO_LARGE_MESSAGE, MAX_IMAGE_BYTES } from '../../lib/image-constants';
import type { ImageDestination } from '../../lib/image-optimization';
import { Button } from '../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Separator } from '../ui/separator';
import { Textarea } from '../ui/textarea';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false, loading: () => <div className="grid min-h-[430px] place-items-center text-sm text-[#8e8780]">Carregando editor...</div> });

type UploadedAsset = { url: string; width: number; height: number; thumbnailUrl?: string };
type QuillEditor = {
  getSelection: (focus?: boolean) => { index: number } | null;
  getLength: () => number;
  insertEmbed: (index: number, type: 'image', url: string, source: 'user') => void;
  formatText: (index: number, length: number, formats: { width: string; height: string }, source: 'user') => void;
};
type ReactQuillHandle = { getEditor: () => QuillEditor };
const ReactQuillWithRef = ReactQuill as unknown as ComponentType<React.ComponentProps<typeof ReactQuill> & { ref?: Ref<ReactQuillHandle> }>;

function imageFilesFromTransfer(transfer: DataTransfer) {
  const files = Array.from(transfer.files).filter((file) => file.type.startsWith('image/'));
  if (files.length) return files;
  return Array.from(transfer.items)
    .filter((item) => item.kind === 'file' && item.type.startsWith('image/'))
    .flatMap((item) => {
      const file = item.getAsFile();
      return file ? [file] : [];
    });
}

const localDateTime = (value?: string) => { const date = value ? new Date(value) : new Date(); const offset = date.getTimezoneOffset(); return new Date(date.getTime() - offset * 60000).toISOString().slice(0, 16); };
const slugify = (value: string) => value.toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').replace(/-+/g, '-');

const blankForm: CmsPostInput = { title: '', slug: '', category: 'Institucional', publishedAt: localDateTime(), excerpt: '', author: 'Assessoria de Comunicação Grupo +B', bodyHtml: '<p>Comece a escrever a matéria...</p>', status: 'draft', seoTitle: '', seoDescription: '', imagePath: '', imageCardPath: '', imageAlt: '', imageCaption: '', gallery: [], noIndex: false };

export function PostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const [form, setForm] = useState(blankForm);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [optimizing, setOptimizing] = useState<ImageDestination | null>(null);
  const quillRef = useRef<ReactQuillHandle | null>(null);
  const [error, setError] = useState('');
  const [coverUploadError, setCoverUploadError] = useState('');
  const [galleryUploadError, setGalleryUploadError] = useState('');
  const [notice, setNotice] = useState('');
  useEffect(() => { if (!postId) return; fetch(`/api/admin/posts/${postId}`).then(async (response) => { if (response.status === 401) { router.push('/admin/login'); return; } const data = await response.json(); if (!response.ok) setError(data.error || 'Falha ao carregar matéria.'); else { const post = data.post as CmsPost; setForm({ ...blankForm, ...post, publishedAt: localDateTime(post.publishedAt), imagePath: post.imagePath || '', imageCardPath: post.imageCardPath || '', gallery: post.gallery || [] }); } setLoading(false); }).catch(() => { setError('Falha de conexão com o CMS.'); setLoading(false); }); }, [postId, router]);
  const set = <K extends keyof typeof form>(key: K, value: typeof form[K]) => setForm((current) => ({ ...current, [key]: value }));
  const seo = useMemo(() => ({ title: form.seoTitle || form.title, description: form.seoDescription || form.excerpt, checks: [Boolean(form.title && form.title.length <= 60), Boolean(form.slug), Boolean(form.excerpt && form.excerpt.length <= 160), Boolean(form.imageAlt), Boolean(form.bodyHtml && form.bodyHtml.replace(/<[^>]+>/g, '').trim().length >= 300)] }), [form]);
  const save = async (event: FormEvent, status: 'draft' | 'published') => { event.preventDefault(); setSaving(true); setError(''); setNotice(''); const payload = { ...form, status, publishedAt: new Date(form.publishedAt).toISOString(), seoTitle: form.seoTitle || form.title, seoDescription: form.seoDescription || form.excerpt }; const response = await fetch(postId ? `/api/admin/posts/${postId}` : '/api/admin/posts', { method: postId ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }); const data = await response.json(); setSaving(false); if (!response.ok) { setError(data.error || 'Não foi possível salvar.'); return; } setNotice(status === 'published' ? 'Matéria publicada com sucesso.' : 'Rascunho salvo com sucesso.'); if (!postId && data.post?.id) router.replace(`/admin/posts/${data.post.id}`); };
  const uploadAsset = useCallback(async (file: File, destination: ImageDestination): Promise<UploadedAsset> => {
    if (!file.size) throw new Error('O arquivo está vazio. Selecione uma imagem válida.');
    if (file.size > MAX_IMAGE_BYTES) throw new Error(IMAGE_TOO_LARGE_MESSAGE);
    const data = new FormData();
    data.append('file', file);
    data.append('destination', destination);
    const response = await fetch('/api/admin/assets', { method: 'POST', body: data });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Falha ao otimizar imagem.');
    return result.asset as UploadedAsset;
  }, []);
  const upload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError('');
    setCoverUploadError('');
    setOptimizing('cover');
    try {
      const asset = await uploadAsset(file, 'cover');
      set('imagePath', asset.url);
      set('imageCardPath', asset.thumbnailUrl || '');
    } catch (uploadError) {
      setCoverUploadError(uploadError instanceof Error ? uploadError.message : 'Falha ao otimizar imagem.');
    } finally {
      setOptimizing(null);
      event.target.value = '';
    }
  };
  const uploadGallery = async (event: ChangeEvent<HTMLInputElement>) => {
    const availableSlots = 12 - form.gallery.length;
    const selectedFiles = Array.from(event.target.files || []);
    setError('');
    setGalleryUploadError('');
    if (availableSlots <= 0) {
      setGalleryUploadError('A galeria aceita até 12 imagens.');
      event.target.value = '';
      return;
    }
    const files = selectedFiles.slice(0, availableSlots);
    if (!files.length) return;
    if (files.some((file) => file.size > MAX_IMAGE_BYTES)) {
      setGalleryUploadError(IMAGE_TOO_LARGE_MESSAGE);
      event.target.value = '';
      return;
    }
    setOptimizing('gallery');
    try {
      const uploaded: CmsPostInput['gallery'] = [];
      for (const file of files) {
        const asset = await uploadAsset(file, 'gallery');
        uploaded.push({ url: asset.url, width: asset.width, height: asset.height, alt: file.name.replace(/\.[^.]+$/, ''), caption: '' });
      }
      set('gallery', [...form.gallery, ...uploaded].slice(0, 12));
    } catch (uploadError) {
      setGalleryUploadError(uploadError instanceof Error ? uploadError.message : 'Falha ao enviar fotos.');
    } finally {
      setOptimizing(null);
      event.target.value = '';
    }
  };
  const uploadInlineImage = useCallback(async (file: File, editor: QuillEditor) => {
    setError('');
    setOptimizing('content');
    try {
      const asset = await uploadAsset(file, 'content');
      const range = editor.getSelection(true) || { index: editor.getLength() };
      editor.insertEmbed(range.index, 'image', asset.url, 'user');
      editor.formatText(range.index, 1, { width: String(asset.width), height: String(asset.height) }, 'user');
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'Falha ao otimizar imagem.');
    } finally {
      setOptimizing(null);
    }
  }, [uploadAsset]);
  const handleEditorImages = useCallback(async (files: File[]) => {
    const editor = quillRef.current?.getEditor();
    if (!editor) return;
    for (const file of files) await uploadInlineImage(file, editor);
  }, [uploadInlineImage]);
  const pasteImages = useCallback((event: ClipboardEvent<HTMLDivElement>) => {
    const files = imageFilesFromTransfer(event.clipboardData);
    if (!files.length) return;
    event.preventDefault();
    void handleEditorImages(files);
  }, [handleEditorImages]);
  const dropImages = useCallback((event: DragEvent<HTMLDivElement>) => {
    const files = imageFilesFromTransfer(event.dataTransfer);
    if (!files.length) return;
    event.preventDefault();
    void handleEditorImages(files);
  }, [handleEditorImages]);
  const editorModules = useMemo(() => ({
    toolbar: {
      container: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ align: ['', 'center', 'right', 'justify'] }], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link', 'image'], ['clean']],
      handlers: {
        image: function (this: { quill: QuillEditor }) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = () => {
            const file = input.files?.[0];
            if (file) void uploadInlineImage(file, this.quill);
          };
          input.click();
        },
      },
    },
  }), [uploadInlineImage]);
  if (loading) return <div className="grid min-h-80 place-items-center text-[#8e8780]"><LoaderCircle className="animate-spin" /></div>;
  return <form onSubmit={(event) => save(event, form.status)} className="space-y-8">
    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><Link href="/admin/posts" className="mb-3 inline-flex items-center gap-2 text-sm text-[#8e8780] hover:text-[#120e0e]"><ArrowLeft size={16} />Voltar para publicações</Link><h1 className="text-3xl font-bold">{postId ? 'Editar matéria' : 'Nova matéria'}</h1><p className="mt-1 text-sm text-[#8e8780]">Preencha o conteúdo, refine o SEO e publique quando estiver pronto.</p></div><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => router.push('/admin/posts')}>Cancelar</Button><Button type="submit" variant="gold" disabled={saving}>{saving ? <LoaderCircle className="animate-spin" size={17} /> : <Save size={17} />}Salvar {form.status === 'published' ? 'alterações' : 'rascunho'}</Button></div></div>
    {error ? <div role="alert" className="rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-4 py-3 text-sm text-[#9f342d]">{error}</div> : null}{notice ? <div className="rounded-xl border border-[#b8dfc5] bg-[#edf9f0] px-4 py-3 text-sm text-[#287442]">{notice}</div> : null}
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6"><Card><CardHeader><CardTitle>Conteúdo principal</CardTitle><CardDescription>O título e o resumo aparecem nos cards e na página da matéria.</CardDescription></CardHeader><CardContent className="space-y-5"><div><Label htmlFor="title">Título da matéria</Label><Input id="title" value={form.title} onChange={(event) => { set('title', event.target.value); if (!postId || !form.slug) set('slug', slugify(event.target.value)); }} placeholder="Ex.: Grupo Mais Barato celebra..." className="mt-2 text-base" maxLength={120} /><div className="mt-1 text-right text-xs text-[#8e8780]">{form.title.length}/120</div></div><div className="grid gap-5 md:grid-cols-2"><div><Label htmlFor="slug">Slug da URL</Label><div className="mt-2 flex items-center rounded-xl border border-[#ddd6cc] bg-white focus-within:border-[#C49A45] focus-within:ring-2 focus-within:ring-[#C49A45]/20"><span className="pl-3 text-sm text-[#aaa198]">/noticias/</span><input id="slug" value={form.slug} onChange={(event) => set('slug', slugify(event.target.value))} className="h-11 min-w-0 flex-1 bg-transparent px-1 text-sm outline-none" /></div></div><div><Label htmlFor="category">Categoria</Label><select id="category" value={form.category} onChange={(event) => set('category', event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-[#ddd6cc] bg-white px-3 text-sm outline-none focus:border-[#C49A45]">{postCategories.map((category) => <option key={category}>{category}</option>)}</select></div></div><div><Label htmlFor="excerpt">Resumo / lead</Label><Textarea id="excerpt" value={form.excerpt} onChange={(event) => set('excerpt', event.target.value)} placeholder="Um resumo claro para os cards e para o compartilhamento..." className="mt-2 min-h-28" maxLength={250} /><div className="mt-1 text-right text-xs text-[#8e8780]">{form.excerpt.length}/250</div></div></CardContent></Card>
        <Card><CardHeader><div><CardTitle>Texto da matéria</CardTitle><CardDescription role={optimizing === 'content' ? 'status' : undefined}>{optimizing === 'content' ? 'Otimizando imagem...' : 'Editor rico com títulos, alinhamento, listas, links, imagens e citações.'}</CardDescription></div></CardHeader><CardContent onPasteCapture={pasteImages} onDropCapture={dropImages} className="overflow-hidden rounded-xl border border-[#e7e0d6] p-0"><ReactQuillWithRef ref={quillRef} theme="snow" value={form.bodyHtml} onChange={(value) => set('bodyHtml', value)} placeholder="Escreva a matéria..." modules={editorModules} /></CardContent></Card></div>
      <div className="space-y-6"><Card><CardHeader><CardTitle>Publicação</CardTitle><CardDescription>Defina o status e a data de exibição.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="status">Status</Label><select id="status" value={form.status} onChange={(event) => set('status', event.target.value as 'draft' | 'published')} className="mt-2 h-11 w-full rounded-xl border border-[#ddd6cc] bg-white px-3 text-sm outline-none focus:border-[#C49A45]"><option value="draft">Rascunho</option><option value="published">Publicada</option></select></div><div><Label htmlFor="publishedAt">Data de publicação</Label><Input id="publishedAt" type="datetime-local" value={form.publishedAt} onChange={(event) => set('publishedAt', event.target.value)} className="mt-2" /></div><div><Label htmlFor="author">Autor</Label><Input id="author" value={form.author} onChange={(event) => set('author', event.target.value)} className="mt-2" /></div><Separator /><Button type="submit" variant="gold" className="w-full" disabled={saving}><Check size={17} />{form.status === 'published' ? 'Publicar matéria' : 'Salvar rascunho'}</Button></CardContent></Card>
        <Card><CardHeader><CardTitle>Banner da matéria</CardTitle><CardDescription>Imagem principal usada no card, hero e compartilhamento.</CardDescription></CardHeader><CardContent className="space-y-4"><label className="group relative flex min-h-40 cursor-pointer items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#d9d2c8] bg-[#fbfaf7] hover:border-[#C49A45]">{form.imagePath ? <><img src={form.imagePath} alt="Prévia do banner" className="absolute inset-0 h-full w-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-[#120e0e]/60 text-sm font-semibold text-white opacity-0 transition group-hover:opacity-100">{optimizing === 'cover' ? 'Otimizando imagem...' : 'Trocar imagem'}</span></> : optimizing === 'cover' ? <span role="status" className="text-sm text-[#8e8780]">Otimizando imagem...</span> : <span className="grid justify-items-center gap-2 text-center text-sm text-[#8e8780]"><ImagePlus className="text-[#C49A45]" /><span>Enviar imagem</span><small>JPG, JPEG, PNG, WebP — até 2 MB</small></span>}{coverUploadError ? <span role="alert" className="absolute bottom-3 left-3 right-3 z-10 rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-3 py-2 text-left text-xs leading-4 text-[#9f342d] shadow-lg">{coverUploadError}</span> : null}<input type="file" accept="image/*" disabled={optimizing !== null} className="sr-only" onChange={upload} /></label><div><Label htmlFor="imageAlt">Texto alternativo</Label><Input id="imageAlt" value={form.imageAlt} onChange={(event) => set('imageAlt', event.target.value)} placeholder="Descreva a imagem para SEO" className="mt-2" /></div><div><Label htmlFor="imageCaption">Legenda</Label><Input id="imageCaption" value={form.imageCaption} onChange={(event) => set('imageCaption', event.target.value)} placeholder="Opcional" className="mt-2" /></div></CardContent></Card>
        <Card><CardHeader><CardTitle>Galeria de fotos</CardTitle><CardDescription>Adicione até 12 fotos para complementar a matéria.</CardDescription></CardHeader><CardContent className="space-y-4"><label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-[#d9d2c8] bg-[#fbfaf7] px-4 py-4 text-sm font-semibold text-[#6f6962] transition hover:border-[#C49A45] hover:text-[#916819]">{optimizing === 'gallery' ? <span role="status">Otimizando imagem...</span> : <><Upload size={18} className="text-[#C49A45]" /><span>Adicionar fotos</span></>}<input type="file" multiple accept="image/*" disabled={optimizing !== null} className="sr-only" onChange={uploadGallery} /></label>{galleryUploadError ? <div role="alert" className="rounded-xl border border-[#efbbb5] bg-[#fff2f0] px-3 py-2 text-xs leading-4 text-[#9f342d] shadow-sm">{galleryUploadError}</div> : null}{form.gallery.length ? <div className="grid grid-cols-2 gap-3">{form.gallery.map((item, index) => <div key={`${item.url}-${index}`} className="group relative overflow-hidden rounded-xl border border-[#e7e0d6] bg-[#fbfaf7]"><img src={item.url} alt={item.alt || `Foto ${index + 1}`} width={item.width || 600} height={item.height || 600} loading="lazy" className="aspect-square w-full object-cover" /><button type="button" onClick={() => set('gallery', form.gallery.filter((_, itemIndex) => itemIndex !== index))} className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full bg-[#120e0e]/75 text-white opacity-0 transition group-hover:opacity-100" aria-label={`Remover foto ${index + 1}`}><X size={15} /></button><div className="space-y-2 p-2"><Input value={item.alt || ''} onChange={(event) => set('gallery', form.gallery.map((galleryItem, itemIndex) => itemIndex === index ? { ...galleryItem, alt: event.target.value } : galleryItem))} placeholder="Texto alternativo" className="h-9 text-xs" /><Input value={item.caption || ''} onChange={(event) => set('gallery', form.gallery.map((galleryItem, itemIndex) => itemIndex === index ? { ...galleryItem, caption: event.target.value } : galleryItem))} placeholder="Legenda (opcional)" className="h-9 text-xs" /></div></div>)}</div> : <p className="text-xs text-[#8e8780]">A galeria aparecerá na página do post depois que você salvar.</p>}</CardContent></Card>
        <Card><CardHeader><div className="flex items-center gap-2"><Sparkles size={18} className="text-[#C49A45]" /><CardTitle>SEO da matéria</CardTitle></div><CardDescription>Otimização para busca e compartilhamento.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label htmlFor="seoTitle">Título SEO</Label><Input id="seoTitle" value={form.seoTitle} onChange={(event) => set('seoTitle', event.target.value)} placeholder={form.title || 'Título otimizado'} maxLength={60} className="mt-2" /><p className="mt-1 text-xs text-[#8e8780]">{seo.title.length}/60 caracteres</p></div><div><Label htmlFor="seoDescription">Descrição SEO</Label><Textarea id="seoDescription" value={form.seoDescription} onChange={(event) => set('seoDescription', event.target.value)} placeholder={form.excerpt || 'Descrição para o Google'} maxLength={160} className="mt-2 min-h-24" /><p className="mt-1 text-xs text-[#8e8780]">{seo.description.length}/160 caracteres</p></div><div className="rounded-xl bg-[#fbfaf7] p-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold">Checklist SEO</span><span className="text-sm font-bold text-[#916819]">{seo.checks.filter(Boolean).length}/{seo.checks.length}</span></div><ul className="mt-3 space-y-2 text-xs text-[#6f6962]">{[['Título até 60 caracteres', seo.checks[0]], ['Slug amigável', seo.checks[1]], ['Descrição até 160 caracteres', seo.checks[2]], ['Texto alternativo da imagem', seo.checks[3]], ['Conteúdo com mais de 300 caracteres', seo.checks[4]]].map(([label, ok]) => <li key={String(label)} className="flex items-center gap-2">{ok ? <Check size={14} className="text-[#287442]" /> : <span className="h-3.5 w-3.5 rounded-full border border-[#c8c0b5]" />}{label}</li>)}</ul></div><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={form.noIndex} onChange={(event) => set('noIndex', event.target.checked)} className="h-4 w-4 accent-[#C49A45]" />Não indexar esta matéria</label></CardContent></Card></div>
    </div>
  </form>;
}
