import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Plus, Search, Building2, MapPin, Users, Edit, Trash2, MoreVertical } from 'lucide-react'
import toast from 'react-hot-toast'
import CriarInstituicaoModal from '../components/CriarInstituicaoModal'

export default function Instituicoes() {
  const { user } = useAuthStore()
  const [instituicoes, setInstituicoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionMenu, setActionMenu] = useState<number | null>(null)
  const [showCriarModal, setShowCriarModal] = useState(false)
  
  const isAdmin = user?.perfil === 'ADMIN'

  useEffect(() => {
    loadInstituicoes()
  }, [])

  const loadInstituicoes = async () => {
    try {
      const response = await api.get('/instituicoes')
      // Backend retorna { instituicoes: [...] }
      setInstituicoes(response.data?.instituicoes || response.data || [])
    } catch (error) {
      toast.error('Erro ao carregar instituições')
    } finally {
      setLoading(false)
    }
  }

  const filteredInstituicoes = instituicoes.filter((instituicao) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return instituicao.nome?.toLowerCase().includes(searchLower)
  })

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir esta instituição?')) return
    try {
      await api.delete(`/instituicoes/${id}`)
      toast.success('Instituição excluída com sucesso')
      loadInstituicoes()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao excluir instituição')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Instituições</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todas as instituições cadastradas
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCriarModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Nova Instituição
          </button>
        )}
      </div>

      {/* Search */}
      <div className="card">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar instituições..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Institutions Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredInstituicoes.map((instituicao) => (
            <div key={instituicao.id} className="card hover:shadow-md transition-shadow relative">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3 flex-1">
                  <div className="h-12 w-12 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-6 w-6 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 truncate">
                      {instituicao.nome}
                    </h3>
                    {instituicao.endereco && (
                      <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                        <MapPin className="h-4 w-4 flex-shrink-0" />
                        <span className="truncate">{instituicao.endereco}</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setActionMenu(actionMenu === instituicao.id ? null : instituicao.id)}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <MoreVertical className="h-5 w-5 text-gray-600" />
                  </button>
                  {actionMenu === instituicao.id && (
                    <>
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setActionMenu(null)}
                      />
                      <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setActionMenu(null)
                                // TODO: Implementar modal de edição
                                toast.info('Funcionalidade de edição em desenvolvimento')
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Edit className="h-4 w-4" />
                              Editar
                            </button>
                            <button
                              onClick={() => {
                                setActionMenu(null)
                                // Navegar para usuários com filtro por instituição
                                window.location.href = `/usuarios?instituicaoId=${instituicao.id}`
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                            >
                              <Users className="h-4 w-4" />
                              Ver Usuários
                            </button>
                            <button
                              onClick={() => {
                                setActionMenu(null)
                                handleDelete(instituicao.id)
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                            >
                              <Trash2 className="h-4 w-4" />
                              Excluir
                            </button>
                          </>
                        )}
                        {!isAdmin && (
                          <div className="px-4 py-2 text-xs text-gray-500">
                            Apenas administradores podem gerenciar instituições
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-1 text-sm text-gray-600">
                  <Users className="h-4 w-4" />
                  {instituicao._count?.usuarios ?? 0} usuários
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={async () => {
                      try {
                        const response = await api.get(`/instituicoes/${instituicao.id}`)
                        const detalhes = response.data
                        toast.info(
                          `${detalhes.nome}\n${detalhes.endereco || ''}\n${detalhes.telefone || ''}\n${detalhes.email || ''}`,
                          { duration: 5000 }
                        )
                      } catch (error) {
                        toast.error('Erro ao carregar detalhes')
                      }
                    }}
                    className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  >
                    Ver detalhes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criar Instituição */}
      {showCriarModal && (
        <CriarInstituicaoModal
          isOpen={showCriarModal}
          onClose={() => setShowCriarModal(false)}
          onSuccess={() => {
            loadInstituicoes()
            setShowCriarModal(false)
          }}
        />
      )}
    </div>
  )
}
