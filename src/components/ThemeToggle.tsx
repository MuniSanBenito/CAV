'use client'

import { useTheme } from '@/hooks/useTheme'
import { IconMoon, IconSun } from '@tabler/icons-react'

type ThemeToggleProps = {
  variant?: 'fixed' | 'inline'
  className?: string
}

export default function ThemeToggle({ variant = 'fixed', className }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme()

  const buttonClass =
    className ?? (variant === 'fixed' ? 'theme-toggle-btn' : 'mis-reclamos-theme-btn')

  return (
    <button
      className={buttonClass}
      onClick={toggleTheme}
      title={theme === 'dark' ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      type="button"
    >
      {theme === 'dark' ? <IconSun size={18} stroke={1.6} /> : <IconMoon size={18} stroke={1.6} />}
    </button>
  )
}
