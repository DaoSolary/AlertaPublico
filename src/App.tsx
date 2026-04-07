import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { useEffect } from 'react'
import { initSocket, disconnectSocket } from './lib/socket'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Alertas from './pages/Alertas'
import AlertaDetalhes from './pages/AlertaDetalhes'
import Usuarios from './pages/Usuarios'
import Instituicoes from './pages/Instituicoes'
import Perfil from './pages/Perfil'
import Layout from './components/Layout'
import PrivateRoute from './components/PrivateRoute'

function App() {
  const { user, token } = useAuthStore()

  useEffect(() => {
    // Inicializar Socket.IO quando usuário estiver logado
    if (token && user) {
      const socket = initSocket(token)
      
      // Escutar notificações específicas do usuário
      socket.on(`usuario:${user.id}:notificacao`, (data: any) => {
        console.log('Notificação recebida:', data)
        // A notificação será mostrada via toast no componente que escuta 'alerta-atualizado'
      })

      // Escutar atualizações de alertas
      socket.on('alerta-atualizado', (alerta: any) => {
        console.log('Alerta atualizado:', alerta)
        // Atualizar será feito via refresh ou estado global
      })

      return () => {
        disconnectSocket()
      }
    }
  }, [token, user])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Layout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alertas" element={<Alertas />} />
          <Route path="alertas/:id" element={<AlertaDetalhes />} />
          <Route path="usuarios" element={<Usuarios />} />
          <Route path="instituicoes" element={<Instituicoes />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
