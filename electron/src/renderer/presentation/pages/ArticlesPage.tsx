import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { newsApi } from '@/infrastructure/api/client';
import { STATUS_LABELS, STATUS_COLORS } from '@/shared/constants';
import { Plus, Pencil, Trash2, Search, FileText, Archive, RotateCcw, ChevronDown, ChevronRight, Loader2, ChevronLeft } from 'lucide-react';
import { TableSkeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

export function ArticlesPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);
  const [archived, setArchived] = useState<any[]>([]);
  const [totalArchived, setTotalArchived] = useState(0);
  const toast = useToastStore((s) => s.addToast);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const loadArticles = async () => {
    try {
      setLoading(true);
      let url = `/admin/materias?page=${page}&limit=10`;
      if (search) url += `&q=${encodeURIComponent(search)}`;
      if (statusFilter) url += `&status=${statusFilter}`;
      const data = await newsApi.get(url);
      setArticles(data?.data || []);
      setTotal(data?.total || 0);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setLoading(false); }
  };

  const loadArchived = async () => {
    try {
      setArchivedLoading(true);
      const data = await newsApi.get('/admin/materias?status=ARCHIVED&limit=100');
      setArchived(data?.data || []);
      setTotalArchived(data?.total || 0);
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setArchivedLoading(false); }
  };

  useEffect(() => { loadArticles(); loadArchived(); }, [page, search, statusFilter]);

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar este artigo?', async () => {
      try {
        setDeleting(id);
        await newsApi.delete(`/admin/articles/${id}`);
        toast('Artigo deletado.', 'success'); loadArticles();
      } catch (e: any) { toast(e.message || 'Erro ao deletar.', 'error'); }
      finally { setDeleting(null); }
    });
  };

  const handleArchive = async (id: string) => {
    try { await newsApi.patch(`/admin/articles/${id}/archive`, {}); toast('Artigo arquivado.', 'success'); loadArticles(); loadArchived(); }
    catch (e: any) { toast(e.message || 'Erro ao arquivar.', 'error'); }
  };

  const handleUnarchive = async (id: string) => {
    try { await newsApi.patch(`/admin/articles/${id}/unarchive`, {}); toast('Artigo desarquivado.', 'success'); loadArchived(); loadArticles(); }
    catch (e: any) { toast(e.message || 'Erro ao desarquivar.', 'error'); }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-headline-md font-bold text-on-surface">Artigos</h1>
        <Link to="/materias/new" className="btn-secondary flex items-center gap-2"><Plus size={16} /> Novo Artigo</Link>
      </div>

      <div className="card mb-4">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input placeholder="Buscar artigos..." value={searchInput} onChange={(e) => setSearchInput(e.target.value)} className="input-field pl-10" />
          </div>
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="appearance-none rounded-full border border-outline-variant bg-surface-container-lowest px-4 py-2 pr-8 text-xs font-bold text-on-surface transition-colors hover:border-primary focus:border-primary focus:outline-none cursor-pointer"
            >
              <option value="">Todos os status</option>
              <option value="PUBLISHED">Publicados</option>
              <option value="DRAFT">Rascunhos</option>
              <option value="REVIEW">Revisão</option>
              <option value="SCHEDULED">Agendados</option>
            </select>
            <ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant" />
          </div>
        </div>
      </div>

      {loading ? <TableSkeleton rows={5} cols={4} /> : (
        <div className="card overflow-x-auto mb-4">
          <table className="w-full table-fixed">
            <thead><tr className="border-b border-outline-variant">
              <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[45%]">Artigo</th>
              <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[25%]">Categoria</th>
              <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[12%]">Status</th>
              <th className="text-right py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[18%]">Ações</th>
            </tr></thead>
            <tbody>
              {articles.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-on-surface-variant">Nenhum artigo.</td></tr>}
              {articles.map((a) => (
                <tr key={a.id} className="table-row">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-3">
                      {a.coverImage ? <img src={a.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0"><FileText size={16} className="text-on-surface-variant" /></div>}
                      <div className="min-w-0"><p className="font-body text-sm font-medium truncate">{a.title}</p><p className="text-xs text-on-surface-variant">{a.author?.name || a.authorNameSnapshot || ''}</p></div>
                    </div>
                  </td>
                  <td className="py-3 px-3"><span className="badge bg-surface-container text-on-surface-variant truncate max-w-full px-3 py-1">{a.category?.name || '-'}</span></td>
                  <td className="py-3 px-3">
                    <div className="flex flex-col gap-0.5 items-start">
                      {(() => {
                        const isScheduled = a.status === 'DRAFT' && !!a.scheduledAt;
                        const label = isScheduled ? 'Agendado' : (STATUS_LABELS[a.status] || a.status);
                        const color = isScheduled ? 'bg-blue-50 text-blue-700' : (STATUS_COLORS[a.status] || '');
                        return <span className={`badge ${color} px-3 py-1`}>{label}</span>;
                      })()}
                      {a.scheduledAt && new Date(a.scheduledAt) > new Date() && (
                        <span className="text-[9px] text-amber-600 flex items-center gap-1">
                          📅 {new Date(a.scheduledAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} às {new Date(a.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/materias/${a.id}`} className="p-1.5 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors text-on-surface-variant" title="Editar"><Pencil size={16} /></Link>
                      <button onClick={() => handleArchive(a.id)} className="p-1.5 rounded hover:bg-yellow-50 hover:text-yellow-700 transition-colors text-gray-500" title="Arquivar"><Archive size={16} /></button>
                      <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="p-1.5 rounded hover:bg-red-50 hover:text-red-600 transition-colors text-red-400 disabled:opacity-40" title="Deletar">
                        {deleting === a.id ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 10 && (
        <div className="flex items-center justify-center gap-2 mb-6">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={16} /></button>
          {Array.from({ length: Math.ceil(total / 10) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded text-sm font-bold transition-colors ${p === page ? 'bg-primary text-white' : 'hover:bg-surface-container-low text-on-surface-variant'}`}>{p}</button>
          ))}
          <button onClick={() => setPage((p) => p + 1)} disabled={articles.length < 10} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={16} /></button>
        </div>
      )}

      <div>
        <button onClick={() => { setArchivedExpanded(!archivedExpanded); if (!archivedExpanded && archived.length === 0) loadArchived(); }} className="flex items-center gap-2 mb-3">
          {archivedExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          <Archive size={14} className="text-gray-500" />
          <span className="font-headline text-sm font-bold text-on-surface">Artigos Arquivados</span>
          <span className="badge bg-gray-100 text-gray-600 text-[10px]">{totalArchived}</span>
        </button>
        {archivedExpanded && archivedLoading && <TableSkeleton rows={3} cols={4} />}
        {archivedExpanded && !archivedLoading && archived.length === 0 && <div className="card p-8 text-center text-on-surface-variant text-sm">Nenhum artigo arquivado.</div>}
        {archivedExpanded && !archivedLoading && archived.length > 0 && (
          <div className="card overflow-x-auto">
            <table className="w-full table-fixed">
              <thead><tr className="border-b border-outline-variant">
                <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[45%]">Artigo</th>
                <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[25%]">Categoria</th>
                <th className="text-left py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[15%]">Autor</th>
                <th className="text-right py-3 px-3 font-headline text-label-sm font-bold text-on-surface-variant w-[15%]">Ações</th>
              </tr></thead>
              <tbody>
                {archived.map((a) => (
                  <tr key={a.id} className="table-row">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        {a.coverImage ? <img src={a.coverImage} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" /> : <div className="w-10 h-10 rounded-lg bg-surface-container flex items-center justify-center shrink-0"><FileText size={16} className="text-on-surface-variant" /></div>}
                        <div className="min-w-0"><p className="font-body text-sm font-medium truncate">{a.title}</p><p className="text-xs text-on-surface-variant">{a.slug || ''}</p></div>
                      </div>
                    </td>
                    <td className="py-3 px-3"><span className="badge bg-surface-container text-on-surface-variant truncate max-w-full px-3 py-1">{a.category?.name || '-'}</span></td>
                    <td className="py-3 px-3"><span className="text-sm text-on-surface-variant">{a.author?.name || '-'}</span></td>
                    <td className="py-3 px-3">
                      <div className="flex justify-end gap-1">
                        <Link to={`/materias/${a.id}`} className="p-1.5 rounded hover:bg-surface-container-low" title="Editar"><Pencil size={14} /></Link>
                        <button onClick={() => handleUnarchive(a.id)} className="p-1.5 rounded hover:bg-blue-50 text-blue-600" title="Desarquivar"><RotateCcw size={14} /></button>
                        <button onClick={() => handleDelete(a.id)} disabled={deleting === a.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-40" title="Deletar">
                          {deleting === a.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
