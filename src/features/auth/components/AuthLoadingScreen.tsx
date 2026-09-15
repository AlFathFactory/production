import { LoadingSpinner } from '../../../components/ui/LoadingSpinner'

export function AuthLoadingScreen() {
  return (
    <main className="auth-status-page" aria-busy="true">
      <LoadingSpinner label="Checking your account" />
      <p>Checking your account…</p>
    </main>
  )
}
