import { useEffect, useRef, type PropsWithChildren } from 'react'

interface DialogProps extends PropsWithChildren {
  isOpen: boolean
  onClose: () => void
  title: string
}

export function Dialog({ children, isOpen, onClose, title }: DialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }

    dialogRef.current?.focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) {
    return null
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <div
        aria-labelledby="dialog-title"
        aria-modal="true"
        className="dialog"
        onMouseDown={(event) => event.stopPropagation()}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className="dialog__header">
          <h2 id="dialog-title">{title}</h2>
          <button aria-label={`Close ${title}`} className="dialog__close" onClick={onClose} type="button">×</button>
        </div>
        {children}
      </div>
    </div>
  )
}
