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
      const response = await api.post('/auth/login', { email, senha })
      const { token, user } = response.data
      
      localStorage.setItem('token', token)
      localStorage.setItem('user', JSON.stringify(user))
      
      set({ user, token, loading: false })
    } catch (error: any) {
      set({ loading: false })
      throw new Error(error.response?.data?.message || 'Erro ao fazer login')
    }
  },

  logout: () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    set({ user: null, token: null })
  },
}))

