import { useEffect, useState, useMemo } from 'react';
import { clubeApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, Shield, Loader2, ChevronDown, ChevronRight, Users } from 'lucide-react';
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
  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [filterCategory, setFilterCategory] = useState<string>('all');
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

  const openNew = () => { setEditing(null); const f = { name: '', position: '', shirtNumber: '', categoryId: '', birthDate: '', isActive: 'true' }; setForm(f); setInitialForm({ ...f }); setPhotoFile(null); setModalOpen(true); };
  const openEdit = (item: any) => {
    setEditing(item);
    const f = { name: item.name || '', position: item.position || '', shirtNumber: item.shirtNumber ? String(item.shirtNumber) : '', categoryId: item.categoryId || '', birthDate: item.birthDate ? new Date(item.birthDate).toISOString().slice(0, 10) : '', isActive: String(item.isActive ?? true) };
    setForm(f); setInitialForm({ ...f }); setPhotoFile(null); setModalOpen(true);
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

  const getCatParentId = (catId: string) => {
    for (const p of categories) {
      if (p.id === catId) return p.id;
      if (p.children?.some((c: any) => c.id === catId)) return p.id;
    }
    return null;
  };

  const grouped = useMemo(() => {
    const groups: Record<string, { parent: any; children: Record<string, any[]>; allPlayers: any[] }> = {};
    for (const p of categories) {
      groups[p.id] = { parent: p, children: {}, allPlayers: [] };
    }

    for (const player of items) {
      const parentId = getCatParentId(player.categoryId);
      if (!parentId || !groups[parentId]) continue;
      groups[parentId].allPlayers.push(player);

      const parent = groups[parentId].parent;
      const child = parent.children?.find((c: any) => c.id === player.categoryId);
      const groupKey = child ? child.id : '__parent__';
      if (!groups[parentId].children[groupKey]) groups[parentId].children[groupKey] = [];
      groups[parentId].children[groupKey].push(player);
    }

    return Object.values(groups).filter((g) => g.allPlayers.length > 0);
  }, [items, categories]);

  const filtered = filterCategory === 'all' ? grouped : grouped.filter((g) => g.parent.id === filterCategory);

  const toggleGroup = (id: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const expandAll = () => setExpandedGroups(new Set(grouped.map((g) => g.parent.id)));
  const collapseAll = () => setExpandedGroups(new Set());

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
      {!loading && grouped.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <button onClick={() => setFilterCategory('all')} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${filterCategory === 'all' ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
            Todos ({items.length})
          </button>
          {grouped.map((g) => (
            <button key={g.parent.id} onClick={() => setFilterCategory(g.parent.id)} className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${filterCategory === g.parent.id ? 'bg-primary text-white' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-low'}`}>
              {g.parent.name}
              <span className={`text-[9px] px-1 py-0.5 rounded ${filterCategory === g.parent.id ? 'bg-white/20' : 'bg-surface-container-low'}`}>{g.allPlayers.length}</span>
            </button>
          ))}
          <div className="ml-auto flex gap-1">
            <button onClick={expandAll} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant" title="Expandir todos"><ChevronDown size={14} /></button>
            <button onClick={collapseAll} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant" title="Recolher todos"><ChevronRight size={14} /></button>
          </div>
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
          {filtered.map((group) => {
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
                  <span className="badge bg-surface-container text-on-surface-variant text-[10px]">{group.allPlayers.length} jogador{group.allPlayers.length !== 1 ? 'es' : ''}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-outline-variant/50 pt-3 pb-1 px-1 fade-in">
                    {Object.entries(group.children).map(([childKey, players]) => {
                      const childCat = childKey === '__parent__' ? null : group.parent.children?.find((c: any) => c.id === childKey);
                      return (
                        <div key={childKey} className="mb-3 last:mb-0">
                          {childCat && (
                            <div className="flex items-center gap-1.5 mb-2 ml-8">
                              <span className="w-1 h-1 rounded-full bg-primary" />
                              <span className="font-headline text-[10px] font-bold text-on-surface-variant uppercase">{childCat.name}</span>
                              {childCat.gender && <span className={`text-[8px] px-1 py-0.5 rounded ${GENDER_BADGE[childCat.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[childCat.gender]}</span>}
                            </div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 ml-8">
                            {players.map((item) => (
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
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
          {!loading && filtered.length === 0 && <p className="text-on-surface-variant text-sm py-8 text-center">Nenhum jogador encontrado.</p>}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Jogador' : 'Novo Jogador'}>
        <div className="space-y-4">
          <ImageUpload label="Foto do Jogador" currentImage={editing?.photoUrl} onUpload={(file) => setPhotoFile(file)} />
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome *</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nome completo" />
          </div>

          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Categoria / Modalidade *</label>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1 border border-outline-variant/30 rounded-lg p-2">
              {categories.map((parent) => (
                <div key={parent.id}>
                  <div className="flex items-center gap-1.5 mb-1 px-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="font-headline text-[10px] font-bold text-on-surface uppercase tracking-wide">{parent.name}</span>
                    <span className={`text-[8px] px-1 py-0.5 rounded ${GENDER_BADGE[parent.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_LABEL[parent.gender] || parent.gender}</span>
                  </div>
                  {parent.children && parent.children.length > 0 && (
                    <div className="grid grid-cols-2 gap-1 ml-3">
                      {parent.children.map((child: any) => (
                        <button key={child.id} type="button" disabled={!child.isActive}
                          onClick={() => setForm({ ...form, categoryId: child.id })}
                          className={`px-2 py-1.5 rounded text-[10px] font-body text-left transition-all ${form.categoryId === child.id ? 'bg-primary text-white font-bold shadow-sm' : !child.isActive ? 'bg-gray-50 text-gray-400 cursor-not-allowed line-through' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>
                          <span>{child.name}</span>
                          {!child.isActive && <span className="ml-1 text-[7px] text-gray-400">(inativa)</span>}
                          <span className={`ml-1 inline-block text-[7px] px-0.5 py-0.5 rounded ${form.categoryId === child.id ? 'bg-white/20 text-white' : (GENDER_BADGE[child.gender] || 'bg-gray-100 text-gray-500')}`}>{GENDER_LABEL[child.gender] || child.gender}</span>
                        </button>
                      ))}
                    </div>
                  )}
                  {!parent.children?.length && (
                    <button type="button" onClick={() => setForm({ ...form, categoryId: parent.id })}
                      className={`ml-3 px-2 py-1.5 rounded text-[10px] font-body text-left transition-all ${form.categoryId === parent.id ? 'bg-primary text-white font-bold shadow-sm' : 'bg-surface hover:bg-surface-container-low text-on-surface'}`}>{parent.name}</button>
                  )}
                </div>
              ))}
            </div>
            {form.categoryId && <p className="text-[10px] text-on-surface-variant mt-1">Selecionado: <strong>{getCategoryLabel(form.categoryId)}</strong></p>}
          </div>

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
