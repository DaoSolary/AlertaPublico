import { useState } from 'react'
import api from '../lib/api'
import Modal from './Modal'
import { Building2, MapPin, Phone, Mail, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

interface CriarInstituicaoModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export default function CriarInstituicaoModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarInstituicaoModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.nome) {
      toast.error('Nome é obrigatório')
      return
    }

    setLoading(true)
    try {
      await api.post('/instituicoes', {
        nome: formData.nome,
        cnpj: formData.cnpj || undefined,
        endereco: formData.endereco || undefined,
        telefone: formData.telefone || undefined,
        email: formData.email || undefined,
        ativo: true,
      })
      
      toast.success('Instituição criada com sucesso!')
      setFormData({
        nome: '',
        cnpj: '',
        endereco: '',
        telefone: '',
        email: '',
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao criar instituição:', error)
      toast.error(error.response?.data?.message || 'Erro ao criar instituição')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Instituição" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nome da Instituição <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              required
              className="input pl-10 w-full"
              placeholder="Ex: Escola Municipal Central"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            CNPJ (opcional)
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              className="input pl-10 w-full"
              placeholder="00.000.000/0000-00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Endereço (opcional)
          </label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.endereco}
              onChange={(e) => setFormData({ ...formData, endereco: e.target.value })}
              className="input pl-10 w-full"
              placeholder="Ex: Rua Principal, 123 - Bairro Centro"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Telefone (opcional)
          </label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              className="input pl-10 w-full"
              placeholder="+244 9XX XXX XXX"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email (opcional)
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="input pl-10 w-full"
              placeholder="contato@escola.ao"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
          >
            {loading ? 'Criando...' : 'Criar Instituição'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

