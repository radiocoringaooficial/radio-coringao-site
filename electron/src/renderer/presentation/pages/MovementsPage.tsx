import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { clubeApi, CLUBE } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, Shield, ArrowDownLeft, ArrowUpRight, RotateCcw, TrendingUp, TrendingDown, ChevronDown, ChevronLeft, ChevronRight, DollarSign, Loader2, Archive, ArchiveRestore, Search, X } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { getSeasonYears } from '@/shared/utils/seasons';
import { CardGridSkeleton, Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

const TYPE_MAP: Record<string, { label: string; color: string; icon: any; direction: 'in' | 'out' }> = {
  ARRIVAL: { label: 'Contratação', color: 'bg-blue-50 text-blue-700', icon: ArrowDownLeft, direction: 'in' },
  DEPARTURE: { label: 'Venda', color: 'bg-red-50 text-red-600', icon: ArrowUpRight, direction: 'out' },
  LOAN_IN: { label: 'Empréstimo Entrada', color: 'bg-blue-50 text-blue-700', icon: TrendingDown, direction: 'in' },
  LOAN_OUT: { label: 'Empréstimo Saída', color: 'bg-yellow-50 text-yellow-700', icon: TrendingUp, direction: 'out' },
  RETURN: { label: 'Retorno', color: 'bg-purple-50 text-purple-700', icon: RotateCcw, direction: 'in' },
};

const IN_TYPES = ['ARRIVAL', 'LOAN_IN', 'RETURN'];
const OUT_TYPES = ['DEPARTURE', 'LOAN_OUT'];
const LOAN_TYPES = ['LOAN_IN', 'LOAN_OUT'];

const GENDER_MAP: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const MODALITY_MAP: Record<string, string> = { FOOTBALL: 'Futebol', BASKETBALL: 'Basquete', FUTSAL: 'Futsal', VOLLEYBALL: 'Voleibol', HANDBALL: 'Handebol', OTHER: 'Outro' };

function formatCategoryLabel(cat: any) {
  if (!cat) return 'Sem Categoria';
  const parts: string[] = [];
  const modality = MODALITY_MAP[cat.modality] || cat.modality;
  const gender = GENDER_MAP[cat.gender] || cat.gender;
  if (modality) parts.push(modality);
  if (gender) parts.push(gender);
  if (cat.name && !parts.includes(cat.name)) parts.push(cat.name);
  return parts.join(' ');
}

function ClubDropdown({ value, onChange, opponents, team, showTeam = true }: { value: string; onChange: (id: string) => void; opponents: any[]; team: any; showTeam?: boolean }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = opponents.find((o) => o.id === value);
  const isTeam = value === 'corinthians';

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }); }
    setOpen(true);
  };

  return (
    <>
      <button type="button" ref={btnRef} onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors text-left">
        {isTeam ? (team?.logoUrl ? <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> : <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center shrink-0"><Shield size={10} className="text-primary" /></div>) :
         selected?.logoUrl ? <img src={selected.logoUrl} alt="" className="w-6 h-6 object-contain shrink-0" /> :
         <div className="w-6 h-6 rounded bg-surface-container flex items-center justify-center shrink-0"><Shield size={10} className="text-on-surface-variant" /></div>}
        <span className="flex-1 text-sm text-on-surface truncate">{isTeam ? team?.name || 'Corinthians' : selected?.name || 'Selecionar clube...'}</span>
        <ChevronDown size={14} className={`text-on-surface-variant/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div data-dropdown className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-outline-variant" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: '40vh' }}>
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '40vh' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }} className="w-full text-left px-3 py-2.5 text-xs text-on-surface-variant hover:bg-surface-container-low">Nenhum</button>
            {showTeam && <button type="button" onClick={() => { onChange('corinthians'); setOpen(false); }} className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-surface-container-low ${isTeam ? 'bg-primary/5' : ''}`}>
              {team?.logoUrl ? <img src={team.logoUrl} alt="" className="w-6 h-6 object-contain" /> : <div className="w-6 h-6 rounded bg-primary/10 flex items-center justify-center"><Shield size={10} className="text-primary" /></div>}
              <div><p className="text-xs font-bold text-primary">{team?.name || 'Corinthians'}</p><p className="text-[9px] text-primary/60">Meu Clube</p></div>
            </button>}
            {showTeam && <div className="border-t border-outline-variant/30" />}
            {opponents.map((o) => (
              <button key={o.id} type="button" onClick={() => { onChange(o.id); setOpen(false); }}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left transition-colors ${value === o.id ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                {o.logoUrl ? <img src={o.logoUrl} alt="" className="w-5 h-5 object-contain" /> : <div className="w-5 h-5 rounded bg-surface-container flex items-center justify-center"><Shield size={8} className="text-on-surface-variant" /></div>}
                <div><p className="text-[11px] font-bold text-on-surface">{o.name}</p>{o.shortName && <p className="text-[9px] text-on-surface-variant">{o.shortName}</p>}</div>
              </button>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };

function PlayerDropdown({ value, onChange, squad, team, fallbackPlayer }: { value: string; onChange: (id: string) => void; squad: any[]; team: any; fallbackPlayer?: any }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const [search, setSearch] = useState('');
  const btnRef = useRef<HTMLButtonElement>(null);
  const safeValue = (value && value !== 'null' && value !== 'undefined') ? value : '';
  const inSquad = squad.find((p) => p.id === safeValue);
  const fb = fallbackPlayer && fallbackPlayer.id === safeValue ? fallbackPlayer : null;
  const selected = inSquad || fb;

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setSearch('');
    setOpen(true);
  };

  const filtered = squad.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };

  return (
    <>
      <button type="button" ref={btnRef} onClick={toggle}
        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors text-left">
        {selected?.photoUrl ? (
          <img src={selected.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant/30" />
        ) : (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Shield size={14} className="text-primary/60" /></div>
        )}
        <div className="flex-1 min-w-0">
          {selected ? (
            <div className="flex items-center gap-1.5">
              {team?.logoUrl && <img src={team.logoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" />}
              <span className="text-sm font-bold text-on-surface truncate">{selected.name}</span>
              {selected.shirtNumber && <span className="text-[10px] font-headline font-bold text-primary">#{selected.shirtNumber}</span>}
            </div>
          ) : (
            <span className="text-sm text-on-surface-variant">Selecionar jogador...</span>
          )}
          {selected?.category?.name && <p className="text-[10px] text-on-surface-variant">{selected.category.name}</p>}
        </div>
        <ChevronDown size={14} className={`text-on-surface-variant/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div className="fixed z-[9999] bg-white rounded-xl shadow-2xl border border-outline-variant overflow-hidden" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: '40vh' }}>
          <div className="p-2 border-b border-outline-variant/30">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant/40" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar jogador..."
                className="w-full pl-8 pr-3 py-2 text-xs rounded-lg border border-outline-variant/40 focus:outline-none focus:border-primary/60 bg-surface" autoFocus />
            </div>
          </div>
          <div className="overflow-y-auto overscroll-contain py-1" style={{ maxHeight: 'calc(40vh - 52px)' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className="w-full text-left px-3 py-2 text-xs text-on-surface-variant hover:bg-surface-container-low flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center shrink-0"><X size={12} className="text-gray-400" /></div>
              <span>Nenhum</span>
            </button>
            <div className="border-t border-outline-variant/20 mx-2" />
            {filtered.map((p) => (
              <button key={p.id} type="button" onClick={() => { onChange(p.id); setOpen(false); }}
                className={`w-full text-left px-3 py-2 flex items-center gap-2.5 transition-colors ${safeValue === p.id ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                {p.photoUrl ? (
                  <img src={p.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 border border-outline-variant/30" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0">
                    <span className="text-[10px] font-bold text-on-surface-variant">{p.name.slice(0, 2).toUpperCase()}</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    {team?.logoUrl && <img src={team.logoUrl} alt="" className="w-3 h-3 object-contain shrink-0" />}
                    <span className="text-xs font-bold text-on-surface truncate">{p.name}</span>
                    {p.shirtNumber && <span className="text-[9px] font-bold text-primary">#{p.shirtNumber}</span>}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    {p.category?.name && <span className="text-[9px] text-on-surface-variant">{p.category.name}</span>}
                    {p.category?.gender && <span className={`text-[8px] px-1 py-0.5 rounded ${GENDER_BADGE[p.category.gender] || ''}`}>{p.category.gender === 'MALE' ? 'M' : p.category.gender === 'FEMALE' ? 'F' : 'Misto'}</span>}
                  </div>
                </div>
                {safeValue === p.id && <span className="text-[9px] font-bold text-primary">✓</span>}
              </button>
            ))}
            {filtered.length === 0 && <div className="px-3 py-6 text-center text-[11px] text-on-surface-variant">Nenhum jogador encontrado</div>}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function TypeDropdown({ value, onChange, types }: { value: string; onChange: (v: string) => void; types: string[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const selected = TYPE_MAP[value];

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) { const r = btnRef.current.getBoundingClientRect(); setPos({ top: r.bottom + 4, left: r.left, width: r.width }); }
    setOpen(true);
  };

  return (
    <>
      <button type="button" ref={btnRef} onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors text-left">
        {selected && <div className={`w-5 h-5 rounded flex items-center justify-center ${selected.color.split(' ')[0]}`}><selected.icon size={11} className={selected.color.split(' ')[1]} /></div>}
        <span className="text-sm text-on-surface flex-1">{selected?.label || 'Selecionar...'}</span>
        <ChevronDown size={14} className={`text-on-surface-variant/40 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div data-dropdown className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-outline-variant" style={{ top: pos.top, left: pos.left, width: pos.width }}>
          {types.map((k) => {
            const t = TYPE_MAP[k];
            const I = t.icon;
            return (
              <button key={k} type="button" onClick={() => { onChange(k); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${value === k ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                <div className={`w-6 h-6 rounded flex items-center justify-center ${t.color.split(' ')[0]}`}><I size={12} className={t.color.split(' ')[1]} /></div>
                <span className="text-xs font-bold text-on-surface">{t.label}</span>
              </button>
            );
          })}
        </div>,
        document.body
      )}
    </>
  );
}

function MovementCardSkeleton() {
  return (
    <div className="card max-w-2xl">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 w-32 shrink-0">
          <Skeleton className="w-8 h-8 rounded-full shrink-0" />
          <div className="min-w-0 space-y-1"><Skeleton className="h-3.5 w-20" /><Skeleton className="h-2.5 w-12" /></div>
        </div>
        <div className="h-6 w-px bg-outline-variant shrink-0" />
        <Skeleton className="w-6 h-6 rounded shrink-0" />
        <div className="shrink-0 space-y-1"><Skeleton className="h-3 w-16" /><Skeleton className="h-2.5 w-10" /></div>
        <div className="h-6 w-px bg-outline-variant shrink-0" />
        <div className="flex items-center gap-1 shrink-0"><Skeleton className="w-4 h-4 rounded shrink-0" /><Skeleton className="h-2.5 w-8" /></div>
        <div className="flex items-center gap-1.5 flex-wrap shrink-0 ml-auto"><Skeleton className="h-4 w-16 rounded" /></div>
      </div>
    </div>
  );
}

export function MovementsPage() {
  const toast = useToastStore((s) => s.addToast);
  const [movements, setMovements] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [finance, setFinance] = useState<any>(null);
  const [squad, setSquad] = useState<any[]>([]);
  const [opponents, setOpponents] = useState<any[]>([]);
  const [team, setTeam] = useState<any>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [selectedSeason, setSelectedSeason] = useState(String(new Date().getFullYear()));
  const [form, setForm] = useState({
    squadMemberId: '', direction: 'in' as 'in' | 'out', type: 'ARRIVAL', date: new Date().toISOString().slice(0, 10),
    opponentId: '', notes: '', value: '', loanValue: '', isFreeLoan: false, paysSalary: false,
    corinthiansPercentage: '', soldPercentage: '', playerPercentage: '', returnDate: '',
  });
  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [archivedMovements, setArchivedMovements] = useState<any[]>([]);
  const [allMovements, setAllMovements] = useState<any[]>([]);
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const [search, setSearch] = useState('');
  const SECTION_LIMIT = 6;

  const load = async (searchTerm?: string) => {
    const q = searchTerm !== undefined ? searchTerm : search;
    const seasonParam = `&season=${selectedSeason}`;
    try { const m = await clubeApi.get(`/admin/movimentacoes?page=1&limit=100${q ? `&search=${encodeURIComponent(q)}` : ''}${seasonParam}`); setMovements(m?.data || (Array.isArray(m) ? m : [])); setTotal(m?.total || 0); } catch {}
    try { const a = await clubeApi.get(`/admin/movimentacoes?page=1&limit=100&archived=true${seasonParam}`); setArchivedMovements(a?.data || (Array.isArray(a) ? a : [])); } catch {}
    try { const f = await clubeApi.get(`/admin/movimentacoes/finance?season=${selectedSeason}`); setFinance(f); } catch {}
    // Busca TODAS as movimentações (sem filtro de temporada) para calcular finanças por temporada
    try {
      const allM = await clubeApi.get('/admin/movimentacoes?page=1&limit=9999');
      const allA = await clubeApi.get('/admin/movimentacoes?page=1&limit=9999&archived=true');
      const allItems = [...(allM?.data || (Array.isArray(allM) ? allM : [])), ...(allA?.data || (Array.isArray(allA) ? allA : []))];
      setAllMovements(allItems);
    } catch {}
    try { const s = await clubeApi.get('/admin/elenco'); setSquad(Array.isArray(s) ? s : s?.data || []); } catch {}
    try { const o = await clubeApi.get('/adversarios'); setOpponents(Array.isArray(o) ? o : o?.data || []); } catch {}
    try {
      const t = await clubeApi.get('/team');
      if (t && t.name) setTeam(t);
      else { const t2 = await fetch(`${CLUBE}/team`).then(r => r.json()); setTeam(t2); }
    } catch {
      try { const t = await fetch(`${CLUBE}/team`).then(r => r.json()); setTeam(t); } catch {}
    }
    setLoading(false);
  };
  useEffect(() => { load(); }, [selectedSeason]);

  // Sincroniza o jogador da movimentação com o form quando o modal de edição abre
  useEffect(() => {
    if (editing && modalOpen) {
      const rawPid = editing.squadMemberId || editing.squadMember?.id || '';
      const pid = (rawPid && rawPid !== 'null' && rawPid !== 'undefined') ? String(rawPid) : '';
      if (pid && form.squadMemberId !== pid) {
        setForm((prev) => ({ ...prev, squadMemberId: pid }));
      }
    }
  }, [editing, modalOpen]);

  useEffect(() => {
    const t = setTimeout(() => { load(search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const arrivals = movements.filter((m) => IN_TYPES.includes(m.type));
  const departures = movements.filter((m) => OUT_TYPES.includes(m.type));

  const groupedArrivals = arrivals.reduce((acc: Record<string, any[]>, m) => {
    const cat = m.category || m.squadMember?.category;
    const key = formatCategoryLabel(cat);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const groupedDepartures = departures.reduce((acc: Record<string, any[]>, m) => {
    const cat = m.category || m.squadMember?.category;
    const key = formatCategoryLabel(cat);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const groupedArchived = archivedMovements.reduce((acc: Record<string, any[]>, m) => {
    const cat = m.category || m.squadMember?.category;
    const key = formatCategoryLabel(cat);
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const syncType = (dir: string, currentType: string) => {
    if (dir === 'in') return IN_TYPES.includes(currentType) ? currentType : 'ARRIVAL';
    return OUT_TYPES.includes(currentType) ? currentType : 'DEPARTURE';
  };

  const newFormDefaults = { squadMemberId: '', direction: 'in' as 'in' | 'out', type: 'ARRIVAL', date: new Date().toISOString().slice(0, 10), opponentId: '', notes: '', value: '', loanValue: '', isFreeLoan: false, paysSalary: false, corinthiansPercentage: '', soldPercentage: '', playerPercentage: '', returnDate: '' };

  const openNew = () => { setEditing(null); const f = { ...newFormDefaults }; setForm(f); setInitialForm({ ...f }); setModalOpen(true); };
  const openEdit = (m: any) => {
    const dir = IN_TYPES.includes(m.type) ? 'in' : 'out';
    setEditing(m);
    const rawId = m.squadMemberId || m.squadMember?.id || '';
    const playerId = (rawId && rawId !== 'null' && rawId !== 'undefined') ? String(rawId) : '';
    const f = {
      squadMemberId: playerId, direction: dir, type: m.type, date: m.date ? new Date(m.date).toISOString().slice(0, 10) : '',
      opponentId: m.opponentId || (m.type === 'RETURN' ? 'corinthians' : ''), notes: m.notes || '',
      value: m.valueCents ? (Number(m.valueCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      loanValue: m.loanValueCents ? (Number(m.loanValueCents) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
      isFreeLoan: m.isFreeLoan || false, paysSalary: m.paysSalary || false,
      corinthiansPercentage: m.corinthiansPercentage != null ? String(m.corinthiansPercentage) : '',
      soldPercentage: m.soldPercentage != null ? String(m.soldPercentage) : '',
      playerPercentage: m.playerPercentage != null ? String(m.playerPercentage) : '',
      returnDate: m.returnDate ? new Date(m.returnDate).toISOString().slice(0, 10) : '',
    };
    setForm(f);
    setInitialForm({ ...f });
    setModalOpen(true);
  };

  const isLoan = LOAN_TYPES.includes(form.type);
  const isSale = form.type === 'DEPARTURE';

  const isDirty = editing !== null || (initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm));

  const handleSave = async () => {
    if (!form.squadMemberId) { toast('Selecione um jogador.', 'error'); return; }
    if (!form.date) { toast('Data é obrigatória.', 'error'); return; }
    if (isLoan && form.returnDate && form.returnDate <= form.date) { toast('Data de retorno deve ser posterior à data de saída.', 'error'); return; }
    setSaving(true);
    try {
      // Get Corinthians transfer club ID
      let clubId = null;
      try {
        const clubs = await clubeApi.get('/admin/transfer-clubs');
        const clubList = Array.isArray(clubs) ? clubs : clubs?.data || [];
        if (clubList.length > 0) clubId = clubList[0].id;
      } catch {}

      // Get player's categoryId for snapshot
      const selectedPlayer = squad.find((p) => p.id === form.squadMemberId);
      const categoryId = selectedPlayer?.category?.id || null;

      const data: any = {
        squadMemberId: form.squadMemberId, type: form.type, date: new Date(form.date).toISOString(),
        opponentId: form.opponentId || null,
        clubId: clubId,
        categoryId: categoryId,
        season: selectedSeason,
        isFreeLoan: form.isFreeLoan, paysSalary: form.paysSalary,
        corinthiansPercentage: form.corinthiansPercentage ? Number(form.corinthiansPercentage) : null,
        soldPercentage: form.soldPercentage ? Number(form.soldPercentage) : null,
        playerPercentage: form.playerPercentage ? Number(form.playerPercentage) : null,
        returnDate: form.returnDate ? new Date(form.returnDate).toISOString() : null,
      };
      if (form.value && !isLoan) data.valueCents = toCents(form.value);
      if (isLoan && !form.isFreeLoan && form.loanValue) data.loanValueCents = toCents(form.loanValue);
      if (editing) await clubeApi.patch(`/admin/movimentacoes/${editing.id}`, data);
      else await clubeApi.post('/admin/movimentacoes', data);
      toast('Salvo com sucesso!', 'success'); setModalOpen(false); load();
    } catch (e: any) { toast(e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar esta movimentação?', async () => {
      try { await clubeApi.delete(`/admin/movimentacoes/${id}`); toast('Removida.', 'success'); load(); }
      catch (e: any) { toast(e.message, 'error'); }
    });
  };

  const handleArchive = async (id: string) => {
    try { await clubeApi.patch(`/admin/movimentacoes/${id}/archive`); toast('Arquivada.', 'success'); load(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const handleUnarchive = async (id: string) => {
    try { await clubeApi.patch(`/admin/movimentacoes/${id}/unarchive`); toast('Desarquivada.', 'success'); load(); }
    catch (e: any) { toast(e.message, 'error'); }
  };

  const formatCurrency = (cents: any) => {
    if (!cents) return null;
    const val = Number(cents) / 100;
    return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const computeSeasonFinance = (items: any[]) => {
    let revenue = 0, expenses = 0, loanIn = 0, loanOut = 0;
    let totalDepartures = 0, totalArrivals = 0, totalLoanOut = 0, totalLoanIn = 0, totalReturns = 0;
    let freeLoans = 0, paidLoans = 0, salaryPayers = 0;
    for (const m of items) {
      const v = m.valueCents ? Number(m.valueCents) : 0;
      const lv = m.loanValueCents ? Number(m.loanValueCents) : 0;
      if (m.type === 'DEPARTURE') { revenue += v; totalDepartures++; }
      else if (m.type === 'ARRIVAL') { expenses += v; totalArrivals++; }
      else if (m.type === 'LOAN_OUT') { loanOut += lv; totalLoanOut++; if (m.isFreeLoan) freeLoans++; else paidLoans++; }
      else if (m.type === 'LOAN_IN') { loanIn += lv; totalLoanIn++; }
      else if (m.type === 'RETURN') { totalReturns++; }
      if (m.paysSalary) salaryPayers++;
    }
    return { revenue, expenses, netRevenue: revenue - expenses, loanIn, loanOut, totalDepartures, totalArrivals, totalLoanOut, totalLoanIn, totalReturns, freeLoans, paidLoans, salaryPayers, total: items.length };
  };

  const seasonFinanceMap = useMemo(() => {
    const map: Record<string, any> = {};
    allMovements.forEach(m => { const s = m.season || '2026'; if (!map[s]) map[s] = []; map[s].push(m); });
    const result: Record<string, any> = {};
    for (const [season, items] of Object.entries(map)) {
      result[season] = computeSeasonFinance(items);
    }
    return result;
  }, [allMovements]);

  const parseCurrencyInput = (raw: string): string => {
    const digits = raw.replace(/\D/g, '');
    if (!digits) return '';
    const num = Number(digits) / 100;
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const toCents = (formatted: string): number => {
    const clean = formatted.replace(/\./g, '').replace(',', '.');
    return Math.round(parseFloat(clean || '0') * 100);
  };

  const renderCard = (m: any) => {
    const tp = TYPE_MAP[m.type] || TYPE_MAP.ARRIVAL;
    const Icon = tp.icon;
    const player = m.squadMember;
    const pName = m.playerName || player?.name || '—';
    const pPhoto = m.playerPhotoUrl || player?.photoUrl;
    const pShirt = player?.shirtNumber;
    const pCategory = formatCategoryLabel(m.category || player?.category);
    const opp = m.opponent;
    const d = new Date(m.date);
    const isOut = m.type === 'DEPARTURE' || m.type === 'LOAN_OUT';

    return (
      <div key={m.id} className="card slide-up group">
        {/* Header: Type badge + Date */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <div className={`w-5 h-5 rounded flex items-center justify-center ${tp.color.split(' ')[0]}`}>
              <Icon size={10} className={tp.color.split(' ')[1]} />
            </div>
            <span className="text-[10px] font-headline font-bold text-on-surface">{tp.label}</span>
          </div>
          <span className="text-[9px] text-on-surface-variant">{d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
        </div>

        {/* Body: Player info + Direction + Club */}
        <div className="flex items-center gap-2 mb-2">
          {/* Player */}
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {pPhoto ? <img src={pPhoto} alt="" className="w-8 h-8 rounded-full object-cover border border-outline-variant shrink-0" /> :
              <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0"><Shield size={12} className="text-on-surface-variant/30" /></div>}
            <div className="min-w-0">
              <p className="font-headline text-xs font-bold text-on-surface truncate">{pName}</p>
              <div className="flex items-center gap-1">
                {pShirt && <span className="text-[8px] font-headline font-bold text-primary">#{pShirt}</span>}
                {pCategory && <span className="text-[8px] text-on-surface-variant">{pCategory}</span>}
              </div>
            </div>
          </div>

          {/* Direction arrow */}
          <div className="flex items-center gap-0.5 shrink-0">
            {team?.logoUrl ? <img src={team.logoUrl} alt="" className="w-3.5 h-3.5 object-contain shrink-0" /> :
              <div className="w-3.5 h-3.5 rounded bg-primary/10 flex items-center justify-center"><Shield size={5} className="text-primary" /></div>}
            <span className={`text-[10px] font-bold ${isOut ? 'text-red-500' : 'text-blue-500'}`}>{isOut ? '→' : '←'}</span>
            {opp ? (
              <div className="flex items-center gap-1">
                {opp.logoUrl ? <img src={opp.logoUrl} alt="" className="w-4 h-4 object-contain" /> :
                  <div className="w-4 h-4 rounded bg-surface-container flex items-center justify-center"><Shield size={6} className="text-on-surface-variant" /></div>}
                <span className="text-[9px] font-bold text-on-surface truncate max-w-[70px]">{opp.shortName || opp.name}</span>
              </div>
            ) : (
              <span className="text-[8px] text-on-surface-variant">Retorno</span>
            )}
          </div>
        </div>

        {/* Footer: Values + Actions */}
        <div className="flex items-center justify-between pt-1.5 border-t border-outline-variant/30">
          <div className="flex items-center gap-1 flex-wrap">
            {m.valueCents && <span className="text-[9px] font-bold text-on-surface bg-surface-container px-1.5 py-0.5 rounded">{formatCurrency(m.valueCents)}</span>}
            {m.loanValueCents && <span className="text-[8px] text-blue-600 bg-blue-50 px-1 py-0.5 rounded">Emp: {formatCurrency(m.loanValueCents)}</span>}
            {m.isFreeLoan && <span className="text-[7px] bg-blue-50 text-blue-700 px-1 py-0.5 rounded font-bold">Gratuito</span>}
            {m.paysSalary && <span className="text-[7px] bg-yellow-50 text-yellow-700 px-1 py-0.5 rounded font-bold">Salário</span>}
            {m.returnDate && (m.type === 'LOAN_OUT' || m.type === 'LOAN_IN') && (
              <span className="text-[7px] bg-purple-50 text-purple-700 px-1 py-0.5 rounded font-bold flex items-center gap-0.5">
                Retorno: {new Date(m.returnDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            )}
          </div>
          <div className="flex gap-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => openEdit(m)} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={11} /></button>
            <button onClick={() => handleDelete(m.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><Trash2 size={11} /></button>
            {m.isArchived ? (
              <button onClick={() => handleUnarchive(m.id)} className="p-1 rounded hover:bg-blue-100 text-blue-600" title="Desarquivar"><ArchiveRestore size={11} /></button>
            ) : (
              <button onClick={() => handleArchive(m.id)} className="p-1 rounded hover:bg-yellow-100 text-yellow-600" title="Arquivar"><Archive size={11} /></button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-headline text-headline-md font-bold text-on-surface shrink-0">Movimentações</h1>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar jogador..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <button onClick={openNew} className="btn-secondary flex items-center gap-2 shrink-0"><Plus size={16} /> Nova Movimentação</button>
        </div>
      </div>

      {/* Cards financeiros por temporada */}
      <p className="text-xs font-headline font-bold text-on-surface-variant uppercase tracking-wide mb-2">Resumo Financeiro por Temporada</p>
      <div className="mb-6 space-y-3">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="card p-3 text-center space-y-2">
                <Skeleton className="h-4 w-24 mx-auto" />
                <Skeleton className="h-6 w-20 mx-auto" />
              </div>
            ))}
          </div>
        ) : Object.keys(seasonFinanceMap).sort().reverse().map((season) => {
          const f = seasonFinanceMap[season];
          const isOpen = expanded === `finance-${season}`;
          return (
            <div key={`fin-${season}`} className="rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : `finance-${season}`)}
                className="w-full flex items-center justify-between p-3 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronRight size={14} className={`text-on-surface-variant transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  <span className="font-headline text-sm font-bold text-on-surface">Temporada {season}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${f.netRevenue >= 0 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
                    {formatCurrency(f.netRevenue) || 'R$ 0,00'}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
                  <span>{f.total} mov.</span>
                  <span className="text-blue-600">{f.totalDepartures} vendas</span>
                  <span className="text-red-500">{f.totalArrivals} contratações</span>
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 fade-in">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="card p-3 text-center">
                      <DollarSign size={16} className="mx-auto mb-1 text-blue-600" />
                      <p className="text-[9px] text-on-surface-variant uppercase font-headline">Receitas (Vendas)</p>
                      <p className="font-headline text-base font-bold text-on-surface">{formatCurrency(f.revenue) || 'R$ 0,00'}</p>
                      <p className="text-[8px] text-on-surface-variant">{f.totalDepartures} venda(s)</p>
                    </div>
                    <div className="card p-3 text-center">
                      <DollarSign size={16} className="mx-auto mb-1 text-red-500" />
                      <p className="text-[9px] text-on-surface-variant uppercase font-headline">Despesas (Contratações)</p>
                      <p className="font-headline text-base font-bold text-on-surface">{formatCurrency(f.expenses) || 'R$ 0,00'}</p>
                      <p className="text-[8px] text-on-surface-variant">{f.totalArrivals} contratação(ões)</p>
                    </div>
                    <div className="card p-3 text-center">
                      {f.netRevenue >= 0 ? <TrendingUp size={16} className="mx-auto mb-1 text-blue-600" /> : <TrendingDown size={16} className="mx-auto mb-1 text-red-500" />}
                      <p className="text-[9px] text-on-surface-variant uppercase font-headline">Saldo Líquido</p>
                      <p className={`font-headline text-base font-bold ${f.netRevenue >= 0 ? 'text-on-surface' : 'text-red-500'}`}>{formatCurrency(f.netRevenue) || 'R$ 0,00'}</p>
                    </div>
                    <div className="card p-3 text-center">
                      <DollarSign size={16} className="mx-auto mb-1 text-yellow-600" />
                      <p className="text-[9px] text-on-surface-variant uppercase font-headline">Empréstimos</p>
                      <p className="font-headline text-xs font-bold text-on-surface">Saída: {formatCurrency(f.loanOut) || 'R$ 0'}</p>
                      <p className="font-headline text-xs font-bold text-on-surface">Entrada: {formatCurrency(f.loanIn) || 'R$ 0'}</p>
                      <div className="flex items-center justify-center gap-1.5 mt-1 flex-wrap">
                        {f.freeLoans > 0 && <span className="text-[7px] bg-blue-50 text-blue-700 px-1 rounded">{f.freeLoans} gratuitos</span>}
                        {f.paidLoans > 0 && <span className="text-[7px] bg-yellow-50 text-yellow-700 px-1 rounded">{f.paidLoans} pagos</span>}
                        {f.salaryPayers > 0 && <span className="text-[7px] bg-red-50 text-red-600 px-1 rounded">{f.salaryPayers} paga salário</span>}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-2 mt-3">
                    {[
                      { label: 'Total Mov.', value: f.total, color: 'text-on-surface' },
                      { label: 'Saídas', value: f.totalDepartures, color: 'text-red-500' },
                      { label: 'Chegadas', value: f.totalArrivals, color: 'text-blue-600' },
                      { label: 'Empréstimos', value: f.totalLoanOut + f.totalLoanIn, color: 'text-yellow-600' },
                      { label: 'Retornos', value: f.totalReturns, color: 'text-purple-600' },
                    ].map((s) => (
                      <div key={s.label} className="text-center py-2 rounded-lg bg-surface-container">
                        <p className={`text-lg font-headline font-bold ${s.color}`}>{s.value}</p>
                        <p className="text-[8px] text-on-surface-variant uppercase">{s.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {Object.keys(seasonFinanceMap).length === 0 && !loading && (
          <div className="card text-center py-8">
            <p className="text-on-surface-variant text-sm">Nenhuma movimentação registrada.</p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="space-y-6">
          <div>
            <Skeleton className="h-6 w-32 mb-3" />
            <div className="space-y-2 ml-5">{Array.from({ length: 3 }).map((_, i) => <MovementCardSkeleton key={i} />)}</div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Agrupar movimentações por temporada — usa allMovements (todas as seasons) */}
      {(() => {
        const activeBySeason: Record<string, any[]> = {};
        const archivedBySeason: Record<string, any[]> = {};
        allMovements.forEach(m => {
          const s = m.season || '2026';
          if (m.isArchived) {
            if (!archivedBySeason[s]) archivedBySeason[s] = [];
            archivedBySeason[s].push(m);
          } else {
            if (!activeBySeason[s]) activeBySeason[s] = [];
            activeBySeason[s].push(m);
          }
        });
        const allSeasons = [...new Set([...Object.keys(activeBySeason), ...Object.keys(archivedBySeason)])].sort().reverse();

        const renderSection = (title: string, color: string, icon: any, items: any[], grouped: Record<string, any[]>, seasonPrefix: string) => {
          if (Object.keys(grouped).length === 0) return null;
          return (
            <div>
              <p className={`text-[11px] font-headline font-bold mb-2 flex items-center gap-1.5 ${color}`}>
                {icon} {title} ({items.length})
              </p>
              {Object.entries(grouped).map(([catName, catItems]) => {
                const key = `${seasonPrefix}-${catName}`;
                const sp = sectionPages[key] || 1;
                return (
                  <div key={catName} className="mb-3">
                    <p className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-wider mb-1.5">{catName} ({catItems.length})</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {catItems.slice((sp - 1) * SECTION_LIMIT, sp * SECTION_LIMIT).map(renderCard)}
                    </div>
                    {catItems.length > SECTION_LIMIT && (
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-[10px] text-on-surface-variant">{sp} de {Math.ceil(catItems.length / SECTION_LIMIT)}</span>
                        <div className="flex gap-1.5">
                          <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.max(1, sp - 1) })} disabled={sp === 1} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={14} /></button>
                          <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.min(Math.ceil(catItems.length / SECTION_LIMIT), sp + 1) })} disabled={sp >= Math.ceil(catItems.length / SECTION_LIMIT)} className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={14} /></button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        };

        const groupByCategory = (items: any[]) => items.reduce((acc: Record<string, any[]>, m) => {
          const key = formatCategoryLabel(m.category || m.squadMember?.category);
          if (!acc[key]) acc[key] = [];
          acc[key].push(m);
          return acc;
        }, {});

        return allSeasons.map(season => {
          const sMov = activeBySeason[season] || [];
          const sArc = archivedBySeason[season] || [];
          const sArr = sMov.filter(m => IN_TYPES.includes(m.type));
          const sDep = sMov.filter(m => OUT_TYPES.includes(m.type));
          const isOpen = expanded === `season-${season}`;
          const total = sArr.length + sDep.length + sArc.length;

          return (
            <div key={season} className="mb-4 rounded-xl border border-outline-variant bg-surface-container-lowest overflow-hidden">
              <button onClick={() => setExpanded(isOpen ? null : `season-${season}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-surface-container-low transition-colors">
                <div className="flex items-center gap-3">
                  <ChevronRight size={16} className={`text-on-surface-variant transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                  <span className="font-headline text-sm font-bold text-on-surface">Temporada {season}</span>
                  <span className="text-[10px] text-on-surface-variant">({total} movimentações)</span>
                </div>
                <div className="flex gap-2">
                  {sArr.length > 0 && <span className="badge bg-blue-50 text-blue-700 text-[10px]">{sArr.length} chegadas</span>}
                  {sDep.length > 0 && <span className="badge bg-red-50 text-red-600 text-[10px]">{sDep.length} saídas</span>}
                  {sArc.length > 0 && <span className="badge bg-gray-100 text-gray-600 text-[10px]">{sArc.length} arquivadas</span>}
                </div>
              </button>
              {isOpen && (
                <div className="px-4 pb-4 space-y-4 fade-in">
                  <p className="text-[10px] font-headline font-bold text-on-surface-variant uppercase tracking-wide">Detalhamento por Categoria</p>
                  {renderSection('Chegadas', 'text-blue-600', <TrendingDown size={12} />, sArr, groupByCategory(sArr), `${season}-arr`)}
                  {renderSection('Saídas', 'text-red-600', <TrendingUp size={12} />, sDep, groupByCategory(sDep), `${season}-dep`)}
                  {renderSection('Arquivados', 'text-gray-500', <Archive size={12} />, sArc, groupByCategory(sArc), `${season}-arc`)}
                </div>
              )}
            </div>
          );
        });
      })()}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Movimentação' : 'Nova Movimentação'}>
        <div className="space-y-4">
          {/* Jogador */}
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Jogador *</label>
            {editing ? (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-surface-container-low/50 border border-outline-variant/30">
                {(editing.playerPhotoUrl || editing.squadMember?.photoUrl) ? (
                  <img src={editing.playerPhotoUrl || editing.squadMember?.photoUrl} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><Shield size={14} className="text-primary" /></div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-on-surface truncate">{editing.playerName || editing.squadMember?.name}</p>
                  <div className="flex items-center gap-1.5">
                    {editing.squadMember?.shirtNumber && <span className="text-[10px] font-bold text-primary">#{editing.squadMember.shirtNumber}</span>}
                    {(editing.category || editing.squadMember?.category) && <span className="text-[10px] text-on-surface-variant">{(editing.category || editing.squadMember?.category)?.name}</span>}
                  </div>
                </div>
              </div>
            ) : (
              <PlayerDropdown value={form.squadMemberId} onChange={(id) => setForm({ ...form, squadMemberId: id })} squad={squad} team={team} />
            )}
          </div>

          {/* Chegada / Saída toggle */}
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Direção</label>
            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { const dir = 'in'; setForm({ ...form, direction: dir, type: syncType(dir, form.type) }); }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${form.direction === 'in' ? 'border-blue-500 bg-blue-50' : 'border-outline-variant hover:border-blue-300'}`}>
                <ArrowDownLeft size={18} className={`mx-auto mb-1 ${form.direction === 'in' ? 'text-blue-600' : 'text-on-surface-variant'}`} />
                <p className={`text-xs font-headline font-bold ${form.direction === 'in' ? 'text-blue-700' : 'text-on-surface'}`}>Chegada</p>
              </button>
              <button type="button" onClick={() => { const dir = 'out'; setForm({ ...form, direction: dir, type: syncType(dir, form.type) }); }}
                className={`p-3 rounded-lg border-2 text-center transition-all ${form.direction === 'out' ? 'border-red-500 bg-red-50' : 'border-outline-variant hover:border-red-300'}`}>
                <ArrowUpRight size={18} className={`mx-auto mb-1 ${form.direction === 'out' ? 'text-red-600' : 'text-on-surface-variant'}`} />
                <p className={`text-xs font-headline font-bold ${form.direction === 'out' ? 'text-red-700' : 'text-on-surface'}`}>Saída</p>
              </button>
            </div>
          </div>

          {/* Tipo */}
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Tipo *</label>
            <TypeDropdown value={form.type} onChange={(v) => setForm({ ...form, type: v })} types={form.direction === 'in' ? IN_TYPES : OUT_TYPES} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Data *</label>
              <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input-field" />
            </div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Temporada</label>
              <select value={selectedSeason} onChange={(e) => setSelectedSeason(e.target.value)} className="select-field">
                {getSeasonYears(1, 3).map((y) => <option key={y} value={String(y)}>{y}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {form.type !== 'RETURN' && (
              <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Clube</label>
                <ClubDropdown value={form.opponentId} onChange={(id) => setForm({ ...form, opponentId: id })} opponents={opponents} team={team} showTeam={false} />
              </div>
            )}
          </div>

          {/* Valor da transação — só para venda/contratação */}
          {!isLoan && (
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Valor da Transação</label>
              <input type="text" inputMode="decimal" value={form.value} onChange={(e) => setForm({ ...form, value: parseCurrencyInput(e.target.value) })} className="input-field" placeholder="0,00" />
            </div>
          )}

          {/* Campos de empréstimo */}
          {isLoan && (
            <div className="border border-outline-variant rounded-lg p-3 space-y-3 bg-surface-container-low/30">
              <p className="font-headline text-xs font-bold text-on-surface">Detalhes do Empréstimo</p>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isFreeLoan} onChange={(e) => setForm({ ...form, isFreeLoan: e.target.checked, loanValue: e.target.checked ? '' : form.loanValue })} className="w-4 h-4 rounded border-outline-variant accent-primary" />
                <span className="text-xs text-on-surface">Empréstimo gratuito</span>
              </label>
              {!form.isFreeLoan && (
                <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Valor do Empréstimo</label>
                  <input type="text" inputMode="decimal" value={form.loanValue} onChange={(e) => setForm({ ...form, loanValue: parseCurrencyInput(e.target.value) })} className="input-field" placeholder="0,00" />
                </div>
              )}
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.paysSalary} onChange={(e) => setForm({ ...form, paysSalary: e.target.checked })} className="w-4 h-4 rounded border-outline-variant accent-primary" />
                <span className="text-xs text-on-surface">Paga salário do jogador emprestado</span>
              </label>
              <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Data Prevista de Retorno</label>
                <input type="date" value={form.returnDate} onChange={(e) => setForm({ ...form, returnDate: e.target.value })} className="input-field" />
                <p className="text-[9px] text-on-surface-variant mt-1">Ao chegar esta data, o jogador é reativado automaticamente no elenco</p>
              </div>
            </div>
          )}

          {/* Campos de venda — porcentagem */}
          {isSale && (() => {
            const corPct = Number(form.corinthiansPercentage) || 0;
            const soldPct = Number(form.soldPercentage) || 0;
            const playerPct = Number(form.playerPercentage) || 0;
            const total = corPct + soldPct + playerPct;
            const maxForSold = 100 - corPct - playerPct;
            const maxForCor = 100 - soldPct - playerPct;
            const maxForPlayer = 100 - corPct - soldPct;
            return (
              <div className="border border-outline-variant rounded-lg p-3 space-y-3 bg-surface-container-low/30">
                <p className="font-headline text-xs font-bold text-on-surface">Porcentagem de Passe</p>
                <div className="grid grid-cols-3 gap-3">
                  <div><label className="block text-[10px] font-bold text-on-surface mb-1">Corinthians (%)</label>
                    <input type="number" min="0" max={maxForCor} value={form.corinthiansPercentage} onChange={(e) => setForm({ ...form, corinthiansPercentage: e.target.value })} className="input-field text-sm" placeholder="0" />
                    {corPct > 0 && <p className="text-[8px] text-on-surface-variant mt-0.5">Máx: {maxForCor}%</p>}
                  </div>
                  <div><label className="block text-[10px] font-bold text-on-surface mb-1">Vendido (%)</label>
                    <input type="number" min="0" max={maxForSold} value={form.soldPercentage} onChange={(e) => setForm({ ...form, soldPercentage: e.target.value })} className="input-field text-sm" placeholder="0" />
                    {soldPct > 0 && <p className="text-[8px] text-on-surface-variant mt-0.5">Máx: {maxForSold}%</p>}
                  </div>
                  <div><label className="block text-[10px] font-bold text-on-surface mb-1">Jogador (%)</label>
                    <input type="number" min="0" max={maxForPlayer} value={form.playerPercentage} onChange={(e) => setForm({ ...form, playerPercentage: e.target.value })} className="input-field text-sm" placeholder="0" />
                    {playerPct > 0 && <p className="text-[8px] text-on-surface-variant mt-0.5">Máx: {maxForPlayer}%</p>}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-bold text-on-surface">Total: {total}%</p>
                  {total > 100 && <p className="text-[10px] font-bold text-red-500">Excedeu 100%!</p>}
                  {total <= 100 && <p className="text-[10px] text-blue-600">✓ Válido</p>}
                </div>
              </div>
            );
          })()}

          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <><Loader2 size={16} className="animate-spin" /> Salvando...</> : 'Salvar'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
