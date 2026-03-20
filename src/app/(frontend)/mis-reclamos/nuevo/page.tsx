import React from 'react'
import NuevoReclamoForm from '../../dashboard/reclamos/nuevo/NuevoReclamoForm'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Nuevo Reclamo | Mis Tareas',
  description: 'Cargar un nuevo reclamo en su área',
}

export default function MiAreaNuevoReclamoPage() {
  return (
    <div className="dash-layout min-h-screen w-full">
      <div className="dash-content w-full h-full p-0 sm:p-4">
        <NuevoReclamoForm returnUrl="/mis-reclamos" />
      </div>
    </div>
  )
}
