import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { AuthLoadingScreen } from './AuthLoadingScreen'
import { AuthResolutionError } from './AuthResolutionError'

export function ProtectedRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isLoading) {
    return <AuthLoadingScreen />
  }

  if (auth.session && auth.error) {
    return <AuthResolutionError />
  }

  if (!auth.isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
