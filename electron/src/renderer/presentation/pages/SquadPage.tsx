import { useEffect, useState, useMemo } from 'react';
import { clubeApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, Shield, Loader2, Users, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { ImageUpload } from '@/presentation/components/ui/ImageUpload';
import { Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

const GENDER_LABEL: Record<string, string> = { MALE: 'Masculino', FEMALE: 'Feminino', MIXED: 'Misto' };
const GENDER_BADGE: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };
const POSITION_OPTIONS = ['Goleiro', 'Zagueiro', 'Lateral', 'Volante', 'Meia', 'Atacante', 'Centroavante', 'Ponta', 'Armador', 'Ala', 'Pivô', 'Ala-Pivô', 'Fixo'];

export function SquadPage() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: '', position: '', shirtNumber: '', categoryId: '', birthDate: '', isActive: 'true' });
  const [selectedModality, setSelectedModality] = useState('');
  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sectionPages, setSectionPages] = useState<Record<string, number>>({});
  const SECTION_LIMIT = 10;
  const toast = useToastStore((s) => s.addToast);

  const isDirty = !editing && photoFile ? true : (initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm));

  const load = async () => {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([clubeApi.get('/admin/elenco'), clubeApi.get('/categorias')]);
      setItems(Array.isArray(s) ? s : s?.data || []);
      setCategories(Array.isArray(c) ? c : []);
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); const f = { name: '', position: '', shirtNumber: '', categoryId: '', birthDate: '', isActive: 'true' }; setForm(f); setInitialForm({ ...f }); setPhotoFile(null); setSelectedModality(''); setModalOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    const f = { name: item.name || '', position: item.position || '', shirtNumber: item.shirtNumber ? String(item.shirtNumber) : '', categoryId: item.categoryId || '', birthDate: item.birthDate ? new Date(item.birthDate).toISOString().slice(0, 10) : '', isActive: String(item.isActive ?? true) };
    setForm(f); setInitialForm({ ...f }); setPhotoFile(null);
    // Find the parent modality for this category
    const parentModality = categories.find((c: any) => c.children?.some((ch: any) => ch.id === item.categoryId));
    setSelectedModality(parentModality?.id || '');
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast('Nome é obrigatório.', 'error'); return; }
    if (!form.categoryId) { toast('Selecione uma categoria.', 'error'); return; }
    setSaving(true);
    const fd = new FormData();
    fd.append('name', form.name);
    fd.append('categoryId', form.categoryId);
    if (form.position) fd.append('position', form.position);
    if (form.shirtNumber) fd.append('shirtNumber', String(Number(form.shirtNumber)));
    if (form.birthDate) fd.append('birthDate', form.birthDate);
    fd.append('isActive', form.isActive);
    if (photoFile) fd.append('photo', photoFile);
    try {
      if (editing) await clubeApi.patch(`/admin/elenco/${editing.id}`, fd);
      else await clubeApi.post('/admin/elenco', fd);
      toast('Salvo com sucesso!', 'success'); setModalOpen(false); load();
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar este jogador?', async () => {
      setDeletingId(id);
      try { await clubeApi.delete(`/admin/elenco/${id}`); toast('Removido.', 'success'); load(); }
      catch (e: any) { toast('Erro: ' + e.message, 'error'); }
      setDeletingId(null);
    });
  };

  const getCategoryLabel = (id: string) => {
    for (const p of categories) {
      if (p.id === id) return p.name;
      const child = p.children?.find((c: any) => c.id === id);
      if (child) return `${p.name} › ${child.name}`;
    }
    return '—';
  };

  // Lista plana de categorias-folha (sem filhos) para as abas de filtro
  const leafCategories = useMemo(() => {
    const leaves: any[] = [];
    for (const p of categories) {
      if (p.children && p.children.length > 0) {
        // Categorias-raiz com filhos: mostrar cada filho como aba
        for (const child of p.children) {
          leaves.push(child);
        }
      } else {
        // Categorias sem filhos: mostrar a própria como aba
        leaves.push(p);
      }
    }
    return leaves;
  }, [categories]);

  // Contagem de jogadores por categoria-folha
  const playerCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const player of items) {
      counts[player.categoryId] = (counts[player.categoryId] || 0) + 1;
    }
    return counts;
  }, [items]);

  // Modo "Todos": uma seção por categoria-folha
  const allByLeaf = useMemo(() => {
    const sections: { leaf: any; players: any[] }[] = [];
    const byId: Record<string, any[]> = {};
    for (const player of items) {
      if (!byId[player.categoryId]) byId[player.categoryId] = [];
      byId[player.categoryId].push(player);
    }
    for (const leaf of leafCategories) {
      const players = byId[leaf.id];
      if (players && players.length > 0) sections.push({ leaf, players: [...players].sort((a: any, b: any) => a.name.localeCompare(b.name, 'pt-BR')) });
    }
    return sections;
  }, [items, leafCategories]);

  // Modo filtro específico: jogadores daquela folha, sem card-pai
  const filteredPlayers = useMemo(() => {
    if (filterCategory === 'all') return [];
    return items.filter((item) => item.categoryId === filterCategory);
  }, [items, filterCategory]);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Elenco</h1>
          <p className="text-xs text-on-surface-variant mt-0.5">{items.length} jogador{items.length !== 1 ? 'es' : ''} cadastrado{items.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={openNew} className="btn-secondary flex items-center gap-2"><Plus size={16} /> Novo Jogador</button>
      </div>

      {/* Filtro por categoria */}
      {!loading && leafCategories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setFilterCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategory === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
            Todos ({items.length})
          </button>
          {leafCategories.map((cat) => (
            <button key={cat.id} onClick={() => setFilterCategory(cat.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${filterCategory === cat.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
              {cat.name}
              <span className={`text-[9px] px-1 py-0.5 rounded ${filterCategory === cat.id ? 'bg-white/20' : 'bg-surface-container-low'}`}>{playerCountByCategory[cat.id] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton className="h-5 w-40 mb-3" />
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex flex-col items-center py-3"><Skeleton className="w-14 h-14 rounded-full mb-2" /><Skeleton className="h-3 w-20 mb-1" /><Skeleton className="h-3 w-16" /></div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {filterCategory === 'all' ? (
            /* Modo "Todos": accordion por categoria-folha, todos fechados por padrão */
            allByLeaf.map(({ leaf, players }) => {
              const isExpanded = expandedGroups.has(leaf.id);
              return (
                <div key={leaf.id} className="card overflow-hidden">
                  <button onClick={() => toggleGroup(leaf.id)} className="w-full flex items-center gap-3 py-3 px-3 text-left hover:bg-surface-container-low/50 transition-colors">
                    {isExpanded ? <ChevronDown size={16} className="text-on-surface-variant shrink-0" /> : <ChevronRight size={16} className="text-on-surface-variant shrink-0" />}
                    <Users size={16} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-sm font-bold text-on-surface">{leaf.name}</span>
                        {leaf.gender && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${GENDER_BADGE[leaf.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[leaf.gender] || leaf.gender}</span>}
                      </div>
                    </div>
                    <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{players.length} jogador{players.length !== 1 ? 'es' : ''}</span>
                  </button>
                  {isExpanded && (() => {
                    const key = `squad-all-${leaf.id}`;
                    const page = sectionPages[key] || 1;
                    const totalPages = Math.ceil(players.length / SECTION_LIMIT);
                    const paged = players.slice((page - 1) * SECTION_LIMIT, page * SECTION_LIMIT);
                    return (
                      <div className="border-t border-outline-variant/50 pt-3 pb-1 px-3 fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                          {paged.map((item) => (
                            <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low/50 transition-colors group/player">
                              {item.photoUrl ? <img src={item.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0" /> :
                                <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0"><Shield size={14} className="text-on-surface-variant/30" /></div>}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-body text-xs font-bold text-on-surface truncate">{item.name}</p>
                                  {item.shirtNumber && <span className="text-[9px] font-headline font-bold text-primary">#{item.shirtNumber}</span>}
                                </div>
                                {item.position && <p className="text-[9px] text-on-surface-variant">{item.position}</p>}
                                <span className={`inline-block text-[8px] font-bold px-1 py-0.5 rounded mt-0.5 ${item.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{item.isActive ? 'Ativo' : 'Inativo'}</span>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0">
                                <button onClick={(e) => { e.stopPropagation(); openEdit(item); }} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={12} /></button>
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }} disabled={deletingId === item.id} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                                  {deletingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        {players.length > SECTION_LIMIT && (
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
          ) : (
            /* Modo filtro específico: jogadores da folha, sem card-pai, sempre aberto */
            <div className="card overflow-hidden">
              {(() => {
                const leaf = leafCategories.find((c) => c.id === filterCategory);
                return (
                  <div className="flex items-center gap-3 py-3 px-3 border-b border-outline-variant/50">
                    <Users size={16} className="text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-headline text-sm font-bold text-on-surface">{leaf?.name || ''}</span>
                        {leaf?.gender && <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${GENDER_BADGE[leaf.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[leaf.gender] || leaf.gender}</span>}
                      </div>
                    </div>
                    <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{filteredPlayers.length} jogador{filteredPlayers.length !== 1 ? 'es' : ''}</span>
                  </div>
                );
              })()}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 p-3">
                {(() => {
                  const key = `squad-filter-${filterCategory}`;
                  const page = sectionPages[key] || 1;
                  const totalPages = Math.ceil(filteredPlayers.length / SECTION_LIMIT);
                  const paged = filteredPlayers.slice((page - 1) * SECTION_LIMIT, page * SECTION_LIMIT);
                  return (
                    <>
                      {paged.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-container-low/50 transition-colors group/player">
                          {item.photoUrl ? <img src={item.photoUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-outline-variant shrink-0" /> :
                            <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center shrink-0"><Shield size={14} className="text-on-surface-variant/30" /></div>}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-body text-xs font-bold text-on-surface truncate">{item.name}</p>
                              {item.shirtNumber && <span className="text-[9px] font-headline font-bold text-primary">#{item.shirtNumber}</span>}
                            </div>
                            {item.position && <p className="text-[9px] text-on-surface-variant">{item.position}</p>}
                            <span className={`inline-block text-[8px] font-bold px-1 py-0.5 rounded mt-0.5 ${item.isActive ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'}`}>{item.isActive ? 'Ativo' : 'Inativo'}</span>
                          </div>
                          <div className="flex gap-0.5 opacity-0 group-hover/player:opacity-100 transition-opacity shrink-0">
                            <button onClick={() => openEdit(item)} className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={12} /></button>
                            <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id} className="p-1 rounded hover:bg-gray-100 text-gray-500 disabled:opacity-50">
                              {deletingId === item.id ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                            </button>
                          </div>
                        </div>
                      ))}
                      {filteredPlayers.length === 0 && (
                        <p className="col-span-full text-on-surface-variant text-sm py-8 text-center">Nenhum jogador nesta categoria.</p>
                      )}
                    </>
                  );
                })()}
              </div>
              {filteredPlayers.length > SECTION_LIMIT && (() => {
                const key = `squad-filter-${filterCategory}`;
                const page = sectionPages[key] || 1;
                const totalPages = Math.ceil(filteredPlayers.length / SECTION_LIMIT);
                return (
                  <div className="flex items-center justify-between px-3 pb-2">
                    <span className="text-[9px] text-on-surface-variant">{page} de {totalPages}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.max(1, page - 1) })} disabled={page === 1} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronLeft size={12} /></button>
                      <button onClick={() => setSectionPages({ ...sectionPages, [key]: Math.min(totalPages, page + 1) })} disabled={page >= totalPages} className="p-1 rounded hover:bg-surface-container-low disabled:opacity-30"><ChevronRight size={12} /></button>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Jogador' : 'Novo Jogador'}>
        <div className="space-y-4">
          <ImageUpload label="Foto do Jogador" currentImage={editing?.photoUrl} onUpload={(file) => setPhotoFile(file)} />
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nome completo" />
          </div>

          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Modalidade *</label>
            <select value={selectedModality} onChange={(e) => {
              const modId = e.target.value;
              setSelectedModality(modId);
              // If selected modality has no children, set categoryId directly
              const mod = categories.find((c: any) => c.id === modId);
              if (mod && (!mod.children || mod.children.length === 0)) {
                setForm({ ...form, categoryId: mod.id });
              } else {
                setForm({ ...form, categoryId: '' });
              }
            }} className="select-field w-full">
              <option value="">Selecione a modalidade...</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {selectedModality && (() => {
            const mod = categories.find((c: any) => c.id === selectedModality);
            if (!mod || !mod.children || mod.children.length === 0) return null;
            return (
              <div>
                <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Subcategoria *</label>
                <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="select-field w-full">
                  <option value="">Selecione a subcategoria...</option>
                  {mod.children.map((child: any) => (
                    <option key={child.id} value={child.id} disabled={!child.isActive}>
                      {child.name} {!child.isActive && '(inativa)'}
                    </option>
                  ))}
                </select>
              </div>
            );
          })()}

          {form.categoryId && <p className="text-[10px] text-on-surface-variant mt-1">Selecionado: <strong>{getCategoryLabel(form.categoryId)}</strong></p>}

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Posição</label>
              <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className="select-field">
                <option value="">Selecione...</option>
                {POSITION_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nº Camisa</label>
              <input inputMode="numeric" pattern="[0-9]*" value={form.shirtNumber} onChange={(e) => setForm({ ...form, shirtNumber: e.target.value.replace(/^0+(?=\d)/, '') })} className="input-field" placeholder="1-99" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Data de Nascimento</label>
              <input type="date" value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} className="input-field" />
            </div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Status</label>
              <select value={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.value })} className="select-field">
                <option value="true">Ativo</option>
                <option value="false">Inativo</option>
              </select>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || (!editing && !photoFile) || (editing && !isDirty)} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 size={16} className="animate-spin" />} Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
