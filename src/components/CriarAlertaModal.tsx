import { useState } from 'react'
import api from '../lib/api'
import Modal from './Modal'
import { AlertTriangle, FileText, MapPin, Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'

interface CriarAlertaModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const TIPOS_ALERTA = [
  { value: 'VIOLENCIA', label: 'Violência' },
  { value: 'ASSEDIO', label: 'Assédio' },
  { value: 'EMERGENCIA', label: 'Emergência' },
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
  const [obtendoLocalizacao, setObtendoLocalizacao] = useState(false)
  const [formData, setFormData] = useState({
    tipo: '',
    titulo: '',
    descricao: '',
    endereco: '',
    prioridade: 'MEDIA',
    latitude: '',
    longitude: '',
  })
  const [evidencias, setEvidencias] = useState<File[]>([])

  const obterLocalizacao = async () => {
    if (obtendoLocalizacao) return
    
    setObtendoLocalizacao(true)
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocalização não suportada pelo navegador')
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            latitude: position.coords.latitude.toString(),
            longitude: position.coords.longitude.toString(),
          })
          toast.success('Localização obtida com sucesso!')
          setObtendoLocalizacao(false)
        },
        (error) => {
          let errorMessage = 'Não foi possível obter localização'
          if (error.code === 1) {
            errorMessage = 'Permissão de localização negada'
          } else if (error.code === 2) {
            errorMessage = 'Localização indisponível'
          } else if (error.code === 3) {
            errorMessage = 'Tempo excedido ao obter localização'
          }
          toast.error(errorMessage)
          setObtendoLocalizacao(false)
        },
        {
          enableHighAccuracy: true,
          timeout: 20000,
          maximumAge: 10000,
        }
      )
    } catch (error) {
      toast.error('Erro ao obter localização')
      setObtendoLocalizacao(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files)
      // Limitar a 10 arquivos
      const novasEvidencias = [...evidencias, ...files].slice(0, 10)
      setEvidencias(novasEvidencias)
      if (novasEvidencias.length >= 10) {
        toast.success('Máximo de 10 evidências permitido')
      }
    }
  }

  const removerEvidencia = (index: number) => {
    setEvidencias(evidencias.filter((_, i) => i !== index))
  }

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()

  if (!formData.tipo || !formData.titulo || !formData.descricao) {
    toast.error('Preencha todos os campos obrigatórios')
    return
  }

  setLoading(true)

  try {
    // 1️⃣ CRIAR ALERTA (SEM FILES)
    const payload = {
      tipo: formData.tipo,
      titulo: formData.titulo,
      descricao: formData.descricao,
      endereco: formData.endereco || undefined,
      prioridade: formData.prioridade,
      latitude: formData.latitude || undefined,
      longitude: formData.longitude || undefined,
    }

    console.log('🚀 Criando alerta:', payload)

    const response = await api.post('/alertas', payload)

    const alertaId = response.data.id

    // 2️⃣ UPLOAD DE EVIDÊNCIAS (SE EXISTIREM)
    if (evidencias.length > 0) {
      const formDataFiles = new FormData()

      evidencias.forEach(file => {
        formDataFiles.append('arquivos', file) // ⚠️ IMPORTANTE: backend espera "arquivos"
      })

      await api.post(
        `/alertas/${alertaId}/evidencias`,
        formDataFiles,
        {
          headers: { 'Content-Type': 'multipart/form-data' }
        }
      )
    }

    toast.success('Alerta criado com sucesso!')

    // reset
    setFormData({
      tipo: '',
      titulo: '',
      descricao: '',
      endereco: '',
      prioridade: 'MEDIA',
      latitude: '',
      longitude: '',
    })

    setEvidencias([])

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

        {/* Localização GPS */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localização GPS (opcional)
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={obterLocalizacao}
              disabled={obtendoLocalizacao}
              className="btn-secondary flex items-center gap-2 flex-1"
            >
              <MapPin className="h-4 w-4" />
              {obtendoLocalizacao ? 'Obtendo...' : 'Obter Localização Atual'}
            </button>
            {(formData.latitude && formData.longitude) && (
              <button
                type="button"
                onClick={() => {
                  setFormData({ ...formData, latitude: '', longitude: '' })
                }}
                className="btn-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          {formData.latitude && formData.longitude && (
            <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-800">
              <strong>Localização:</strong> {parseFloat(formData.latitude).toFixed(6)}, {parseFloat(formData.longitude).toFixed(6)}
            </div>
          )}
        </div>

        {/* Evidências */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidências (opcional) - Máximo 10 arquivos
          </label>
          <div className="space-y-2">
            <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-primary-500 transition-colors">
              <Upload className="h-5 w-5 text-gray-400" />
              <span className="text-sm text-gray-600">
                {evidencias.length > 0 ? `Adicionar mais (${evidencias.length}/10)` : 'Clique para adicionar fotos/vídeos'}
              </span>
              <input
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="hidden"
                disabled={evidencias.length >= 10}
              />
            </label>
            
            {evidencias.length > 0 && (
              <div className="grid grid-cols-2 gap-2">
                {evidencias.map((file, index) => (
                  <div key={index} className="relative p-2 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="h-4 w-4 text-gray-400" />
                      <span className="text-xs text-gray-600 truncate flex-1">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removerEvidencia(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
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

