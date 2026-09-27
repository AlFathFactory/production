import type { TextareaHTMLAttributes } from 'react'

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  hasError?: boolean
}

export function Textarea({ className = '', dir = 'auto', hasError, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={hasError || undefined}
      className={`textarea ${hasError ? 'textarea--error' : ''} ${className}`.trim()}
      dir={dir}
      {...props}
    />
  )
}
