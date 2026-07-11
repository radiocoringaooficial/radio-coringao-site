import { useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, ChevronRight, ChevronDown, GripVertical, Loader2 } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

export function MenuPage() {
  const [items, setItems] = useState<any[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ label: '', url: '', order: '0', parentId: '' });
  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastStore((s) => s.addToast);

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await newsApi.get('/admin/menu');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getNextOrder = (parentId?: string) => {
    const siblings = items.filter((i) => (parentId || null) === (i.parentId || null));
    if (siblings.length === 0) return '0';
    const maxOrder = Math.max(...siblings.map((i) => i.order || 0));
    return String(maxOrder + 1);
  };

  const openNew = (parentId?: string) => {
    setEditing(null);
    const newForm = { label: '', url: '', order: getNextOrder(parentId), parentId: parentId || '' };
    setForm(newForm);
    setInitialForm(newForm);
    setModalOpen(true);
  };

  const openEdit = (m: any) => {
    setEditing(m);
    const loaded = { label: m.label, url: m.url, order: String(m.order || 0), parentId: m.parentId || '' };
    setForm(loaded);
    setInitialForm(loaded);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const data = {
        ...form,
        order: Number(form.order),
        parentId: form.parentId || undefined,
      };
      if (editing) await newsApi.patch(`/admin/menu/${editing.id}`, data);
      else await newsApi.post('/admin/menu', data);
      toast('Salvo com sucesso!', 'success'); setModalOpen(false); load();
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar este item do menu?', async () => {
      try { await newsApi.delete(`/admin/menu/${id}`); toast('Item removido.', 'success'); load(); }
      catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    });
  };

  const NavbarPreview = () => (
    <div className="border border-outline-variant rounded-lg overflow-hidden bg-gray-800">
      <div className="flex items-center h-8 px-3 gap-4">
        <div className="w-5 h-5 bg-white/20 rounded shrink-0" />
        <div className="flex gap-3">
          {items.filter((i) => !i.parentId).map((item) => (
            <div key={item.id} className="relative group">
              <span className="text-[9px] text-white/80 font-headline cursor-pointer hover:text-white transition-colors">{item.label}</span>
              {item.children && item.children.length > 0 && (
                <div className="absolute top-full left-0 pt-1 hidden group-hover:block z-10">
                  <div className="bg-white rounded-lg shadow-lg border border-outline-variant p-2 min-w-[120px]">
                    {item.children.map((child: any) => (
                      <div key={child.id} className="px-2 py-1 text-[8px] text-on-surface hover:bg-surface-container-low rounded cursor-pointer">{child.label}</div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
          <div className="w-4 h-4 bg-white/20 rounded" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-headline text-headline-md font-bold text-on-surface">Menu de Navegação</h1>
        <button onClick={() => openNew()} className="btn-secondary flex items-center gap-2"><Plus size={16} /> Novo Item</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-2">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="card flex items-center gap-3">
                  <Skeleton className="w-4 h-4 shrink-0" />
                  <Skeleton className="w-6 h-6 shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                  <Skeleton className="w-12 h-5 rounded" />
                  <div className="flex gap-1 shrink-0">
                    <Skeleton className="w-7 h-7 rounded" />
                    <Skeleton className="w-7 h-7 rounded" />
                    <Skeleton className="w-7 h-7 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {items.map((item, i) => {
                const hasChildren = item.children && item.children.length > 0;
                const isExpanded = expandedIds.has(item.id);
                return (
                  <div key={item.id} className="slide-up" style={{ animationDelay: `${i * 30}ms` }}>
                    <div className="card flex items-center gap-3">
                      <GripVertical size={14} className="text-on-surface-variant/30 shrink-0" />
                      {hasChildren ? (
                        <button onClick={() => { const next = new Set(expandedIds); isExpanded ? next.delete(item.id) : next.add(item.id); setExpandedIds(next); }}
                          className="p-0.5 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors">
                          {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      ) : <div className="w-6" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-headline text-sm font-bold text-on-surface">{item.label}</p>
                        <p className="text-xs text-on-surface-variant font-mono truncate">{item.url}</p>
                      </div>
                      {hasChildren && <span className="text-[10px] text-on-surface-variant">{item.children.length} sub{item.children.length === 1 ? 'item' : 'itens'}</span>}
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="badge bg-surface-container text-on-surface-variant text-[10px]">#{item.order}</span>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        <button onClick={() => openNew(item.id)} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors" title="Adicionar subitem"><Plus size={14} /></button>
                        <button onClick={() => openEdit(item)} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant transition-colors"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500 transition-colors"><Trash2 size={14} /></button>
                      </div>
                    </div>
                    {hasChildren && isExpanded && (
                      <div className="ml-8 mt-1 space-y-1 fade-in">
                        {item.children.map((child: any) => (
                          <div key={child.id} className="card flex items-center gap-3 py-2">
                            <GripVertical size={12} className="text-on-surface-variant/30 shrink-0" />
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-sm text-on-surface">{child.label}</p>
                              <p className="text-[10px] text-on-surface-variant font-mono truncate">{child.url}</p>
                            </div>
                            <span className="badge bg-surface-container text-on-surface-variant text-[10px]">#{child.order}</span>
                            <div className="flex items-center gap-0.5 shrink-0">
                              <button onClick={() => openEdit(child)} className="p-1.5 rounded hover:bg-surface-container-low text-on-surface-variant"><Pencil size={12} /></button>
                              <button onClick={() => handleDelete(child.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500"><Trash2 size={12} /></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              {items.length === 0 && <p className="text-on-surface-variant text-center py-8">Nenhum item de menu cadastrado.</p>}
            </>
          )}
        </div>

        <div className="lg:col-span-1">
          <div className="card lg:sticky lg:top-6">
            <h3 className="font-headline text-label-sm font-bold text-on-surface mb-3">Pré-visualização da Navbar</h3>
            <NavbarPreview />
          </div>
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Item do Menu' : 'Novo Item do Menu'}>
        <div className="space-y-4">
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome do Item *</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input-field" placeholder="Ex: Futebol, Notícias" /></div>
          <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">URL *</label><input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} className="input-field" placeholder="Ex: /esportes/futebol" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Ordem</label><input type="number" inputMode="numeric" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value.replace(/^0+(?=\d)/, '') })} className="input-field" /></div>
          </div>
          {form.parentId && <p className="text-xs text-on-surface-variant">Subitem de: <strong>{items.find((m) => m.id === form.parentId)?.label || form.parentId}</strong></p>}
          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            Salvar
          </button>
        </div>
      </Modal>
    </div>
  );
}
