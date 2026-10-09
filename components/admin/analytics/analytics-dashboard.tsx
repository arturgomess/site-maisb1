'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { BarChart3, CalendarDays, Clock3, Eye, FileText, Monitor, Smartphone, Tablet, UsersRound } from 'lucide-react';

type Summary = { pageViews: number; uniqueVisitors: number; avgEngagedSeconds: number; postViews: number };
type ConsentDecisions = { accepted: number; rejected: number; total: number; acceptPercent: number; rejectPercent: number };
type TrendPoint = { day: string; pageViews: number; uniqueVisitors: number };
type Source = { category: string; views: number; percent: number };
type Device = { device: 'DESKTOP' | 'MOBILE' | 'TABLET'; views: number; percent: number };
type Post = { id: string; slug: string; title: string; publishedAt: string; imagePath: string | null; views: number };
type Page = { path: string; views: number; percent: number };
type Paginated<T> = { page: number; pageSize: number; total: number; posts?: T[]; pages?: T[] };
type SourceDetails = { category: string; views: number; posts: Post[]; trend: TrendPoint[] };
type PostDetails = { post: Post; summary: Summary; sources: Source[]; trend: TrendPoint[] };
type Remote<T> = { data: T | null; loading: boolean; error: string; reload: () => void };

const sourceLabels: Record<string, string> = {
  ORGANIC: 'Busca orgânica', SOCIAL: 'Redes sociais', DIRECT: 'Direto', REFERRAL: 'Referências', PAID_SEARCH: 'Busca paga', OTHER: 'Outros',
};
const sourceColors: Record<string, string> = {
  ORGANIC: '#c89223', SOCIAL: '#38a77a', DIRECT: '#686664', REFERRAL: '#efc773', PAID_SEARCH: '#5e9dc7', OTHER: '#c9c5c0',
};
const numberFormat = new Intl.NumberFormat('pt-BR');

function todayInSaoPaulo() {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date());
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)!.value;
  return `${value('year')}-${value('month')}-${value('day')}`;
}

function shiftDay(day: string, offset: number) {
  const [year, month, date] = day.split('-').map(Number);
  const shifted = new Date(Date.UTC(year, month - 1, date + offset));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, '0')}-${String(shifted.getUTCDate()).padStart(2, '0')}`;
}

function useRemote<T>(url: string | null, refreshIntervalMs = 0): Remote<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = useCallback(() => setVersion((current) => current + 1), []);

  useEffect(() => {
    if (!url) { setData(null); setLoading(false); setError(''); return; }
    const controller = new AbortController();
    setLoading(true);
    setError('');
    void fetch(url, { cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Não foi possível carregar os dados.');
        return result as T;
      })
      .then((result) => { if (!controller.signal.aborted) setData(result); })
      .catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Falha ao carregar os dados.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [url, version]);

  useEffect(() => {
    if (!url || refreshIntervalMs <= 0) return;
    const refreshIfVisible = () => {
      if (document.visibilityState === 'visible') setVersion((current) => current + 1);
    };
    const interval = window.setInterval(refreshIfVisible, refreshIntervalMs);
    document.addEventListener('visibilitychange', refreshIfVisible);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [url, refreshIntervalMs]);

  return { data, loading, error, reload };
}

function formatDuration(seconds: number) {
  const safe = Math.max(0, Math.round(seconds));
  const minutes = Math.floor(safe / 60);
  const remainder = safe % 60;
  return minutes ? `${minutes}m ${remainder}s` : `${remainder}s`;
}

function formatDay(day: string) {
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(`${day}T12:00:00Z`));
}

function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return <section className={`min-w-0 rounded-xl border border-[#e7e0d6] bg-white p-5 shadow-[0_2px_10px_rgba(32,27,21,0.025)] sm:p-6 ${className}`}><div className="mb-5 flex items-center justify-between gap-3"><h2 className="text-base font-bold sm:text-lg">{title}</h2>{action}</div>{children}</section>;
}

function LoadingState({ label = 'Carregando dados' }: { label?: string }) {
  return <div role="status" aria-label={label} className="animate-pulse space-y-3"><div className="h-4 w-2/3 rounded bg-[#f0ede8]" /><div className="h-28 rounded-lg bg-[#f7f5f1]" /></div>;
}

