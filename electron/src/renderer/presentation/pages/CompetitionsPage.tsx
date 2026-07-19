import { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { clubeApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, Table2, ChevronDown, ChevronRight, ChevronLeft, Save, LayoutGrid, LayoutList, X, Shield, Users, Loader2, Trophy, Ban } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { Skeleton, TableSkeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };
const MAX_PER_GROUP = 10;
const PHASE_OPTIONS = ['Em andamento', 'Fase de Grupos', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final', 'Campeão', 'Não participa'];
const PHASE_NAMES = ['Fase de Grupos', 'Oitavas de Final', 'Quartas de Final', 'Semifinal', 'Final'];

interface TeamSelectDropdownProps {
  idx: number;
  s: any;
  team: any;
  filteredOpponents: any[];
  allOpponents: any[];
  standings: any[];
  setStandings: (v: any[]) => void;
  currentCategoryId: string | null;
  onOpponentCreated: (opp: any) => void;
  openDropdown: string | null;
  setOpenDropdown: (v: string | null) => void;
  dropdownPos: { top: number; left: number };
  setDropdownPos: (v: { top: number; left: number }) => void;
  selectTeam: (idx: number) => void;
  selectOpponent: (idx: number, id: string) => void;
}

function getRowTeamKey(row: any): string {
  if (row.teamId) return `team:${row.teamId}`;
  if (row.opponentId) return row.opponentId;
  return '';
}

function TeamSelectDropdown({ idx, s, team, filteredOpponents, allOpponents, standings, setStandings, currentCategoryId, onOpponentCreated, openDropdown, setOpenDropdown, dropdownPos, setDropdownPos, selectTeam, selectOpponent }: TeamSelectDropdownProps) {
  const toast = useToastStore((s) => s.addToast);
  const isOpen = openDropdown === `team-${idx}`;
  const opponents_list = filteredOpponents;
  const selected = undefined;
  const isTeamSelected = s.opponentId?.startsWith('team:');
  const selectedName = isTeamSelected ? team?.name : s.teamName;
  const btnRef = useRef<HTMLButtonElement>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createFormName, setCreateFormName] = useState('');
  const [createFormLogoFile, setCreateFormLogoFile] = useState<File | null>(null);
  const [creating, setCreating] = useState(false);

  // Fecha o dropdown ao rolar a página (padrão UI padrão)
  useEffect(() => {
    if (!isOpen) return;
    const closeOnScroll = () => setOpenDropdown(null);
    window.addEventListener('scroll', closeOnScroll, { passive: true });
    window.addEventListener('resize', closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', closeOnScroll);
      window.removeEventListener('resize', closeOnScroll);
    };
  }, [isOpen, setOpenDropdown]);

  const toggleOpen = () => {
    if (isOpen) { setOpenDropdown(null); return; }
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const dropdownHeight = 320;
      const spaceBelow = window.innerHeight - rect.bottom;
      let top = rect.bottom + 4;
      if (spaceBelow < dropdownHeight) {
        top = Math.max(8, rect.top - dropdownHeight - 4);
      }
      setDropdownPos({ top, left: rect.left });
    }
    setOpenDropdown(`team-${idx}`);
  };

  return (
    <div className="relative">
      <button type="button" ref={btnRef} onClick={toggleOpen} data-team-btn
        className="w-full flex items-center gap-2 text-left px-2 py-1 rounded-md border border-outline-variant/30 hover:border-primary/40 transition-colors text-[11px] min-h-[30px]">
        {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> :
          <div className="w-5 h-5 rounded bg-surface-container shrink-0" />}
        <span className={`truncate flex-1 ${selectedName ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>{selectedName || 'Selecionar time...'}</span>
        <ChevronDown size={10} className={`text-on-surface-variant/40 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (() => {
        // Build maps: by key (ID) AND by normalized name → row position for teams used in OTHER rows
        const usedByKey: Record<string, number> = {};
        const usedByName: Record<string, number> = {};
        standings.forEach((row, i) => {
          if (i === idx) return; // skip current row
          const key = getRowTeamKey(row);
          if (key) usedByKey[key] = i;
          const normalizedName = row.teamName?.trim().toLowerCase();
          if (normalizedName) usedByName[normalizedName] = i;
        });
        const teamKeyById = team ? `team:${team.id}` : '';
        const teamUsedBy = team ? (usedByKey[teamKeyById] ?? usedByName[team.name?.trim().toLowerCase()] ?? null) : null;
        return createPortal(
          <div data-team-select className="fixed z-[9999] w-60 bg-white rounded-lg shadow-xl border border-outline-variant" style={{ top: dropdownPos.top, left: dropdownPos.left }}>
            {/* Pinned top: Cadastrar novo time */}
            {showCreateForm ? (
              <div className="px-3 py-3 space-y-2 border-b border-outline-variant/30">
                <p className="text-[10px] font-headline font-bold text-on-surface uppercase tracking-wide">Novo Adversário</p>
                <input type="text" value={createFormName} onChange={(e) => setCreateFormName(e.target.value)}
                  placeholder="Nome do time" autoFocus
                  className="w-full px-2.5 py-1.5 rounded border border-outline-variant/40 text-[11px] text-on-surface bg-white focus:border-primary focus:outline-none transition-colors" />
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="text-[10px] text-on-surface-variant">Logo:</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setCreateFormLogoFile(e.target.files?.[0] || null)} />
                  <span className="text-[10px] text-primary hover:underline">{createFormLogoFile ? createFormLogoFile.name : 'Selecionar arquivo'}</span>
                </label>
                <div className="flex gap-2 pt-0.5">
                  <button type="button" disabled={!createFormName.trim() || creating}
                    onClick={async () => {
                      const name = createFormName.trim();
                      if (!name) return;
                      const lowerName = name.toLowerCase();
                      const allNames = [...allOpponents.map((o: any) => o.name?.trim().toLowerCase()), ...standings.map((r: any) => r.teamName?.trim().toLowerCase())];
                      if (allNames.includes(lowerName)) {
                        toast(`Já existe um time com o nome "${name}".`, 'error');
                        return;
                      }
                      setCreating(true);
                      try {
                        const fd = new FormData();
                        fd.append('name', name);
                        if (currentCategoryId) fd.append('categoryIds', currentCategoryId);
                        if (createFormLogoFile) fd.append('logo', createFormLogoFile);
                        const newOpp = await clubeApi.post('/admin/adversarios', fd);
                        toast('Time cadastrado com sucesso!', 'success');
                        onOpponentCreated(newOpp);
                        const copy = [...standings];
                        copy[idx] = { ...copy[idx], opponentId: newOpp.id, teamName: newOpp.name, logoUrl: newOpp.logoUrl || copy[idx].logoUrl, teamId: null, isOwnTeam: false };
                        setStandings(copy);
                        setShowCreateForm(false);
                        setCreateFormName('');
                        setCreateFormLogoFile(null);
                        setOpenDropdown(null);
                      } catch (err: any) {
                        toast('Erro: ' + err.message, 'error');
                      } finally {
                        setCreating(false);
                      }
                    }}
                    className={`flex-1 py-1.5 rounded text-[10px] font-headline font-bold transition-all flex items-center justify-center gap-1 ${createFormName.trim() && !creating ? 'bg-primary text-white hover:bg-primary/90' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}>
                    {creating ? <Loader2 size={10} className="animate-spin" /> : <Plus size={10} />}
                    {creating ? 'Cadastrando...' : 'Cadastrar'}
                  </button>
                  <button type="button" onClick={() => { setShowCreateForm(false); setCreateFormName(''); setCreateFormLogoFile(null); }}
                    className="px-3 py-1.5 rounded text-[10px] font-headline font-bold text-on-surface-variant hover:bg-surface-container-low transition-colors">
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setShowCreateForm(true)}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-[11px] font-headline font-bold text-primary hover:bg-primary/5 transition-colors border-b border-outline-variant/30">
                <Plus size={12} /> Cadastrar novo time
              </button>
            )}
            {/* Scrollable: Meu Clube + opponents list */}
            <div className="max-h-80 overflow-y-auto overscroll-contain">
              {team && (
                <button type="button" disabled={teamUsedBy !== null}
                  onClick={() => { selectTeam(idx); setOpenDropdown(null); }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${isTeamSelected ? 'bg-primary/5' : teamUsedBy !== null ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container-low'}`}>
                  {team.logoUrl ? <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain" /> :
                    <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><Shield size={10} className="text-primary" /></div>}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-on-surface">{team.name}</p>
                    <p className="text-[9px] text-primary font-headline">Meu Clube</p>
                  </div>
                  {teamUsedBy !== null && <span className="text-[8px] text-on-surface-variant bg-surface-container rounded px-1.5 py-0.5 shrink-0">Linha {teamUsedBy + 1}</span>}
                </button>
              )}
              {team && opponents_list.length > 0 && <div className="border-t border-outline-variant/30" />}
              {opponents_list.map((o) => {
                const normalizedName = o.name?.trim().toLowerCase();
                const oppUsedBy = usedByKey[o.id] ?? usedByName[normalizedName] ?? null;
                return (
                  <button key={o.id} type="button" disabled={oppUsedBy !== null}
                    onClick={() => { selectOpponent(idx, o.id); setOpenDropdown(null); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${s.opponentId === o.id ? 'bg-primary/5' : oppUsedBy !== null ? 'opacity-40 cursor-not-allowed' : 'hover:bg-surface-container-low'}`}>
                    {o.logoUrl ? <img src={o.logoUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> :
                      <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center shrink-0"><Users size={10} className="text-on-surface-variant" /></div>}
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-bold text-on-surface">{o.name}</p>
                      {o.shortName && <p className="text-[9px] text-on-surface-variant">{o.shortName}</p>}
                    </div>
                    {oppUsedBy !== null && <span className="text-[8px] text-on-surface-variant bg-surface-container rounded px-1.5 py-0.5 shrink-0">Linha {oppUsedBy + 1}</span>}
                  </button>
                );
              })}
              {opponents_list.length === 0 && !team && (
                <div className="px-3 py-4 text-center text-[10px] text-on-surface-variant">
                  Nenhum time nesta categoria ainda
                </div>
              )}
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
}

export function CompetitionsPage() {
  const [competitions, setCompetitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [savingStandings, setSavingStandings] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [flatCategories, setFlatCategories] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', season: '', status: 'Em andamento', categoryId: '', isParticipating: 'true', tableFormat: 'single', groupNames: '' });
  const [initialForm, setInitialForm] = useState<{ name: string; season: string; status: string; categoryId: string; isParticipating: string; tableFormat: string; groupNames: string } | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [standings, setStandings] = useState<any[]>([]);
  const [standingsLoading, setStandingsLoading] = useState(false);
  const [initialStandings, setInitialStandings] = useState<string>('');
  const [compMatches, setCompMatches] = useState<any[]>([]);
  const [compMatchesLoading, setCompMatchesLoading] = useState(false);
  const toast = useToastStore((s) => s.addToast);

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  const loadCompetitions = async () => {
    setLoading(true);
    try { const data = await clubeApi.get('/admin/competicoes'); setCompetitions(Array.isArray(data) ? data : []); }
    catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setLoading(false);
  };
  const loadCategories = async () => {
    try {
      const [hierData, flatData] = await Promise.all([
        clubeApi.get('/categorias').catch(() => []),
        clubeApi.get('/categorias/flat').catch(() => []),
      ]);
      setCategories(Array.isArray(hierData) ? hierData : []);
      setFlatCategories(Array.isArray(flatData) ? flatData : []);
    } catch {}
  };
  const loadOpponents = async () => { try { const data = await clubeApi.get('/adversarios'); setOpponents(Array.isArray(data) ? data : []); } catch {} };
  const loadTeam = async () => { try { const data = await clubeApi.get('/team'); setTeam(data); } catch {} };
  useEffect(() => { loadCompetitions(); loadCategories(); loadOpponents(); loadTeam(); }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-team-select]') && !target.closest('[data-team-btn]')) setOpenDropdown(null);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const getCategoryName = (id: string) => categories.find((c) => c.id === id)?.name || '—';
  const openNew = () => { setEditing(null); const f = { name: '', season: '2026', status: 'Em andamento', categoryId: '', isParticipating: 'true', tableFormat: 'single', groupNames: '' }; setForm(f); setInitialForm({ ...f }); setModalOpen(true); };
  const openEdit = (c: any) => { setEditing(c); const f = { name: c.name, season: c.season, status: c.status || 'Em andamento', categoryId: c.categoryId || '', isParticipating: String(c.isParticipating), tableFormat: c.tableFormat || 'single', groupNames: c.groupNames || '' }; setForm(f); setInitialForm({ ...f }); setModalOpen(true); };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório.', 'error'); return; }
    setSaving(true);
    try {
      const data = { ...form, isParticipating: form.isParticipating === 'true' };
      if (editing) await clubeApi.patch(`/admin/competicoes/${editing.id}`, data);
      else await clubeApi.post('/admin/competicoes', data);
      toast('Salvo com sucesso!', 'success'); setModalOpen(false); loadCompetitions();
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar esta competição?', async () => {
      setDeletingId(id);
      try { await clubeApi.delete(`/admin/competicoes/${id}`); toast('Removido.', 'success'); loadCompetitions(); }
      catch (e: any) { toast('Erro: ' + e.message, 'error'); }
      setDeletingId(null);
    });
  };

  const toggleExpand = async (id: string) => {
    if (expanded === id) { setExpanded(null); setCompMatches([]); setOpenDropdown(null); return; }
    setOpenDropdown(null);
    setExpanded(id); setStandingsLoading(true); setCompMatchesLoading(true);
    loadOpponents();
    try {
      const comp = competitions.find((c) => c.id === id);
      const [standingsData, matchesData] = await Promise.all([
        clubeApi.get(`/classificacoes/${id}`).catch(() => []),
        clubeApi.get(`/partidas?competitionId=${id}&limit=50`).catch(() => ({ data: [] })),
      ]);
      let loaded = Array.isArray(standingsData) ? standingsData : [];
      if (comp?.tableFormat === 'grouped') {
        const validGroups = new Set((comp.groupNames || '').split(',').map((g: string) => g.trim()).filter(Boolean));
        const fallback = comp.groupNames?.split(',')[0]?.trim() || '';
        loaded = loaded.map((s) => validGroups.has(s.groupName) ? s : { ...s, groupName: fallback });
      }
      setStandings(loaded);
      setInitialStandings(JSON.stringify(loaded));
      const mData = (matchesData?.data || (Array.isArray(matchesData) ? matchesData : [])).filter((m: any) => m.competitionId === id || m.competition?.id === id);
      setCompMatches(mData);
    }
    catch { setStandings([]); setInitialStandings('[]'); setCompMatches([]); }
    setStandingsLoading(false); setCompMatchesLoading(false);
  };

  const updateStanding = (index: number, field: string, value: any) => {
    const copy = [...standings];
    if (field === 'isOwnTeam') {
      copy[index] = { ...copy[index], [field]: value === 'true' || value === true };
    } else if (['position', 'played', 'won', 'drawn', 'lost', 'goalsFor', 'goalsAgainst', 'points'].includes(field)) {
      const cleaned = String(value).replace(/^0+(?=\d)/, '');
      copy[index] = { ...copy[index], [field]: cleaned === '' ? 0 : Number(cleaned) };
    } else {
      copy[index] = { ...copy[index], [field]: value };
    }
    setStandings(copy);
  };

  const addStandingRow = (groupName?: string, count: number = 1) => {
    const group = groupName || '';
    const sameGroup = standings.filter((s) => (s.groupName || '') === group);
    if (sameGroup.length + count > MAX_PER_GROUP) { toast(`Máximo de ${MAX_PER_GROUP} times por grupo.`, 'error'); return; }
    const newRows = Array.from({ length: count }, (_, i) => ({
      teamName: '', points: 0, played: 0, won: 0, drawn: 0, lost: 0, goalsFor: 0, goalsAgainst: 0,
      position: sameGroup.length + i + 1, isOwnTeam: false, form: null, groupName: group || null,
      logoUrl: null, teamId: null, opponentId: null,
    }));
    setStandings([...standings, ...newRows]);
  };

  const removeStandingRow = (index: number) => { setStandings(standings.filter((_, i) => i !== index)); };

  const cleanStanding = (s: any, isBasketballComp?: boolean) => ({
    ...s,
    points: isBasketballComp ? (s.points || 0) : ((s.won || 0) * 3 + (s.drawn || 0)),
    form: s.form || null,
    groupName: s.groupName || null,
    logoUrl: s.logoUrl || null,
    teamId: s.teamId || null,
    opponentId: s.opponentId || null,
    zone: s.zone || 'NONE',
  });

  const isStandingsDirty = JSON.stringify(standings) !== initialStandings;

  const saveStandings = async () => {
    if (!expanded) return;
    setSavingStandings(true);
    try {
      const comp = competitions.find((c) => c.id === expanded);
      const isBasketballComp = comp?.category?.modality === 'BASKETBALL';
      if (comp?.tableFormat === 'grouped') {
        const groups = (comp.groupNames || '').split(',').map((g: string) => g.trim()).filter(Boolean);
        const validGroups = new Set(groups);
        let posCount: Record<string, number> = {};
        groups.forEach((g) => { posCount[g] = 0; });
        const numbered = standings.map((s) => {
          let g = s.groupName || '';
          if (!validGroups.has(g)) g = groups[0] || '';
          posCount[g] = (posCount[g] || 0) + 1;
          return cleanStanding({ ...s, position: posCount[g], groupName: g }, isBasketballComp);
        });
        await clubeApi.put(`/admin/classificacoes/${expanded}/bulk`, numbered);
      } else if (comp?.tableFormat === 'phases') {
        // Para fases, numerar posições dentro de cada fase (groupName)
        let posCount: Record<string, number> = {};
        const numbered = standings.map((s) => {
          const g = s.groupName || 'Geral';
          posCount[g] = (posCount[g] || 0) + 1;
          return cleanStanding({ ...s, position: posCount[g], groupName: g }, isBasketballComp);
        });
        await clubeApi.put(`/admin/classificacoes/${expanded}/bulk`, numbered);
      } else {
        await clubeApi.put(`/admin/classificacoes/${expanded}/bulk`, standings.map((s, i) => cleanStanding({ ...s, position: i + 1, groupName: null }, isBasketballComp)));
      }
      toast('Classificação salva!', 'success');
      loadOpponents();
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setSavingStandings(false);
  };

  const currentComp = competitions.find((c) => c.id === expanded);
  const isBasketball = currentComp?.category?.modality === 'BASKETBALL';
  const isGrouped = currentComp?.tableFormat === 'grouped';
  const groups = isGrouped ? (currentComp?.groupNames || '').split(',').map((g: string) => g.trim()).filter(Boolean) : [];

  // Filter opponents by EXACT competition category (no fallback, no group mixing)
  const filteredOpponents = useMemo(() => {
    if (!currentComp?.categoryId) return opponents;
    const targetId = currentComp.categoryId;
    const filtered = opponents.filter((o) => {
      const oppCats = (o.categories || []).map((oc: any) => oc.categoryId || oc.category?.id);
      return oppCats.some((cid: string) => cid === targetId);
    });
    return filtered;
  }, [opponents, currentComp?.categoryId]);

  // Warn about duplicate opponent names in the database (different IDs, same name)
  useEffect(() => {
    const nameMap = new Map<string, string[]>();
    opponents.forEach((o) => {
      const key = o.name?.trim().toLowerCase();
      if (key) {
        const ids = nameMap.get(key) || [];
        ids.push(o.id);
        nameMap.set(key, ids);
      }
    });
    nameMap.forEach((ids, name) => {
      if (ids.length > 1) {
        console.warn(`[Adversários duplicados] "${name}" possui ${ids.length} cadastros com IDs diferentes:`, ids);
      }
    });
  }, [opponents]);

  const selectTeam = (index: number) => {
    if (team) {
      const newKey = `team:${team.id}`;
      const newName = team.name?.trim().toLowerCase();
      const existingIdx = standings.findIndex((s, i) => i !== index && getRowTeamKey(s) === newKey);
      if (existingIdx !== -1) {
        toast(`Este time já está cadastrado na linha ${existingIdx + 1}.`, 'error');
        return;
      }
      if (newName) {
        const nameIdx = standings.findIndex((s, i) => i !== index && s.teamName?.trim().toLowerCase() === newName);
        if (nameIdx !== -1) {
          toast(`Já existe um time com o nome "${team.name}" na linha ${nameIdx + 1}.`, 'error');
          return;
        }
      }
      const copy = standings.map((s, i) => ({
        ...s,
        isOwnTeam: i === index ? true : false,
      }));
      copy[index] = { ...copy[index], teamId: team.id, teamName: team.name, logoUrl: team.logoUrl || copy[index].logoUrl, isOwnTeam: true, opponentId: '' };
      setStandings(copy);
    }
  };

  const selectOpponent = (index: number, opponentId: string) => {
    if (!opponentId) { updateStanding(index, 'opponentId', ''); return; }
    if (opponentId.startsWith('team:')) {
      selectTeam(index);
      return;
    }
    const existingIdx = standings.findIndex((s, i) => i !== index && getRowTeamKey(s) === opponentId);
    if (existingIdx !== -1) {
      toast(`Este time já está cadastrado na linha ${existingIdx + 1}.`, 'error');
      return;
    }
    const opp = opponents.find((o) => o.id === opponentId);
    if (opp) {
      const newName = opp.name?.trim().toLowerCase();
      if (newName) {
        const nameIdx = standings.findIndex((s, i) => i !== index && s.teamName?.trim().toLowerCase() === newName);
        if (nameIdx !== -1) {
          toast(`Já existe um time com o nome "${opp.name}" na linha ${nameIdx + 1}.`, 'error');
          return;
        }
      }
      const copy = [...standings];
      copy[index] = { ...copy[index], opponentId: opp.id, teamName: opp.name, logoUrl: opp.logoUrl || copy[index].logoUrl, teamId: null, isOwnTeam: false };
      setStandings(copy);
    }
  };

  const uploadStandingLogo = async (index: number, file: File) => {
    const fd = new FormData(); fd.append('logo', file);
    try { const data = await clubeApi.post('/admin/classificacoes/logo', fd); if (data?.logoUrl) updateStanding(index, 'logoUrl', data.logoUrl); }
    catch (e: any) { toast('Erro: ' + e.message, 'error'); }
  };

  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(idx));
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === targetIdx) { setDragIdx(null); setDragOverIdx(null); return; }
    const copy = [...standings];
    const [moved] = copy.splice(dragIdx, 1);
    copy.splice(targetIdx, 0, moved);
    const reordered = copy.map((s, i) => ({ ...s, position: i + 1 }));
    setStandings(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const handleDragEnd = () => { setDragIdx(null); setDragOverIdx(null); };

  const renderRow = (s: any) => {
    const idx = standings.indexOf(s);
    return (
      <tr key={idx} draggable onDragStart={(e) => handleDragStart(e, idx)} onDragOver={(e) => handleDragOver(e, idx)} onDrop={(e) => handleDrop(e, idx)} onDragEnd={handleDragEnd}
        className={`group border-b border-outline-variant/30 transition-all cursor-grab active:cursor-grabbing ${s.isOwnTeam ? 'bg-primary/5' : 'hover:bg-surface-container-low/60'} ${dragOverIdx === idx ? 'border-t-2 border-t-primary' : ''} ${dragIdx === idx ? 'opacity-40' : ''}`}>
        <td className="py-1.5 px-2 text-center font-headline font-bold text-on-surface-variant text-[11px] w-8">{s.position}</td>
        <td className="py-1.5 px-1">
          <label className="cursor-pointer block">
            {s.logoUrl ? <img src={s.logoUrl} alt="" className="w-7 h-7 object-contain" /> : <div className="w-7 h-7 rounded bg-surface-container border border-dashed border-outline-variant flex items-center justify-center text-[8px] text-on-surface-variant hover:border-primary transition-colors">+</div>}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadStandingLogo(idx, f); }} />
          </label>
        </td>
        <td className="py-1.5 px-1 min-w-[160px]">
          <TeamSelectDropdown key={`team-select-${idx}`} idx={idx} s={s} team={team} filteredOpponents={filteredOpponents} allOpponents={opponents} standings={standings} setStandings={setStandings} currentCategoryId={currentComp?.categoryId ?? null} onOpponentCreated={(opp) => setOpponents((prev) => [...prev, opp])} openDropdown={openDropdown} setOpenDropdown={setOpenDropdown} dropdownPos={dropdownPos} setDropdownPos={setDropdownPos} selectTeam={selectTeam} selectOpponent={selectOpponent} />
        </td>
        {isBasketball ? (
          <>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.played)} onChange={(e) => updateStanding(idx, 'played', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.won)} onChange={(e) => updateStanding(idx, 'won', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.lost)} onChange={(e) => updateStanding(idx, 'lost', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.goalsFor)} onChange={(e) => updateStanding(idx, 'goalsFor', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.goalsAgainst)} onChange={(e) => updateStanding(idx, 'goalsAgainst', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center text-xs font-headline font-bold text-on-surface-variant">{(s.goalsFor || 0) - (s.goalsAgainst || 0) > 0 ? '+' : ''}{(s.goalsFor || 0) - (s.goalsAgainst || 0)}</td>
          </>
        ) : (
          <>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.points)} onChange={(e) => updateStanding(idx, 'points', e.target.value)} className="w-11 bg-primary/5 text-center text-xs font-bold text-primary py-1 px-0.5 outline-none border border-primary/20 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.played)} onChange={(e) => updateStanding(idx, 'played', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.won)} onChange={(e) => updateStanding(idx, 'won', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.drawn)} onChange={(e) => updateStanding(idx, 'drawn', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.lost)} onChange={(e) => updateStanding(idx, 'lost', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.goalsFor)} onChange={(e) => updateStanding(idx, 'goalsFor', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center"><input inputMode="numeric" pattern="[0-9]*" value={String(s.goalsAgainst)} onChange={(e) => updateStanding(idx, 'goalsAgainst', e.target.value)} className="w-11 bg-transparent text-center text-xs text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors" /></td>
            <td className="py-1.5 px-1.5 text-center text-xs font-headline font-bold text-on-surface-variant">{(s.goalsFor || 0) - (s.goalsAgainst || 0) > 0 ? '+' : ''}{(s.goalsFor || 0) - (s.goalsAgainst || 0)}</td>
          </>
        )}
        <td className="py-1.5 px-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => removeStandingRow(idx)} className="p-1 rounded hover:bg-red-50 text-on-surface-variant/30 hover:text-red-500 transition-colors"><X size={12} /></button>
        </td>
      </tr>
    );
  };

  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const SECTION_LIMIT = 10;
  const [addingPhase, setAddingPhase] = useState(false);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [expandedCategoryId, setExpandedCategoryId] = useState<string | null>(null);

  const getCategoryLabel = (id: string) => {
    for (const p of categories) {
      if (p.id === id) return { name: p.name, gender: p.gender };
      const child = p.children?.find((c: any) => c.id === id);
      if (child) return { name: `${p.name} › ${child.name}`, gender: child.gender || p.gender };
    }
    return { name: '—', gender: null };
  };

  const getCatParentId = (catId: string) => {
    for (const p of categories) {
      if (p.id === catId) return p.id;
      if (p.children?.some((c: any) => c.id === catId)) return p.id;
    }
    return null;
  };

  const grouped = useMemo(() => {
    const groups: Record<string, { parent: any; competitions: any[] }> = {};

    // Create groups for each category (parent + child)
    for (const p of categories) {
      groups[p.id] = { parent: p, competitions: [] };
      if (p.children) {
        for (const ch of p.children) {
          groups[ch.id] = { parent: ch, competitions: [] };
        }
      }
    }
    groups['__none__'] = { parent: { id: '__none__', name: 'Sem Categoria', gender: null }, competitions: [] };

    for (const comp of competitions) {
      // Direct category match first, then parent
      const catId = comp.categoryId;
      if (catId && groups[catId]) {
        groups[catId].competitions.push(comp);
      } else {
        const parentId = getCatParentId(catId) || '__none__';
        if (!groups[parentId]) groups[parentId] = { parent: { id: parentId, name: getCategoryLabel(catId).name, gender: null }, competitions: [] };
        groups[parentId].competitions.push(comp);
      }
    }

    return Object.values(groups)
      .filter((g) => g.competitions.length > 0)
      .map((g) => ({
        ...g,
        competitions: [...g.competitions].sort((a: any, b: any) => {
          const seasonCmp = (b.season || '').localeCompare(a.season || '');
          return seasonCmp !== 0 ? seasonCmp : a.name.localeCompare(b.name, 'pt-BR');
        }),
      }));
  }, [competitions, categories]);

  const filtered = filterCategory === 'all' ? grouped : grouped.filter((g) => g.parent.id === filterCategory);

  const toggleCategory = (id: string) => {
    setExpandedCategoryId((prev) => prev === id ? null : id);
  };

  const TableHeader = () => (
    <thead><tr className="border-b border-outline-variant bg-surface-container-low/50">
      <th className="py-2 px-2 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-8">#</th>
      <th className="py-2 px-1 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-8"></th>
      <th className="py-2 px-1 text-left font-headline text-[9px] font-bold text-on-surface-variant uppercase">Time</th>
      {isBasketball ? (
        <>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">J</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">V</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">D</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">PPRO</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">PCON</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">SLD</th>
        </>
      ) : (
        <>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-primary uppercase w-11">Pts</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">PJ</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">VIT</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">E</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">DER</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">GM</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">GC</th>
          <th className="py-2 px-1.5 text-center font-headline text-[9px] font-bold text-on-surface-variant uppercase w-11">SG</th>
        </>
      )}
      <th className="py-2 px-1 w-6"></th>
    </tr></thead>
  );

  const AddRowButton = ({ groupName }: { groupName?: string }) => {
    const count = groupName ? standings.filter((s) => s.groupName === groupName).length : standings.length;
    const full = count >= MAX_PER_GROUP;
    return (
      <button onClick={() => addStandingRow(groupName)} disabled={full}
        className={`w-full py-2.5 px-4 text-[10px] font-headline font-bold transition-all flex items-center justify-center gap-1.5 ${full ? 'text-on-surface-variant/30 cursor-not-allowed' : 'text-primary hover:bg-primary/5 border border-dashed border-primary/30 hover:border-primary/60 rounded-lg mt-1'}`}>
        <Plus size={12} /> {full ? `Limite de ${MAX_PER_GROUP} atingido` : `Adicionar time${groupName ? ` ao ${groupName}` : ''}`}
      </button>
    );
  };

  const renderConfrontos = (items: any[]) => {
    const pairs: { a: any; b: any | null }[] = [];
    for (let i = 0; i < items.length; i += 2) {
      pairs.push({ a: items[i], b: items[i + 1] || null });
    }
    return (
      <div className="space-y-2 p-3">
        {pairs.map((pair, idx) => {
          const scoreA = pair.a.goalsFor ?? 0;
          const scoreB = pair.b?.goalsFor ?? null;
          const hasAnyScore = scoreA !== 0 || (scoreB !== null && scoreB !== 0);
          const isDecided = pair.b && scoreB !== null && scoreA !== scoreB;
          const isTie = pair.b && scoreB !== null && scoreA === scoreB && hasAnyScore;
          const manualWinner = pair.a.won === 1 ? 'a' : pair.b?.won === 1 ? 'b' : null;
          const classified = manualWinner || (isDecided ? (scoreA > scoreB ? 'a' : 'b') : null);
          return (
            <div key={`pair-${idx}`} className="border border-outline-variant/50 rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-2 bg-surface-container-low/50">
                <span className="text-[9px] font-bold text-on-surface-variant">Confronto {idx + 1}</span>
                {classified && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-green-50 text-green-700">✓ Classificado</span>}
                {isTie && !manualWinner && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Empate — defina o classificado</span>}
              </div>
              <div className="divide-y divide-outline-variant/30">
                {[pair.a, pair.b].filter(Boolean).map((entry, eIdx) => {
                  const entryIdx = standings.indexOf(entry);
                  const isWinner = classified === (eIdx === 0 ? 'a' : 'b');
                  return (
                    <div key={`entry-${entryIdx}`} className={`flex items-center gap-3 px-3 py-2 ${isWinner ? 'bg-green-50/50' : ''}`}>
                      <div className="flex-1 min-w-0">
                        <TeamSelectDropdown
                          idx={entryIdx}
                          s={entry}
                          team={team}
                          filteredOpponents={filteredOpponents}
                          allOpponents={opponents}
                          standings={standings}
                          setStandings={setStandings}
                          currentCategoryId={currentComp?.categoryId ?? null}
                          onOpponentCreated={(opp) => setOpponents((prev) => [...prev, opp])}
                          openDropdown={openDropdown}
                          setOpenDropdown={setOpenDropdown}
                          dropdownPos={dropdownPos}
                          setDropdownPos={setDropdownPos}
                          selectTeam={selectTeam}
                          selectOpponent={selectOpponent}
                        />
                      </div>
                      <input
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={String(entry.goalsFor ?? '')}
                        onChange={(e) => {
                          const val = e.target.value.replace(/^0+(?=\d)/, '');
                          updateStanding(entryIdx, 'goalsFor', val === '' ? 0 : Number(val));
                        }}
                        className="w-10 bg-transparent text-center text-xs font-bold text-on-surface py-1 px-0.5 outline-none border border-outline-variant/30 focus:border-primary rounded transition-colors"
                        placeholder="0"
                      />
                      {isTie && !manualWinner && (
                        <button
                          onClick={() => {
                            const idxA = standings.indexOf(pair.a);
                            const idxB = pair.b ? standings.indexOf(pair.b) : -1;
                            const copy = [...standings];
                            if (idxA !== -1) copy[idxA] = { ...copy[idxA], won: eIdx === 0 ? 1 : 0 };
                            if (idxB !== -1) copy[idxB] = { ...copy[idxB], won: eIdx === 0 ? 0 : 1 };
                            setStandings(copy);
                          }}
                          className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors shrink-0"
                        >
                          Classificar
                        </button>
                      )}
                    </div>
                  );
                })}
                {!pair.b && (
                  <div className="flex items-center gap-3 px-3 py-2 text-on-surface-variant/50">
                    <span className="text-[10px] italic">Aguardando adversário</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const renderTable = (items: any[], groupLabel?: string) => (
    <div>
      {groupLabel && (
        <div className="flex items-center justify-between px-4 py-2 bg-primary/5 border-y border-outline-variant">
          <span className="font-headline text-xs font-bold text-primary uppercase tracking-wider">{groupLabel}</span>
          <span className="text-[10px] text-on-surface-variant">{items.length}/{MAX_PER_GROUP} times</span>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full">
          <TableHeader />
          <tbody>{items.map((s) => renderRow(s))}</tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Competições</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{competitions.length} competiç{competitions.length !== 1 ? 'ões' : 'ão'} cadastrada{competitions.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-secondary flex items-center gap-2"><Plus size={16} /> Nova Competição</button>
      </div>

      {/* Filtros por categoria */}
      {!loading && grouped.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setFilterCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategory === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
            Todas ({competitions.length})
          </button>
          {grouped.map((g) => (
            <button key={g.parent.id} onClick={() => setFilterCategory(g.parent.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${filterCategory === g.parent.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
              {g.parent.name}
              <span className={`text-[9px] px-1 py-0.5 rounded ${filterCategory === g.parent.id ? 'bg-white/20' : 'bg-surface-container-low'}`}>{g.competitions.length}</span>
            </button>
          ))}
        </div>
      )}

      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3"><Skeleton className="w-6 h-6 rounded" /><Skeleton className="h-4 w-48" /><Skeleton className="h-5 w-20 rounded-full" /></div>
                ))}
              </div>
            </div>
          ))
        ) : (
          filtered.map((group) => {
            const isCatExpanded = expandedCategoryId === group.parent.id;
            const catInfo = getCategoryLabel(group.parent.id);
            return (
              <div key={group.parent.id} className="card overflow-hidden">
                <button onClick={() => toggleCategory(group.parent.id)} className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-surface-container-low/50 transition-colors">
                  {isCatExpanded ? <ChevronDown size={16} className="text-on-surface-variant shrink-0" /> : <ChevronRight size={16} className="text-on-surface-variant shrink-0" />}
                  <Trophy size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-sm font-bold text-on-surface">{group.parent.name}</span>
                      {catInfo.gender && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${GENDER_BADGE[catInfo.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[catInfo.gender] || catInfo.gender}</span>}
                    </div>
                  </div>
                  <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{group.competitions.length} competiç{group.competitions.length !== 1 ? 'ões' : 'ão'}</span>
                </button>

                {isCatExpanded && (() => {
                  const key = `comp-${group.parent.id}`;
                  const page = sectionPages[key] || 1;
                  const totalPages = Math.ceil(group.competitions.length / SECTION_LIMIT);
                  const paged = group.competitions.slice((page - 1) * SECTION_LIMIT, page * SECTION_LIMIT);
                  return (
                    <div className="border-t border-outline-variant/50 pt-3 pb-1 px-1 fade-in space-y-2">
                      {paged.map((c, i) => {
                      const isExpanded = expanded === c.id;
                      return (
                        <div key={c.id} className="slide-up" style={{ animationDelay: `${i * 20}ms` }}>
                          <div className="flex items-center gap-3 py-2 px-2 rounded-lg hover:bg-surface-container-low/30 transition-colors">
                            <button onClick={(e) => { e.stopPropagation(); toggleExpand(c.id); }} className="p-0.5 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-headline text-sm font-bold text-on-surface">{c.name}</p>
                                <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{c.season}</span>
                                <span className="badge bg-surface-container text-on-surface-variant text-[10px] flex items-center gap-1">{c.tableFormat === 'grouped' ? <><LayoutGrid size={10} /> Grupos</> : c.tableFormat === 'friendly' ? <><Users size={10} /> Amistoso</> : c.tableFormat === 'none' ? <><Ban size={10} /> Sem Tabela</> : c.tableFormat === 'phases' ? <><Trophy size={10} /> Fases</> : <><LayoutList size={10} /> Única</>}</span>
                              </div>
                              {c.status && c.tableFormat !== 'friendly' && <p className="text-xs text-on-surface-variant mt-0.5">{c.status}</p>}
                            </div>
                            <span className={`badge text-[10px] ${c.isParticipating ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{c.isParticipating ? 'Participa' : 'Não participa'}</span>
                            <div className="flex items-center gap-0.5">
                              <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={14} /></button>
                              <button onClick={() => handleDelete(c.id)} disabled={deletingId === c.id} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                {deletingId === c.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                              </button>
                            </div>
                          </div>

                          {isExpanded && !['none', 'friendly'].includes(currentComp?.tableFormat) && (
                            <div className="ml-8 mt-2 fade-in">
                              <div className="card p-0 overflow-hidden">
                                <div className="flex items-center justify-between px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                                  <div className="flex items-center gap-2">
                                    <Table2 size={14} className="text-on-surface-variant" />
                                    <span className="font-headline text-xs font-bold text-on-surface">
                                      {currentComp?.tableFormat === 'phases' ? `Fases · ${compMatches.length} partidas` : isGrouped ? `${groups.length} Grupos` : 'Tabela Única'}
                                    </span>
                                    {currentComp?.tableFormat !== 'phases' && <span className="text-[10px] text-on-surface-variant">· {standings.length} times</span>}
                                  </div>
                                  {currentComp?.tableFormat !== 'phases' && (
                                    <button onClick={saveStandings} disabled={savingStandings || !isStandingsDirty} className="px-3 py-1.5 rounded-lg text-[11px] font-headline font-bold bg-primary text-white hover:bg-primary/90 transition-all flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
                                      {savingStandings ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} {savingStandings ? 'Salvando...' : 'Salvar Classificação'}
                                    </button>
                                  )}
                                </div>
                                {(currentComp?.tableFormat === 'phases' ? compMatchesLoading : standingsLoading) ? (
                                  <TableSkeleton rows={5} cols={6} />
                                ) : currentComp?.tableFormat === 'phases' ? (
                                  /* Sistema de Fases - deriva rounds de compMatches */
                                  <div>
                                    {(() => {
                                      let rounds = [...new Set(compMatches.map((m: any) => m.round).filter(Boolean))];
                                      if (currentComp?.status && PHASE_NAMES.includes(currentComp.status) && !rounds.includes(currentComp.status)) {
                                        rounds = [...rounds, currentComp.status];
                                      }
                                      if (rounds.length === 0) {
                                        return <div className="px-4 py-6 text-center text-on-surface-variant text-xs">Nenhuma partida registrada para esta competição. Cadastre em Partidas.</div>;
                                      }
                                      return rounds.map((round) => {
                                        const roundMatches = compMatches.filter((m: any) => m.round === round);
                                        const byOpponent = new Map<string, any[]>();
                                        roundMatches.forEach((m: any) => {
                                          const key = m.opponentId || m.opponent?.id || 'sem-adversario';
                                          byOpponent.set(key, [...(byOpponent.get(key) || []), m]);
                                        });
                                        const rExpanded = expandedGroups.has(round!);
                                        return (
                                          <div key={round} className="border-b border-outline-variant last:border-b-0">
                                            <button type="button" onClick={() => { const next = new Set(expandedGroups); rExpanded ? next.delete(round) : next.add(round); setExpandedGroups(next); }}
                                              className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low/50 transition-colors">
                                              <div className="flex items-center gap-2">
                                                <ChevronRight size={14} className={`text-on-surface-variant transition-transform ${rExpanded ? 'rotate-90' : ''}`} />
                                                <Trophy size={14} className="text-primary" />
                                                <span className="font-headline text-xs font-bold text-primary uppercase tracking-wider">{round}</span>
                                                <span className="text-[10px] text-on-surface-variant">({byOpponent.size} confrontos)</span>
                                              </div>
                                            </button>
                                            {rExpanded && (
                                              <div className="fade-in p-3 space-y-3">
                                                {byOpponent.size === 0 ? (
                                                  <p className="text-[10px] text-on-surface-variant text-center py-2">Nenhuma partida registrada para esta fase ainda.</p>
                                                ) : (
                                                  Array.from(byOpponent.entries()).map(([oppId, matches]) => {
                                                    const opp = matches[0]?.opponent;
                                                    const allFinished = matches.every((m: any) => m.status === 'FINISHED');
                                                    const totalA = matches.reduce((sum: number, m: any) => sum + (m.isHome ? (m.homeScore ?? 0) : (m.awayScore ?? 0)), 0);
                                                    const totalB = matches.reduce((sum: number, m: any) => sum + (m.isHome ? (m.awayScore ?? 0) : (m.homeScore ?? 0)), 0);
                                                    const aggDecided = allFinished && matches.length > 0 && totalA !== totalB;
                                                    const aggTie = allFinished && matches.length > 0 && totalA === totalB;
                                                    return (
                                                      <div key={oppId} className="border border-outline-variant/50 rounded-lg overflow-hidden">
                                                        <div className="flex items-center gap-3 px-3 py-2 bg-surface-container-low/50">
                                                          <div className="flex items-center -space-x-1.5 shrink-0">
                                                            <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center ring-2 ring-surface z-10">
                                                              {team?.logoUrl ? <img src={team.logoUrl} alt="" className="w-4 h-4 object-contain" /> : <Shield size={10} className="text-on-surface-variant/40" />}
                                                            </div>
                                                            <div className="w-6 h-6 rounded-full bg-surface-container flex items-center justify-center ring-2 ring-surface">
                                                              {opp?.logoUrl ? <img src={opp.logoUrl} alt="" className="w-4 h-4 object-contain" /> : <Shield size={10} className="text-on-surface-variant/40" />}
                                                            </div>
                                                          </div>
                                                          <span className="font-bold text-xs text-on-surface flex-1">Corinthians vs {opp?.name || '?'}</span>
                                                          {aggDecided && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${totalA > totalB ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{totalA > totalB ? 'Corinthians' : opp?.name} classificado</span>}
                                                          {aggTie && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">Empate no agregado</span>}
                                                        </div>
                                                        <div className="divide-y divide-outline-variant/30">
                                                          {matches.map((m: any) => {
                                                            const d = new Date(m.date);
                                                            const finished = m.status === 'FINISHED';
                                                            const label = matches.length > 1 ? (m.isHome ? 'Ida' : 'Volta') : '';
                                                            return (
                                                              <div key={m.id} className="flex items-center gap-3 px-3 py-2">
                                                                <div className="flex-1 min-w-0">
                                                                  <div className="flex items-center gap-2">
                                                                    <span className="text-[10px] text-on-surface-variant">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</span>
                                                                    {label && <span className="text-[9px] font-bold text-primary">{label}</span>}
                                                                  </div>
                                                                  <p className="text-[10px] text-on-surface-variant">{m.isHome ? 'Corinthians' : opp?.name || '?'} vs {m.isHome ? opp?.name || '?' : 'Corinthians'}</p>
                                                                </div>
                                                                {finished ? (
                                                                  <span className="text-sm font-headline font-bold text-on-surface">{m.homeScore} x {m.awayScore}</span>
                                                                ) : (
                                                                  <span className="text-[10px] text-on-surface-variant">Agendado</span>
                                                                )}
                                                              </div>
                                                            );
                                                          })}
                                                          {allFinished && matches.length > 1 && (
                                                            <div className="flex items-center justify-between px-3 py-2 bg-surface-container-low/30">
                                                              <span className="text-[10px] font-bold text-on-surface-variant">Agregado</span>
                                                              <span className="text-sm font-headline font-bold text-on-surface">{totalA} x {totalB}</span>
                                                            </div>
                                                          )}
                                                        </div>
                                                      </div>
                                                    );
                                                  })
                                                )}
                                              </div>
                                            )}
                                          </div>
                                        );
                                      });
                                    })()}
                                  </div>
                                ) : isGrouped && groups.length > 0 ? (
                                  <div>
                                    {groups.map((g) => {
                                      const groupItems = standings.filter((s) => s.groupName === g);
                                      const gExpanded = expandedGroups.has(g);
                                      return (
                                        <div key={g} className="border-b border-outline-variant last:border-b-0">
                                          <button type="button" onClick={() => { const next = new Set(expandedGroups); gExpanded ? next.delete(g) : next.add(g); setExpandedGroups(next); }}
                                            className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-surface-container-low/50 transition-colors">
                                            <div className="flex items-center gap-2">
                                              <ChevronRight size={14} className={`text-on-surface-variant transition-transform ${gExpanded ? 'rotate-90' : ''}`} />
                                              <span className="font-headline text-xs font-bold text-primary uppercase tracking-wider">{g}</span>
                                              <span className="text-[10px] text-on-surface-variant">({groupItems.length} times)</span>
                                            </div>
                                            <div onClick={(e) => e.stopPropagation()}>
                                              <AddRowButton groupName={g} />
                                            </div>
                                          </button>
                                          {gExpanded && (
                                            <div className="fade-in">
                                              {renderTable(groupItems)}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                ) : (
                                  <div>
                                    {renderTable(standings)}
                                    <div className="px-4 pb-3"><AddRowButton /></div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Partidas da Competição */}
                          {isExpanded && compMatches.length > 0 && (
                            <div className="ml-8 mt-3 fade-in">
                              <div className="card p-0 overflow-hidden">
                                <div className="flex items-center gap-2 px-4 py-3 bg-surface-container-low border-b border-outline-variant">
                                  <Trophy size={14} className="text-on-surface-variant" />
                                  <span className="font-headline text-xs font-bold text-on-surface">Partidas</span>
                                  <span className="text-[10px] text-on-surface-variant">· {compMatches.length} partida{compMatches.length !== 1 ? 's' : ''}</span>
                                </div>
                                <div className="divide-y divide-outline-variant/30">
                                  {compMatches.map((m: any) => {
                                    const opp = m.opponent;
                                    const st = m.status === 'FINISHED' ? 'Finalizado' : m.status === 'SCHEDULED' ? 'Agendado' : m.status;
                                    const d = new Date(m.date);
                                    return (
                                      <div key={m.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low/50 transition-colors">
                                        <div className="flex items-center -space-x-2 shrink-0">
                                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center ring-2 ring-surface z-10">
                                            {(m.isHome ? team?.logoUrl : opp?.logoUrl) ? (
                                              <img src={m.isHome ? team?.logoUrl : opp?.logoUrl} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                              <Shield size={12} className="text-on-surface-variant/40" />
                                            )}
                                          </div>
                                          <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center ring-2 ring-surface">
                                            {(m.isHome ? opp?.logoUrl : team?.logoUrl) ? (
                                              <img src={m.isHome ? opp?.logoUrl : team?.logoUrl} alt="" className="w-6 h-6 object-contain" />
                                            ) : (
                                              <Shield size={12} className="text-on-surface-variant/40" />
                                            )}
                                          </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-bold text-on-surface truncate">{m.isHome ? 'Corinthians' : opp?.name || '?'} vs {m.isHome ? opp?.name || '?' : 'Corinthians'}</p>
                                          <p className="text-[10px] text-on-surface-variant">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} {d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        </div>
                                        {m.status === 'FINISHED' ? (
                                          <span className="text-sm font-headline font-bold text-on-surface">{m.homeScore} x {m.awayScore}</span>
                                        ) : (
                                          <span className="text-[10px] text-on-surface-variant">{st}</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                      {group.competitions.length > SECTION_LIMIT && (
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[9px] text-on-surface-variant">{page} de {totalPages}</span>
                          <div className="flex gap-1.5">
                            <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.max(1, page - 1) })} disabled={page === 1} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={12} /></button>
                            <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.min(totalPages, page + 1) })} disabled={page >= totalPages} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={12} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

              </div>
            );
          })
        )}
        {!loading && filtered.length === 0 && <p className="text-on-surface-variant text-sm py-8 text-center">Nenhuma competição encontrada.</p>}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Competição' : 'Nova Competição'}>
        <div className="space-y-4">
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Ex: Brasileirão Série A" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Temporada *</label><input value={form.season} onChange={(e) => setForm({ ...form, season: e.target.value })} className="input-field" placeholder="2026" /></div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="select-field">
                {PHASE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Tipo de Tabela *</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForm({ ...form, tableFormat: 'single', groupNames: '' })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${form.tableFormat === 'single' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                <LayoutList size={20} className={`mb-1 ${form.tableFormat === 'single' ? 'text-primary' : 'text-on-surface-variant'}`} />
                <p className="font-headline text-xs font-bold text-on-surface">Tabela Única</p>
                <p className="text-[10px] text-on-surface-variant">Todos os times em uma só tabela</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, tableFormat: 'grouped' })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${form.tableFormat === 'grouped' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                <LayoutGrid size={20} className={`mb-1 ${form.tableFormat === 'grouped' ? 'text-primary' : 'text-on-surface-variant'}`} />
                <p className="font-headline text-xs font-bold text-on-surface">Tabela por Grupos</p>
                <p className="text-[10px] text-on-surface-variant">Separar por grupos (A, B, C...)</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, tableFormat: 'friendly', groupNames: '' })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${form.tableFormat === 'friendly' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                <Users size={20} className={`mb-1 ${form.tableFormat === 'friendly' ? 'text-primary' : 'text-on-surface-variant'}`} />
                <p className="font-headline text-xs font-bold text-on-surface">Amistoso</p>
                <p className="text-[10px] text-on-surface-variant">Jogos amistosos, sem tabela</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, tableFormat: 'none', groupNames: '' })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${form.tableFormat === 'none' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                <Ban size={20} className={`mb-1 ${form.tableFormat === 'none' ? 'text-primary' : 'text-on-surface-variant'}`} />
                <p className="font-headline text-xs font-bold text-on-surface">Sem Tabela</p>
                <p className="text-[10px] text-on-surface-variant">Competição sem classificação</p>
              </button>
              <button type="button" onClick={() => setForm({ ...form, tableFormat: 'phases', groupNames: '' })}
                className={`p-3 rounded-lg border-2 text-left transition-all ${form.tableFormat === 'phases' ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                <Trophy size={20} className={`mb-1 ${form.tableFormat === 'phases' ? 'text-primary' : 'text-on-surface-variant'}`} />
                <p className="font-headline text-xs font-bold text-on-surface">Sistema de Fases</p>
                <p className="text-[10px] text-on-surface-variant">Eliminatório por fases</p>
              </button>
            </div>
          </div>
          {form.tableFormat === 'grouped' && (
            <div>
              <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nomes dos Grupos *</label>
              <input value={form.groupNames} onChange={(e) => setForm({ ...form, groupNames: e.target.value })} className="input-field" placeholder="Ex: Grupo A,Grupo B,Grupo C" />
              <p className="text-[10px] text-on-surface-variant mt-1">Separados por vírgula</p>
            </div>
          )}
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Categoria / Modalidade *</label>
            <div className="space-y-1.5 max-h-60 overflow-y-auto border border-outline-variant/30 rounded-lg p-2">
              {flatCategories.filter((c) => c.parentId || !flatCategories.some((p) => p.parentId === c.id)).map((cat) => (
                <button key={cat.id} type="button" onClick={() => setForm({ ...form, categoryId: cat.id })}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-left transition-all ${form.categoryId === cat.id ? 'bg-primary text-white font-bold shadow-sm' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>
                  <span className="text-xs">{cat.displayName || cat.name}</span>
                  <span className={`text-[8px] px-1 py-0.5 rounded ${form.categoryId === cat.id ? 'bg-white/20 text-white' : (GENDER_BADGE[cat.gender] || 'bg-gray-100 text-gray-500')}`}>{GENDER_LABEL[cat.gender] || cat.gender}</span>
                </button>
              ))}
            </div>
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Participa</label>
            <select value={form.isParticipating} onChange={(e) => setForm({ ...form, isParticipating: e.target.value })} className="select-field">
              <option value="true">Sim</option><option value="false">Não</option>
            </select>
          </div>
          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
