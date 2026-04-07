import { create } from 'zustand'
import api from '../lib/api'

interface User {
  id: number
  email: string
  nome: string
  perfil: string
  instituicaoId?: number | null
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  login: (email: string, senha: string) => Promise<void>
  logout: () => void
  checkAuth: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,

  checkAuth: () => {
    const token = localStorage.getItem('token')
    const userStr = localStorage.getItem('user')
    
    if (token && userStr) {
      set({ token, user: JSON.parse(userStr) })
    }
  },

  login: async (email: string, senha: string) => {
    set({ loading: true })
    try {
      console.log('🔐 Tentando fazer login:', { email, apiUrl: api.defaults.baseURL })
      const response = await api.post('/auth/login', { email, senha })
      console.log('✅ Login bem-sucedido:', response.data)
      
      const { token, user } = response.data
      
      if (!token || !user) {
        throw new Error('Resposta inválida do servidor')
      }
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({ user, token, loading: false })
    } catch (error: any) {
      console.error('❌ Erro no login:', error)
      console.error('Detalhes:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        baseURL: error.config?.baseURL
      })
      set({ loading: false })
      
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          'Erro ao fazer login. Verifique suas credenciais.'
      throw new Error(errorMessage)
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))

