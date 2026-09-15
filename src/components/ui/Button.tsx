import type { ButtonHTMLAttributes, PropsWithChildren } from 'react'

import { LoadingSpinner } from './LoadingSpinner'

interface ButtonProps
  extends PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> {
  isLoading?: boolean
  variant?: 'primary' | 'secondary' | 'danger'
}

export function Button({
  children,
  className = '',
  disabled,
  isLoading = false,
  variant = 'primary',
  ...props
}: ButtonProps) {
  return (
    <button
      className={`button button--${variant} ${className}`.trim()}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <LoadingSpinner size="small" label="Please wait" /> : null}
      <span>{children}</span>
    </button>
  )
}
