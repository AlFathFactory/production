import { useState } from 'react'

import { Button } from '../ui/Button'
import { AppNotification } from '../ui/AppNotification'
import { getRoleLabel } from '../../features/auth/permissions'
import { useAuth } from '../../features/auth/hooks/useAuth'

interface AppHeaderProps {
  pageTitle: string
  onMenuClick: () => void
}

export function AppHeader({ pageTitle, onMenuClick }: AppHeaderProps) {
  const { signOut, userProfile } = useAuth()
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [signOutError, setSignOutError] = useState<string | null>(null)

  async function handleSignOut() {
    setIsSigningOut(true)
    setSignOutError(null)

    try {
      await signOut()
    } catch {
      setSignOutError('Sign out could not be completed. Please try again.')
      setIsSigningOut(false)
    }
  }

  if (!userProfile) {
    return null
  }

  return (
    <header className="app-shell-header">
      {signOutError ? (
        <AppNotification onDismiss={() => setSignOutError(null)} title="Action failed" tone="error">
          <span>{signOutError}</span>
        </AppNotification>
      ) : null}
      <div className="app-shell-header__context">
        <button className="menu-toggle" type="button" aria-label="Toggle navigation menu" onClick={onMenuClick}>
          <span aria-hidden="true">☰</span>
        </button>
        <p>{pageTitle}</p>
      </div>

      <div className="app-shell-header__user">
        <div className="user-summary">
          <strong title={userProfile.full_name}>{userProfile.full_name}</strong>
          <span>{getRoleLabel(userProfile.role)}</span>
        </div>
        <Button type="button" variant="secondary" isLoading={isSigningOut} onClick={handleSignOut}>
          Sign out
        </Button>
      </div>
    </header>
  )
}
