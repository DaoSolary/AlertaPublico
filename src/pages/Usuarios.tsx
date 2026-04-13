import { useEffect, useState } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/authStore'
import { Plus, Search, User as UserIcon, Mail, Building2, ChevronLeft, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'
import EditarUsuarioModal from '../components/EditarUsuarioModal'

const PERFIL_COLORS = {
  ADMIN: 'bg-purple-100 text-purple-800',
  SEGURANCA: 'bg-blue-100 text-blue-800',
  POLICIA: 'bg-red-100 text-red-800',
  PROFESSOR: 'bg-green-100 text-green-800',
  ALUNO: 'bg-yellow-100 text-yellow-800',
}

const ITEMS_PER_PAGE = 10

export default function Usuarios() {
  const { user } = useAuthStore()
  const [usuarios, setUsuarios] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [editarModal, setEditarModal] = useState<any>(null)
  
  const isAdmin = user?.perfil === 'ADMIN'

  useEffect(() => {
    loadUsuarios()
  }, [])

  const loadUsuarios = async () => {
    try {
      const response = await api.get('/usuarios')
      // Backend retorna { usuarios: [...] } ou apenas [...]
      setUsuarios(response.data?.usuarios || response.data || [])
    } catch (error) {
      toast.error('Erro ao carregar usuários')
    } finally {
      setLoading(false)
    }
  }

  const filteredUsuarios = usuarios.filter((usuario) => {
    if (!search) return true
    const searchLower = search.toLowerCase()
    return (
      usuario.nome?.toLowerCase().includes(searchLower) ||
      usuario.email?.toLowerCase().includes(searchLower)
    )
  })

  const totalPages = Math.ceil(filteredUsuarios.length / ITEMS_PER_PAGE)
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
  const endIndex = startIndex + ITEMS_PER_PAGE
  const paginatedUsuarios = filteredUsuarios.slice(startIndex, endIndex)

  useEffect(() => {
    setCurrentPage(1) // Reset to first page when search changes
  }, [search])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Usuários</h1>
          <p className="text-gray-600 mt-1">
            Gerencie todos os usuários do sistema ({filteredUsuarios.length} total)
          </p>
        </div>
        {isAdmin && (
          <button className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Novo Usuário
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
            placeholder="Buscar usuários..."
            className="input pl-10"
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Perfil
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Instituição
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {paginatedUsuarios.map((usuario) => (
                    <tr key={usuario.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center mr-3">
                            <span className="text-primary-700 font-medium">
                              {usuario.nome?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {usuario.nome}
                            </div>
                            {usuario.telefone && (
                              <div className="text-sm text-gray-500">
                                {usuario.telefone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {usuario.email}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            PERFIL_COLORS[usuario.perfil as keyof typeof PERFIL_COLORS] ||
                            'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {usuario.perfil}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-900">
                          <Building2 className="h-4 w-4 mr-2 text-gray-400" />
                          {usuario.instituicao?.nome || '-'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${
                            usuario.ativo
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {usuario.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => {
                                setEditarModal(usuario)
                              }}
                              className="text-primary-600 hover:text-primary-900 mr-4"
                            >
                              Editar
                            </button>
                            <button
                              onClick={async () => {
                                if (!window.confirm(`Tem certeza que deseja excluir o usuário "${usuario.nome}"?\n\nEsta ação não pode ser desfeita.`)) return
                                try {
                                  await api.delete(`/usuarios/${usuario.id}`)
                                  toast.success('Usuário excluído com sucesso')
                                  loadUsuarios()
                                } catch (error: any) {
                                  toast.error(error.response?.data?.message || 'Erro ao excluir usuário')
                                }
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Excluir
                            </button>
                          </>
                        )}
                        {!isAdmin && (
                          <span className="text-gray-400 text-xs">Sem permissão</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between card">
              <div className="text-sm text-gray-700">
                Mostrando {startIndex + 1} a {Math.min(endIndex, filteredUsuarios.length)} de {filteredUsuarios.length} usuários
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1 rounded-lg ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal de Edição */}
      {editarModal && (
        <EditarUsuarioModal
          isOpen={!!editarModal}
          onClose={() => setEditarModal(null)}
          usuario={editarModal}
          onSuccess={() => {
            loadUsuarios()
            setEditarModal(null)
          }}
        />
      )}
    </div>
  )
}
