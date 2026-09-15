import type { PropsWithChildren, ReactNode } from 'react'

interface FormFieldProps extends PropsWithChildren {
  htmlFor: string
  label: string
  hint?: ReactNode
}

export function FormField({
  children,
  hint,
  htmlFor,
  label,
}: FormFieldProps) {
  return (
    <div className="form-field">
      <div className="form-field__label-row">
        <label className="form-field__label" htmlFor={htmlFor}>
          {label}
        </label>
        {hint ? <span className="form-field__hint">{hint}</span> : null}
      </div>
      {children}
    </div>
  )
}
