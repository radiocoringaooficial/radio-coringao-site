import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { clubeApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, ChevronLeft, Save, MapPin, Trophy, Clock, X, Shield, Loader2, Archive, ArchiveRestore } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { CardGridSkeleton, Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  SCHEDULED: { label: 'Agendado', color: 'text-blue-700', bg: 'bg-blue-50' },
  IN_PLAY: { label: 'Ao vivo', color: 'text-green-700', bg: 'bg-green-50' },
  FINISHED: { label: 'Finalizado', color: 'text-gray-600', bg: 'bg-gray-100' },
  POSTPONED: { label: 'Adiado', color: 'text-yellow-700', bg: 'bg-yellow-50' },
  CANCELLED: { label: 'Cancelado', color: 'text-red-600', bg: 'bg-red-50' },
};

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };

const LIMIT = 6;

function OpponentSelect({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  useEffect(() => { clubeApi.get('/adversarios').then((d) => setOpponents(Array.isArray(d) ? d : d?.data || [])).catch(() => {}); }, []);

  const selected = opponents.find((o) => o.id === value);
  const filtered = opponents.filter((o) => o.name.toLowerCase().includes(search.toLowerCase()) || (o.shortName && o.shortName.toLowerCase().includes(search.toLowerCase())));

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setSearch('');
    setOpen(true);
  };

  return (
    <>
      <button type="button" ref={btnRef} onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors text-left">
        {selected?.logoUrl ? <img src={selected.logoUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> :
          <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center shrink-0"><Shield size={10} className="text-on-surface-variant" /></div>}
        <span className="flex-1 text-sm text-on-surface">{selected?.name || 'Selecionar adversário...'}</span>
        <ChevronDown size={14} className={`text-on-surface-variant/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div data-dropdown className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-outline-variant" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: '50vh' }}>
          <div className="p-2 border-b border-outline-variant/30">
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar time..."
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary/60" autoFocus />
          </div>
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '42vh' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-left hover:bg-surface-container-low transition-colors text-xs text-on-surface-variant">
              Nenhum
            </button>
            <div className="border-t border-outline-variant/30" />
            {filtered.map((o) => (
              <button key={o.id} type="button"
                onClick={() => { onChange(o.id); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${value === o.id ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                {o.logoUrl ? <img src={o.logoUrl} alt="" className="w-7 h-7 object-contain shrink-0" /> :
                  <div className="w-7 h-7 rounded bg-surface-container flex items-center justify-center shrink-0"><Shield size={11} className="text-on-surface-variant" /></div>}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{o.name}</p>
                  {o.shortName && <p className="text-[10px] text-on-surface-variant">{o.shortName}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-4 text-center text-[11px] text-on-surface-variant">Nenhum adversário encontrado</div>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function MatchCard({ match, team, opponents, competitions, onEdit, onDelete, onArchive, onUnarchive }: any) {
  const opp = opponents.find((o: any) => o.id === match.opponentId);
  const comp = competitions.find((c: any) => c.id === match.competitionId);
  const cat = match.competition?.category || comp?.category;
  const categoryName = cat?.name;
  const categoryGender = cat?.gender;
  const st = STATUS_MAP[match.status] || STATUS_MAP.SCHEDULED;
  const d = new Date(match.date);
  const genderLabel = categoryGender === 'MALE' ? 'Masculino' : categoryGender === 'FEMALE' ? 'Feminino' : categoryGender === 'MIXED' ? 'Misto' : '';

  return (
    <div className="card slide-up group max-w-xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
          {team?.logoUrl ? <img src={team.logoUrl} alt="" className="w-8 h-8 object-contain" /> :
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><Shield size={14} className="text-on-surface-variant" /></div>}
          <p className="text-[8px] font-headline font-bold text-on-surface text-center leading-tight">{team?.shortName || 'COR'}</p>
        </div>
        <div className="flex flex-col items-center gap-0.5 w-16 shrink-0">
          {match.status === 'FINISHED' && match.homeScore != null ? (
            <div className="flex items-center gap-0.5">
              <span className="text-xl font-headline font-bold text-on-surface">{match.homeScore}</span>
              <span className="text-xs text-on-surface-variant">×</span>
              <span className="text-xl font-headline font-bold text-on-surface">{match.awayScore}</span>
            </div>
          ) : (
            <span className="text-sm font-headline font-bold text-on-surface-variant">vs</span>
          )}
          <span className={`badge text-[9px] ${st.bg} ${st.color}`}>{st.label}</span>
        </div>
        <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
          {opp?.logoUrl ? <img src={opp.logoUrl} alt="" className="w-8 h-8 object-contain" /> :
            <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center"><Shield size={14} className="text-on-surface-variant" /></div>}
          <p className="text-[8px] font-headline font-bold text-on-surface text-center leading-tight truncate max-w-[60px]">{opp?.shortName || opp?.name || 'TBD'}</p>
        </div>
        <div className="h-8 w-px bg-outline-variant shrink-0" />
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-1 text-xs text-on-surface-variant">
            <Clock size={10} className="shrink-0" />
            <span className="font-headline font-bold text-on-surface">{d.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })}</span>
            <span className="text-[10px]">{d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          {match.venue && <div className="flex items-center gap-1 text-[10px] text-on-surface-variant"><MapPin size={8} className="shrink-0" />{match.venue}</div>}
          <div className="flex items-center gap-1.5 flex-wrap">
            {categoryName && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700">
                {categoryName}{genderLabel && <span className="font-normal opacity-70"> {genderLabel}</span>}
              </span>
            )}
            {comp && <span className="flex items-center gap-0.5 text-[10px] text-on-surface-variant"><Trophy size={8} />{comp.name}</span>}
            {match.round && <span className="text-[10px] text-on-surface-variant">• {match.round}</span>}
          </div>
        </div>
        <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(match)} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={14} /></button>
          {match.isArchived ? (
            <button onClick={() => onUnarchive(match.id)} className="p-1.5 rounded hover:bg-blue-100 text-blue-600" title="Desarquivar"><ArchiveRestore size={14} /></button>
          ) : (
            <button onClick={() => onArchive(match.id)} className="p-1.5 rounded hover:bg-yellow-100 text-yellow-600" title="Arquivar"><Archive size={14} /></button>
          )}
          <button onClick={() => onDelete(match.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Trash2 size={14} /></button>
        </div>
      </div>
    </div>
  );
}

function MatchCardSkeleton() {
  return (
    <div className="card max-w-xl">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-2 w-8" />
        </div>
        <div className="flex flex-col items-center gap-0.5 w-16 shrink-0">
          <Skeleton className="h-6 w-12" />
          <Skeleton className="h-3.5 w-16" />
        </div>
        <div className="flex flex-col items-center gap-0.5 w-14 shrink-0">
          <Skeleton className="w-8 h-8 rounded-full" />
          <Skeleton className="h-2 w-12" />
        </div>
        <div className="h-8 w-px bg-outline-variant shrink-0" />
        <div className="flex-1 min-w-0 space-y-1.5">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      </div>
    </div>
  );
}

export function MatchesPage() {
  const toast = useToastStore((s) => s.addToast);
  const [matches, setMatches] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ date: '', venue: '', status: 'SCHEDULED', competitionId: '', opponentId: '', homeScore: '', awayScore: '', round: '', categoryId: '', season: String(new Date().getFullYear()), ticketUrl: '' });
  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const SECTION_LIMIT = 6;
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivedMatches, setArchivedMatches] = useState<any[]>([]);
  const [archivedExpanded, setArchivedExpanded] = useState(false);
  const [archivedLoading, setArchivedLoading] = useState(false);

  const loadArchived = async () => {
    try {
      setArchivedLoading(true);
      const m = await clubeApi.get('/admin/partidas?limit=200&archived=true').catch(() => ({ data: [] }));
      const mData = Array.isArray(m) ? m : m?.data || [];
      setArchivedMatches(mData);
    } catch {} finally { setArchivedLoading(false); }
  };

  const load = async () => {
    try {
      const [m, o, c, cat, t] = await Promise.all([
        clubeApi.get(`/admin/partidas?page=${page}&limit=50`).catch((e) => { console.error('partidas err:', e); return { data: [], total: 0 }; }),
        clubeApi.get('/adversarios').catch(() => []),
        clubeApi.get('/admin/competicoes').catch(() => []),
        clubeApi.get('/categorias/flat').catch(() => []),
        clubeApi.get('/team').catch(() => ({})),
      ]);
      const mData = Array.isArray(m) ? m : m?.data || [];
      console.log('[LOAD] matches recebidos:', JSON.stringify(mData.map((m: any) => ({ id: m.id, ticketUrl: m.ticketUrl }))));
      setMatches(mData);
      setTotal(m?.total || mData.length);
      setOpponents(Array.isArray(o) ? o : o?.data || []);
      setCompetitions(Array.isArray(c) ? c : c?.data || []);
      setCategories(Array.isArray(cat) ? cat : []);
      setTeam(t);
    } catch (e: any) { console.error('load error:', e); toast(e.message, 'error'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); loadArchived(); }, [page]);

  const totalPages = Math.ceil(total / LIMIT);
  const upcoming = matches.filter((m) => ['SCHEDULED', 'IN_PLAY', 'POSTPONED'].includes(m.status));
  const past = matches.filter((m) => ['FINISHED', 'CANCELLED'].includes(m.status));
  const filteredCompetitions = useMemo(() => {
    if (!form.categoryId) return competitions;
    return competitions.filter((c) => c.categoryId === form.categoryId);
  }, [competitions, form.categoryId]);

  // Build category hierarchy: root categories with their children nested
  const categoryHierarchy = useMemo(() => {
    const roots = categories.filter((c: any) => !c.parentId);
    return roots.map((root: any) => ({
      ...root,
      children: categories.filter((c: any) => c.parentId === root.id),
    }));
  }, [categories]);
  const selectedComp = competitions.find((c) => c.id === form.competitionId);
  const isFriendly = selectedComp?.tableFormat === 'friendly';

  const getCategoryLabel = (id: string) => {
    for (const p of categories) {
      if (p.id === id) return p.name;
      const child = p.children?.find((c: any) => c.id === id);
      if (child) return `${p.name} → ${child.name}`;
    }
    return '';
  };

  const openNew = () => { setEditing(null); const f = { date: '', venue: '', status: 'SCHEDULED', competitionId: '', opponentId: '', homeScore: '', awayScore: '', round: '', categoryId: '', season: String(new Date().getFullYear()), ticketUrl: '' }; setForm(f); setInitialForm({ ...f }); setModalOpen(true); };
  const openEdit = (m: any) => {
    console.log('[OPEN EDIT] recebido:', JSON.stringify(m));
    setEditing(m);
    const comp = competitions.find((c) => c.id === m.competitionId);
    const catId = comp?.categoryId || '';
    const f = { date: m.date ? new Date(m.date).toISOString().slice(0, 16) : '', venue: m.venue || '', status: m.status || 'SCHEDULED', competitionId: m.competitionId || '', opponentId: m.opponentId || '', homeScore: m.homeScore != null ? String(m.homeScore) : '', awayScore: m.awayScore != null ? String(m.awayScore) : '', round: m.round || '', categoryId: catId, season: m.season || String(new Date(m.date).getFullYear()), ticketUrl: m.ticketUrl || '' };
    setForm(f);
    setInitialForm({ ...f });
    setModalOpen(true);
  };

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  const handleSave = async () => {
    if (!form.date) { toast('Data é obrigatória.', 'error'); return; }
    if (!form.opponentId) { toast('Selecione um adversário.', 'error'); return; }
    setSaving(true);
    try {
      const data: any = { date: new Date(form.date).toISOString(), venue: form.venue || null, status: form.status, opponentId: form.opponentId, competitionId: form.competitionId || undefined, isHome: true, round: form.round || null, season: form.season, ticketUrl: form.ticketUrl?.trim() || null };
      if (form.status === 'FINISHED' || form.status === 'IN_PLAY') {
        data.homeScore = form.homeScore ? Number(form.homeScore) : 0;
        data.awayScore = form.awayScore ? Number(form.awayScore) : 0;
      }
      if (editing) await clubeApi.patch(`/admin/partidas/${editing.id}`, data);
      else await clubeApi.post('/admin/partidas', data);
      toast('Salvo com sucesso!', 'success'); setModalOpen(false); load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar esta partida?', async () => {
      try { await clubeApi.delete(`/admin/partidas/${id}`); toast('Removida.', 'success'); load(); }
      catch (e: any) { toast(e.message, 'error'); }
    });
  };

  const handleArchive = async (id: string) => {
    try { await clubeApi.patch(`/admin/partidas/${id}/archive`, {}); toast('Arquivada.', 'success'); load(); loadArchived(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const handleUnarchive = async (id: string) => {
    try { await clubeApi.patch(`/admin/partidas/${id}/unarchive`, {}); toast('Desarquivada.', 'success'); load(); loadArchived(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const handleDeleteArchived = async (id: string) => {
    confirm('Excluir esta partida permanentemente?', async () => {
      try { await clubeApi.delete(`/admin/partidas/${id}`); toast('Excluída.', 'success'); loadArchived(); }
      catch (e: any) { toast(e.message, 'error'); }
    });
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-headline-md font-bold text-on-surface">Partidas</h1>
        <button onClick={openNew} className="btn-secondary flex items-center gap-2"><Plus size={16} /> Nova Partida</button>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="space-y-2 ml-6">{Array.from({ length: 3 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>
          </div>
          <div>
            <Skeleton className="h-6 w-40 mb-3" />
            <div className="space-y-2 ml-6">{Array.from({ length: 3 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {(() => {
            const getCatKey = (m: any) => {
              const cat = m.competition?.category;
              return cat ? `${cat.slug || cat.name}` : 'sem-categoria';
            };
            const getCatLabel = (m: any) => {
              const cat = m.competition?.category;
              if (!cat) return 'Sem Categoria';
              const gender = cat.gender === 'MALE' ? ' Masculino' : cat.gender === 'FEMALE' ? ' Feminino' : cat.gender === 'MIXED' ? ' Misto' : '';
              return `${cat.name}${gender}`;
            };
            const getCatOrder = (m: any) => {
              const cat = m.competition?.category;
              const order: Record<string, number> = { futebol: 1, 'futebol-feminino': 2, 'sub-20': 3, 'sub-17': 4, basquete: 5, futsal: 6 };
              return order[cat?.slug || ''] || 99;
            };

            const allBySeason: Record<string, any[]> = {};
            matches.forEach(m => { const s = m.season || '2026'; if (!allBySeason[s]) allBySeason[s] = []; allBySeason[s].push(m); });
            const allSeasons = Object.keys(allBySeason).sort().reverse();

            return allSeasons.map(season => {
              const sMatches = allBySeason[season] || [];
              const isOpen = expanded === `season-${season}`;

              // Group by category within season
              const byCat: Record<string, any[]> = {};
              sMatches.forEach((m: any) => { const k = getCatKey(m); if (!byCat[k]) byCat[k] = []; byCat[k].push(m); });
              const catKeys = Object.keys(byCat).sort((a, b) => {
                const orderA = byCat[a][0] ? getCatOrder(byCat[a][0]) : 99;
                const orderB = byCat[b][0] ? getCatOrder(byCat[b][0]) : 99;
                return orderA - orderB;
              });

              return (
                <div key={season} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : `season-${season}`)}
                    className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
                    <div className="flex items-center gap-3">
                      <ChevronRight size={16} className={`text-on-surface-variant transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                      <span className="font-headline text-sm font-bold text-on-surface">Temporada {season}</span>
                      <span className="text-[10px] text-on-surface-variant">({sMatches.length} partidas · {catKeys.length} categoria{catKeys.length !== 1 ? 's' : ''})</span>
                    </div>
                    <div className="flex gap-2 flex-wrap justify-end">
                      {catKeys.map((ck) => {
                        const label = getCatLabel(byCat[ck][0]);
                        return <span key={ck} className="badge bg-indigo-50 text-indigo-700 text-[9px]">{label} ({byCat[ck].length})</span>;
                      })}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 space-y-5 fade-in">
                      {catKeys.map(catKey => {
                        const catMatches = byCat[catKey];
                        const catLabel = getCatLabel(catMatches[0]);
                        const catGender = catMatches[0]?.competition?.category?.gender;
                        const genderBadge = catGender === 'MALE' ? 'bg-blue-50 text-blue-600' : catGender === 'FEMALE' ? 'bg-pink-50 text-pink-600' : catGender === 'MIXED' ? 'bg-purple-50 text-purple-600' : 'bg-gray-100 text-gray-500';
                        const genderText = catGender === 'MALE' ? 'Masculino' : catGender === 'FEMALE' ? 'Feminino' : catGender === 'MIXED' ? 'Misto' : '';

                        const catUpcoming = catMatches.filter((m: any) => ['SCHEDULED', 'IN_PLAY', 'POSTPONED'].includes(m.status));
                        const catPast = catMatches.filter((m: any) => ['FINISHED', 'CANCELLED'].includes(m.status));

                        const keyUp = `up-${season}-${catKey}`;
                        const keyPast = `past-${season}-${catKey}`;
                        const spUp = sectionPages[keyUp] || 1;
                        const spPast = sectionPages[keyPast] || 1;

                        return (
                          <div key={catKey} className="rounded-lg border border-outline-variant/40 overflow-hidden">
                            <div className="flex items-center gap-2 px-3 py-2 bg-surface-container">
                              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />
                              <span className="font-headline text-xs font-bold text-on-surface">{catLabel}</span>
                              {genderText && <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${genderBadge}`}>{genderText}</span>}
                              <span className="text-[9px] text-on-surface-variant ml-auto">{catMatches.length} partida{catMatches.length !== 1 ? 's' : ''}</span>
                            </div>
                            <div className="p-3 space-y-4">
                              {catUpcoming.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-headline font-bold text-blue-600 mb-2 flex items-center gap-1.5">
                                    <Clock size={10} /> Próximas Partidas ({catUpcoming.length})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {catUpcoming.slice((spUp - 1) * SECTION_LIMIT, spUp * SECTION_LIMIT).map((m: any) => <MatchCard key={m.id} match={m} team={team} opponents={opponents} competitions={competitions} onEdit={openEdit} onDelete={handleDelete} onArchive={handleArchive} onUnarchive={handleUnarchive} />)}
                                  </div>
                                  {catUpcoming.length > SECTION_LIMIT && (
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-[9px] text-on-surface-variant">{spUp} de {Math.ceil(catUpcoming.length / SECTION_LIMIT)}</span>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => setSectionPages({ ...sectionPages, [keyUp]: Math.max(1, spUp - 1) })} disabled={spUp === 1} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={12} /></button>
                                        <button onClick={() => setSectionPages({ ...sectionPages, [keyUp]: Math.min(Math.ceil(catUpcoming.length / SECTION_LIMIT), spUp + 1) })} disabled={spUp >= Math.ceil(catUpcoming.length / SECTION_LIMIT)} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={12} /></button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {catPast.length > 0 && (
                                <div>
                                  <p className="text-[10px] font-headline font-bold text-green-600 mb-2 flex items-center gap-1.5">
                                    <Trophy size={10} /> Partidas Jogadas ({catPast.length})
                                  </p>
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {catPast.slice((spPast - 1) * SECTION_LIMIT, spPast * SECTION_LIMIT).map((m: any) => <MatchCard key={m.id} match={m} team={team} opponents={opponents} competitions={competitions} onEdit={openEdit} onDelete={handleDelete} onArchive={handleArchive} onUnarchive={handleUnarchive} />)}
                                  </div>
                                  {catPast.length > SECTION_LIMIT && (
                                    <div className="flex items-center justify-between mt-2">
                                      <span className="text-[9px] text-on-surface-variant">{spPast} de {Math.ceil(catPast.length / SECTION_LIMIT)}</span>
                                      <div className="flex gap-1.5">
                                        <button onClick={() => setSectionPages({ ...sectionPages, [keyPast]: Math.max(1, spPast - 1) })} disabled={spPast === 1} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={12} /></button>
                                        <button onClick={() => setSectionPages({ ...sectionPages, [keyPast]: Math.min(Math.ceil(catPast.length / SECTION_LIMIT), spPast + 1) })} disabled={spPast >= Math.ceil(catPast.length / SECTION_LIMIT)} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={12} /></button>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}
                              {catUpcoming.length === 0 && catPast.length === 0 && (
                                <p className="text-[10px] text-on-surface-variant text-center py-2">Nenhuma partida nesta categoria.</p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      )}

      {/* Partidas Arquivadas */}
      <div className="mt-8 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
        <button onClick={() => { setArchivedExpanded(!archivedExpanded); if (!archivedExpanded) loadArchived(); }}
          className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
          <div className="flex items-center gap-3">
            <ChevronRight size={16} className={`text-on-surface-variant transition-transform ${archivedExpanded ? 'rotate-90' : ''}`} />
            <Archive size={14} className="text-on-surface-variant" />
            <span className="font-headline text-sm font-bold text-on-surface">Partidas Arquivadas</span>
            <span className="text-[10px] text-on-surface-variant">({archivedMatches.length})</span>
          </div>
        </button>
        {archivedExpanded && (
          <div className="px-4 pb-4 space-y-2 fade-in">
            {archivedLoading ? (
              <div className="space-y-2">{Array.from({ length: 2 }).map((_, i) => <MatchCardSkeleton key={i} />)}</div>
            ) : archivedMatches.length === 0 ? (
              <p className="text-[10px] text-on-surface-variant text-center py-4">Nenhuma partida arquivada.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {archivedMatches.map((m: any) => (
                  <MatchCard key={m.id} match={m} team={team} opponents={opponents} competitions={competitions}
                    onEdit={openEdit} onDelete={handleDeleteArchived} onArchive={handleArchive} onUnarchive={handleUnarchive} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Partida' : 'Nova Partida'}>
        <div className="space-y-4">
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Data e Hora *</label>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Local</label>
            <input value={form.venue} onChange={(e) => setForm({ ...form, venue: e.target.value })} className="input-field" placeholder="Ex: Neo Química Arena" />
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Link de Ingressos</label>
            <input value={form.ticketUrl} onChange={(e) => setForm({ ...form, ticketUrl: e.target.value })} className="input-field" placeholder="https://www.fieltorcedor.com.br/..." />
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Adversário *</label>
            <OpponentSelect value={form.opponentId} onChange={(id) => setForm({ ...form, opponentId: id })} />
          </div>

          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Modalidade/Categoria</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-outline-variant/30 rounded-lg p-2">
              <button type="button" onClick={() => setForm({ ...form, categoryId: '', competitionId: '' })}
                className={`px-2 py-1.5 rounded text-[10px] font-body text-left transition-all ${form.categoryId === '' ? 'bg-primary text-white font-bold shadow-sm' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>
                Todas as categorias
              </button>
              {categoryHierarchy.map((parent: any) => (
                <div key={parent.id} className="mt-1">
                  {parent.children.length > 0 ? (
                    <div className="flex items-center gap-1.5 px-2 py-1.5 text-[10px] text-on-surface-variant/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-on-surface-variant/30 shrink-0" />
                      <span className="font-bold uppercase tracking-wide">{parent.name}</span>
                      {parent.gender && <span className="text-[8px] px-1 py-0.5 rounded bg-gray-100 text-gray-500">{GENDER_LABEL[parent.gender] || parent.gender}</span>}
                    </div>
                  ) : (
                    <button type="button" onClick={() => setForm({ ...form, categoryId: parent.id, competitionId: '' })}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded text-[10px] font-body text-left transition-all ${form.categoryId === parent.id ? 'bg-primary text-white font-bold shadow-sm' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      <span>{parent.name}</span>
                      {parent.gender && <span className={`text-[8px] px-1 py-0.5 rounded ${form.categoryId === parent.id ? 'bg-white/20 text-white' : (GENDER_BADGE[parent.gender] || 'bg-gray-100 text-gray-500')}`}>{GENDER_LABEL[parent.gender] || parent.gender}</span>}
                    </button>
                  )}
                  {parent.children.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 ml-3 mt-1">
                      {parent.children.map((child: any) => (
                        <button key={child.id} type="button" onClick={() => setForm({ ...form, categoryId: child.id, competitionId: '' })}
                          className={`px-2 py-1.5 rounded text-[10px] font-body text-left transition-all ${form.categoryId === child.id ? 'bg-primary text-white font-bold shadow-sm' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>
                          <span>{child.name}</span>
                          {child.gender && <span className={`ml-1 inline-block text-[7px] px-0.5 py-0.5 rounded ${form.categoryId === child.id ? 'bg-white/20 text-white' : (GENDER_BADGE[child.gender] || 'bg-gray-100 text-gray-500')}`}>{GENDER_LABEL[child.gender] || child.gender}</span>}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
            {form.categoryId && (
              <p className="text-[10px] text-on-surface-variant mt-1">Filtrando por: <strong>{getCategoryLabel(form.categoryId)}</strong></p>
            )}
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Competição</label>
            <select value={form.competitionId} onChange={(e) => {
              const comp = competitions.find((c) => c.id === e.target.value);
              setForm({ ...form, competitionId: e.target.value, round: comp?.tableFormat === 'friendly' ? '' : form.round });
            }} className="select-field">
              <option value="">Nenhuma</option>
              {filteredCompetitions.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.season})</option>)}
            </select>
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Status</label>
            <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-field">
              {Object.entries(STATUS_MAP).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          {!isFriendly && (
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Rodada</label>
              <select value={form.round} onChange={(e) => setForm({ ...form, round: e.target.value })} className="select-field">
                <option value="">Selecione...</option>
                {Array.from({ length: 38 }, (_, i) => {
                  const label = `${i + 1}ª Rodada`;
                  return <option key={i + 1} value={label}>{label}</option>;
                })}
                <option value="Fase de Grupos">Fase de Grupos</option>
                <option value="Oitavas de Final">Oitavas de Final</option>
                <option value="Quartas de Final">Quartas de Final</option>
                <option value="Semifinal">Semifinal</option>
                <option value="Final">Final</option>
              </select>
            </div>
          )}
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Temporada</label>
            <select value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="select-field">
              {[2028, 2027, 2026, 2025, 2024, 2023].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          {form.status === 'FINISHED' && (
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Placar Corinthians</label>
                <input type="number" value={form.homeScore} onChange={(e) => setForm({ ...form, homeScore: e.target.value })} className="input-field" placeholder="0" />
              </div>
              <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Placar Adversário</label>
                <input type="number" value={form.awayScore} onChange={(e) => setForm({ ...form, awayScore: e.target.value })} className="input-field" placeholder="0" />
              </div>
            </div>
          )}
          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
