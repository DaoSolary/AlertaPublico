import { useState, useEffect } from 'react'
import api from '../lib/api'
import Modal from './Modal'
import { User, Mail, Phone, Building2, Shield, Lock } from 'lucide-react'
import toast from 'react-hot-toast'

interface CriarUsuarioModalProps {
  isOpen: boolean
  onClose: () => void
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

export default function CriarUsuarioModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarUsuarioModalProps) {
  const [loading, setLoading] = useState(false)
  const [instituicoes, setInstituicoes] = useState<any[]>([])
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    senha: '',
    telefone: '',
    contacto_emergencia: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.nome || !formData.email || !formData.senha || !formData.telefone || !formData.contacto_emergencia || !formData.perfil) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres')
      return
    }

    try {
      setLoading(true)
      await api.post('/auth/register', {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha,
        telefone: formData.telefone.trim(),
        contacto_emergencia: formData.contacto_emergencia.trim(),
        perfil: formData.perfil,
        instituicaoId: formData.instituicaoId ? parseInt(formData.instituicaoId) : null,
        ativo: formData.ativo,
      })
      toast.success('Usuário criado com sucesso!')
      setFormData({
        nome: '',
        email: '',
        senha: '',
        telefone: '',
        contacto_emergencia: '',
        perfil: '',
        instituicaoId: '',
        ativo: true,
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Usuário" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome <span className="text-red-500">*</span>
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
            Email <span className="text-red-500">*</span>
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
            Senha <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              value={formData.senha}
              onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              required
              minLength={6}
              className="input pl-10 w-full"
              placeholder="Mínimo 6 caracteres"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              required
              className="input pl-10 w-full"
              placeholder="+244 9XX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contacto de Emergência <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="tel"
              value={formData.contacto_emergencia}
              onChange={(e) => setFormData({ ...formData, contacto_emergencia: e.target.value })}
              required
              className="input pl-10 w-full"
              placeholder="+244 9XX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Perfil <span className="text-red-500">*</span>
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
            {loading ? 'Criando...' : 'Criar Usuário'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

