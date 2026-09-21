import { administrationNavigationItems, primaryNavigationItems } from '../../app/navigation/navigation'
import type { NavigationItem } from '../../app/navigation/types'
import { useAuth } from '../../features/auth/hooks/useAuth'
import type { AppRole } from '../../features/auth/types'
import { SidebarNavItem } from './SidebarNavItem'

interface AppSidebarProps {
  isOpen: boolean
  onClose: () => void
}

function visibleItems(items: NavigationItem[], role: AppRole) {
  return items.filter((item) => !item.isVisible || item.isVisible(role))
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
  const { userProfile } = useAuth()

  if (!userProfile) {
    return null
  }

  const primaryItems = visibleItems(primaryNavigationItems, userProfile.role)
  const adminItems = visibleItems(administrationNavigationItems, userProfile.role)

  return (
    <aside className={`app-sidebar${isOpen ? ' app-sidebar--open' : ''}`} aria-label="Application sidebar">
      <div className="app-sidebar__brand">
        <span className="app-sidebar__mark" aria-hidden="true">PC</span>
        <span>Follow Up System</span>
      </div>

      <nav className="app-sidebar__navigation" aria-label="Main navigation">
        <div className="sidebar-nav-group">
          {primaryItems.map((item) => (
            <SidebarNavItem item={item} key={item.path} onNavigate={onClose} />
          ))}
        </div>

        {adminItems.length > 0 ? (
          <div className="sidebar-nav-group sidebar-nav-group--administration">
            <p className="sidebar-nav-group__label">Administration</p>
            {adminItems.map((item) => (
              <SidebarNavItem item={item} key={item.path} onNavigate={onClose} />
            ))}
          </div>
        ) : null}
      </nav>
    </aside>
  )
}
