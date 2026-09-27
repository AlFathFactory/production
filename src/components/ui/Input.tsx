import type { InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  hasError?: boolean
}

export function Input({ className = '', dir = 'auto', hasError, ...props }: InputProps) {
  return (
    <input
      className={`input ${hasError ? 'input--error' : ''} ${className}`.trim()}
      aria-invalid={hasError || undefined}
      dir={dir}
      {...props}
    />
  )
}
