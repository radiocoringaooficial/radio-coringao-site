import { useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Modal } from '@/presentation/components/ui/Modal';
import { TableSkeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';
import { confirm } from '@/presentation/stores/dialog-store';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  isActive: boolean;
  order: number;
  _count?: { articles: number };
  createdAt: string;
}

const ITEMS_PER_PAGE = 10;

const ICON_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'football', label: 'Futebol' },
  { value: 'basketball', label: 'Basquete' },
  { value: 'futsal', label: 'Futsal' },
  { value: 'mma', label: 'MMA' },
  { value: 'newspaper', label: 'Notícias' },
  { value: 'swimming', label: 'Natação' },
  { value: 'racing', label: 'Automobilismo' },
  { value: 'trophy', label: 'Troféu' },
  { value: 'calendar', label: 'Eventos' },
  { value: 'football-international', label: 'Futebol Internacional' },
];

const EMPTY_FORM = { name: '', description: '', color: '#1a1a1a', icon: '', order: '0', isActive: true };

export function CategoriesPage() {
  const [items, setItems] = useState<Category[]>([]);
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [initialForm, setInitialForm] = useState<typeof EMPTY_FORM | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastStore((s) => s.addToast);

  const isDirty = initialForm !== null && JSON.stringify(form) !== JSON.stringify(initialForm);

  const load = async () => {
    try {
      setLoading(true);
      const data = await newsApi.get('/admin/categorias');
      setItems(Array.isArray(data) ? data : []);
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const openNew = () => {
    setEditing(null);
    const newForm = { name: '', description: '', color: '#1a1a1a', icon: '', order: '0', isActive: true };
    setForm(newForm);
    setInitialForm(newForm);
    setModalOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditing(cat);
    const loaded = {
      name: cat.name,
      description: cat.description || '',
      color: cat.color || '#1a1a1a',
      icon: cat.icon || '',
      order: String(cat.order),
      isActive: cat.isActive,
    };
    setForm(loaded);
    setInitialForm(loaded);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast('Nome é obrigatório.', 'error');
      return;
    }

    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      color: form.color || null,
      icon: form.icon || null,
      order: parseInt(form.order) || 0,
      isActive: form.isActive,
    };

    try {
      setSaving(true);
      if (editing) {
        await newsApi.patch(`/admin/categorias/${editing.id}`, payload);
      } else {
        await newsApi.post('/admin/categorias', payload);
      }
      toast('Salvo com sucesso!', 'success');
      setModalOpen(false);
      load();
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    confirm('Tem certeza que deseja deletar esta categoria? Artigos vinculados precisarão ser reatribuídos.', async () => {
      try {
        await newsApi.delete(`/admin/categorias/${id}`);
        toast('Categoria removida.', 'success');
        load();
      } catch (e: any) {
        toast('Erro: ' + e.message, 'error');
      }
    });
  };

  const handleToggleActive = async (cat: Category) => {
    try {
      await newsApi.patch(`/admin/categorias/${cat.id}`, { isActive: !cat.isActive });
      load();
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    }
  };

  return (
    <div className="fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Categorias</h1>
          <p className="font-body text-body-sm text-on-surface-variant mt-1">Gerencie as categorias de conteúdo do portal</p>
        </div>
        <button onClick={openNew} className="btn-secondary flex items-center gap-2">
          <Plus size={16} /> Nova Categoria
        </button>
      </div>

      {loading ? (
        <TableSkeleton rows={5} cols={6} />
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant">
                <th className="text-left py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Nome</th>
                <th className="text-left py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Slug</th>
                <th className="text-center py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Ordem</th>
                <th className="text-center py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Artigos</th>
                <th className="text-center py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Status</th>
                <th className="text-right py-3 px-4 font-headline text-label-sm font-bold text-on-surface-variant">Ações</th>
              </tr>
            </thead>
            <tbody>
              {paginatedItems.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-on-surface-variant font-body">
                    Nenhuma categoria cadastrada.
                  </td>
                </tr>
              )}
              {paginatedItems.map((cat) => (
                <tr key={cat.id} className="table-row">
                  <td className="py-3 px-4 font-body text-sm font-bold text-on-surface">{cat.name}</td>
                  <td className="py-3 px-4 font-body text-sm text-on-surface-variant font-mono">{cat.slug}</td>
                  <td className="py-3 px-4 font-body text-sm text-on-surface-variant text-center">{cat.order}</td>
                  <td className="py-3 px-4 font-body text-sm text-on-surface-variant text-center">
                    {cat._count?.articles ?? 0}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleToggleActive(cat)}
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-colors ${
                        cat.isActive
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${cat.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                      {cat.isActive ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end gap-1">
                      <button onClick={() => openEdit(cat)} className="p-1.5 rounded hover:bg-surface-container-low" title="Editar">
                        <Pencil size={14} />
                      </button>
                      <button onClick={() => handleDelete(cat.id)} className="p-1.5 rounded hover:bg-gray-100 text-gray-500" title="Deletar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-outline-variant">
              <p className="font-body text-sm text-on-surface-variant">
                {items.length} categoria{(items.length !== 1) ? 's' : ''} — Página {page} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-8 h-8 rounded text-sm font-bold transition-colors ${
                      p === page
                        ? 'bg-primary text-white'
                        : 'hover:bg-surface-container-low text-on-surface-variant'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-1.5 rounded hover:bg-surface-container-low disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Editar Categoria' : 'Nova Categoria'}>
        <div className="space-y-4">
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="input-field"
              placeholder="Ex: Futebol, Basquete, Notícias"
            />
          </div>

          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Ordem</label>
            <input
              type="number"
              inputMode="numeric"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value.replace(/^0+(?=\d)/, '') })}
              className="input-field"
              placeholder="0"
            />
            <p className="font-body text-xs text-on-surface-variant mt-1">Define a posição no menu (menor = primeiro)</p>
          </div>

          <div className="flex items-center gap-3">
            <label className="font-headline text-label-sm font-bold text-on-surface">Ativo</label>
            <button
              type="button"
              onClick={() => setForm({ ...form, isActive: !form.isActive })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                form.isActive ? 'bg-primary' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  form.isActive ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2">
            {saving && <Loader2 size={16} className="animate-spin" />}
            {editing ? 'Salvar Alterações' : 'Criar Categoria'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
