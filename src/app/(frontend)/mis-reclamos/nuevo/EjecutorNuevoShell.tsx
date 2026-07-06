'use client'

import ThemeToggle from '@/components/ThemeToggle'
import NuevoReclamoForm from '../../dashboard/reclamos/nuevo/NuevoReclamoForm'

export default function EjecutorNuevoShell() {
  return (
    <div className="dash-layout min-h-screen w-full">
      <ThemeToggle />
      <div className="dash-content w-full h-full p-0 sm:p-4">
        <NuevoReclamoForm returnUrl="/mis-reclamos" />
      </div>
    </div>
  )
}
