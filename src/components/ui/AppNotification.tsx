import { useEffect, useRef, useState, type PropsWithChildren } from 'react'
import { createPortal } from 'react-dom'

interface AppNotificationProps extends PropsWithChildren {
  autoDismissMs?: number
  onDismiss: () => void
  title?: string
  tone?: 'error' | 'success'
}

function getNotificationRegion(): HTMLDivElement {
  const existingRegion = document.querySelector<HTMLDivElement>('[data-app-notification-region]')
  if (existingRegion) return existingRegion

  const region = document.createElement('div')
  region.className = 'app-notification-region'
  region.dataset.appNotificationRegion = ''
  region.setAttribute('aria-live', 'polite')
  document.body.append(region)
  return region
}

export function AppNotification({
  autoDismissMs,
  children,
  onDismiss,
  title,
  tone = 'success',
}: AppNotificationProps) {
  const onDismissRef = useRef(onDismiss)
  const [region] = useState(getNotificationRegion)

  useEffect(() => {
    onDismissRef.current = onDismiss
  }, [onDismiss])

  useEffect(() => {
    if (!autoDismissMs) return

    const timeout = window.setTimeout(() => onDismissRef.current(), autoDismissMs)
    return () => window.clearTimeout(timeout)
  }, [autoDismissMs])

  return createPortal(
    <section
      aria-atomic="true"
      className={`app-notification app-notification--${tone}`}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <div className="app-notification__content" dir="auto">
        {title ? <strong className="app-notification__title">{title}</strong> : null}
        {children}
      </div>
      <button
        aria-label="Dismiss notification"
        className="app-notification__dismiss"
        onClick={onDismiss}
        type="button"
      >
        <span aria-hidden="true">&times;</span>
      </button>
    </section>,
    region,
  )
}
