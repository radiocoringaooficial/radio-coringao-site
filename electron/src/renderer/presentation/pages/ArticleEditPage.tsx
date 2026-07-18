import { useRef } from 'react';
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { newsApi } from '@/infrastructure/api/client';
import { ImageUpload } from '@/presentation/components/ui/ImageUpload';
import { RichTextEditor } from '@/presentation/components/ui/RichTextEditor';
import { ArrowLeft, Save, LayoutList, FileText, Loader2, ChevronDown, FolderOpen, CalendarClock } from 'lucide-react';
import { Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';

const CARD_POSITIONS = [
  { value: 0, label: 'Sem posição' },
  { value: 1, label: 'Card 1 — Hero Principal' },
  { value: 2, label: 'Card 2 — Lateral Superior' },
  { value: 3, label: 'Card 3 — Lateral Inferior' },
  { value: 4, label: 'Card 4 — Grade Linha 1' },
  { value: 5, label: 'Card 5 — Grade Linha 1' },
  { value: 6, label: 'Card 6 — Grade Linha 1' },
  { value: 7, label: 'Card 7 — Grade Linha 2' },
  { value: 8, label: 'Card 8 — Grade Linha 2' },
  { value: 9, label: 'Card 9 — Grade Linha 2' },
  { value: 10, label: 'Card 10 — Grade Linha 3' },
  { value: 11, label: 'Card 11 — Grade Linha 3' },
  { value: 12, label: 'Card 12 — Grade Linha 3' },
];

const GENDER_MAP: Record<string, string> = { MALE: 'M', FEMALE: 'F', MIXED: 'Misto' };
const GENDER_COLOR: Record<string, string> = { MALE: 'bg-blue-50 text-blue-600', FEMALE: 'bg-pink-50 text-pink-600', MIXED: 'bg-purple-50 text-purple-600' };

/** Hora atual formatada para o input datetime-local (horário local do browser) */
function getLocalNow(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

function CategoryDropdown({ value, onChange, categories }: { value: string; onChange: (id: string) => void; categories: any[] }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef<HTMLButtonElement>(null);

  const parents = categories.filter((c: any) => !c.parentId);
  const allFlat = categories.flatMap((c: any) => [c, ...(c.children || [])]);
  const selected = allFlat.find((c: any) => c.id === value);

  const toggle = () => {
    if (open) { setOpen(false); return; }
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 4, left: r.left, width: r.width });
    }
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-cat-dropdown]')) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <>
      <button type="button" ref={btnRef} onClick={toggle}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-outline-variant/40 hover:border-primary/40 transition-colors text-left">
        <FolderOpen size={14} className="text-on-surface-variant/50 shrink-0" />
        <span className={`flex-1 text-sm ${selected ? 'text-on-surface font-medium' : 'text-on-surface-variant'}`}>
          {selected ? selected.name : 'Selecione uma categoria...'}
        </span>
        {selected?.gender && (
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${GENDER_COLOR[selected.gender] || 'bg-gray-100 text-gray-500'}`}>
            {GENDER_MAP[selected.gender] || selected.gender}
          </span>
        )}
        <ChevronDown size={14} className={`text-on-surface-variant/40 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && createPortal(
        <div data-cat-dropdown className="fixed z-[9999] bg-white rounded-lg shadow-xl border border-outline-variant" style={{ top: pos.top, left: pos.left, width: pos.width, maxHeight: '320px' }}>
          <div className="overflow-y-auto overscroll-contain" style={{ maxHeight: '300px' }}>
            <button type="button" onClick={() => { onChange(''); setOpen(false); }}
              className={`w-full text-left px-3 py-2.5 text-xs transition-colors ${!value ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
              Selecione uma categoria...
            </button>
            {parents.map((parent: any) => (
              <div key={parent.id}>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-surface-container-low/50 border-t border-outline-variant/20">
                  <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: parent.color || '#6366f1' }} />
                  <span className="font-headline text-[10px] font-bold text-on-surface uppercase tracking-wide">{parent.name}</span>
                  {parent.gender && <span className={`text-[8px] px-1 py-0.5 rounded font-bold ${GENDER_COLOR[parent.gender] || 'bg-gray-100 text-gray-500'}`}>{GENDER_MAP[parent.gender] || parent.gender}</span>}
                </div>
                {parent.children && parent.children.length > 0 ? (
                  parent.children.map((child: any) => (
                    <button key={child.id} type="button" onClick={() => { onChange(child.id); setOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2 pl-6 text-left transition-colors text-xs ${value === child.id ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}>
                      <div className="w-1 h-1 rounded-full bg-on-surface-variant/30 shrink-0" />
                      <span className="flex-1">{child.name}</span>
                      {child.gender && (
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${value === child.id ? 'bg-primary/10 text-primary' : (GENDER_COLOR[child.gender] || 'bg-gray-100 text-gray-500')}`}>
                          {GENDER_MAP[child.gender] || child.gender}
                        </span>
                      )}
                    </button>
                  ))
                ) : (
                  <button type="button" onClick={() => { onChange(parent.id); setOpen(false); }}
                    className={`w-full flex items-center gap-2 px-3 py-2 pl-6 text-left transition-colors text-xs ${value === parent.id ? 'bg-primary/5 text-primary font-bold' : 'text-on-surface hover:bg-surface-container-low'}`}>
                    <div className="w-1 h-1 rounded-full bg-on-surface-variant/30 shrink-0" />
                    <span className="flex-1">{parent.name}</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function ArticleEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToastStore((s) => s.addToast);
  const isNew = !id;
  const [loading, setLoading] = useState(!isNew);

  // Hora local do browser, atualizada a cada 30s
  const [nowLocal, setNowLocal] = useState(() => getLocalNow());
  useEffect(() => {
    const timer = setInterval(() => setNowLocal(getLocalNow()), 30_000);
    return () => clearInterval(timer);
  }, []);

  const [form, setForm] = useState({
    title: '', subtitle: '', content: '', excerpt: '', categoryId: '', status: 'DRAFT', type: 'NEWS',
    isFeatured: false, order: '0',
    coverImageAlt: '', coverImageCredit: '',
    scheduledAt: '',
  });

  const [initialForm, setInitialForm] = useState<typeof form | null>(null);
  // Agendamento só trava se o artigo JÁ estava publicado quando carregou
  const wasAlreadyPublished = !isNew && initialForm?.status === 'PUBLISHED';
  const [categories, setCategories] = useState<any[]>([]);
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    newsApi.get('/categorias').then((data) => {
      const flat = Array.isArray(data) ? data : [];
      // Construir estrutura aninhada: categorias sem parentId viram pais, filhos são agrupados
      const byId = new Map(flat.map((c: any) => [c.id, { ...c, children: [] as any[] }]));
      const parents: any[] = [];
      for (const cat of flat) {
        const node = byId.get(cat.id)!;
        if (cat.parentId && byId.has(cat.parentId)) {
          byId.get(cat.parentId)!.children.push(node);
        } else {
          parents.push(node);
        }
      }
      setCategories(parents);
    }).catch(() => {});
    if (id) {
      setLoading(true);
      newsApi.get(`/admin/articles/${id}`).then((a) => {
        let scheduledAtStr = '';
        if (a.scheduledAt) {
          const d = new Date(a.scheduledAt);
          if (!isNaN(d.getTime())) {
            scheduledAtStr = d.toISOString().slice(0, 16);
          }
        }
        const loaded = {
          title: a.title || '', subtitle: a.subtitle || '', content: a.content || '', excerpt: a.excerpt || '',
          categoryId: a.categoryId || '', status: a.status || 'DRAFT', type: a.type || 'NEWS',
          isFeatured: a.isFeatured || false,
          order: String(a.order || 0), coverImageAlt: a.coverImageAlt || '', coverImageCredit: a.coverImageCredit || '',
          scheduledAt: scheduledAtStr,
        };
        setForm(loaded);
        setInitialForm({ ...loaded });
        if (a.coverImage) setCoverPreview(a.coverImage);
      }).catch(() => {}).finally(() => setLoading(false));
    }
  }, [id]);

  const isDirty = isNew
    ? form.title.trim().length > 0
    : (initialForm !== null && (JSON.stringify(form) !== JSON.stringify(initialForm) || coverImage !== null));

  const handleCoverChange = (file: File) => {
    setCoverImage(file);
    const reader = new FileReader();
    reader.onload = () => setCoverPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.status === 'PUBLISHED' && !coverImage && !coverPreview) {
      toast('Imagem de capa é obrigatória para publicar.', 'error');
      return;
    }
    if (form.scheduledAt) {
      if (form.scheduledAt <= nowLocal) {
        toast('A data de agendamento deve ser no futuro.', 'error');
        return;
      }
    }
    setSaving(true);
    const fd = new FormData();
    fd.append('title', form.title);
    fd.append('subtitle', form.subtitle);
    fd.append('content', form.content);
    fd.append('excerpt', form.excerpt);
    fd.append('categoryId', form.categoryId);
    fd.append('status', form.status);
    fd.append('type', form.type);
    fd.append('isFeatured', String(form.isFeatured));
    fd.append('order', form.order);
    fd.append('coverImageAlt', form.coverImageAlt);
    fd.append('coverImageCredit', form.coverImageCredit);
    if (form.scheduledAt && form.status !== 'PUBLISHED') {
      fd.append('scheduledAt', new Date(form.scheduledAt).toISOString());
    } else {
      fd.append('scheduledAt', '');
    }
    if (coverImage) fd.append('coverImage', coverImage);
    try {
      if (isNew) await newsApi.post('/admin/materias', fd);
      else await newsApi.patch(`/admin/articles/${id}`, fd);
      toast('Salvo com sucesso!', 'success');
      setTimeout(() => navigate('/materias'), 1000);
    } catch (e: any) { toast('Erro: ' + e.message, 'error'); }
    setSaving(false);
  };

  if (loading) return (
    <div className="fade-in">
      <Skeleton className="h-4 w-16 mb-4" />
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4 p-6">
            <div><Skeleton className="h-4 w-12 mb-1.5" /><Skeleton className="h-10 w-full" /></div>
            <div><Skeleton className="h-4 w-16 mb-1.5" /><Skeleton className="h-10 w-full" /></div>
            <div><Skeleton className="h-4 w-14 mb-1.5" /><Skeleton className="h-16 w-full" /></div>
          </div>
          <div className="card p-6">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-64 w-full rounded-lg" />
          </div>
        </div>
        <div className="space-y-4">
          <div className="card p-6 space-y-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="card p-6">
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-40 w-full rounded-lg" />
          </div>
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <button onClick={() => navigate('/materias')} className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface mb-4 text-sm"><ArrowLeft size={16} /> Voltar</button>
      <h1 className="font-headline text-headline-md font-bold text-on-surface mb-6">{isNew ? 'Novo Artigo' : 'Editar Artigo'}</h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Conteúdo principal */}
        <div className="lg:col-span-2 space-y-4">
          <div className="card space-y-4">
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Título *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" required placeholder="Título do artigo" /></div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Subtítulo</label><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" placeholder="Linha fina / chamada" /></div>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Excerpt</label><textarea value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} className="input-field h-16 resize-none" placeholder="Resumo para listagens e SEO" /></div>
          </div>

          {/* Editor CMS */}
          <div className="card">
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-2">Conteúdo *</label>
            <div className="border border-outline-variant rounded-lg overflow-hidden">
              <RichTextEditor content={form.content} onChange={(html) => setForm({ ...form, content: html })} placeholder="Escreva o conteúdo do artigo aqui..." />
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Publicação */}
          <div className="card space-y-4">
            <h3 className="font-headline text-label-sm font-bold text-on-surface">Publicação</h3>
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Status</label>
              <select value={form.status} onChange={(e) => {
                const newStatus = e.target.value;
                setForm((prev) => ({ ...prev, status: newStatus, scheduledAt: newStatus === 'PUBLISHED' ? '' : prev.scheduledAt }));
              }} className="select-field">
                <option value="DRAFT">Rascunho</option><option value="REVIEW">Revisão</option><option value="PUBLISHED">Publicado</option>
              </select>
            </div>

            {/* Agendamento */}
            <div className="border-t border-outline-variant/30 pt-4">
              <div className="flex items-center gap-2 mb-1.5">
                <CalendarClock size={14} className={wasAlreadyPublished ? 'text-on-surface-variant/40' : 'text-on-surface-variant'} />
                <label className={`font-headline text-label-sm font-bold ${wasAlreadyPublished ? 'text-on-surface-variant/40' : 'text-on-surface'}`}>Agendamento</label>
              </div>
              <p className="text-[10px] text-on-surface-variant mb-2">
                {wasAlreadyPublished ? 'Agendamento não disponível para artigos já publicados.' : 'Agendar para publicação automática no futuro.'}
              </p>
              <input
                type="datetime-local"
                value={form.scheduledAt}
                min={nowLocal}
                disabled={wasAlreadyPublished}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val && val <= nowLocal) {
                    toast('Selecione uma data e hora futuras.', 'error');
                    return;
                  }
                  setForm({ ...form, scheduledAt: val });
                }}
                className={`input-field text-sm ${wasAlreadyPublished ? 'opacity-40 cursor-not-allowed' : ''}`}
              />
              {form.scheduledAt && new Date(form.scheduledAt) > new Date() && form.status !== 'PUBLISHED' && (
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 p-2">
                  <CalendarClock size={12} className="text-amber-600 shrink-0" />
                  <div>
                    <p className="text-[10px] font-bold text-amber-700">Artigo será publicado automaticamente</p>
                    <p className="text-[9px] text-amber-600">
                      {new Date(form.scheduledAt).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
                      {' às '}
                      {new Date(form.scheduledAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              )}
              {form.scheduledAt && !wasAlreadyPublished && (
                <button
                  type="button"
                  onClick={() => setForm({ ...form, scheduledAt: '' })}
                  className="mt-1.5 text-[10px] text-on-surface-variant hover:text-red-500 transition-colors"
                >
                  Remover agendamento
                </button>
              )}
            </div>

            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Categoria *</label>
              <CategoryDropdown value={form.categoryId} onChange={(id) => setForm({ ...form, categoryId: id })} categories={categories} />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={form.isFeatured} onChange={(e) => {
                const checked = e.target.checked;
                setForm({ ...form, isFeatured: checked, order: checked ? (Number(form.order) > 0 ? form.order : '1') : '0' });
              }} className="rounded" /><span className="text-sm">Destaque na Home</span></label>
            </div>
          </div>

          {/* Posição na Home */}
          <div className={`card space-y-3 transition-opacity ${form.isFeatured ? '' : 'opacity-40 pointer-events-none'}`}>
            <div className="flex items-center gap-2">
              <LayoutList size={14} className="text-on-surface-variant" />
              <h3 className="font-headline text-label-sm font-bold text-on-surface">Posição na Home</h3>
              {!form.isFeatured && <span className="text-[10px] text-on-surface-variant">(Ative "Destaque na Home" primeiro)</span>}
            </div>
            <div className="grid grid-cols-2 gap-2">
              {CARD_POSITIONS.map((pos) => (
                <button key={pos.value} type="button" onClick={() => setForm({ ...form, order: String(pos.value) })}
                  className={`p-2 rounded-lg border-2 text-left transition-all ${form.order === String(pos.value) ? 'border-primary bg-primary/5' : 'border-outline-variant hover:border-primary/30'}`}>
                  <p className="text-[10px] font-headline font-bold text-on-surface">{pos.value === 0 ? 'Sem posição' : `#${pos.value}`}</p>
                  <p className="text-[9px] text-on-surface-variant">{pos.label}</p>
                </button>
              ))}
            </div>
            {Number(form.order) > 0 && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-2">
                <p className="text-[10px] font-bold text-primary">Card #{form.order} selecionado</p>
                <p className="text-[9px] text-on-surface-variant">{CARD_POSITIONS.find((p) => p.value === Number(form.order))?.label}</p>
              </div>
            )}
          </div>

          {/* Imagem de Capa */}
          <div className="card space-y-3">
            <div className="flex items-center gap-2">
              <FileText size={14} className="text-on-surface-variant" />
              <h3 className="font-headline text-label-sm font-bold text-on-surface">Imagem de Capa</h3>
            </div>
            <ImageUpload currentImage={coverPreview || undefined} onUpload={handleCoverChange} />
            <div><label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Crédito da imagem</label><input value={form.coverImageCredit} onChange={(e) => setForm({ ...form, coverImageCredit: e.target.value })} className="input-field" placeholder="Foto: Nome" /></div>

            {/* Preview do Card */}
            {coverPreview && (
              <div>
                <p className="font-headline text-[10px] font-bold text-on-surface-variant mb-1.5">Preview do Card na Home</p>
                <div className="border border-outline-variant rounded-lg overflow-hidden bg-white">
                  <img src={coverPreview} alt="" className="w-full h-32 object-cover" />
                  <div className="p-2.5">
                    <p className="font-headline text-xs font-bold text-on-surface truncate">{form.title || 'Título do artigo'}</p>
                    {form.subtitle && <p className="text-[9px] text-on-surface-variant truncate mt-0.5">{form.subtitle}</p>}
                    {Number(form.order) > 0 && <span className="inline-block mt-1 badge bg-primary/10 text-primary text-[8px]">Card #{form.order}</span>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
}
