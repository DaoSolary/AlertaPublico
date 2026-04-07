import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import api from '../lib/api'

interface Notificacao {
  id: number
  titulo: string
  mensagem?: string
  tipo: string
  status?: string
  createdAt: string
  alertaId: number
}

// Função para tocar som de notificação
const playNotificationSound = () => {
  try {
    // Criar contexto de áudio
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    
    // Criar oscilador (tom)
    const oscillator = audioContext.createOscillator()
    const gainNode = audioContext.createGain()
    
    // Conectar os nós
    oscillator.connect(gainNode)
    gainNode.connect(audioContext.destination)
    
    // Configurar o tom (frequência)
    oscillator.frequency.value = 800 // Frequência em Hz
    oscillator.type = 'sine'
    
    // Configurar volume (envelope)
    gainNode.gain.setValueAtTime(0, audioContext.currentTime)
    gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    
    // Tocar e parar
    oscillator.start(audioContext.currentTime)
    oscillator.stop(audioContext.currentTime + 0.5)
    
    // Segundo tom (mais curto)
    setTimeout(() => {
      const oscillator2 = audioContext.createOscillator()
      const gainNode2 = audioContext.createGain()
      
      oscillator2.connect(gainNode2)
      gainNode2.connect(audioContext.destination)
      
      oscillator2.frequency.value = 1000
      oscillator2.type = 'sine'
      
      gainNode2.gain.setValueAtTime(0, audioContext.currentTime)
      gainNode2.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
      gainNode2.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
      
      oscillator2.start(audioContext.currentTime)
      oscillator2.stop(audioContext.currentTime + 0.3)
    }, 100)
  } catch (error) {
    console.error('Erro ao tocar som de notificação:', error)
    // Fallback: usar beep do sistema
    try {
      const beep = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBTGH0fPRgjMIGmW28OSfUxELT6bh8LZmHAU4k9bz0H4yBiN4x/DckUAKFF606eqpVhQKRp7f8sBuIgUxh9Hz0YIzCBpmtvDkn1MRC0+m4fC2ZhwFOJPW89B+MgYjeMfw3JFACg==')
      beep.play().catch(() => {})
    } catch (e) {
      // Ignorar se falhar
    }
  }
}

export default function NotificacoesBell() {
  const { user } = useAuthStore()
  const navigate = useNavigate()
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [showDropdown, setShowDropdown] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Carregar contador inicial de notificações não lidas
  useEffect(() => {
    if (!user) return

    const loadUnreadCount = async () => {
      try {
        const response = await api.get('/notificacoes?naoLidas=true')
        const count = response.data?.notificacoes?.length || 0
        setUnreadCount(count)
      } catch (error) {
        console.error('Erro ao carregar contador de notificações:', error)
      }
    }

    loadUnreadCount()
  }, [user])

  // Carregar notificações quando abrir o dropdown
  useEffect(() => {
    if (!user || !showDropdown) return

    const loadNotificacoes = async () => {
      try {
        const response = await api.get('/notificacoes')
        const notifs = response.data?.notificacoes || []
        setNotificacoes(notifs)
      } catch (error) {
        console.error('Erro ao carregar notificações:', error)
      }
    }

    loadNotificacoes()
  }, [user, showDropdown])

  useEffect(() => {
    if (!user) return

    // Solicitar permissão para notificações do navegador
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {
        // Ignorar erro se usuário negar
      })
    }

    const socket = getSocket()
    if (socket) {
      // Escutar notificações do backend via Socket.IO
      socket.on(`usuario:${user.id}:nova-notificacao`, (data: { notificacao: any; count: number }) => {
        const { notificacao, count } = data
        
        // Atualizar contador com o valor do servidor
        setUnreadCount(count)
        
        // Adicionar notificação à lista se o dropdown estiver aberto
        if (showDropdown) {
          setNotificacoes((prev) => [notificacao, ...prev])
        }
        
        // Tocar som de notificação
        playNotificationSound()
        
        // Mostrar notificação do navegador
        if ('Notification' in window && Notification.permission === 'granted') {
          const notification = new Notification(notificacao.titulo || 'Nova notificação', {
            body: notificacao.mensagem?.substring(0, 100) || 'Você tem uma nova notificação',
            icon: '/favicon.ico',
            tag: `notificacao-${notificacao.id}`,
            requireInteraction: false,
          })
          
          if (notificacao.alertaId) {
            notification.onclick = () => {
              window.focus()
              navigate(`/alertas/${notificacao.alertaId}`)
              notification.close()
            }
          }
        }
        
        // Mostrar toast
        toast.success(notificacao.titulo || 'Nova notificação', {
          duration: 5000,
        })
      })
    }

    return () => {
      if (socket && user) {
        socket.off(`usuario:${user.id}:nova-notificacao`)
      }
    }
  }, [user, navigate, showDropdown])

  const handleBellClick = async () => {
    const newState = !showDropdown
    setShowDropdown(newState)
    
    // Quando abrir o dropdown, recarregar contador do servidor
    if (newState) {
      try {
        const response = await api.get('/notificacoes?naoLidas=true')
        const count = response.data?.notificacoes?.length || 0
        setUnreadCount(count)
      } catch (error) {
        console.error('Erro ao recarregar contador:', error)
      }
    }
  }

  const handleAlertaClick = async (alertaId: number, notificacaoId?: number) => {
    setShowDropdown(false)
    
    // Marcar notificação como lida se tiver ID
    if (notificacaoId) {
      try {
        await api.put(`/notificacoes/${notificacaoId}/lida`)
        // Recarregar contador após marcar como lida
        const response = await api.get('/notificacoes?naoLidas=true')
        const count = response.data?.notificacoes?.length || 0
        setUnreadCount(count)
      } catch (error) {
        console.error('Erro ao marcar notificação como lida:', error)
      }
    }
    
    navigate(`/alertas/${alertaId}`)
  }

  const handleVerTodos = () => {
    setShowDropdown(false)
    navigate('/alertas')
  }

  const handleLimpar = async () => {
    try {
      await api.put('/notificacoes/todas/lida')
      setNotificacoes([])
      setUnreadCount(0)
    } catch (error) {
      console.error('Erro ao limpar notificações:', error)
    }
  }

  return (
    <div className="relative">
      <button
        onClick={handleBellClick}
        className="relative p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label="Notificações"
      >
        <Bell className="h-6 w-6 text-gray-600" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 max-h-96 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Notificações</h3>
              {notificacoes.length > 0 && (
                <button
                  onClick={handleLimpar}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Limpar
                </button>
              )}
            </div>
            
            <div className="overflow-y-auto flex-1">
              {notificacoes.length === 0 ? (
                <div className="px-4 py-8 text-center text-gray-500">
                  Nenhuma notificação
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {notificacoes.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleAlertaClick(notif.alertaId, notif.id)}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notif.titulo}
                          </p>
                          {notif.mensagem && (
                            <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                              {notif.mensagem}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notif.createdAt).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                          {notif.tipo && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                                {notif.tipo}
                              </span>
                              {notif.status && (
                                <span className="text-xs px-2 py-0.5 rounded bg-yellow-100 text-yellow-800">
                                  {notif.status}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {notificacoes.length > 0 && (
              <div className="px-4 py-3 border-t border-gray-200">
                <button
                  onClick={handleVerTodos}
                  className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Ver todos os alertas
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}

