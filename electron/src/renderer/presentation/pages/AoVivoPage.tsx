import { useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { Radio, Loader2 } from 'lucide-react';
import { useToastStore } from '@/presentation/stores/toast-store';

export function AoVivoPage() {
  const [liveStreamUrl, setLiveStreamUrl] = useState('');
  const [liveStreamActive, setLiveStreamActive] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const toast = useToastStore((s) => s.addToast);

  useEffect(() => {
    newsApi.get('/admin/configuracoes').then((data) => {
      setLiveStreamUrl(data.liveStreamUrl || '');
      setLiveStreamActive(data.liveStreamActive || false);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await newsApi.put('/admin/configuracoes', { liveStreamUrl, liveStreamActive });
      toast('Configurações salvas!', 'success');
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  // Extrair ID do vídeo YouTube de diferentes formatos
  const getYoutubeId = (url: string): string | null => {
    if (!url) return null;
    const patterns = [
      /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
      /youtu\.be\/([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
    ];
    for (const p of patterns) {
      const m = url.match(p);
      if (m) return m[1];
    }
    return null;
  };

  const videoId = getYoutubeId(liveStreamUrl);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-on-surface-variant" size={24} /></div>;

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Radio size={20} className="text-primary" /></div>
        <div>
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Ao Vivo</h1>
          <p className="text-xs text-on-surface-variant">Configure a transmissão ao vivo do YouTube</p>
        </div>
      </div>

      <div className="card space-y-4 max-w-xl">
        <div>
          <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">URL do vídeo YouTube</label>
          <input
            value={liveStreamUrl}
            onChange={(e) => setLiveStreamUrl(e.target.value)}
            className="input-field"
            placeholder="https://www.youtube.com/watch?v=... ou youtu.be/..."
          />
          <p className="text-[10px] text-on-surface-variant mt-1">Cole o link de uma live ou vídeo do YouTube.</p>
        </div>

        {videoId && (
          <div>
            <p className="text-[10px] text-on-surface-variant mb-2">Preview:</p>
            <div className="aspect-video w-full rounded-lg overflow-hidden bg-black">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Preview YouTube"
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-outline-variant/30 pt-4">
          <div>
            <p className="text-sm font-bold text-on-surface">Transmissão ativa</p>
            <p className="text-[10px] text-on-surface-variant">Quando desligado, a página pública não mostra o player</p>
          </div>
          <button
            type="button"
            onClick={() => setLiveStreamActive(!liveStreamActive)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${liveStreamActive ? 'bg-primary' : 'bg-gray-300'}`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${liveStreamActive ? 'translate-x-6' : 'translate-x-1'}`} />
          </button>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-secondary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
