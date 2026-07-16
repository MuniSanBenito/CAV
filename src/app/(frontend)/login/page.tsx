import type { Metadata } from 'next'
import LoginForm from './LoginForm'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Ingresá al Centro de Atención al Vecino de la Municipalidad de San Benito',
}

export default function LoginPage() {
  return <LoginForm />
}
