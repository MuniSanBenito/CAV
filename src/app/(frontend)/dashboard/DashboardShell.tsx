'use client'

import { roleLabels } from '@/lib/constants'
import {
  IconBuilding,
  IconChevronRight,
  IconFileDescription,
  IconLayoutDashboard,
  IconLogout,
  IconMap,
  IconMenu2,
  IconMoon,
  IconSun,
  IconX,
  IconChartBar,
} from '@tabler/icons-react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import React, { useEffect, useState } from 'react'

interface DashboardUser {
  nombre: string
  apellido: string
  role: string
}

const navItems = [
  { href: '/dashboard', label: 'Inicio', icon: IconLayoutDashboard },
  { href: '/dashboard/reclamos', label: 'Reclamos', icon: IconFileDescription },
  { href: '/dashboard/mapa', label: 'Mapa', icon: IconMap },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: IconChartBar },
]

// roleLabels imported from @/lib/constants

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [user, setUser] = useState<DashboardUser | null>(null)
  const [authChecking, setAuthChecking] = useState(true)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('cav-theme') as 'light' | 'dark' | null
    if (saved === 'dark') {
      setTheme('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  function toggleTheme() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('cav-theme', next)
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  useEffect(() => {
    fetch('/api/users/me', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (!data.user) {
          router.replace('/login')
          return
        }
        if (data.user.role === 'ejecutor') {
          router.replace('/mis-reclamos')
          return
        }
        setUser({
          nombre: data.user.nombre ?? '',
          apellido: data.user.apellido ?? '',
          role: data.user.role ?? '',
        })
        setAuthChecking(false)
      })
      .catch(() => router.replace('/login'))
  }, [router])

  async function handleLogout() {
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    router.replace('/login')
  }

  if (authChecking || !user) {
    return (
      <div className="mis-reclamos-loading">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
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
          <div className="dash-theme-row">
            <button className="dash-theme-btn" onClick={toggleTheme} title={theme === 'dark' ? 'Cambiar a claro' : 'Cambiar a oscuro'}>
              {theme === 'dark' ? <IconSun size={16} stroke={1.6} /> : <IconMoon size={16} stroke={1.6} />}
              <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
            </button>
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
