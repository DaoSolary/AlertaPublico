import { create } from 'zustand';
import api from '../lib/api';

interface User {
  id: number;
  email: string;
  nome: string;
  perfil: string;
  instituicaoId?: number | null;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  // 🔍 Verifica sessão salva
  checkAuth: () => {
    try {
      const token = localStorage.getItem('token');
      const userStr = localStorage.getItem('user');

      if (token && userStr) {
        set({ token, user: JSON.parse(userStr) });
      }
    } catch (error) {
      console.warn('Erro ao recuperar sessão:', error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  // 🔐 Login
  login: async (email: string, senha: string) => {
    set({ loading: true });

    try {
      console.log('🔐 Login request:', {
        email,
        url: api.defaults.baseURL,
      });

      // ✅ CORREÇÃO AQUI (rota certa)
      const response = await api.post('/api/auth/login', {
        email,
        senha,
      });

      const { token, user } = response.data;

      if (!user) {
        throw new Error('Resposta inválida do servidor');
      }

      // 💾 Salvar localmente (opcional se usar cookies)
      if (token) {
        localStorage.setItem('token', token);
      }

      localStorage.setItem('user', JSON.stringify(user));

      set({
        user,
        token: token || null,
        loading: false,
      });

      console.log('✅ Login OK');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);

      set({ loading: false });

      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        'Erro ao fazer login';

      throw new Error(errorMessage);
    }
  },

  // 🚪 Logout
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    set({
      user: null,
      token: null,
    });

    // opcional: chamar backend
    // api.post('/api/auth/logout');
  },
}));