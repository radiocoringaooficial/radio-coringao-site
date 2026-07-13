import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { newsApi } from '@/infrastructure/api/client';
import { FileText, Eye, Clock, CheckCircle, TrendingUp, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { DashboardSkeleton } from '@/presentation/components/ui/Skeleton';

interface TopArticle { id: string; title: string; viewCount: number; coverImage?: string; category?: { name: string; color?: string }; author?: { name: string }; }
interface MonthData { month: string; published: number; review: number; }
interface ReadsData { month: string; reads: number; uniqueReaders: number; }

function Sparkline({ data, dataKey, color, gradientId }: { data: any[]; dataKey: string; color: string; gradientId: string }) {
  if (!data || data.length === 0) return <div className="h-16" />;
  const showDot = data.length <= 2;
  return (
    <ResponsiveContainer width="100%" height={64}>
      <AreaChart data={data} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
        <defs><linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity={0.3} /><stop offset="100%" stopColor={color} stopOpacity={0} /></linearGradient></defs>
        <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} dot={showDot ? { r: 4, fill: color, strokeWidth: 2, stroke: '#fff' } : false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    newsApi.get('/admin/dashboard').then(setData).catch((err) => setError(err.message)).finally(() => setLoading(false));
  }, []);

  if (loading) return <DashboardSkeleton />;
  if (error) return <div className="card border-red-200"><p className="text-red-500">{error}</p></div>;

  const s = data?.stats || data;
  const topArticles: TopArticle[] = data?.topArticles || [];
  const articlesPerMonth: MonthData[] = data?.articlesPerMonth || [];
  const readsPerMonth: ReadsData[] = data?.readsPerMonth || [];
  const last6 = articlesPerMonth.slice(-6);
  const last6Reads = readsPerMonth.slice(-6);

  const monthLabels: Record<string, string> = { '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Abr', '05': 'Mai', '06': 'Jun', '07': 'Jul', '08': 'Ago', '09': 'Set', '10': 'Out', '11': 'Nov', '12': 'Dez' };
  const fmt = (d: MonthData[]) => d.map((item) => { const [y, m] = item.month.split('-'); return { ...item, label: `${monthLabels[m] || m} ${y}` }; });
  const fmtReads = (d: ReadsData[]) => d.map((item) => { const [y, m] = item.month.split('-'); return { ...item, label: `${monthLabels[m] || m} ${y}` }; });

  const artByYear = articlesPerMonth.reduce((acc: Record<string, number>, d) => { const y = d.month.slice(0, 4); acc[y] = (acc[y] || 0) + d.published; return acc; }, {});
  const yearlyArt = Object.entries(artByYear).map(([year, published]) => ({ year, published }));
  const viewsByYear = readsPerMonth.reduce((acc: Record<string, number>, d) => { const y = d.month.slice(0, 4); acc[y] = (acc[y] || 0) + d.reads; return acc; }, {});
  const yearlyViews = Object.entries(viewsByYear).map(([year, reads]) => ({ year, reads }));

  const ChartCard = ({ title, subtitle, icon, color, gradientId, labels, dataKey, onClick }: any) => (
    <div className="card cursor-pointer hover:shadow-lg hover:border-primary/20 transition-all group" onClick={onClick}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg" style={{ backgroundColor: color + '15' }}>{icon}</div>
          <div><h3 className="font-headline text-xs font-bold text-on-surface">{title}</h3><p className="text-[10px] text-on-surface-variant">{subtitle}</p></div>
        </div>
        <ArrowUpRight size={14} className="text-on-surface-variant group-hover:text-primary transition-colors" />
      </div>
      <Sparkline data={labels} dataKey={dataKey} color={color} gradientId={gradientId} />
    </div>
  );

  return (
    <div className="fade-in space-y-6">
      <h1 className="font-headline text-headline-md font-bold text-on-surface">Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: s.total || 0, icon: <FileText size={18} />, color: '#3b82f6' },
          { label: 'Publicados', value: s.published || 0, icon: <CheckCircle size={18} />, color: '#6366f1' },
          { label: 'Rascunhos', value: s.draft || 0, icon: <Clock size={18} />, color: '#f59e0b' },
          { label: 'Views', value: s.totalViews || 0, icon: <Eye size={18} />, color: '#a855f7' },
        ].map((c) => (
          <div key={c.label} className="card flex items-start gap-3">
            <div className="p-2 rounded-lg" style={{ backgroundColor: c.color + '15', color: c.color }}>{c.icon}</div>
            <div><p className="text-[10px] text-on-surface-variant uppercase tracking-wide">{c.label}</p><p className="text-lg font-bold text-on-surface">{c.value.toLocaleString()}</p></div>
          </div>
        ))}
      </div>
      <div className="card">
        <div className="flex items-center gap-2 mb-4"><TrendingUp size={18} className="text-primary" /><h2 className="font-headline text-headline-sm font-bold text-on-surface">Mais Lidas</h2></div>
        {topArticles.length === 0 ? <p className="text-on-surface-variant text-sm py-4 text-center">Nenhuma notícia registrada.</p> : (
          <div className="space-y-1.5">
            {topArticles.slice(0, 5).map((article, i) => (
              <div key={article.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-surface-container-low transition-colors cursor-pointer" onClick={() => navigate(`/materias/${article.id}`)}>
                <span className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: i === 0 ? '#fbbf24' : i === 1 ? '#9ca3af' : i === 2 ? '#cd7f32' : '#e5e7eb', color: i < 3 ? '#fff' : '#6b7280' }}>{i + 1}</span>
                {article.coverImage ? <img src={article.coverImage} alt="" className="w-11 h-11 rounded-xl object-cover shrink-0" /> : <div className="w-11 h-11 rounded-xl bg-surface-container flex items-center justify-center shrink-0"><FileText size={14} className="text-on-surface-variant" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{article.title}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {article.category && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700">{article.category.name}</span>}
                    {article.author && <span className="text-[10px] text-on-surface-variant">{article.author.name}</span>}
                  </div>
                </div>
                <div className="text-right shrink-0"><p className="text-sm font-bold text-on-surface">{article.viewCount.toLocaleString()}</p><p className="text-[10px] text-on-surface-variant">views</p></div>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard title="Publicações — Últimos 6 meses" subtitle="Evolução mensal" icon={<FileText size={14} style={{ color: '#6366f1' }} />} color="#6366f1" gradientId="grad-art-month" dataKey="published" labels={fmt(last6)} onClick={() => navigate('/dashboard/materias-month')} />
        <ChartCard title="Publicações — Por ano" subtitle="Total publicados" icon={<CheckCircle size={14} style={{ color: '#6366f1' }} />} color="#6366f1" gradientId="grad-art-year" dataKey="published" labels={yearlyArt} onClick={() => navigate('/dashboard/materias-year')} />
        <ChartCard title="Visualizações — Últimos 6 meses" subtitle="Leituras e únicos" icon={<Eye size={14} style={{ color: '#8b5cf6' }} />} color="#8b5cf6" gradientId="grad-views-month" dataKey="reads" labels={fmtReads(last6Reads)} onClick={() => navigate('/dashboard/views-month')} />
        <ChartCard title="Visualizações — Por ano" subtitle="Total de leituras" icon={<Eye size={14} style={{ color: '#f97316' }} />} color="#f97316" gradientId="grad-views-year" dataKey="reads" labels={yearlyViews} onClick={() => navigate('/dashboard/views-year')} />
      </div>
    </div>
  );
}
