import { useState, type FormEvent } from 'react'

import { Button } from '../../../components/ui/Button'
import { FormField } from '../../../components/ui/FormField'
import { Input } from '../../../components/ui/Input'
import { AuthRepositoryError } from '../authRepository'
import { useSignIn } from '../hooks/useSignIn'

function getSignInMessage(error: unknown): string {
  if (error instanceof AuthRepositoryError) {
    return error.message
  }

  return 'Sign in could not be completed. Please try again.'
}

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isPasswordVisible, setIsPasswordVisible] = useState(false)
  const signIn = useSignIn()

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    signIn.mutate({ email: email.trim(), password })
  }

  const errorMessage = signIn.isError
    ? getSignInMessage(signIn.error)
    : null

  return (
    <form className="login-form" onSubmit={handleSubmit} noValidate>
      {errorMessage ? (
        <div className="alert alert--error" role="alert">
          <span className="alert__icon" aria-hidden="true">
            !
          </span>
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <FormField
        htmlFor="email"
        label="Work email"
        hint="Employee account"
      >
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          inputMode="email"
          placeholder="name@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
          disabled={signIn.isPending}
          hasError={Boolean(errorMessage)}
        />
      </FormField>

      <FormField htmlFor="password" label="Password or access code">
        <div className="password-input">
          <Input
            id="password"
            name="password"
            type={isPasswordVisible ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            disabled={signIn.isPending}
            hasError={Boolean(errorMessage)}
          />
          <button
            className="password-input__toggle"
            type="button"
            aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
            aria-pressed={isPasswordVisible}
            onClick={() => setIsPasswordVisible((visible) => !visible)}
            disabled={signIn.isPending}
          >
            {isPasswordVisible ? 'Hide' : 'Show'}
          </button>
        </div>
      </FormField>

      <Button
        className="login-form__submit"
        type="submit"
        isLoading={signIn.isPending}
        disabled={!email.trim() || !password}
      >
        {signIn.isPending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  )
}
