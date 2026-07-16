import type { ReactNode } from 'react'
import DashboardShell from './DashboardShell'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Dashboard',
  description: 'Panel de gestión del Centro de Atención al Vecino',
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <DashboardShell>{children}</DashboardShell>
}
