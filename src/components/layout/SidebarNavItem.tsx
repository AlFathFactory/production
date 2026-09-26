import { useEffect, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'

import type { NavigationIcon, NavigationItem } from '../../app/navigation/types'

interface SidebarNavItemProps {
  item: NavigationItem
  onNavigate?: () => void
}

function NavigationIcon({ icon }: { icon: NavigationIcon }) {
  const iconPaths: Record<NavigationIcon, ReactNode> = {
    dashboard: <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />,
    projects: <path d="M3 7h7l2 3h9v10H3zM3 7V5h7l2 3" />,
    production: <path d="M4 19V9m5 10V5m5 14v-7m5 7V3" />,
    reports: <path d="M5 3h14v18H5zM8 8h8M8 12h8M8 16h5" />,
    bending: <path d="M4 5v5a6 6 0 0 0 12 0V5m0 0h4m-4 0v4" />,
    documents: <path d="M6 3h9l4 4v14H6zM15 3v5h5M9 13h6M9 17h6" />,
    users: <path d="M16 20v-1.5a4.5 4.5 0 0 0-9 0V20m4.5-8a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm6.5 8v-1.5a4.4 4.4 0 0 0-2.5-4M16 6.2a3 3 0 0 1 0 5.6" />,
  }

  return (
    <svg aria-hidden="true" className="sidebar-nav-item__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[icon]}
    </svg>
  )
}

export function SidebarNavItem({ item, onNavigate }: SidebarNavItemProps) {
  const { pathname } = useLocation()
  const [isExpanded, setIsExpanded] = useState(() => pathname === item.path || Boolean(item.children?.some((child) => child.path === pathname)))

  useEffect(() => {
    if (item.children?.some((child) => child.path === pathname)) {
      setIsExpanded(true)
    }
  }, [item, pathname])

  if (item.children) {
    const isActive = pathname === item.path || item.children.some((child) => child.path === pathname)
    return (
      <div className={`sidebar-nav-item-group${isExpanded ? ' sidebar-nav-item-group--expanded' : ''}`}>
        <button
          aria-expanded={isExpanded}
          className={`sidebar-nav-item sidebar-nav-item--button${isActive ? ' sidebar-nav-item--active' : ''}`}
          onClick={() => setIsExpanded((current) => !current)}
          type="button"
        >
          <NavigationIcon icon={item.icon} />
          <span>{item.label}</span>
          <svg
            aria-hidden="true"
            className={`sidebar-nav-item__chevron${isExpanded ? ' sidebar-nav-item__chevron--open' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
          >
            <path d="m7 9.5 5 5 5-5" />
          </svg>
        </button>
        {isExpanded ? (
          <div className="sidebar-nav-item__children">
            {item.children.map((child) => (
              <NavLink
                className={({ isActive: childIsActive }) => `sidebar-nav-item sidebar-nav-item--child${childIsActive ? ' sidebar-nav-item--active' : ''}`}
                key={child.path}
                onClick={onNavigate}
                to={child.path}
              >
                {child.label}
              </NavLink>
            ))}
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <NavLink
      className={({ isActive }) =>
        `sidebar-nav-item${isActive ? ' sidebar-nav-item--active' : ''}`
      }
      end={item.path === '/'}
      onClick={onNavigate}
      to={item.path}
    >
      <NavigationIcon icon={item.icon} />
      <span>{item.label}</span>
    </NavLink>
  )
}
