interface LoadingSpinnerProps {
  size?: 'small' | 'medium'
  label?: string
}

export function LoadingSpinner({
  size = 'medium',
  label = 'Loading',
}: LoadingSpinnerProps) {
  return (
    <span
      className={`spinner spinner--${size}`}
      role="status"
      aria-label={label}
    />
  )
}