function ErrorState({ error, retry }: { error: string; retry: () => void }) {
  return <div role="alert" className="rounded-lg border border-[#efbbb5] bg-[#fff7f6] p-3 text-sm text-[#8f302b]"><p>{error}</p><button type="button" className="mt-2 font-semibold underline" onClick={retry}>Tentar novamente</button></div>;
}

function TrendChart({ data, metric }: { data: TrendPoint[]; metric: 'pageViews' | 'uniqueVisitors' }) {
  if (!data.length || data.every((point) => point[metric] === 0)) return <div className="grid min-h-[260px] place-items-center text-center text-sm text-[#817a72]">Ainda não há dados de acesso neste período.</div>;
  const width = 720;
  const height = 250;
  const pad = { left: 44, right: 18, top: 16, bottom: 38 };
  const max = Math.max(1, ...data.map((point) => point[metric]));
  const plotWidth = width - pad.left - pad.right;
  const plotHeight = height - pad.top - pad.bottom;
  const coords = data.map((point, index) => ({
    ...point,
    x: data.length === 1 ? pad.left + plotWidth / 2 : pad.left + (index / (data.length - 1)) * plotWidth,
    y: pad.top + plotHeight - (point[metric] / max) * plotHeight,
  }));
  const line = coords.map(({ x, y }) => `${x},${y}`).join(' ');
  const area = `${pad.left},${pad.top + plotHeight} ${line} ${pad.left + plotWidth},${pad.top + plotHeight}`;
  const ticks = [0, 0.5, 1].map((portion) => Math.round(max * portion));
  const step = Math.max(1, Math.ceil(data.length / 6));

  return <div className="w-full overflow-hidden">
    <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label={metric === 'pageViews' ? 'Evolução de visualizações de página' : 'Evolução de visitantes únicos'} className="h-auto w-full">
      {ticks.map((value, index) => {
        const y = pad.top + plotHeight - (index / 2) * plotHeight;
        return <g key={index}><line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#eee9e2" strokeWidth="1" /><text x={pad.left - 8} y={y + 4} textAnchor="end" fill="#77716b" fontSize="11">{numberFormat.format(value)}</text></g>;
      })}
      <polygon points={area} fill="#c89223" fillOpacity="0.12" />
      <polyline points={line} fill="none" stroke="#c89223" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {coords.map((point, index) => <g key={point.day} tabIndex={0} aria-label={`${formatDay(point.day)}: ${numberFormat.format(point[metric])}`}>
        <circle cx={point.x} cy={point.y} r="9" fill="transparent" />
        <circle cx={point.x} cy={point.y} r="4.5" fill="#c89223" stroke="white" strokeWidth="2"><title>{formatDay(point.day)}: {numberFormat.format(point[metric])}</title></circle>
        {index % step === 0 && <text x={point.x} y={height - 12} textAnchor="middle" fill="#77716b" fontSize="11">{formatDay(point.day)}</text>}
      </g>)}
    </svg>
  </div>;
}

