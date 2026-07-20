import { useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { Save, Search, Loader2 } from 'lucide-react';
import { ImageUpload } from '@/presentation/components/ui/ImageUpload';
import { Skeleton } from '@/presentation/components/ui/Skeleton';
import { useToastStore } from '@/presentation/stores/toast-store';

export function SeoPage() {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [initialSettings, setInitialSettings] = useState<any>(null);
  const toast = useToastStore((s) => s.addToast);

  const isDirty = initialSettings !== null && (
    JSON.stringify({ siteName: settings.siteName }) !==
    JSON.stringify({ siteName: initialSettings.siteName })
  ) || !!faviconFile;

  useEffect(() => {
    newsApi.get('/configuracoes').then((data) => { setSettings(data); setInitialSettings({ ...data }); }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (settings.siteName !== initialSettings.siteName) {
        await newsApi.patch('/admin/configuracoes', { siteName: settings.siteName });
      }
      if (faviconFile) {
        const fd = new FormData();
        fd.append('favicon', faviconFile);
        await newsApi.patch('/admin/settings/favicon', fd);
        setFaviconFile(null);
      }
      const updated = await newsApi.get('/configuracoes');
      setSettings(updated);
      setInitialSettings({ ...updated });
      toast('Configurações SEO salvas com sucesso!', 'success');
    } catch (err: any) { toast('Erro: ' + err.message, 'error'); }
    setSaving(false);
  };

  if (loading) return (
    <div className="fade-in">
      <Skeleton className="h-8 w-48 mb-6" />
      <div className="max-w-2xl">
        <div className="card p-6">
          <Skeleton className="h-6 w-40 mb-4" />
          <Skeleton className="h-10 w-full mb-4" />
          <Skeleton className="h-24 w-24 rounded-lg" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="fade-in">
      <h1 className="font-headline text-headline-md font-bold text-on-surface mb-6">SEO</h1>
      <div className="max-w-2xl">
        <div className="card p-6 space-y-6">
          <div>
            <h2 className="font-headline text-label-sm font-bold text-on-surface mb-4 flex items-center gap-2">
              <Search size={16} /> Identidade do Site
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Nome do Site (SEO)</label>
                <input
                  value={settings?.siteName || ''}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Rádio Coringão"
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Aparece no título das páginas, Open Graph e Twitter Cards.</p>
              </div>
              <div>
                <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Favicon</label>
                <ImageUpload
                  label="Favicon do Site"
                  currentImage={settings?.faviconUrl}
                  onUpload={(file) => setFaviconFile(file)}
                />
                <p className="text-[10px] text-on-surface-variant mt-1">Ícone que aparece na aba do navegador. Se não enviar, usa o padrão.</p>
              </div>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving || !isDirty} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
            {saving && <Loader2 size={16} className="animate-spin" />}
            <Save size={16} /> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
