import { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import {
  ArrowLeft,
  MapPin,
  Clock,
  User,
  Phone,
  CheckCircle,
  AlertTriangle,
  Send,
  Image as ImageIcon,
  Video,
  FileAudio,
  Download,
  Camera,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

const STATUS_INFO = {
  PENDENTE: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  EM_ANDAMENTO: { label: 'Em Andamento', color: 'bg-blue-100 text-blue-800', icon: AlertTriangle },
  RESOLVIDO: { label: 'Resolvido', color: 'bg-green-100 text-green-800', icon: CheckCircle },
}

const TIPO_INFO = {
  VIOLENCIA: { label: 'Violência', color: 'bg-red-100 text-red-800' },
  ASSEDIO: { label: 'Assédio', color: 'bg-orange-100 text-orange-800' },
  EMERGENCIA: { label: 'Emergência', color: 'bg-red-100 text-red-800' },
  EMERGENCIA_MEDICA: { label: 'Emergência Médica', color: 'bg-green-100 text-green-800' },
  INCENDIO: { label: 'Incêndio', color: 'bg-red-100 text-red-800' },
  INTRUSAO: { label: 'Intrusão', color: 'bg-yellow-100 text-yellow-800' },
  DROGA: { label: 'Droga', color: 'bg-purple-100 text-purple-800' },
  OUTROS: { label: 'Outros', color: 'bg-gray-100 text-gray-800' },
}

const PRIORIDADE_COLORS = {
  BAIXA: 'bg-green-100 text-green-800',
  MEDIA: 'bg-yellow-100 text-yellow-800',
  ALTA: 'bg-orange-100 text-orange-800',
  CRITICA: 'bg-red-100 text-red-800',
}


export default function AlertaDetalhes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [alerta, setAlerta] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [mensagens, setMensagens] = useState<any[]>([])
  const [novaMensagem, setNovaMensagem] = useState('')
  const [enviandoMensagem, setEnviandoMensagem] = useState(false)
  const [digitando, setDigitando] = useState<{ userId: number; nome: string } | null>(null)
  const [timeoutDigitando, setTimeoutDigitando] = useState<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (id) {
      loadAlerta().then((alertaData) => {
        // Se o alerta já vem com mensagens, usar elas
        if (alertaData?.mensagens && alertaData.mensagens.length > 0) {
          setMensagens(alertaData.mensagens)
        } else {
          loadMensagens()
        }
      })
    }
  }, [id])

  useEffect(() => {
    // Escutar atualizações via Socket.IO
    const socket = getSocket()
    if (socket && id) {
      // Entrar na sala do alerta
      socket.emit('join-alerta', parseInt(id!))

      socket.on('alerta-atualizado', (alertaAtualizado: any) => {
        if (alertaAtualizado.id === parseInt(id!)) {
          setAlerta(alertaAtualizado)
          toast.success('Alerta atualizado!')
        }
      })

      socket.on(`usuario:${user?.id}:notificacao`, (data: any) => {
        if (data.tipo === 'alerta-atualizado' && data.alerta.id === parseInt(id!)) {
          setAlerta(data.alerta)
          toast.success(data.mensagem, { duration: 5000 })
        }
      })

      socket.on('nova-mensagem', (mensagem: any) => {
        if (mensagem.alertaId === parseInt(id!)) {
          setMensagens((prev) => {
            // Evitar duplicatas
            if (prev.some((m) => m.id === mensagem.id)) {
              return prev
            }
            // Adicionar nova mensagem
            const novasMensagens = [...prev, mensagem]
            // Scroll automático
            setTimeout(() => scrollToBottom(), 100)
            return novasMensagens
          })
        }
      })

      socket.on(`alerta:${id}:nova-mensagem`, (mensagem: any) => {
        setMensagens((prev) => {
          // Evitar duplicatas
          if (prev.some((m) => m.id === mensagem.id)) {
            return prev
          }
          // Adicionar nova mensagem
          const novasMensagens = [...prev, mensagem]
          // Scroll automático
          setTimeout(() => scrollToBottom(), 100)
          return novasMensagens
        })
      })

      // Escutar indicador de digitação
      socket.on(`alerta:${id}:digitando`, (data: any) => {
        if (data.userId !== user?.id) {
          setDigitando({ userId: data.userId, nome: data.nome })
          // Limpar timeout anterior
          if (timeoutDigitando) {
            clearTimeout(timeoutDigitando)
          }
          // Limpar após 3 segundos sem atualização
          const timeout = setTimeout(() => {
            setDigitando(null)
          }, 3000)
          setTimeoutDigitando(timeout)
        }
      })

      socket.on(`alerta:${id}:parou-digitar`, (data: any) => {
        if (data.userId !== user?.id) {
          setDigitando(null)
          if (timeoutDigitando) {
            clearTimeout(timeoutDigitando)
          }
        }
      })
    }

    return () => {
      if (socket && id) {
        socket.emit('leave-alerta', parseInt(id!))
        socket.off('alerta-atualizado')
        socket.off(`usuario:${user?.id}:notificacao`)
        socket.off('nova-mensagem')
        socket.off(`alerta:${id}:nova-mensagem`)
        socket.off(`alerta:${id}:digitando`)
        socket.off(`alerta:${id}:parou-digitar`)
      }
      if (timeoutDigitando) {
        clearTimeout(timeoutDigitando)
      }
    }
  }, [id, user])

  useEffect(() => {
    scrollToBottom()
  }, [mensagens])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadAlerta = async () => {
    try {
      const response = await api.get(`/alertas/${id}`)
      const alertaData = response.data
      setAlerta(alertaData)
      // Se o alerta já vem com mensagens, usar elas
      if (alertaData?.mensagens && alertaData.mensagens.length > 0) {
        setMensagens(alertaData.mensagens)
      }
      return alertaData
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Redirecionando...')
        navigate('/login')
        return null
      }
      toast.error('Erro ao carregar alerta')
      navigate('/alertas')
      return null
    } finally {
      setLoading(false)
    }
  }

  const loadMensagens = async () => {
    try {
      const response = await api.get(`/mensagens/alerta/${id}`)
      setMensagens(response.data?.mensagens || response.data || [])
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
      // Se o alerta já vem com mensagens, usar elas
      if (alerta?.mensagens) {
        setMensagens(alerta.mensagens)
      }
    }
  }

  const handleEnviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!novaMensagem.trim() || !id) return

    try {
      setEnviandoMensagem(true)
      
      // Notificar que parou de digitar
      const socket = getSocket()
      if (socket && id && user) {
        socket.emit('alerta-parou-digitar', {
          alertaId: parseInt(id),
          userId: user.id,
        })
      }
      
      await api.post('/mensagens', {
        alertaId: parseInt(id),
        conteudo: novaMensagem,
      })
      
      // Adicionar mensagem localmente imediatamente (otimista)
      // Mas a mensagem já virá via Socket.IO, então vamos apenas limpar o campo
      // O Socket.IO garantirá que todos vejam a mensagem
      setNovaMensagem('')
      
      // Scroll será feito automaticamente quando a mensagem chegar via Socket.IO
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        navigate('/login')
      } else {
        toast.error(error.response?.data?.message || 'Erro ao enviar mensagem')
      }
    } finally {
      setEnviandoMensagem(false)
    }
  }

  const handleInputChange = (value: string) => {
    setNovaMensagem(value)
    
    // Notificar que está digitando
    const socket = getSocket()
    if (socket && id && user) {
      // Limpar timeout anterior
      if (timeoutDigitando) {
        clearTimeout(timeoutDigitando)
      }
      
      if (value.trim().length > 0) {
        // Notificar que está digitando
        socket.emit('alerta-digitando', {
          alertaId: parseInt(id!),
          userId: user.id,
          nome: user.nome,
        })
        
        // Parar de digitar após 2 segundos sem digitar
        const timeout = setTimeout(() => {
          socket.emit('alerta-parou-digitar', {
            alertaId: parseInt(id!),
            userId: user.id,
          })
        }, 2000)
        setTimeoutDigitando(timeout)
      } else {
        // Se campo vazio, parar de digitar imediatamente
        socket.emit('alerta-parou-digitar', {
          alertaId: parseInt(id!),
          userId: user.id,
        })
      }
    }
  }

  const handleStatusChange = async (status: string) => {
    try {
      const payload: any = { status }
      if (status === 'EM_ANDAMENTO' && user) {
        payload.atribuidoParaId = user.id
      }
      await api.put(`/alertas/${id}`, payload)
      toast.success('Status atualizado!')
      loadAlerta()
    } catch (error: any) {
      if (error.response?.status === 401) {
        toast.error('Sessão expirada. Faça login novamente.')
        navigate('/login')
      } else {
        toast.error(error.response?.data?.message || 'Erro ao atualizar status')
      }
    }
  }

  const getEvidenciaIcon = (tipo: string) => {
    if (tipo === 'foto' || tipo?.includes('image')) return ImageIcon
    if (tipo === 'video' || tipo?.includes('video')) return Video
    return FileAudio
  }

  const isVideo = (url: string, tipo?: string) => {
    return tipo === 'video' || url.match(/\.(mp4|mov|avi|webm)$/i)
  }

  const isAudio = (url: string, tipo?: string) => {
    return tipo === 'audio' || url.match(/\.(mp3|wav|ogg|m4a)$/i)
  }

  const getFileUrl = (url: string) => {
  if (!url) return ''

  if (url.startsWith('http')) return url

  const base = api.defaults.baseURL || ''

  const root = base.replace(/\/api$/, '')

  return `${root}${url.startsWith('/') ? '' : '/'}${url}`
}

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!alerta) return null

  const statusInfo = STATUS_INFO[alerta.status as keyof typeof STATUS_INFO]
  const tipoInfo = TIPO_INFO[alerta.tipo as keyof typeof TIPO_INFO]
  const StatusIcon = statusInfo?.icon || Clock
  const prioridadeColor = PRIORIDADE_COLORS[alerta.prioridade as keyof typeof PRIORIDADE_COLORS] || 'bg-gray-100 text-gray-800'

  return (
    <div className="space-y-6 pb-6">
      <button
        onClick={() => navigate('/alertas')}
        className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-5 w-5" />
        Voltar
      </button>

      {/* Card Principal - Detalhes do Alerta */}
      <div className="card">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">{alerta.titulo}</h1>
          <p className="text-gray-700 mb-6 whitespace-pre-wrap">{alerta.descricao}</p>

          {/* Meta informações */}
          <div className="flex flex-wrap gap-2 mb-6">
            <span className={`px-3 py-1 rounded text-sm font-medium ${tipoInfo?.color || ''}`}>
              {tipoInfo?.label || alerta.tipo}
            </span>
            <span
              className={`px-3 py-1 rounded text-sm font-medium flex items-center gap-2 ${statusInfo?.color || ''}`}
            >
              <StatusIcon className="h-4 w-4" />
              {statusInfo?.label || alerta.status}
            </span>
            <span className={`px-3 py-1 rounded text-sm font-medium ${prioridadeColor}`}>
              {alerta.prioridade}
            </span>
          </div>

          {/* Informações adicionais */}
          <div className="space-y-3 text-sm text-gray-600 mb-6">
            {alerta.endereco && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>{alerta.endereco}</span>
              </div>
            )}
            {alerta.latitude && alerta.longitude && user?.perfil === 'ADMIN' && (
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                <span>Coordenadas: {alerta.latitude.toFixed(6)}, {alerta.longitude.toFixed(6)}</span>
                <a
                  href={`https://www.google.com/maps?q=${alerta.latitude},${alerta.longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:underline ml-2 font-medium"
                >
                  Ver no Mapa
                </a>
              </div>
            )}
            <div className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>
                Enviado por: <strong>{alerta.enviadoPor?.nome || 'Desconhecido'}</strong>
                {alerta.enviadoPor?.perfil && (
                  <span className="text-gray-500"> ({alerta.enviadoPor.perfil})</span>
                )}
              </span>
            </div>
            {alerta.enviadoPor?.telefone && (
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                <span>
                  Contacto: <strong>{alerta.enviadoPor.telefone}</strong>
                </span>
              </div>
            )}
            {alerta.atribuidoPara && (
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>
                  Atribuído para: <strong>{alerta.atribuidoPara.nome}</strong>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>
                Enviado em: {format(new Date(alerta.createdAt), "dd/MM/yyyy 'às' HH:mm")}
              </span>
            </div>
          </div>

          {/* Controle de Status (apenas para ADMIN/SEGURANCA/POLICIA) */}
          {['SEGURANCA', 'POLICIA', 'ADMIN'].includes(user?.perfil || '') && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alterar Status
              </label>
              <select
                value={alerta.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="input"
              >
                <option value="PENDENTE">Pendente</option>
                <option value="EM_ANDAMENTO">Em Andamento</option>
                <option value="RESOLVIDO">Resolvido</option>
              </select>
            </div>
          )}
        </div>

        {/* Evidências */}
{alerta.evidencias && alerta.evidencias.length > 0 && (
  <div className="border-t border-gray-200 pt-6">
    <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
      <Camera className="h-5 w-5" />
      Evidências ({alerta.evidencias.length})
    </h3>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {alerta.evidencias.map((evidencia: any) => {
        const EvidenciaIcon = getEvidenciaIcon(evidencia.tipo)
        const isVideoFile = isVideo(evidencia.url, evidencia.tipo)
        const isAudioFile = isAudio(evidencia.url, evidencia.tipo)

        const fileUrl = getFileUrl(evidencia.url)

        return (
          <div
            key={evidencia.id}
            className="border border-gray-200 rounded-lg overflow-hidden bg-white"
          >
            {isVideoFile ? (
              <video
                src={fileUrl}
                controls
                className="w-full h-48 object-cover"
              />
            ) : isAudioFile ? (
              <div className="p-4 bg-gray-50 flex items-center gap-4">
                <FileAudio className="h-12 w-12 text-gray-400" />
                <audio src={fileUrl} controls className="flex-1" />
              </div>
            ) : (
              <img
                src={fileUrl}
                alt={evidencia.nomeArquivo || 'Evidência'}
                className="w-full h-48 object-cover cursor-pointer hover:opacity-90"
                onClick={() => window.open(fileUrl, '_blank')}
              />
            )}

            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
                  <EvidenciaIcon className="h-4 w-4 flex-shrink-0" />
                  <span className="truncate">
                    {evidencia.nomeArquivo || 'Sem nome'}
                  </span>
                </div>

                <a
                  href={fileUrl}
                  download
                  className="text-primary-600 hover:text-primary-700 ml-2"
                >
                  <Download className="h-4 w-4" />
                </a>
              </div>

              {evidencia.descricao && (
                <p className="text-xs text-gray-500 mt-1">
                  {evidencia.descricao}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  </div>
)}

      {/* Mensagens - Sempre visível */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">
          Mensagens {mensagens.length > 0 && `(${mensagens.length})`}
        </h3>
        <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto p-4 bg-gray-50 space-y-4">
          {mensagens.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              Nenhuma mensagem ainda. Seja o primeiro a comentar!
            </div>
          ) : (
            <>
              {mensagens.map((mensagem: any) => {
              const isOwn = mensagem.enviadoPor?.id === user?.id
              return (
                <div
                  key={mensagem.id}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      isOwn
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">
                        {mensagem.enviadoPor?.nome || 'Desconhecido'}
                      </span>
                      {mensagem.enviadoPor?.perfil && (
                        <span className="text-xs opacity-75">
                          ({mensagem.enviadoPor.perfil})
                        </span>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{mensagem.conteudo}</p>
                    <div className="text-xs opacity-75 mt-1">
                      {format(new Date(mensagem.createdAt), "HH:mm")}
                    </div>
                    {mensagem.anexoUrl && (
                      <a
                        href={mensagem.anexoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs underline mt-2 block"
                      >
                        Ver anexo
                      </a>
                    )}
                  </div>
                </div>
              )
              })}
              {/* Indicador de digitação */}
              {digitando && (
                <div className="flex justify-start">
                  <div className="max-w-xs lg:max-w-md px-4 py-2 rounded-lg bg-white text-gray-900 border border-gray-200">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{digitando.nome}</span>
                      <span className="text-gray-500 text-sm">está digitando</span>
                      <span className="flex gap-1">
                        <span className="animate-bounce" style={{ animationDelay: '0ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '150ms' }}>.</span>
                        <span className="animate-bounce" style={{ animationDelay: '300ms' }}>.</span>
                      </span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>
      </div>

      {/* Caixa de Nova Mensagem - Sempre visível */}
      <div className="card">
        <h3 className="font-semibold text-gray-900 mb-4">Enviar Mensagem</h3>
        <form onSubmit={handleEnviarMensagem} className="space-y-3">
          <textarea
            ref={inputRef}
            value={novaMensagem}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="input w-full min-h-[100px] resize-none"
            disabled={enviandoMensagem}
            rows={4}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleEnviarMensagem(e)
              }
            }}
          />
          <button
            type="submit"
            disabled={!novaMensagem.trim() || enviandoMensagem}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="h-5 w-5" />
            {enviandoMensagem ? 'Enviando...' : 'Enviar Mensagem'}
          </button>
        </form>
      </div>
    </div>

