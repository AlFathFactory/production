import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'

import { AppHeader } from '../../components/layout/AppHeader'
import { AppSidebar } from '../../components/layout/AppSidebar'
import { getNavigationLabel } from '../navigation/navigation'

export function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const location = useLocation()
  const pageTitle = getNavigationLabel(location.pathname) ?? 'Page not found'

  useEffect(() => {
    if (!isSidebarOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsSidebarOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isSidebarOpen])

  return (
    <div className={`app-shell${isSidebarCollapsed ? ' app-shell--sidebar-collapsed' : ''}`}>
      <AppSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onToggleCollapse={() => {
          if (isSidebarOpen) {
            setIsSidebarOpen(false)
          } else {
            setIsSidebarCollapsed((current) => !current)
          }
        }}
      />
      {isSidebarOpen ? (
        <button
          aria-label="Close navigation menu"
          className="app-shell__backdrop"
          onClick={() => setIsSidebarOpen(false)}
          type="button"
        />
      ) : null}
      <div className="app-shell__workspace">
        <AppHeader
          pageTitle={pageTitle}
          onMenuClick={() => {
            if (window.matchMedia('(max-width: 820px)').matches) {
              setIsSidebarOpen(true)
            } else {
              setIsSidebarCollapsed((current) => !current)
            }
          }}
        />
        <main className="app-shell__content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
