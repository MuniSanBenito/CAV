'use client'

import { useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

const STORAGE_KEY = 'cav-theme'

function applyTheme(theme: Theme) {
  if (theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark')
  } else {
    document.documentElement.removeAttribute('data-theme')
  }
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null
    if (saved === 'dark') {
      setTheme('dark')
      applyTheme('dark')
    }
  }, [])

  function toggleTheme() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
  }

  return { theme, toggleTheme }
}
