import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import {
  Search,
  AlertTriangle,
  Clock,
  CheckCircle,
  MapPin,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import CriarAlertaModal from '../components/CriarAlertaModal'

const TIPOS_ALERTA = {
  VIOLENCIA: { label: 'Violência', color: 'bg-red-100 text-red-800' },
  ASSEDIO: { label: 'Assédio', color: 'bg-orange-100 text-orange-800' },
  EMERGENCIA: { label: 'Emergência', color: 'bg-red-100 text-red-800' },
  EMERGENCIA_MEDICA: { label: 'Emergência Médica', color: 'bg-green-100 text-green-800' },
  INCENDIO: { label: 'Incêndio', color: 'bg-red-100 text-red-800' },
  INTRUSAO: { label: 'Intrusão', color: 'bg-yellow-100 text-yellow-800' },
  DROGA: { label: 'Droga', color: 'bg-purple-100 text-purple-800' },
  OUTROS: { label: 'Outros', color: 'bg-gray-100 text-gray-800' },
}

const STATUS_ALERTA = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

export default function Alertas() {
  const { user } = useAuthStore()
  const [alertas, setAlertas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [showCriarModal, setShowCriarModal] = useState(false)
  const navigate = useNavigate()
  
  const isAdmin = user?.perfil === 'ADMIN'

  useEffect(() => {
    loadAlertas()
  }, [statusFilter])

  const loadAlertas = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter) params.append('status', statusFilter)
      if (search) params.append('search', search)

      const response = await api.get(`/alertas?${params.toString()}`)
      setAlertas(response.data.alertas || [])
    } catch (error) {
      toast.error('Erro ao carregar alertas')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    loadAlertas()
  }

  const filteredAlertas = alertas.filter((alerta) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      alerta.titulo?.toLowerCase().includes(searchLower) ||
      alerta.descricao?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Alertas</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os alertas do sistema
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCriarModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Criar Alerta
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="card">
        <form onSubmit={handleSearch} className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar alertas..."
              className="input pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="">Todos os status</option>
            <option value="PENDENTE">Pendente</option>
            <option value="EM_ANDAMENTO">Em Andamento</option>
            <option value="RESOLVIDO">Resolvido</option>
          </select>
          <button type="submit" className="btn-primary">
            Buscar
          </button>
        </form>
      </div>

      {/* Alertas List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : filteredAlertas.length === 0 ? (
        <div className="card text-center py-12">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Nenhum alerta encontrado</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredAlertas.map((alerta) => {
            const status = STATUS_ALERTA[alerta.status as keyof typeof STATUS_ALERTA]
            const tipo = TIPOS_ALERTA[alerta.tipo as keyof typeof TIPOS_ALERTA]
            const StatusIcon = status?.icon || Clock

            return (
              <div
                key={alerta.id}
                className="card hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/alertas/${alerta.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {alerta.titulo}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${tipo?.color || ''}`}>
                        {tipo?.label || alerta.tipo}
                      </span>
                      <span className={`px-2 py-1 rounded text-xs font-medium flex items-center gap-1 ${status?.color || ''}`}>
                        <StatusIcon className="h-3 w-3" />
                        {status?.label || alerta.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-3 line-clamp-2">
                      {alerta.descricao}
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      {alerta.endereco && (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          {alerta.endereco}
                        </div>
                      )}
                      <span>
                        {new Date(alerta.createdAt).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal de Criar Alerta */}
      {showCriarModal && (
        <CriarAlertaModal
          isOpen={showCriarModal}
          onClose={() => setShowCriarModal(false)}
          onSuccess={() => {
            loadAlertas()
            setShowCriarModal(false)
          }}
        />
      )}
    </div>
  )
}