function Donut({ rows, selected, onSelect }: { rows: Source[]; selected: string | null; onSelect: (source: string) => void }) {
  const total = rows.reduce((sum, row) => sum + row.views, 0);
  const circumference = 2 * Math.PI * 58;
  let offset = 0;
  return <div className="grid gap-5 sm:grid-cols-[minmax(150px,0.85fr)_minmax(150px,1fr)] sm:items-center">
    <div className="relative mx-auto aspect-square w-full max-w-[190px]">
      <svg viewBox="0 0 140 140" role="img" aria-label="Distribuição das origens dos acessos" className="h-full w-full -rotate-90">
        <circle cx="70" cy="70" r="58" fill="none" stroke="#f0ede8" strokeWidth="20" />
        {total > 0 && rows.filter((row) => row.views > 0).map((row) => {
          const length = circumference * row.views / total;
          const segment = <circle key={row.category} cx="70" cy="70" r="58" fill="none" stroke={sourceColors[row.category] || sourceColors.OTHER} strokeWidth={selected === row.category ? 23 : 20} strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} className="cursor-pointer transition-all" onClick={() => onSelect(row.category)}><title>{sourceLabels[row.category] || 'Outros'}: {numberFormat.format(row.views)} acessos ({row.percent}%)</title></circle>;
          offset += length;
          return segment;
        })}
      </svg>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><strong className="text-xl font-bold">{numberFormat.format(total)}</strong><span className="text-xs text-[#77716b]">total de acessos</span></div>
    </div>
    <div className="space-y-2">{rows.length === 0 ? <p className="text-sm text-[#817a72]">Ainda não há origens identificadas.</p> : rows.map((row) => <button type="button" key={row.category} aria-label={`Detalhar origem ${sourceLabels[row.category] || 'Outros'}`} aria-pressed={selected === row.category} onClick={() => onSelect(row.category)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-[#faf8f4] ${selected === row.category ? 'bg-[#faf5e9]' : ''}`}><span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: sourceColors[row.category] || sourceColors.OTHER }} /><span className="min-w-0 flex-1 truncate">{sourceLabels[row.category] || 'Outros'}</span><strong className="tabular-nums">{row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</strong></button>)}</div>
  </div>;
}

function MetricCard({ title, value, icon: Icon, tint }: { title: string; value: string; icon: typeof Eye; tint: string }) {
  return <article className="min-w-0 rounded-xl border border-[#e7e0d6] bg-white p-4 sm:p-5"><span className={`grid size-10 place-items-center rounded-xl ${tint}`}><Icon size={21} /></span><p className="mt-3 text-sm text-[#504b46]">{title}</p><p className="mt-1 break-words text-2xl font-bold tracking-tight sm:text-3xl">{value}</p></article>;
}

function Pagination({ page, total, pageSize, onChange }: { page: number; total: number; pageSize: number; onChange: (page: number) => void }) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;
  return <div className="mt-4 flex items-center justify-between border-t border-[#eee9e2] pt-3 text-sm text-[#706961]"><span>Página {page} de {pages}</span><div className="flex gap-2"><button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)} className="rounded-lg border border-[#ded8d0] px-3 py-1.5 disabled:opacity-45">Anterior</button><button type="button" disabled={page >= pages} onClick={() => onChange(page + 1)} className="rounded-lg border border-[#ded8d0] px-3 py-1.5 disabled:opacity-45">Próxima</button></div></div>;
}

