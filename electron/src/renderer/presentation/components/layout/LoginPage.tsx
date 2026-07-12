import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/presentation/stores/auth-store';
import { setAuthToken, SPORTS_NEWS } from '@/infrastructure/api/client';
import { LogIn, Loader2 } from 'lucide-react';

export function LoginPage() {
  const [email, setEmail] = useState('admin@radiocoringao.com');
  const [password, setPassword] = useState('RadioCoringao@2026');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) { setError('Informe o e-mail.'); return; }
    if (!password.trim()) { setError('Informe a senha.'); return; }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${SPORTS_NEWS}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Credenciais inválidas.');
      login(data.accessToken || data.token, {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role,
        avatar: data.user.avatar,
      });
      setAuthToken(data.accessToken || data.token);
      navigate('/');
    } catch (err: any) {
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        setError('Não foi possível conectar ao servidor. Verifique se a API está rodando.');
      } else {
        setError(err.message || 'Erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md fade-in">
        <div className="text-center mb-8">
          <h1 className="font-headline text-headline-md font-bold text-primary mb-2">Rádio Coringão</h1>
          <p className="font-body text-body-md text-on-surface-variant">Painel Administrativo</p>
        </div>
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">E-mail</label>
              <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }} className={`input-field ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}`} required />
            </div>
            <div>
              <label className="block font-headline text-label-sm font-bold text-on-surface mb-1.5">Senha</label>
              <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); setError(''); }} className={`input-field ${error ? 'border-red-400 focus:ring-red-200 focus:border-red-400' : ''}`} required />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                <span className="shrink-0">✕</span>
                <span>{error}</span>
              </div>
            )}
            <button type="submit" disabled={loading} className="btn-secondary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? <><Loader2 size={16} className="animate-spin" /> Entrando...</> : <><LogIn size={16} /> Entrar</>}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
