import { useEffect, useState } from 'react'
import api from '../lib/api'
import { getSocket } from '../lib/socket'
import { useAuthStore } from '../store/authStore'
import {
  CheckCircle,
  Clock,
  TrendingUp,
  Bell,
} from 'lucide-react'
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import AlertasModal from '../components/AlertasModal'

const COLORS = ['#0ea5e9', '#ef4444', '#f59e0b', '#10b981', '#8b5cf6']

export default function Dashboard() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<any>(null)
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalStatus, setModalStatus] = useState<'TODOS' | 'PENDENTE' | 'EM_ANDAMENTO' | 'RESOLVIDO' | null>(null)

  useEffect(() => {
    loadData()
    // Atualizar a cada 30 segundos
    const interval = setInterval(loadData, 30000)
    
    // Escutar atualizações via Socket.IO
    const socket = getSocket()
    if (socket) {
      socket.on('alerta-atualizado', (alertaAtualizado: any) => {
        // Atualizar estatísticas imediatamente
        if (stats) {
          const newStats = { ...stats }
          
          // Determinar mudança de status baseado no status anterior (se disponível)
          // Se não tiver status anterior, vamos recarregar tudo
          // Mas podemos atualizar otimisticamente
          
          // Se mudou para EM_ANDAMENTO (provavelmente estava PENDENTE)
          if (alertaAtualizado.status === 'EM_ANDAMENTO') {
            newStats.pendentes = Math.max(0, (newStats.pendentes || 0) - 1)
            newStats.emAndamento = (newStats.emAndamento || 0) + 1
          }
          // Se mudou para RESOLVIDO
          else if (alertaAtualizado.status === 'RESOLVIDO') {
            // Se tinha atribuidoParaId, provavelmente estava EM_ANDAMENTO
            if (alertaAtualizado.atribuidoParaId) {
              newStats.emAndamento = Math.max(0, (newStats.emAndamento || 0) - 1)
            } else {
              // Caso contrário, provavelmente estava PENDENTE
              newStats.pendentes = Math.max(0, (newStats.pendentes || 0) - 1)
            }
            newStats.resolvidos = (newStats.resolvidos || 0) + 1
          }
          
          setStats(newStats)
        }
        // Também recarregar dados para garantir sincronização completa
        loadData()
      })
      
      socket.on('novo-alerta', (alerta: any) => {
        // Atualizar dados quando novo alerta for criado
        // ADMIN não deve ver seus próprios alertas como pendentes
        const isAdminOwnAlert = user?.perfil === 'ADMIN' && alerta.enviadoPorId === user?.id;
        
        if (stats && !isAdminOwnAlert) {
          setStats({
            ...stats,
            total: (stats.total || 0) + 1,
            pendentes: (stats.pendentes || 0) + 1,
          })
        } else if (stats && isAdminOwnAlert) {
          // Se ADMIN criou, apenas incrementar total, não pendentes
          setStats({
            ...stats,
            total: (stats.total || 0) + 1,
          })
        }
        loadData()
      })
      
      // Escutar atualizações de estatísticas em tempo real
      if (user?.id) {
        socket.on(`usuario:${user.id}:estatisticas-atualizadas`, () => {
          // Recarregar estatísticas do servidor para garantir precisão
          loadData()
        })
      }
    }
    
    return () => {
      clearInterval(interval)
      if (socket) {
        socket.off('alerta-atualizado')
        socket.off('novo-alerta')
        if (user?.id) {
          socket.off(`usuario:${user.id}:estatisticas-atualizadas`)
        }
      }
    }
  }, [user, stats])

  const loadData = async () => {
    try {
      const [statsRes, alertasRes] = await Promise.all([
        api.get('/alertas/estatisticas'),
        api.get('/alertas?limit=100'),
      ])

      setStats(statsRes.data)

      // Preparar dados para gráficos
      const alertas = alertasRes.data.alertas || []
      const porTipo = alertas.reduce((acc: any, alerta: any) => {
        acc[alerta.tipo] = (acc[alerta.tipo] || 0) + 1
        return acc
      }, {})

      const porDia = alertas.reduce((acc: any, alerta: any) => {
        const date = new Date(alerta.createdAt).toLocaleDateString('pt-BR')
        acc[date] = (acc[date] || 0) + 1
        return acc
      }, {})

      setChartData([
        {
          name: 'Por Tipo',
          data: Object.entries(porTipo).map(([name, value]) => ({
            name,
            value,
          })),
        },
        {
          name: 'Por Dia',
          data: Object.entries(porDia)
            .slice(-7)
            .map(([name, value]) => ({ name, value: value as number })),
        },
      ])
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  const statCards = [
    {
      title: 'Total de Alertas',
      value: stats?.total || 0,
      icon: Bell,
      color: 'bg-blue-500',
      change: '+12%',
    },
    {
      title: 'Pendentes',
      value: stats?.pendentes || 0,
      icon: Clock,
      color: 'bg-yellow-500',
      change: '+5%',
    },
    {
      title: 'Em Andamento',
      value: stats?.emAndamento || 0,
      icon: TrendingUp,
      color: 'bg-primary-500',
      change: '+8%',
    },
    {
      title: 'Resolvidos',
      value: stats?.resolvidos || 0,
      icon: CheckCircle,
      color: 'bg-green-500',
      change: '+15%',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Visão geral do sistema de segurança Pública
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const modalType = stat.title === 'Total de Alertas' ? 'TODOS' :
            stat.title === 'Pendentes' ? 'PENDENTE' :
            stat.title === 'Em Andamento' ? 'EM_ANDAMENTO' :
            stat.title === 'Resolvidos' ? 'RESOLVIDO' : null

          return (
            <div
              key={stat.title}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => modalType && setModalStatus(modalType)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                  <p className="text-sm text-green-600 mt-1">{stat.change}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <stat.icon className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal de Alertas */}
      {modalStatus && (
        <AlertasModal
          isOpen={!!modalStatus}
          onClose={() => setModalStatus(null)}
          status={modalStatus}
        />
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart - Alertas por Tipo */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Alertas por Tipo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData[0]?.data || []}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) =>
                  `${name} ${(percent * 100).toFixed(0)}%`
                }
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {(chartData[0]?.data || []).map((_entry: any, index: number) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Alertas por Dia */}
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Alertas nos Últimos 7 Dias</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData[1]?.data || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#0ea5e9" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart - Tendência */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Tendência de Alertas</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData[1]?.data || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#0ea5e9"
              strokeWidth={2}
              name="Alertas"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

