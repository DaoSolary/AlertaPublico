import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useEffect } from 'react'

export default function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

