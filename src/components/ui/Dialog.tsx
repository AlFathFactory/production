import { useEffect, useRef, type PropsWithChildren } from 'react'

interface DialogProps extends PropsWithChildren {
  className?: string
  isCloseDisabled?: boolean
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Dialog({ children, className = '', isCloseDisabled = false, isOpen, onClose, title }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !isCloseDisabled) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCloseDisabled, isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop" onMouseDown={isCloseDisabled ? undefined : onClose}>
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className={`dialog ${className}`.trim()}
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog__header">
          <h2 id="dialog-title">{title}</h2>
          <button
            aria-label={`Close ${title}`}
            className="dialog__close"
            disabled={isCloseDisabled}
            onClick={onClose}
            type="button"
          >
            &times;
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
