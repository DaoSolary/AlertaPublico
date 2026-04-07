import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export const initSocket = (token: string): Socket => {
  if (socket?.connected) {
    return socket
  }

  // URL do Socket.IO - usar variável de ambiente ou produção por padrão
  const socketUrl = import.meta.env.VITE_SOCKET_URL || 
    'https://daosolari-1.onrender.com'

  socket = io(socketUrl, {
    auth: {
      token,
    },
    transports: ['websocket', 'polling'],
  })

  socket.on('connect', () => {
    console.log('✅ Conectado ao Socket.IO')
  })

  socket.on('disconnect', () => {
    console.log('❌ Desconectado do Socket.IO')
  })

  socket.on('connect_error', (error) => {
    console.error('Erro de conexão Socket.IO:', error)
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = (): Socket | null => {
  return socket
}

