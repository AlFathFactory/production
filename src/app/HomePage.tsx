import { useState } from 'react'

import { Button } from '../components/ui/Button'
import { useAuth } from '../features/auth/hooks/useAuth'

export function HomePage() {
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

  return (
    <main className="home-page">
      <header className="app-header">
        <div className="app-header__brand">
          <span className="app-header__mark" aria-hidden="true">
            PC
          </span>
          <span>Production Control</span>
        </div>
        <Button
          type="button"
          variant="secondary"
          isLoading={isSigningOut}
          onClick={handleSignOut}
        >
          Sign out
        </Button>
      </header>

      <section className="welcome-card">
        <p className="eyebrow">Authenticated workspace</p>
        <h1>Welcome, {userProfile?.full_name}</h1>
        <div className="profile-summary">
          <div>
            <span>Employee code</span>
            <strong>{userProfile?.employee_code}</strong>
          </div>
          <div>
            <span>Role</span>
            <strong className="role-badge">{userProfile?.role}</strong>
          </div>
        </div>
        <p className="welcome-card__note">
          The authenticated application foundation is ready. Dashboard features
          will be added in a later task.
        </p>
        {signOutError ? (
          <p className="inline-error" role="alert">
            {signOutError}
          </p>
        ) : null}
      </section>
    </main>
  )
}
