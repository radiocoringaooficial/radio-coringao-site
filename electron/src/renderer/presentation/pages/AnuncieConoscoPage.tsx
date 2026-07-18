import { useEffect, useState } from 'react';
import { newsApi } from '@/infrastructure/api/client';
import { Megaphone, Plus, Trash2, Loader2 } from 'lucide-react';
import { useToastStore } from '@/presentation/stores/toast-store';

export function AnuncieConoscoPage() {
  const [advertiseIntro, setAdvertiseIntro] = useState('');
  const [advertiseBullets, setAdvertiseBullets] = useState<string[]>([]);
  const [advertiseEmail, setAdvertiseEmail] = useState('');
  const [advertisePhone, setAdvertisePhone] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newBullet, setNewBullet] = useState('');
  const toast = useToastStore((s) => s.addToast);

  useEffect(() => {
    newsApi.get('/admin/configuracoes').then((data) => {
      setAdvertiseIntro(data.advertiseIntro || '');
      setAdvertiseBullets(data.advertiseBullets || []);
      setAdvertiseEmail(data.advertiseEmail || '');
      setAdvertisePhone(data.advertisePhone || '');
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await newsApi.put('/admin/configuracoes', { advertiseIntro, advertiseBullets, advertiseEmail, advertisePhone });
      toast('Configurações salvas!', 'success');
    } catch (e: any) {
      toast('Erro: ' + e.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const addBullet = () => {
    const text = newBullet.trim();
    if (!text) return;
    setAdvertiseBullets([...advertiseBullets, text]);
    setNewBullet('');
  };

  const removeBullet = (index: number) => {
    setAdvertiseBullets(advertiseBullets.filter((_, i) => i !== index));
  };

  const updateBullet = (index: number, value: string) => {
    const updated = [...advertiseBullets];
    updated[index] = value;
    setAdvertiseBullets(updated);
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-on-surface-variant" size={24} /></div>;

  return (
    <div className="fade-in space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-primary/10"><Megaphone size={20} className="text-primary" /></div>
        <div>
          <h1 className="font-headline text-headline-md font-bold text-on-surface">Anuncie Conosco</h1>
          <p className="text-xs text-on-surface-variant">Configure o conteúdo da página de publicidade</p>
        </div>
      </div>

      <div className="card space-y-4 max-w-2xl">
        <div>
          <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Parágrafo introdutório</label>
          <textarea
            value={advertiseIntro}
            onChange={(e) => setAdvertiseIntro(e.target.value)}
            className="input-field h-24 resize-none"
            placeholder="Texto principal sobre por que anunciar..."
          />
        </div>

        <div>
          <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Destaques (bullets)</label>
          <div className="space-y-2">
            {advertiseBullets.map((bullet, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={bullet}
                  onChange={(e) => updateBullet(i, e.target.value)}
                  className="input-field flex-1 text-sm"
                />
                <button type="button" onClick={() => removeBullet(i)} className="p-2 text-on-surface-variant hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-2">
            <input
              value={newBullet}
              onChange={(e) => setNewBullet(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addBullet(); } }}
              className="input-field flex-1 text-sm"
              placeholder="Novo destaque..."
            />
            <button type="button" onClick={addBullet} className="btn-secondary px-3 text-sm">
              <Plus size={14} />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">E-mail</label>
            <input value={advertiseEmail} onChange={(e) => setAdvertiseEmail(e.target.value)} className="input-field" placeholder="contato@exemplo.com" />
          </div>
          <div>
            <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Telefone</label>
            <input value={advertisePhone} onChange={(e) => setAdvertisePhone(e.target.value)} className="input-field" placeholder="(11) 99999-9999" />
          </div>
        </div>

        <button onClick={handleSave} disabled={saving} className="btn-secondary w-full flex items-center justify-center gap-2">
          {saving && <Loader2 size={16} className="animate-spin" />}
          Salvar
        </button>
      </div>
    </div>
  );
}
