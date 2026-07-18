import { create } from 'zustand';
import { setAuthToken } from '@/infrastructure/api/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar?: string;
  position?: string;
  cargos?: string[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  login: (token, user) => {
    sessionStorage.setItem('auth-token', token);
    sessionStorage.setItem('auth-user', JSON.stringify(user));
    setAuthToken(token);
    set({ token, user, isAuthenticated: true });
  },
  logout: () => {
    sessionStorage.removeItem('auth-token');
    sessionStorage.removeItem('auth-user');
    setAuthToken('');
    set({ token: null, user: null, isAuthenticated: false });
  },
  updateUser: (partial) =>
    set((state) => {
      const merged = state.user ? { ...state.user, ...partial } : null;
      if (merged) sessionStorage.setItem('auth-user', JSON.stringify(merged));
      return { user: merged };
    }),
}));

// Check session on load
const savedToken = sessionStorage.getItem('auth-token');
const savedUser = sessionStorage.getItem('auth-user');
if (savedToken && savedUser) {
  try {
    useAuthStore.getState().login(savedToken, JSON.parse(savedUser));
  } catch {
    sessionStorage.clear();
    setAuthToken('');
  }
}
