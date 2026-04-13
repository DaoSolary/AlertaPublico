import { useState } from 'react'
import api from '../lib/api'
import Modal from './Modal'
import { AlertTriangle, FileText, MapPin } from 'lucide-react'
import toast from 'react-hot-toast'

interface CriarAlertaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TIPOS_ALERTA = [
  { value: 'VIOLENCIA', label: 'Violência' },
  { value: 'ASSEDIO', label: 'Assédio' },
  { value: 'EMERGENCIA_MEDICA', label: 'Emergência Médica' },
  { value: 'INCENDIO', label: 'Incêndio' },
  { value: 'INTRUSAO', label: 'Intrusão' },
  { value: 'DROGA', label: 'Droga' },
  { value: 'OUTROS', label: 'Outros' },
]

const PRIORIDADES = [
  { value: 'BAIXA', label: 'Baixa' },
  { value: 'MEDIA', label: 'Média' },
  { value: 'ALTA', label: 'Alta' },
  { value: 'CRITICA', label: 'Crítica' },
]

export default function CriarAlertaModal({
  isOpen,
  onClose,
  onSuccess,
}: CriarAlertaModalProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '',
    descricao: '',
    endereco: '',
    prioridade: 'MEDIA',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.tipo || !formData.titulo || !formData.descricao) {
      toast.error('Preencha todos os campos obrigatórios')
      return
    }

    setLoading(true)
    try {
      await api.post('/alertas', {
        tipo: formData.tipo,
        titulo: formData.titulo,
        descricao: formData.descricao,
        endereco: formData.endereco || undefined,
        prioridade: formData.prioridade,
        // Latitude e longitude serão opcionais (admin pode criar sem localização)
      })
      
      toast.success('Alerta criado com sucesso! Todos os perfis serão notificados.')
      setFormData({
        tipo: '',
        titulo: '',
        descricao: '',
        endereco: '',
        prioridade: 'MEDIA',
      })
      onSuccess()
      onClose()
    } catch (error: any) {
      console.error('Erro ao criar alerta:', error)
      toast.error(error.response?.data?.message || 'Erro ao criar alerta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Criar Novo Alerta" size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tipo de Alerta <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <AlertTriangle className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <select
              value={formData.tipo}
              onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
              required
              className="input pl-10 w-full"
            >
              <option value="">Selecione o tipo</option>
              {TIPOS_ALERTA.map((tipo) => (
                <option key={tipo.value} value={tipo.value}>
                  {tipo.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Título <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.titulo}
            onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
            required
            className="input w-full"
            placeholder="Ex: Situação de emergência na escola"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descrição <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              required
              className="input pl-10 w-full min-h-[120px] resize-none"
              placeholder="Descreva detalhadamente o alerta..."
              rows={5}
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
            Prioridade
          </label>
          <select
            value={formData.prioridade}
            onChange={(e) => setFormData({ ...formData, prioridade: e.target.value })}
            className="input w-full"
          >
            {PRIORIDADES.map((prioridade) => (
              <option key={prioridade.value} value={prioridade.value}>
                {prioridade.label}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Nota:</strong> Este alerta será enviado para todos os perfis do sistema (ADMIN, SEGURANCA, POLICIA, PROFESSOR, ALUNO).
          </p>
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
            {loading ? 'Criando...' : 'Criar Alerta'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

