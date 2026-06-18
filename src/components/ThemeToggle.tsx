'use client'

import { IconMoon, IconSun } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    const saved = localStorage.getItem('cav-theme') as 'light' | 'dark' | null
    if (saved === 'dark') {
      setTheme('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  }, [])

  function toggle() {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('cav-theme', next)
    if (next === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
    }
  }

  return (
    <button
      className="theme-toggle-btn"
      onClick={toggle}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
    >
      {theme === 'dark' ? (
        <IconSun size={18} stroke={1.6} />
      ) : (
        <IconMoon size={18} stroke={1.6} />
      )}
    </button>
  )
}
