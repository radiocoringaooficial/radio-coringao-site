import { useEffect, useState, useMemo, useRef } from 'react';
import type { Opponent } from '@/domain/entities/clube';
import { Plus, Pencil, Trash2, MapPin, Building2, CalendarDays, ChevronLeft, ChevronRight, ChevronDown, Loader2, Search } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { ImageUpload } from '@/presentation/components/ui/ImageUpload';
import { CardGridSkeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';
import { clubeApi } from '@/infrastructure/api/client';

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };

export function OpponentsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [form, setForm] = useState({ name: '', shortName: '', stadium: '', city: '', foundedYear: '', categoryIds: '' });
  const [initialForm, setInitialForm] = useState<{ name: string; shortName: string; stadium: string; city: string; foundedYear: string; categoryIds: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['__none__']));
  const [search, setSearch] = useState('');
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const SECTION_LIMIT = 10;
  const searchSeq = useRef(0);
  const toast = useToastStore((s) => s.addToast);

  const isDirty = initialForm !== null && (
    JSON.stringify(form) !== JSON.stringify(initialForm) || logoFile !== null
  );

  const load = async (searchTerm?: string) => {
    const seq = ++searchSeq.current;
    try {
      setLoading(true);
      const q = searchTerm !== undefined ? searchTerm : search;
      const url = `/admin/adversarios?limit=200${q ? `&q=${encodeURIComponent(q)}` : ''}`;
      const [oppData, catData] = await Promise.all([
        clubeApi.get(url).catch(() => ({ data: [] })),
        clubeApi.get('/categorias/flat').catch(() => []),
      ]);
      if (seq !== searchSeq.current) return;
      setItems(oppData?.data || (Array.isArray(oppData) ? oppData : []));
      setCategories(Array.isArray(catData) ? catData : []);
    } catch (err: any) {
      if (seq !== searchSeq.current) return;
      toast('Erro ao carregar: ' + err.message, 'error');
    } finally {
      if (seq === searchSeq.current) setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);
  useEffect(() => {
    const t = setTimeout(() => { load(search); }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const grouped = useMemo(() => {
    const groups: Record<string, { parent: any; children: Record<string, any[]>; all: any[] }> = {};
    for (const cat of categories) {
      groups[cat.id] = { parent: cat, children: {}, all: [] };
    }
    groups['__none__'] = { parent: { id: '__none__', name: 'Sem Categoria', gender: null }, children: {}, all: [] };

    const hasAnyCategory = new Set<string>();
    for (const opp of items) {
      const oppCats = opp.categories || [];
      if (oppCats.length === 0) {
        groups['__none__'].all.push(opp);
      } else {
        for (const oc of oppCats) {
          const catId = oc.categoryId || oc.category?.id;
          if (catId && groups[catId]) {
            groups[catId].all.push(opp);
            hasAnyCategory.add(opp.id);
          }
        }
      }
    }

    return Object.values(groups)
      .filter((g) => g.all.length > 0)
      .map((g) => ({ ...g, all: [...g.all].sort((a: any, b: any) => a.name.localeCompare(b.name, 'pt-BR')) }));
  }, [items, categories]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(grouped.map((g) => g.parent.id)));
  const collapseAll = () => setExpandedGroups(new Set());

  const openNew = () => {
    setEditing(null);
    setLogoFile(null);
    const newForm = { name: '', shortName: '', stadium: '', city: '', foundedYear: '', categoryIds: '' };
    setForm(newForm);
    setInitialForm(newForm);
    setModalOpen(true);
  };

  const openEdit = (o: any) => {
    setEditing(o);
    setLogoFile(null);
    const catIds = (o.categories || []).map((c: any) => c.categoryId || c.category?.id).filter(Boolean).join(',');
    const loaded = { name: o.name, shortName: o.shortName || '', stadium: o.stadium || '', city: o.city || '', foundedYear: o.foundedYear?.toString() || '', categoryIds: catIds };
    setForm(loaded);
    setInitialForm(loaded);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório', 'error'); return; }
    const fd = new FormData();
    fd.append('name', form.name);
    if (form.shortName) fd.append('shortName', form.shortName);
    if (form.stadium) fd.append('stadium', form.stadium);
    if (form.city) fd.append('city', form.city);
    if (form.foundedYear) fd.append('foundedYear', form.foundedYear);
    fd.append('categoryIds', form.categoryIds || '');
    if (logoFile) fd.append('logo', logoFile);

    try {
      setSaving(true);
      if (editing) {
        await clubeApi.patch(`/admin/adversarios/${editing.id}`, fd);
      } else {
        await clubeApi.post('/admin/adversarios', fd);
      }
      toast(editing ? 'Atualizado!' : 'Cadastrado com sucesso!', 'success');
      setModalOpen(false);
      load();
    } catch (err: any) {
      toast('Erro: ' + err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar este adversário?', async () => {
      try {
        await clubeApi.delete(`/admin/adversarios/${id}`);
        toast('Removido.', 'success');
        load();
      } catch (err: any) { toast('Erro: ' + err.message, 'error'); }
    });
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6 gap-4">
        <div className="shrink-0">
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Adversários</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{items.length} adversário{items.length !== 1 ? 's' : ''} cadastrado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="relative w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/50" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar adversário..."
              className="input-field pl-9 text-sm"
            />
          </div>
          <button onClick={expandAll} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant" title="Expandir todos"><ChevronDown size={14} /></button>
          <button onClick={collapseAll} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant" title="Recolher todos"><ChevronRight size={14} /></button>
          <button onClick={openNew} className="btn-secondary flex items-center gap-2 shrink-0"><Plus size={16} /> Novo</button>
        </div>
      </div>

      {loading ? (
        <CardGridSkeleton count={8} cols={4} />
      ) : (
        <div className="space-y-4">
          {grouped.map((group) => {
            const isExpanded = expandedGroups.has(group.parent.id);
            return (
              <div key={group.parent.id} className="card overflow-hidden">
                <button onClick={() => toggleGroup(group.parent.id)} className="w-full flex items-center gap-3 py-3 px-1 text-left hover:bg-surface-container-low/50 transition-colors">
                  {isExpanded ? <ChevronDown size={16} className="text-on-surface-variant shrink-0" /> : <ChevronRight size={16} className="text-on-surface-variant shrink-0" />}
                  <Users size={16} className="text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-headline text-sm font-bold text-on-surface">{group.parent.name}</span>
                      {group.parent.gender && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${GENDER_BADGE[group.parent.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[group.parent.gender] || group.parent.gender}</span>}
                    </div>
                  </div>
                  <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{group.all.length} adversário{group.all.length !== 1 ? 's' : ''}</span>
                </button>

                {isExpanded && (() => {
                  const key = `opp-${group.parent.id}`;
                  const page = sectionPages[key] || 1;
                  const totalPages = Math.ceil(group.all.length / SECTION_LIMIT);
                  const paged = group.all.slice((page - 1) * SECTION_LIMIT, page * SECTION_LIMIT);
                  return (
                    <div className="border-t border-outline-variant/50 pt-3 pb-1 px-1 fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                        {paged.map((o) => (
                          <div key={o.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-surface-container-low/50 transition-colors group/item border border-outline-variant/30">
                            {o.logoUrl ? <img src={o.logoUrl} alt={o.name} className="w-10 h-10 rounded-xl object-contain shrink-0" /> : <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">{o.shortName?.charAt(0) || o.name.charAt(0)}</div>}
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-xs font-bold text-on-surface truncate">{o.name}</p>
                              {o.city && <p className="text-[10px] text-on-surface-variant">{o.city}</p>}
                            </div>
                            <div className="flex gap-0.5 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
                              <button onClick={() => openEdit(o)} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={12} /></button>
                              <button onClick={() => handleDelete(o.id)} className="p-1 rounded hover:bg-gray-100 text-gray-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                      {group.all.length > SECTION_LIMIT && (
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
          })}
          {grouped.length === 0 && !loading && <p className="text-on-surface-variant text-sm py-8 text-center">Nenhum adversário cadastrado.</p>}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Adversário' : 'Novo Adversário'} maxWidth="max-w-2xl">
        <div className="space-y-4">
          <ImageUpload onUpload={(f) => setLogoFile(f)} currentImage={editing?.logoUrl} label="Escudo" />
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Abreviado</label><input value={form.shortName} onChange={(e) => setForm({ ...form, shortName: e.target.value })} className="input-field" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Estádio</label><input value={form.stadium} onChange={(e) => setForm({ ...form, stadium: e.target.value })} className="input-field" /></div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Cidade</label><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Fundação</label><input type="number" value={form.foundedYear} onChange={(e) => setForm({ ...form, foundedYear: e.target.value })} className="input-field" /></div>
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Categorias / Modalidades</label>
            <div className="space-y-1.5 max-h-40 overflow-y-auto border border-outline-variant/30 rounded-lg p-2">
              {categories.filter((c) => c.parentId || !categories.some((p) => p.parentId === c.id)).map((cat) => {
                const selected = form.categoryIds.split(',').includes(cat.id);
                return (
                  <label key={cat.id} className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${selected ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                    <input type="checkbox" checked={selected} onChange={() => {
                      const ids = form.categoryIds.split(',').filter(Boolean);
                      const newIds = selected ? ids.filter((i) => i !== cat.id) : [...ids, cat.id];
                      setForm({ ...form, categoryIds: newIds.join(',') });
                    }} className="rounded" />
                    <span className="text-xs text-on-surface">{cat.displayName || cat.name}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded ${GENDER_BADGE[cat.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[cat.gender] || cat.gender}</span>
                  </label>
                );
              })}
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}

function Users({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M22 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