export function AnalyticsDashboard() {
  const [period, setPeriod] = useState('30d');
  const [customFrom, setCustomFrom] = useState(() => shiftDay(todayInSaoPaulo(), -29));
  const [customTo, setCustomTo] = useState(todayInSaoPaulo);
  const [metric, setMetric] = useState<'pageViews' | 'uniqueVisitors'>('pageViews');
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [allPosts, setAllPosts] = useState(false);
  const [allPages, setAllPages] = useState(false);
  const [postPage, setPostPage] = useState(1);
  const [pagePage, setPagePage] = useState(1);

  const rangeQuery = useMemo(() => period === 'custom'
    ? `period=custom&from=${encodeURIComponent(customFrom)}&to=${encodeURIComponent(customTo)}`
    : `period=${period}`, [period, customFrom, customTo]);
  const summary = useRemote<Summary>(`/api/admin/analytics/summary?${rangeQuery}`);
  const consentDecisions = useRemote<ConsentDecisions>(`/api/admin/analytics/privacy-decisions?${rangeQuery}`, 15_000);
  const trend = useRemote<TrendPoint[]>(`/api/admin/analytics/trend?${rangeQuery}`);
  const sources = useRemote<Source[]>(`/api/admin/analytics/sources?${rangeQuery}`);
  const devices = useRemote<Device[]>(`/api/admin/analytics/devices?${rangeQuery}`);
  const posts = useRemote<Paginated<Post>>(`/api/admin/analytics/posts?${rangeQuery}&page=${postPage}&pageSize=${allPosts ? 10 : 5}`);
  const pages = useRemote<Paginated<Page>>(`/api/admin/analytics/pages?${rangeQuery}&page=${pagePage}&pageSize=${allPages ? 10 : 5}`);
  const sourceDetails = useRemote<SourceDetails>(selectedSource ? `/api/admin/analytics/sources/${selectedSource}?${rangeQuery}` : null);
  const postDetails = useRemote<PostDetails>(selectedPost ? `/api/admin/analytics/posts/${selectedPost}?${rangeQuery}` : null);

  const headline = summary.data || { pageViews: 0, uniqueVisitors: 0, avgEngagedSeconds: 0, postViews: 0 };
  const postRows = posts.data?.posts || [];
  const pageRows = pages.data?.pages || [];
  const deviceRows = devices.data || [];
  const headlineValue = (value: number) => summary.loading || summary.error ? '—' : numberFormat.format(value);

  const changePeriod = (value: string) => {
    setPeriod(value);
    setPostPage(1);
    setPagePage(1);
    setSelectedSource(null);
    setSelectedPost(null);
    if (value === 'custom') {
      setCustomFrom((current) => current || shiftDay(todayInSaoPaulo(), -29));
      setCustomTo((current) => current || todayInSaoPaulo());
    }
  };

  return <div className="space-y-6">
    <div className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
      <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#a77919]">Analytics</p><h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">Visão geral do desempenho</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#77716b] sm:text-base">Acompanhe os acessos, o comportamento dos visitantes e o desempenho das publicações do Grupo +B.</p></div>
      <div className="flex flex-wrap items-end gap-2">
        <label className="flex h-11 min-w-48 items-center gap-2 rounded-xl border border-[#ded8d0] bg-white px-3 text-sm"><CalendarDays size={17} className="shrink-0 text-[#847b70]" /><span className="sr-only">Período</span><select aria-label="Período" value={period} onChange={(event) => changePeriod(event.target.value)} className="min-w-0 flex-1 bg-transparent font-medium outline-none"><option value="today">Hoje</option><option value="7d">Últimos 7 dias</option><option value="30d">Últimos 30 dias</option><option value="90d">Últimos 90 dias</option><option value="custom">Período personalizado</option></select></label>
        {period === 'custom' && <div className="flex items-center gap-2"><label className="sr-only" htmlFor="analytics-from">Data inicial</label><input id="analytics-from" type="date" value={customFrom} onChange={(event) => { setCustomFrom(event.target.value); setPostPage(1); setPagePage(1); }} className="h-11 min-w-0 rounded-xl border border-[#ded8d0] bg-white px-2 text-sm" /><span className="text-[#898178]">até</span><label className="sr-only" htmlFor="analytics-to">Data final</label><input id="analytics-to" type="date" value={customTo} onChange={(event) => { setCustomTo(event.target.value); setPostPage(1); setPagePage(1); }} className="h-11 min-w-0 rounded-xl border border-[#ded8d0] bg-white px-2 text-sm" /></div>}
      </div>
    </div>

    <section aria-label="Indicadores principais" className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
      <MetricCard title="Visualizações de página" value={headlineValue(headline.pageViews)} icon={Eye} tint="bg-[#fbf1da] text-[#b8810d]" />
      <MetricCard title="Visitantes únicos" value={headlineValue(headline.uniqueVisitors)} icon={UsersRound} tint="bg-[#e8f5ed] text-[#299866]" />
      <MetricCard title="Tempo médio de permanência" value={summary.loading || summary.error ? '—' : formatDuration(headline.avgEngagedSeconds)} icon={Clock3} tint="bg-[#fbf1da] text-[#b8810d]" />
      <MetricCard title="Publicações lidas" value={headlineValue(headline.postViews)} icon={FileText} tint="bg-[#f0eeeb] text-[#756e65]" />
    </section>
    {summary.error && <ErrorState error={summary.error} retry={summary.reload} />}

    <Panel title="Preferências de privacidade">
      {consentDecisions.loading ? <LoadingState label="Carregando decisões de privacidade" /> : consentDecisions.error ? <ErrorState error={consentDecisions.error} retry={consentDecisions.reload} /> : <div className="grid items-center gap-5 sm:grid-cols-[minmax(148px,0.7fr)_1fr]">
        <div className="relative mx-auto size-40" role="img" aria-label="Distribuição das decisões de consentimento">
          <svg viewBox="0 0 120 120" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="60" cy="60" r="42" fill="none" stroke="#e8e5e0" strokeWidth="14" />
            {consentDecisions.data?.total ? <>
              <circle cx="60" cy="60" r="42" fill="none" stroke="#c89223" strokeWidth="14" strokeDasharray={`${consentDecisions.data.acceptPercent * 2.639} 263.9`} />
              <circle cx="60" cy="60" r="42" fill="none" stroke="#73706b" strokeWidth="14" strokeDasharray={`${consentDecisions.data.rejectPercent * 2.639} 263.9`} strokeDashoffset={`${-consentDecisions.data.acceptPercent * 2.639}`} />
            </> : null}
          </svg>
          <div className="absolute inset-0 grid place-content-center text-center"><strong className="text-2xl tabular-nums">{numberFormat.format(consentDecisions.data?.total || 0)}</strong><span className="mt-0.5 text-xs text-[#77716b]">decisões</span></div>
        </div>
        <div>
          <p className="text-sm text-[#77716b]"><strong className="font-semibold text-[#37332f]">Decisões registradas</strong> no período; cada ação é contabilizada uma vez e não representa necessariamente uma pessoa única.</p>
          {consentDecisions.data?.total === 0 && <p className="mt-3 text-sm text-[#817a72]">Ainda não há decisões neste período.</p>}
          <dl className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-lg bg-[#fcfbf9] p-3"><dt className="flex items-center gap-2 text-sm text-[#625c55]"><span className="size-2.5 rounded-full bg-[#c89223]" />Aceitaram</dt><dd className="mt-1 text-lg font-bold tabular-nums">{numberFormat.format(consentDecisions.data?.accepted || 0)} <span className="text-sm font-medium text-[#77716b]">({(consentDecisions.data?.acceptPercent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)</span></dd></div>
            <div className="rounded-lg bg-[#fcfbf9] p-3"><dt className="flex items-center gap-2 text-sm text-[#625c55]"><span className="size-2.5 rounded-full bg-[#73706b]" />Recusaram</dt><dd className="mt-1 text-lg font-bold tabular-nums">{numberFormat.format(consentDecisions.data?.rejected || 0)} <span className="text-sm font-medium text-[#77716b]">({(consentDecisions.data?.rejectPercent || 0).toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%)</span></dd></div>
          </dl>
        </div>
      </div>}
    </Panel>

    <div className="grid gap-4 2xl:grid-cols-[1.45fr_1fr]">
      <Panel title="Evolução de acessos" action={<label className="flex h-9 items-center gap-2 rounded-lg border border-[#e3ddd5] px-2.5 text-xs"><span className="size-2.5 rounded-full bg-[#c89223]" /><span className="sr-only">Métrica do gráfico</span><select aria-label="Métrica do gráfico" value={metric} onChange={(event) => setMetric(event.target.value as 'pageViews' | 'uniqueVisitors')} className="bg-transparent outline-none"><option value="pageViews">Visualizações</option><option value="uniqueVisitors">Visitantes únicos</option></select></label>}>
        {trend.loading ? <LoadingState label="Carregando evolução de acessos" /> : trend.error ? <ErrorState error={trend.error} retry={trend.reload} /> : <TrendChart data={trend.data || []} metric={metric} />}
      </Panel>
      <Panel title="Origem dos acessos">
        {sources.loading ? <LoadingState label="Carregando origens de acesso" /> : sources.error ? <ErrorState error={sources.error} retry={sources.reload} /> : <>
          <Donut rows={sources.data || []} selected={selectedSource} onSelect={(source) => setSelectedSource((current) => current === source ? null : source)} />
          {selectedSource && <div className="mt-5 rounded-xl border border-[#eee9e2] bg-[#fcfbf9] p-4">
            {sourceDetails.loading ? <LoadingState label="Carregando detalhamento da origem" /> : sourceDetails.error ? <ErrorState error={sourceDetails.error} retry={sourceDetails.reload} /> : <>
              <div className="flex items-center justify-between gap-2"><h3 className="font-semibold">{sourceLabels[selectedSource] || 'Outros'}</h3><strong>{numberFormat.format(sourceDetails.data?.views || 0)} acessos</strong></div>
              <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-[#77716b]">Publicações acessadas</p>
              {(sourceDetails.data?.posts || []).length === 0 ? <p className="mt-2 text-sm text-[#817a72]">Nenhuma publicação veio desta origem no período.</p> : <ul className="mt-2 space-y-2">{sourceDetails.data?.posts.map((post) => <li key={post.id} className="flex justify-between gap-3 text-sm"><button className="truncate text-left hover:underline" onClick={() => setSelectedPost(post.id)}>{post.title}</button><span className="shrink-0 tabular-nums">{numberFormat.format(post.views)}</span></li>)}</ul>}
              <div className="mt-4 border-t border-[#eee9e2] pt-3"><p className="text-xs font-semibold uppercase tracking-wide text-[#77716b]">Acessos por dia</p><div className="mt-2 flex h-14 items-end gap-1" aria-label="Distribuição diária dos acessos dessa origem">{(sourceDetails.data?.trend || []).map((point) => { const max = Math.max(1, ...(sourceDetails.data?.trend || []).map((item) => item.pageViews)); return <div key={point.day} title={`${formatDay(point.day)}: ${point.pageViews}`} className="min-w-0 flex-1 rounded-t bg-[#c89223]" style={{ height: `${Math.max(3, point.pageViews / max * 100)}%` }} />; })}</div></div>
            </>}
          </div>}
        </>}
      </Panel>
    </div>

    <div className="grid items-start gap-4 2xl:grid-cols-[1.45fr_1fr]">
      <Panel title={allPosts ? 'Todas as publicações' : 'Publicações mais acessadas'} action={<button type="button" onClick={() => { setAllPosts((value) => !value); setPostPage(1); }} className="text-sm font-medium text-[#a77919] hover:underline">{allPosts ? 'Ver top 5' : 'Ver todas'}</button>}>
        {posts.loading ? <LoadingState label="Carregando publicações" /> : posts.error ? <ErrorState error={posts.error} retry={posts.reload} /> : postRows.length === 0 ? <p className="py-10 text-center text-sm text-[#817a72]">Nenhuma publicação foi acessada neste período.</p> : <>
          <ol className="divide-y divide-[#eee9e2]">{postRows.map((post, index) => <li key={post.id} className="grid grid-cols-[22px_58px_minmax(0,1fr)_auto] items-center gap-3 py-3 first:pt-0 last:pb-0 sm:grid-cols-[28px_72px_minmax(0,1fr)_auto] sm:gap-4"><span className="text-sm text-[#57514a]">{(postPage - 1) * (allPosts ? 10 : 5) + index + 1}.</span><button type="button" onClick={() => setSelectedPost(post.id)} aria-label={`Detalhar ${post.title}`} className="h-[58px] w-[58px] overflow-hidden rounded-lg bg-[#f1ede6] sm:h-[72px] sm:w-[72px]">{post.imagePath ? <img src={post.imagePath} alt="" className="h-full w-full object-cover" onError={(event) => { event.currentTarget.style.display = 'none'; }} /> : <span className="grid h-full place-items-center text-[#a69b8d]"><FileText size={20} /></span>}</button><div className="min-w-0"><button type="button" onClick={() => setSelectedPost(post.id)} className="line-clamp-2 text-left text-sm font-medium leading-5 hover:underline">{post.title}</button><time className="mt-1 block text-xs text-[#817a72]" dateTime={post.publishedAt}>{new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Sao_Paulo' }).format(new Date(post.publishedAt))}</time></div><span className="whitespace-nowrap text-xs text-[#625c55] sm:text-sm"><Eye size={14} className="mr-1 inline-block" />{numberFormat.format(post.views)}</span></li>)}</ol>
          {allPosts && <Pagination page={postPage} total={posts.data?.total || 0} pageSize={10} onChange={setPostPage} />}
        </>}
        {selectedPost && <div className="mt-5 rounded-xl border border-[#e7e0d6] bg-[#fcfbf9] p-4">
          <div className="mb-3 flex items-center justify-between gap-2"><h3 className="font-semibold">Desempenho da publicação</h3><button type="button" onClick={() => setSelectedPost(null)} className="rounded px-2 py-1 text-sm text-[#746d65] hover:bg-white">Fechar</button></div>
          {postDetails.loading ? <LoadingState label="Carregando detalhes da publicação" /> : postDetails.error ? <ErrorState error={postDetails.error} retry={postDetails.reload} /> : postDetails.data && <><p className="text-sm font-medium">{postDetails.data.post.title}</p><div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4"><div className="rounded-lg bg-white p-3"><p className="text-xs text-[#817a72]">Visualizações</p><strong>{numberFormat.format(postDetails.data.summary.pageViews)}</strong></div><div className="rounded-lg bg-white p-3"><p className="text-xs text-[#817a72]">Visitantes únicos</p><strong>{numberFormat.format(postDetails.data.summary.uniqueVisitors)}</strong></div><div className="rounded-lg bg-white p-3"><p className="text-xs text-[#817a72]">Tempo engajado médio</p><strong>{formatDuration(postDetails.data.summary.avgEngagedSeconds)}</strong></div><div className="rounded-lg bg-white p-3"><p className="text-xs text-[#817a72]">Período</p><strong className="text-sm">{period === 'custom' ? `${formatDay(customFrom)} – ${formatDay(customTo)}` : period === 'today' ? 'Hoje' : `Últimos ${period}`}</strong></div></div><div className="mt-4 grid gap-4 md:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-wide text-[#77716b]">Origem do tráfego</p><ul className="mt-2 space-y-1 text-sm">{postDetails.data.sources.length ? postDetails.data.sources.map((source) => <li key={source.category} className="flex justify-between gap-3"><span>{sourceLabels[source.category] || 'Outros'}</span><span>{source.percent}%</span></li>) : <li className="text-[#817a72]">Sem dados de origem.</li>}</ul></div><div><p className="text-xs font-semibold uppercase tracking-wide text-[#77716b]">Evolução dos acessos</p><div className="mt-2"><TrendChart data={postDetails.data.trend} metric="pageViews" /></div></div></div></>}
        </div>}
      </Panel>

      <div className="space-y-4">
        <Panel title="Dispositivos utilizados">
          {devices.loading ? <LoadingState label="Carregando dispositivos" /> : devices.error ? <ErrorState error={devices.error} retry={devices.reload} /> : <div className="space-y-4">{deviceRows.map((row) => { const Icon = row.device === 'DESKTOP' ? Monitor : row.device === 'MOBILE' ? Smartphone : Tablet; const label = row.device === 'DESKTOP' ? 'Desktop' : row.device === 'MOBILE' ? 'Mobile' : 'Tablet'; return <div key={row.device} className="flex items-center gap-3"><Icon size={22} className="shrink-0 text-[#b8810d]" /><div className="min-w-0 flex-1"><div className="mb-1 flex justify-between gap-2 text-sm"><span>{label}</span><span>{row.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#efede9]"><div className="h-full rounded-full bg-[#c89223]" style={{ width: `${Math.max(0, Math.min(100, row.percent))}%` }} /></div></div></div>; })}</div>}
        </Panel>
        <Panel title={allPages ? 'Todas as páginas visitadas' : 'Páginas mais visitadas'} action={<button type="button" onClick={() => { setAllPages((value) => !value); setPagePage(1); }} className="text-sm font-medium text-[#a77919] hover:underline">{allPages ? 'Ver top 5' : 'Ver todas'}</button>}>
          {pages.loading ? <LoadingState label="Carregando páginas mais visitadas" /> : pages.error ? <ErrorState error={pages.error} retry={pages.reload} /> : pageRows.length === 0 ? <p className="py-8 text-center text-sm text-[#817a72]">Nenhuma página foi acessada neste período.</p> : <><ol className="divide-y divide-[#eee9e2]">{pageRows.map((page, index) => <li key={page.path} className="grid grid-cols-[22px_minmax(0,1fr)_minmax(60px,0.9fr)_48px] items-center gap-2 py-3 text-sm"><span>{(pagePage - 1) * (allPages ? 10 : 5) + index + 1}.</span><span title={page.path} className="truncate">{page.path}</span><span className="h-1.5 overflow-hidden rounded-full bg-[#efede9]"><span className="block h-full rounded-full bg-[#c89223]" style={{ width: `${Math.max(0, Math.min(100, page.percent))}%` }} /></span><span className="text-right tabular-nums">{page.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%</span></li>)}</ol>{allPages && <Pagination page={pagePage} total={pages.data?.total || 0} pageSize={10} onChange={setPagePage} />}</>}
        </Panel>
      </div>
    </div>
  </div>;
}
