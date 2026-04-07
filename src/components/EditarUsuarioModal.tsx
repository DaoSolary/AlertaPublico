import { useEffect, useState } from 'react'
import api from '../lib/api'
import Modal from './Modal'
import { User, Mail, Phone, Building2, Shield } from 'lucide-react'
import toast from 'react-hot-toast'

interface EditarUsuarioModalProps {
  isOpen: boolean
  onClose: () => void
  usuario: any
  onSuccess: () => void
}

const PERFIS = [
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'SEGURANCA', label: 'Segurança' },
  { value: 'POLICIA', label: 'Polícia' },
  { value: 'PROFESSOR', label: 'Professor' },
  { value: 'ALUNO', label: 'Aluno' },
  { value: 'CIDADAO', label: 'Cidadão' },
]

export default function EditarUsuarioModal({
  isOpen,
  onClose,
  usuario,
  onSuccess,
}: EditarUsuarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [instituicoes, setInstituicoes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    perfil: '',
    instituicaoId: '',
    ativo: true,
  })

  useEffect(() => {
    if (isOpen) {
      loadInstituicoes()
    }
  }, [isOpen])

  const loadInstituicoes = async () => {
    try {
      const response = await api.get('/instituicoes')
      setInstituicoes(response.data?.instituicoes || [])
    } catch (error) {
      console.error('Erro ao carregar instituições:', error)
    }
  }

  useEffect(() => {
    if (usuario) {
      setFormData({
        nome: usuario.nome || '',
        email: usuario.email || '',
        telefone: usuario.telefone || '',
        perfil: usuario.perfil || '',
        instituicaoId: usuario.instituicaoId?.toString() || '',
        ativo: usuario.ativo !== undefined ? usuario.ativo : true,
      })
    }
  }, [usuario])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!usuario) return

    try {
      setLoading(true)
      await api.put(`/usuarios/${usuario.id}`, {
        ...formData,
        instituicaoId: formData.instituicaoId ? parseInt(formData.instituicaoId) : null,
      })
      toast.success('Usuário atualizado com sucesso!')
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário')
    } finally {
      setLoading(false)
    }
  }

  if (!usuario) return null

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Editar Usuário" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              className="input pl-10 w-full"
              placeholder="Nome completo"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              className="input pl-10 w-full"
              placeholder="email@exemplo.com"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="input pl-10 w-full"
              placeholder="+244 9XX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perfil
          </label>
          <div className="relative">
            <Shield className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.perfil}
              onChange={(e) => setFormData({ ...formData, perfil: e.target.value })}
              required
              className="input pl-10 w-full"
            >
              <option value="">Selecione um perfil</option>
              {PERFIS.map((perfil) => (
                <option key={perfil.value} value={perfil.value}>
                  {perfil.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instituição (opcional)
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.instituicaoId}
              onChange={(e) => setFormData({ ...formData, instituicaoId: e.target.value })}
              className="input pl-10 w-full"
            >
              <option value="">Nenhuma instituição</option>
              {instituicoes.map((inst) => (
                <option key={inst.id} value={inst.id.toString()}>
                  {inst.nome}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="ativo"
            checked={formData.ativo}
            onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
          />
          <label htmlFor="ativo" className="text-sm font-medium text-gray-700">
            Usuário ativo
          </label>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

