import { getCurrentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DashboardShell from './DashboardShell'

export const metadata = {
  title: 'Dashboard — CAV San Benito',
  description: 'Panel de gestión del Centro de Atención al Vecino',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()

  console.log('user en dashboard', user)

  if (!user) redirect('/login')
  if (user.role === 'ejecutor') redirect('/mis-reclamos')

  return (
    <DashboardShell
      user={{
        nombre: user.nombre ?? '',
        apellido: user.apellido ?? '',
        role: user.role ?? '',
      }}
    >
      {children}
    </DashboardShell>
  )
}
