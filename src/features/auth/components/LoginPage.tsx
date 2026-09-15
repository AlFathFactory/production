import { LoginForm } from './LoginForm'

interface LoginPageProps {
  accessError: string | null
}

export function LoginPage({ accessError }: LoginPageProps) {
  return (
    <main className="login-page">
      <section className="login-brand" aria-label="Production Control">
        <div className="brand-mark" aria-hidden="true">
          <span>PC</span>
        </div>
        <div className="login-brand__content">
          <p className="eyebrow">Operations workspace</p>
          <h1>Production Control</h1>
          <p>
            A focused workspace for managing shop-floor production safely and
            consistently.
          </p>
        </div>
        <div className="login-brand__footer">
          <span className="status-dot" aria-hidden="true" />
          Secure employee access
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card">
          <div className="login-card__header">
            <p className="eyebrow">Employee portal</p>
            <h2>Welcome back</h2>
            <p>Sign in with the work email linked to your employee account.</p>
          </div>

          {accessError ? (
            <div className="alert alert--error" role="alert">
              <span className="alert__icon" aria-hidden="true">
                !
              </span>
              <span>{accessError}</span>
            </div>
          ) : null}

          <LoginForm />

          <p className="login-card__support">
            Need access? Contact your Production Control administrator.
          </p>
        </div>
      </section>
    </main>
  )
}
