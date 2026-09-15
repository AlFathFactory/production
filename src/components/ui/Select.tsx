import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  hasError?: boolean
}

export function Select({ className = '', hasError, ...props }: SelectProps) {
  return (
    <select
      aria-invalid={hasError || undefined}
      className={`select ${hasError ? 'select--error' : ''} ${className}`.trim()}
      {...props}
    />
  )
}
