import { useAuthStore } from '../store/authStore'
import { Mail, Shield, Building2, LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'

const PERFIL_INFO = {
  ADMIN: { label: 'Administrador', color: 'bg-purple-100 text-purple-800' },
  SEGURANCA: { label: 'Segurança', color: 'bg-blue-100 text-blue-800' },
  POLICIA: { label: 'Polícia', color: 'bg-red-100 text-red-800' },
  PROFESSOR: { label: 'Professor', color: 'bg-green-100 text-green-800' },
  ALUNO: { label: 'Aluno', color: 'bg-yellow-100 text-yellow-800' },
}

export default function Perfil() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    toast.success('Logout realizado com sucesso')
    navigate('/login')
  }

  if (!user) return null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
        <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center gap-6 mb-6">
            <div className="h-20 w-20 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary-700 font-bold text-2xl">
                {user.nome?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.nome}</h2>
              <p className="text-gray-600">{user.email}</p>
              <span
                className={`inline-block mt-2 px-3 py-1 rounded text-sm font-medium ${
                  PERFIL_INFO[user.perfil as keyof typeof PERFIL_INFO]?.color ||
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {PERFIL_INFO[user.perfil as keyof typeof PERFIL_INFO]?.label ||
                  user.perfil}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Mail className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium text-gray-900">{user.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <Shield className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-600">Perfil</p>
                <p className="font-medium text-gray-900">
                  {PERFIL_INFO[user.perfil as keyof typeof PERFIL_INFO]?.label ||
                    user.perfil}
                </p>
              </div>
            </div>

            {user.instituicaoId && (
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                <Building2 className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-600">Instituição ID</p>
                  <p className="font-medium text-gray-900">
                    {user.instituicaoId}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions Card */}
        <div className="card">
          <h3 className="font-semibold text-gray-900 mb-4">Ações</h3>
          <div className="space-y-3">
            <button className="w-full btn-secondary text-left">
              Editar Perfil
            </button>
            <button className="w-full btn-secondary text-left">
              Alterar Senha
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5" />
              Sair da Conta
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

