import React from 'react'
import DashboardShell from './DashboardShell'

export const metadata = {
  title: 'Dashboard — CAV San Benito',
  description: 'Panel de gestión del Centro de Atención al Vecino',
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
