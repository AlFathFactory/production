import type { PropsWithChildren } from 'react'
import { Navigate } from 'react-router-dom'

import { useAuth } from '../../features/auth/hooks/useAuth'
import type { AppRole } from '../../features/auth/types'

interface RequirePermissionProps extends PropsWithChildren {
  canAccess: (role: AppRole) => boolean
}

export function RequirePermission({ children, canAccess }: RequirePermissionProps) {
  const { userProfile } = useAuth()

  if (!userProfile || !canAccess(userProfile.role)) {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}
