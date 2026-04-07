import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import Modal from './Modal'
import {
  Clock,
  CheckCircle,
  AlertTriangle,
  MapPin,
  User,
  Calendar,
} from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

const STATUS_INFO = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const TIPO_INFO = {
  VIOLENCIA: { label: 'Violência', color: 'bg-red-100 text-red-800' },
  ASSEDIO: { label: 'Assédio', color: 'bg-orange-100 text-orange-800' },
  EMERGENCIA_MEDICA: { label: 'Emergência Médica', color: 'bg-green-100 text-green-800' },
  INCENDIO: { label: 'Incêndio', color: 'bg-red-100 text-red-800' },
  INTRUSAO: { label: 'Intrusão', color: 'bg-yellow-100 text-yellow-800' },
  DROGA: { label: 'Droga', color: 'bg-purple-100 text-purple-800' },
  OUTROS: { label: 'Outros', color: 'bg-gray-100 text-gray-800' },
}

interface AlertasModalProps {
  isOpen: boolean
  onClose: () => void
  status: 'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO'
}

export default function AlertasModal({
  isOpen,
  onClose,
  status,
}: AlertasModalProps) {
  const navigate = useNavigate()
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { user } = useAuthStore()

  useEffect(() => {
    if (isOpen) {
      loadAlertas()
      
      // Escutar atualizações via Socket.IO
      const socket = getSocket()
      if (socket) {
        socket.on('alerta-atualizado', (alertaAtualizado: any) => {
          // Atualizar a lista se o alerta atualizado estiver na lista
          setAlertas((prev) =>
            prev.map((a) => (a.id === alertaAtualizado.id ? alertaAtualizado : a))
          )
        })
        
        // Escutar notificações específicas do usuário
        if (user) {
          socket.on(`usuario:${user.id}:notificacao`, (data: any) => {
            if (data.tipo === 'alerta-atualizado') {
              toast.success(data.mensagem, { duration: 5000 })
              loadAlertas() // Recarregar para atualizar
            }
          })
        }
      }
      
      return () => {
        if (socket) {
          socket.off('alerta-atualizado')
          if (user) {
            socket.off(`usuario:${user.id}:notificacao`)
          }
        }
      }
    }
  }, [isOpen, status, user])

  const loadAlertas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (status !== 'TODOS') {
        params.append('status', status)
      }
      const response = await api.get(`/alertas?${params.toString()}`)
      setAlertas(response.data.alertas || [])
    } catch (error) {
      console.error('Erro ao carregar alertas:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = async (alertaId: number, newStatus: string) => {
    try {
      const payload: any = { status: newStatus }
      
      // Se mudando para EM_ANDAMENTO, atribuir ao usuário atual
      if (newStatus === 'EM_ANDAMENTO' && user) {
        payload.atribuidoParaId = user.id
      }

      await api.put(`/alertas/${alertaId}`, payload)
      
      toast.success(
        newStatus === 'EM_ANDAMENTO' 
          ? 'Alerta em andamento! O remetente será notificado.'
          : 'Alerta resolvido! O remetente será notificado.'
      )
      
      // Atualizar a lista
      loadAlertas()
      
      // O Socket.IO já notificará o remetente automaticamente via backend
    } catch (error: any) {
      console.error('Erro ao atualizar status:', error)
      toast.error(error.response?.data?.message || 'Erro ao atualizar status')
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Alertas ${status !== 'TODOS' ? STATUS_INFO[status as keyof typeof STATUS_INFO]?.label : 'Todos'}`}
      size="xl"
    >
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : alertas.length === 0 ? (
        <div className="text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum alerta encontrado</p>
        </div>
      ) : (
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {alertas.map((alerta) => {
            const statusInfo = STATUS_INFO[alerta.status as keyof typeof STATUS_INFO]
            const tipoInfo = TIPO_INFO[alerta.tipo as keyof typeof TIPO_INFO]
            const StatusIcon = statusInfo?.icon || Clock

            return (
              <div
                key={alerta.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 
                        className="font-semibold text-gray-900 cursor-pointer hover:text-primary-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onClose()
                          // Navegar usando React Router
                          navigate(`/alertas/${alerta.id}`)
                        }}
                      >
                        {alerta.titulo}
                      </h4>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          tipoInfo?.color || ''
                        }`}
                      >
                        {tipoInfo?.label || alerta.tipo}
                      </span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${
                          statusInfo?.color || ''
                        }`}
                      >
                        <StatusIcon className="h-3 w-3" />
                        {statusInfo?.label || alerta.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">
                      {alerta.descricao}
                    </p>
                    <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {alerta.enviadoPor?.nome || 'Desconhecido'}
                      </div>
                      {alerta.atribuidoPara && (
                        <div className="flex items-center gap-1">
                          <User className="h-4 w-4" />
                          Atribuído: {alerta.atribuidoPara.nome}
                        </div>
                      )}
                      {alerta.endereco && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {alerta.endereco}
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(alerta.createdAt), "dd/MM/yyyy 'às' HH:mm")}
                      </div>
                    </div>
                  </div>
                  {status === 'PENDENTE' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(alerta.id, 'EM_ANDAMENTO')
                        }}
                        className="px-3 py-1 text-xs bg-blue-100 text-blue-800 rounded hover:bg-blue-200 transition-colors font-medium"
                      >
                        Colocar em Andamento
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(alerta.id, 'RESOLVIDO')
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors font-medium"
                      >
                        Resolver
                      </button>
                    </div>
                  )}
                  {status === 'EM_ANDAMENTO' && (
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleStatusChange(alerta.id, 'RESOLVIDO')
                          // Atualizar imediatamente na lista local
                          setAlertas((prev) =>
                            prev.map((a) =>
                              a.id === alerta.id ? { ...a, status: 'RESOLVIDO' } : a
                            )
                          )
                        }}
                        className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors font-medium"
                      >
                        Concluir
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </Modal>
  )
}

