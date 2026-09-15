import { Navigate, useLocation } from 'react-router-dom'

import { useAuth } from '../hooks/useAuth'
import { AuthLoadingScreen } from './AuthLoadingScreen'
import { AuthResolutionError } from './AuthResolutionError'
import { LoginPage } from './LoginPage'

interface LoginLocationState {
  from?: string
}

export function LoginRoute() {
  const auth = useAuth()
  const location = useLocation()

  if (auth.isLoading) {
    return <AuthLoadingScreen />
  }

  if (auth.session && auth.error) {
    return <AuthResolutionError />
  }

  if (auth.isAuthenticated) {
    const state = location.state as LoginLocationState | null
    return <Navigate to={state?.from ?? '/'} replace />
  }

  return <LoginPage accessError={auth.error} />
}
