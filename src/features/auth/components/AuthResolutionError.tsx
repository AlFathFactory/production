import { useState } from 'react'

import { Button } from '../../../components/ui/Button'
import { useAuth } from '../hooks/useAuth'

export function AuthResolutionError() {
  const { error, retryProfile, signOut } = useAuth()
  const [isRetrying, setIsRetrying] = useState(false)

  async function handleRetry() {
    setIsRetrying(true)
    await retryProfile().finally(() => setIsRetrying(false))
  }

  return (
    <main className="auth-status-page">
      <div className="status-card">
        <div className="status-card__mark" aria-hidden="true">
          !
        </div>
        <h1>We couldn’t verify your account</h1>
        <p>{error ?? 'Please try again or return to sign in.'}</p>
        <div className="status-card__actions">
          <Button type="button" isLoading={isRetrying} onClick={handleRetry}>
            Try again
          </Button>
          <Button type="button" variant="secondary" onClick={() => void signOut()}>
            Return to sign in
          </Button>
        </div>
      </div>
    </main>
  )
}
