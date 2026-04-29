'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  IconLayoutDashboard,
  IconFileDescription,
  IconLogout,
  IconMenu2,
  IconX,
  IconBuilding,
  IconChevronRight,
  IconMap,
} from '@tabler/icons-react'
import { roleLabels } from '@/lib/constants'

interface DashboardUser {
  nombre: string
  apellido: string
  role: string
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: IconLayoutDashboard },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: IconFileDescription },
  { href: '/dashboard/mapa', label: 'Mapa', icon: IconMap },
]

// roleLabels imported from @/lib/constants

export default function DashboardShell({
  children,
  user,
}: {
  children: React.ReactNode
  user: DashboardUser
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  async function handleLogout() {
    await fetch('/api/users/logout', { method: 'POST', credentials: 'include' })
    window.location.href = '/login'
  }

  return (
    <div className="dash-layout">
      {/* Mobile overlay */}
      {sidebarOpen && <div className="dash-overlay" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`dash-sidebar ${sidebarOpen ? 'dash-sidebar--open' : ''}`}>
        <div className="dash-sidebar-header">
          <div className="dash-sidebar-brand">
            <IconBuilding size={22} stroke={1.5} />
            <span>CAV</span>
          </div>
          <button className="dash-sidebar-close" onClick={() => setSidebarOpen(false)}>
            <IconX size={20} />
          </button>
        </div>

        <nav className="dash-sidebar-nav">
          {navItems.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`dash-nav-link ${isActive ? 'dash-nav-link--active' : ''}`}
                onClick={() => setSidebarOpen(false)}
              >
                <item.icon size={20} stroke={1.6} />
                <span>{item.label}</span>
                {isActive && <IconChevronRight size={16} className="dash-nav-link-arrow" />}
              </Link>
            )
          })}
        </nav>

        <div className="dash-sidebar-footer">
          <div className="dash-user-info">
            <div className="dash-user-avatar">
              {user.nombre.charAt(0)}
              {user.apellido.charAt(0)}
            </div>
            <div className="dash-user-details">
              <span className="dash-user-name">
                {user.nombre} {user.apellido}
              </span>
              <span className="dash-user-role">{roleLabels[user.role] || user.role}</span>
            </div>
          </div>
          <button className="dash-logout-btn" onClick={handleLogout}>
            <IconLogout size={18} stroke={1.6} />
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="dash-main">
        {/* Top bar (mobile) */}
        <header className="dash-topbar">
          <button className="dash-menu-btn" onClick={() => setSidebarOpen(true)}>
            <IconMenu2 size={22} />
          </button>
          <div className="dash-topbar-brand">
            <IconBuilding size={18} stroke={1.5} />
            <span>CAV San Benito</span>
          </div>
          <div className="dash-topbar-user">
            <div className="dash-user-avatar dash-user-avatar--sm">
              {user.nombre.charAt(0)}
              {user.apellido.charAt(0)}
            </div>
          </div>
        </header>

        <div className="dash-content">{children}</div>
      </div>
    </div>
  )
}
